import React, { useState, useEffect, useRef } from 'react';
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
import { ChevronLeft, ChevronRight, Settings, Route, FileBarChart, LogOut, Calendar, LayoutGrid, List, Maximize2, Minimize2, Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  { id: 'v-1', name: 'Carro 1' },
  { id: 'v-2', name: 'Iveco' },
  { id: 'v-3', name: 'Camião' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isCompactView, setIsCompactView] = useState(true);
  const [syncKey, setSyncKey] = useState<string | null>(localStorage.getItem('cloud_sync_key'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => Number(localStorage.getItem('last_sync_time')) || 0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('local_technicians');
    return saved ? JSON.parse(saved) : SEED_TECHNICIANS;
  });

  const [services, setServices] = useState<ServiceDefinition[]>(() => {
    const saved = localStorage.getItem('local_services');
    return saved ? JSON.parse(saved) : SEED_SERVICES;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('local_vehicles');
    return saved ? JSON.parse(saved) : SEED_VEHICLES;
  });

  const [visores, setVisores] = useState<Visor[]>(() => {
    const saved = localStorage.getItem('local_visores');
    return saved ? JSON.parse(saved) : [];
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('local_tickets');
    if (saved) return JSON.parse(saved).map((t: any) => ({ ...t, date: new Date(t.date) }));
    return [];
  });

  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>(() => {
    const saved = localStorage.getItem('local_day_statuses');
    if (saved) return JSON.parse(saved).map((d: any) => ({ ...d, date: new Date(d.date) }));
    return [];
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string | null}>({ date: new Date(), techId: null });

  // Auto-configuração via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get('key');
    if (keyFromUrl && keyFromUrl !== syncKey) {
        setSyncKey(keyFromUrl);
        localStorage.setItem('cloud_sync_key', keyFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sync automático
  useEffect(() => {
    if (syncKey) {
      handleCloudSync('pull');
      const interval = setInterval(() => handleCloudSync('pull'), 15000); 
      return () => clearInterval(interval);
    }
  }, [syncKey]);

  useEffect(() => {
    localStorage.setItem('local_technicians', JSON.stringify(technicians));
    localStorage.setItem('local_services', JSON.stringify(services));
    localStorage.setItem('local_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('local_visores', JSON.stringify(visores));
    localStorage.setItem('local_tickets', JSON.stringify(tickets));
    localStorage.setItem('local_day_statuses', JSON.stringify(dayStatuses));
    localStorage.setItem('last_sync_time', lastSyncTime.toString());
  }, [technicians, services, vehicles, visores, tickets, dayStatuses, lastSyncTime]);

  const handleCloudSync = async (mode: 'push' | 'pull') => {
    if (!syncKey || isSyncing) return;
    setIsSyncing(true);
    try {
      const url = `https://jsonblob.com/api/jsonBlob/${syncKey}`;
      
      if (mode === 'pull') {
        const res = await fetch(url, { 
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
        });
        
        if (res.ok) {
          const data: CloudData = await res.json();
          // Só atualiza se o timestamp da cloud for superior ao local
          if (data && (data.lastSync > lastSyncTime || lastSyncTime === 0)) {
            if (data.technicians) setTechnicians(data.technicians);
            if (data.services) setServices(data.services);
            if (data.vehicles) setVehicles(data.vehicles);
            if (data.visores) setVisores(data.visores || []);
            if (data.tickets) setTickets(data.tickets.map(t => ({ ...t, date: new Date(t.date) })));
            if (data.dayStatuses) setDayStatuses((data.dayStatuses || []).map(d => ({ ...d, date: new Date(d.date) })));
            setLastSyncTime(data.lastSync);
            setSyncError(null);
          }
        } else {
            setSyncError(res.status === 404 ? "Chave Inválida" : "Erro Servidor");
        }
      } else {
        const payload: CloudData = {
          technicians, services, vehicles, visores, dayStatuses,
          tickets: tickets.map(t => ({ ...t, updatedAt: Date.now() })),
          lastSync: Date.now()
        };
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
            setLastSyncTime(payload.lastSync);
            setSyncError(null);
        } else {
            setSyncError("Erro Gravação");
        }
      }
    } catch (e: any) {
      setSyncError("Sem Internet");
    } finally {
      setIsSyncing(false);
    }
  };

  const createNewSyncKey = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const payload: CloudData = { technicians, services, vehicles, visores, tickets, dayStatuses, lastSync: Date.now() };
      
      const res = await fetch('https://jsonblob.com/api/jsonBlob', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("API Indisponível");

      // O JSONBlob retorna o ID no header Location. 
      // Em alguns browsers, precisamos ler o corpo se o header estiver bloqueado por CORS.
      const location = res.headers.get('Location');
      let id = location ? location.split('/').pop() : null;
      
      if (!id) {
          // Fallback: Tenta ler o corpo se a API mudar o comportamento
          const data = await res.json();
          id = data?.id || null;
      }
      
      if (id) {
        setSyncKey(id);
        localStorage.setItem('cloud_sync_key', id);
        setLastSyncTime(payload.lastSync);
        setSyncError(null);
      } else {
        throw new Error("ID não recebido");
      }
    } catch (e: any) {
      setSyncError("Erro ao ativar Cloud. Verifique ligação.");
      alert("Aviso: O serviço de sincronização pública está lento ou bloqueado. Tente novamente ou use uma chave manual.");
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
    if (syncKey) setTimeout(() => handleCloudSync('push'), 300);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: Date.now() } : t));
    if (syncKey) setTimeout(() => handleCloudSync('push'), 300);
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setEditingTicket(null);
    if (syncKey) setTimeout(() => handleCloudSync('push'), 300);
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={syncKey} onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('cloud_sync_key', key || ''); if(key) handleCloudSync('pull'); }} />;

  if (user.role === 'technician' && user.technicianId) {
      const currentTech = technicians.find(t => t.id === user.technicianId);
      return (
          <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            <div className={`p-1.5 text-center text-[9px] font-black uppercase tracking-[0.2em] text-white shrink-0 z-[60] shadow-md flex items-center justify-center gap-2 transition-all ${syncKey ? (syncError ? 'bg-amber-500' : 'bg-emerald-600') : 'bg-slate-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'animate-pulse bg-white' : 'bg-white/50'}`} />
                {syncKey ? (syncError || `Ligado • Sincronizado: ${format(new Date(lastSyncTime), 'HH:mm')}`) : 'Trabalhando Offline'}
                {syncKey && <button onClick={() => handleCloudSync('pull')} className={`ml-2 ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={10}/></button>}
            </div>
            <MobileTechnicianView 
                tickets={tickets} 
                technicianId={user.technicianId} 
                technician={currentTech!}
                services={services} 
                vehicles={vehicles}
                onUpdateStatus={(id, status) => handleUpdateTicket(id, { status })}
                onViewDetails={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }}
                onUpdateProfile={(updates) => {
                    setTechnicians(prev => prev.map(t => t.id === user.technicianId ? {...t, ...updates} : t));
                    if (syncKey) handleCloudSync('push');
                }}
                onLogout={() => setUser(null)}
            />
            <TicketFormModal 
                isOpen={isTicketModalOpen} 
                onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); }}
                onSave={handleSaveTicket}
                onUpdate={handleUpdateTicket}
                technicians={technicians}
                services={services}
                vehicles={vehicles}
                visores={visores}
                initialDate={new Date()}
                selectedTechId={user.technicianId}
                ticketToEdit={editingTicket}
                isReadOnly={false}
            />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans antialiased">
        <div className={`p-1.5 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white z-[60] transition-all flex items-center justify-center gap-2 shadow-sm ${syncKey ? (syncError ? 'bg-amber-500' : 'bg-emerald-600') : 'bg-slate-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'animate-pulse bg-white' : 'bg-white/50'}`} />
            {syncKey ? (syncError || `Base de Dados Nuvem Ativa • Último Sync: ${format(new Date(lastSyncTime), 'HH:mm:ss')}`) : 'Dados Locais (Sem Backup Nuvem)'}
            {syncKey && <button onClick={() => handleCloudSync('pull')} className={`ml-2 p-1 hover:bg-white/10 rounded transition-colors ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={10}/></button>}
        </div>

        <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-50">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-100 cursor-pointer hover:scale-105 transition-all active:scale-95" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
                         <span className="text-white text-xl font-black">M</span>
                    </div>
                    <div>
                        <h1 className="text-lg text-slate-900 leading-none font-black tracking-tighter uppercase">Balanças Marques</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Logistics Command Center</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-200">
                        <button onClick={() => { setViewMode('week'); setIsCompactView(true); }} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Semana</button>
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
                    <button onClick={() => setIsReportsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all" title="Relatórios"><FileBarChart size={20} /></button>
                    {user.role === 'admin' && (
                        <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all" title="Definições"><Settings size={20} /></button>
                    )}
                    <button onClick={() => { setEditingTicket(null); setNewTicketPreData({date: selectedDate, techId: null}); setIsTicketModalOpen(true); }} className="bg-red-600 text-white hover:bg-red-700 px-6 py-2.5 rounded-xl shadow-xl shadow-red-100 font-black text-[10px] uppercase tracking-widest ml-2 transition-all active:scale-95">Nova Intervenção</button>
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
                        if (syncKey) setTimeout(() => handleCloudSync('push'), 200);
                    }}
                    onSelectDate={setSelectedDate}
                    selectedDate={selectedDate}
                    isReadOnly={user.role === 'viewer'}
                    isCompact={isCompactView}
                  />
               ) : viewMode === 'month' ? (
                   <div className="h-full overflow-hidden flex flex-col">
                       <CalendarView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={(d) => { setSelectedDate(d); setViewMode('week'); }} tickets={tickets} technicians={technicians} selectedTechId={null} isReadOnly={user.role === 'viewer'} />
                   </div>
               ) : (
                   <ListView tickets={tickets} technicians={technicians} services={services} vehicles={vehicles} onEditTicket={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }} onUpdateTicket={handleUpdateTicket} isReadOnly={user.role === 'viewer'} />
               )}
            </div>

            <footer className="h-64 bg-white border border-slate-200 rounded-3xl shadow-sm z-30 shrink-0 flex flex-col overflow-hidden hidden md:flex border-b-4 border-b-red-600/20">
               <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 w-2 h-2 rounded-full animate-pulse" />
                        <span className="text-slate-700 text-[10px] uppercase tracking-[0.2em] font-black">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}</span>
                    </div>
                    <button onClick={() => setIsCompactView(!isCompactView)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all border ${isCompactView ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                        {isCompactView ? <Maximize2 size={12} /> : <Minimize2 size={12} />} {isCompactView ? 'Vista Alargada' : 'Compactar'}
                    </button>
               </div>
               <div className="flex-1 px-6 py-3 bg-white overflow-hidden">
                 <div className="grid grid-cols-4 gap-6 h-full">
                    <div className="col-span-1 border-r border-slate-100 pr-4 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[9px] text-slate-400 uppercase tracking-widest mb-3 font-black">Agenda do Dia Selecionado</h4>
                        <div className="space-y-1.5">
                            {tickets.filter(t => isSameDay(t.date, selectedDate)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(tick => (
                                <div key={tick.id} onClick={() => { setEditingTicket(tick); setIsTicketModalOpen(true); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] uppercase font-bold hover:bg-red-50 hover:border-red-200 cursor-pointer transition-all flex items-center justify-between group">
                                    <span className="truncate flex-1"><span className="text-red-600 mr-2">{tick.scheduledTime}</span> {tick.customerName}</span>
                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-red-400" />
                                </div>
                            ))}
                            {tickets.filter(t => isSameDay(t.date, selectedDate)).length === 0 && (
                                <p className="text-[9px] text-slate-300 italic uppercase font-bold text-center py-8">Sem serviços para este dia</p>
                            )}
                        </div>
                    </div>
                    <div className="col-span-3 h-full overflow-hidden">
                        <RouteAnalyzer tickets={tickets.filter(t => isSameDay(t.date, selectedDate))} technicians={technicians} dayStatuses={dayStatuses} />
                    </div>
                 </div>
               </div>
            </footer>
        </main>

        <TicketFormModal isOpen={isTicketModalOpen} onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); }} onSave={handleSaveTicket} onDelete={handleDeleteTicket} onUpdate={handleUpdateTicket} technicians={technicians} services={services} vehicles={vehicles} visores={visores} initialDate={newTicketPreData.date} selectedTechId={newTicketPreData.techId} ticketToEdit={editingTicket} isReadOnly={user.role === 'viewer'} />

        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} technicians={technicians} services={services} vehicles={vehicles} visores={visores} syncKey={syncKey} onAddTechnician={(t) => { setTechnicians(prev => [...prev, t]); if(syncKey) handleCloudSync('push'); }} onRemoveTechnician={(id) => { setTechnicians(prev => prev.filter(t => t.id !== id)); if(syncKey) handleCloudSync('push'); }} onAddService={(s) => { setServices(prev => [...prev, s]); if(syncKey) handleCloudSync('push'); }} onRemoveService={(id) => { setServices(prev => prev.filter(s => s.id !== id)); if(syncKey) handleCloudSync('push'); }} onAddVehicle={(v) => { setVehicles(prev => [...prev, v]); if(syncKey) handleCloudSync('push'); }} onRemoveVehicle={(id) => { setVehicles(prev => prev.filter(v => v.id !== id)); if(syncKey) handleCloudSync('push'); }} onAddVisor={(v) => { setVisores(prev => [...prev, v]); if(syncKey) handleCloudSync('push'); }} onRemoveVisor={(id) => { setVisores(prev => prev.filter(v => v.id !== id)); if(syncKey) handleCloudSync('push'); }} onUpdateTechnician={(id, updates) => { setTechnicians(prev => prev.map(t => t.id === id ? {...t, ...updates} : t)); if(syncKey) handleCloudSync('push'); }} onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('cloud_sync_key', key || ''); if(key) handleCloudSync('pull'); }} onCreateSyncKey={createNewSyncKey} onExportBackup={() => {}} onImportBackup={() => {}} />

        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;