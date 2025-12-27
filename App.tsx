
import React, { useState, useEffect, useCallback } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { MobileTechnicianView } from './components/MobileTechnicianView';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, TicketStatus, Visor, CloudData, Vehicle } from './types';
import { addWeeks, subWeeks, format, isSameDay, startOfDay, addMonths, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, FileBarChart, LogOut, RefreshCw, Wifi, WifiOff, Database } from 'lucide-react';

const SEED_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'João Silva', avatarColor: 'bg-blue-600', password: '1234' },
  { id: 'tech-2', name: 'Maria Costa', avatarColor: 'bg-emerald-600', password: '1234' },
];

const SEED_SERVICES: ServiceDefinition[] = [
  { id: 'svc-1', name: 'Assistência', defaultDuration: 1, colorClass: 'bg-slate-100' },
  { id: 'svc-2', name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-600' },
  { id: 'svc-7', name: 'Reconstrução', defaultDuration: 6, colorClass: 'bg-orange-500' },
];

const SEED_VEHICLES: Vehicle[] = [
  { id: 'v-1', name: 'Viatura 01' },
  { id: 'v-2', name: 'Viatura 02' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isCompactView, setIsCompactView] = useState(true);
  const [syncKey, setSyncKey] = useState<string | null>(localStorage.getItem('cloud_sync_key'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => Number(localStorage.getItem('last_sync_time')) || 0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);

  // Estados tipo "Collection" (Mongo Style)
  const [technicians, setTechnicians] = useState<Technician[]>(() => JSON.parse(localStorage.getItem('db_techs') || JSON.stringify(SEED_TECHNICIANS)));
  const [services, setServices] = useState<ServiceDefinition[]>(() => JSON.parse(localStorage.getItem('db_services') || JSON.stringify(SEED_SERVICES)));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => JSON.parse(localStorage.getItem('db_vehicles') || JSON.stringify(SEED_VEHICLES)));
  const [visores, setVisores] = useState<Visor[]>(() => JSON.parse(localStorage.getItem('db_visores') || '[]'));
  const [tickets, setTickets] = useState<Ticket[]>(() => (JSON.parse(localStorage.getItem('db_tickets') || '[]')).map((t: any) => ({ ...t, date: new Date(t.date) })));
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>(() => (JSON.parse(localStorage.getItem('db_days') || '[]')).map((d: any) => ({ ...d, date: new Date(d.date) })));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string | null}>({ date: new Date(), techId: null });

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistência Atómica Local
  useEffect(() => {
    localStorage.setItem('db_techs', JSON.stringify(technicians));
    localStorage.setItem('db_services', JSON.stringify(services));
    localStorage.setItem('db_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('db_visores', JSON.stringify(visores));
    localStorage.setItem('db_tickets', JSON.stringify(tickets));
    localStorage.setItem('db_days', JSON.stringify(dayStatuses));
    localStorage.setItem('last_sync_time', lastSyncTime.toString());
  }, [technicians, services, vehicles, visores, tickets, dayStatuses, lastSyncTime]);

  const handleCloudSync = useCallback(async (mode: 'push' | 'pull') => {
    if (!syncKey || !navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      // npoint.io é mais estável para CORS que jsonblob
      const url = `https://api.npoint.io/${syncKey}`;
      
      const options: RequestInit = {
        method: mode === 'pull' ? 'GET' : 'POST', // npoint usa POST para update em alguns casos ou um endpoint específico
        headers: { 'Content-Type': 'application/json' }
      };

      // Nota: npoint.io requer PUT ou POST dependendo da configuração.
      // Vou usar uma lógica de tentativa e erro para garantir que o fetch não falha silenciosamente.
      const res = await fetch(url, mode === 'push' ? { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicians, services, vehicles, visores, dayStatuses,
            tickets, lastSync: Date.now()
          })
      } : { method: 'GET' });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (mode === 'pull') {
        const data: CloudData = await res.json();
        if (data && data.lastSync > lastSyncTime) {
          if (data.technicians) setTechnicians(data.technicians);
          if (data.services) setServices(data.services);
          if (data.vehicles) setVehicles(data.vehicles);
          if (data.visores) setVisores(data.visores || []);
          if (data.tickets) setTickets(data.tickets.map(t => ({ ...t, date: new Date(t.date) })));
          if (data.dayStatuses) setDayStatuses((data.dayStatuses || []).map(d => ({ ...d, date: new Date(d.date) })));
          setLastSyncTime(data.lastSync);
        }
      } else {
          setLastSyncTime(Date.now());
      }
    } catch (e: any) {
      console.warn("Sync Error:", e);
      setSyncError("Erro de Sincronização. Verifique a internet.");
    } finally {
      setIsSyncing(false);
    }
  }, [syncKey, lastSyncTime, technicians, services, vehicles, visores, tickets, dayStatuses, isSyncing]);

  const createNewSyncKey = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // Inicializar base npoint
      const res = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicians, services, vehicles, visores, tickets, dayStatuses, lastSync: Date.now() })
      });
      const data = await res.json();
      if (data.id) {
        setSyncKey(data.id);
        localStorage.setItem('cloud_sync_key', data.id);
        alert("Nuvem Ativada! Chave: " + data.id);
      }
    } catch (e) {
      setSyncError("Não foi possível criar a base de dados remota.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveTicket = (ticketData: Omit<Ticket, 'id'>) => {
    let updated;
    if (editingTicket) {
      updated = tickets.map(t => t.id === editingTicket.id ? { ...ticketData, id: t.id, updatedAt: Date.now() } : t);
    } else {
      const newTicket: Ticket = { ...ticketData, id: `tk-${Date.now()}`, updatedAt: Date.now() };
      updated = [...tickets, newTicket];
    }
    setTickets(updated);
    setEditingTicket(null);
    if (syncKey) setTimeout(() => handleCloudSync('push'), 1000);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: Date.now() } : t));
    if (syncKey) setTimeout(() => handleCloudSync('push'), 1000);
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={syncKey} onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('cloud_sync_key', key || ''); }} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans antialiased">
        {/* Status Bar Resiliente */}
        <div className={`px-4 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white transition-all duration-300 z-[70] ${!onlineStatus ? 'bg-slate-700' : syncError ? 'bg-amber-600' : syncKey ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            <div className="flex items-center gap-3">
                {!onlineStatus ? <WifiOff size={12} /> : <Wifi size={12} />}
                <span>{!onlineStatus ? 'Trabalhando Offline' : syncError ? 'Erro de Ligação' : syncKey ? 'Base de Dados Online' : 'Cloud Desativada'}</span>
            </div>
            {syncKey && (
                <div className="flex items-center gap-4">
                    <span className="opacity-70 hidden sm:inline">Último Acesso: {format(new Date(lastSyncTime), 'HH:mm:ss')}</span>
                    <button onClick={() => handleCloudSync('pull')} className={`hover:scale-110 transition-transform ${isSyncing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={12} />
                    </button>
                </div>
            )}
        </div>

        {user.role === 'technician' && user.technicianId ? (
            <MobileTechnicianView 
                tickets={tickets} 
                technicianId={user.technicianId} 
                technician={technicians.find(t => t.id === user.technicianId)!}
                services={services} 
                vehicles={vehicles}
                onUpdateStatus={(id, status) => handleUpdateTicket(id, { status })}
                onViewDetails={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }}
                onUpdateProfile={(updates) => setTechnicians(prev => prev.map(t => t.id === user.technicianId ? {...t, ...updates} : t))}
                onLogout={() => setUser(null)}
            />
        ) : (
            <>
                <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-50">
                    <div className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-100 cursor-pointer hover:scale-105 transition-all" onClick={() => setCurrentDate(new Date())}>
                                <span className="text-white text-xl font-black">M</span>
                            </div>
                            <div>
                                <h1 className="text-lg text-slate-900 leading-none font-black tracking-tighter uppercase">Marques Dispatch</h1>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Cloud Command</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-200">
                                <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Semana</button>
                                <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
                                <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
                            </div>

                            <div className="flex items-center bg-white rounded-2xl p-1 border border-slate-200 shadow-inner">
                                <button onClick={() => { 
                                    const next = viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1);
                                    setCurrentDate(next);
                                }} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={18}/></button>
                                <span className="px-4 text-slate-900 w-44 text-center text-[11px] uppercase tracking-[0.2em] font-black">
                                    {format(currentDate, 'MMMM yyyy', { locale: pt })}
                                </span>
                                <button onClick={() => { 
                                    const next = viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1);
                                    setCurrentDate(next);
                                }} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={18}/></button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsReportsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><FileBarChart size={20} /></button>
                            {user.role === 'admin' && (
                                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><Settings size={20} /></button>
                            )}
                            <button onClick={() => { setEditingTicket(null); setNewTicketPreData({date: selectedDate, techId: null}); setIsTicketModalOpen(true); }} className="bg-red-600 text-white hover:bg-red-700 px-6 py-2.5 rounded-xl shadow-xl shadow-red-100 font-black text-[10px] uppercase tracking-widest ml-2 transition-all">Novo Serviço</button>
                            <button onClick={() => setUser(null)} className="ml-2 p-2.5 text-slate-300 hover:text-red-600 transition-all"><LogOut size={20} /></button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
                    <div className="flex-1 overflow-hidden flex flex-col relative">
                    {viewMode === 'week' ? (
                        <WeeklyScheduleView 
                            currentDate={currentDate} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} vehicles={vehicles}
                            onTicketUpdate={handleUpdateTicket}
                            onEditTicket={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }}
                            onNewTicket={(date, techId) => { setNewTicketPreData({ date, techId }); setEditingTicket(null); setIsTicketModalOpen(true); }}
                            onToggleOvernight={(date, techId) => {
                                const idx = dayStatuses.findIndex(ds => isSameDay(ds.date, date) && ds.technicianId === techId);
                                if (idx >= 0) setDayStatuses(prev => prev.filter((_, i) => i !== idx));
                                else setDayStatuses(prev => [...prev, { id: `status-${Date.now()}`, technicianId: techId, date: startOfDay(date), isOvernight: true }]);
                                if (syncKey) setTimeout(() => handleCloudSync('push'), 500);
                            }}
                            onSelectDate={setSelectedDate}
                            selectedDate={selectedDate}
                            isReadOnly={user.role === 'viewer'}
                            isCompact={isCompactView}
                        />
                    ) : viewMode === 'month' ? (
                        <CalendarView 
                            currentDate={currentDate} selectedDate={selectedDate} 
                            onSelectDate={(d) => { setSelectedDate(d); setViewMode('week'); setCurrentDate(d); }} 
                            tickets={tickets} technicians={technicians} selectedTechId={null} 
                        />
                    ) : (
                        <ListView tickets={tickets} technicians={technicians} services={services} vehicles={vehicles} onEditTicket={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }} onUpdateTicket={handleUpdateTicket} isReadOnly={user.role === 'viewer'} />
                    )}
                    </div>

                    <footer className="h-64 bg-white border border-slate-200 rounded-3xl shadow-sm z-30 shrink-0 flex flex-col overflow-hidden hidden md:flex">
                        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-600 w-2 h-2 rounded-full animate-pulse" />
                                <span className="text-slate-700 text-[10px] uppercase tracking-[0.2em] font-black">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}</span>
                            </div>
                            <button onClick={() => setIsCompactView(!isCompactView)} className="text-[9px] uppercase font-black tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Vista Compacta</button>
                        </div>
                        <div className="flex-1 px-6 py-3 overflow-hidden">
                            <RouteAnalyzer tickets={tickets.filter(t => isSameDay(t.date, selectedDate))} technicians={technicians} dayStatuses={dayStatuses} />
                        </div>
                    </footer>
                </main>
            </>
        )}

        <TicketFormModal 
            isOpen={isTicketModalOpen} onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); }} 
            onSave={handleSaveTicket} technicians={technicians} services={services} vehicles={vehicles} visores={visores}
            initialDate={newTicketPreData.date} selectedTechId={newTicketPreData.techId} ticketToEdit={editingTicket} 
            onDelete={(id) => { setTickets(prev => prev.filter(t => t.id !== id)); if(syncKey) handleCloudSync('push'); }}
        />
        <SettingsModal 
            isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} 
            technicians={technicians} services={services} vehicles={vehicles} visores={visores} syncKey={syncKey}
            onAddTechnician={(t) => setTechnicians(prev => [...prev, t])} onRemoveTechnician={(id) => setTechnicians(prev => prev.filter(t => t.id !== id))}
            onAddService={(s) => setServices(prev => [...prev, s])} onRemoveService={(id) => setServices(prev => prev.filter(s => s.id !== id))}
            onAddVehicle={(v) => setVehicles(prev => [...prev, v])} onRemoveVehicle={(id) => setVehicles(prev => prev.filter(v => v.id !== id))}
            onAddVisor={(v) => setVisores(prev => [...prev, v])} onRemoveVisor={(id) => setVisores(prev => prev.filter(v => v.id !== id))}
            onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('cloud_sync_key', key || ''); }}
            onCreateSyncKey={createNewSyncKey}
            onExportBackup={() => {}} onImportBackup={() => {}}
        />
        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
