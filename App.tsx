
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { MobileTechnicianView } from './components/MobileTechnicianView';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, Visor, CloudData, Vehicle, TicketStatus } from './types';
import { addWeeks, subWeeks, format, isSameDay, startOfDay, addMonths, subMonths, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, FileBarChart, LogOut, RefreshCw, Wifi, WifiOff, Database, Cloud, ShieldCheck, Server } from 'lucide-react';

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
  const [syncKey, setSyncKey] = useState<string | null>(localStorage.getItem('pg_sync_id'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => Number(localStorage.getItem('pg_last_sync')) || 0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);

  // Estados tipo "Table" (Postgres Relational Style)
  const [technicians, setTechnicians] = useState<Technician[]>(() => JSON.parse(localStorage.getItem('tbl_technicians') || JSON.stringify(SEED_TECHNICIANS)));
  const [services, setServices] = useState<ServiceDefinition[]>(() => JSON.parse(localStorage.getItem('tbl_services') || JSON.stringify(SEED_SERVICES)));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => JSON.parse(localStorage.getItem('tbl_vehicles') || JSON.stringify(SEED_VEHICLES)));
  const [visores, setVisores] = useState<Visor[]>(() => JSON.parse(localStorage.getItem('tbl_visores') || '[]'));
  
  // Mapping local storage data to the updated Ticket interface.
  const [tickets, setTickets] = useState<Ticket[]>(() => (JSON.parse(localStorage.getItem('tbl_tickets') || '[]')).map((t: any) => ({ 
    ...t, 
    ticketNumber: t.ticketNumber || t.ticket_number,
    customerName: t.customerName || t.customer_name,
    vehicleId: t.vehicleId || t.vehicle_id,
    serviceId: t.serviceId || t.service_id,
    scheduledTime: t.scheduledTime || t.scheduled_time,
    duration: t.duration || t.duration_hours,
    date: t.date ? (typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date)) : parseISO(t.scheduled_date)
  })));
  
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>(() => (JSON.parse(localStorage.getItem('tbl_day_statuses') || '[]')).map((d: any) => ({ 
    ...d, 
    technicianId: d.technicianId || d.technician_id,
    isOvernight: d.isOvernight !== undefined ? d.isOvernight : d.is_overnight,
    date: typeof d.date === 'string' ? parseISO(d.date) : new Date(d.date) 
  })));
  
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

  // Persistência Atómica Local (Snapshot)
  useEffect(() => {
    localStorage.setItem('tbl_technicians', JSON.stringify(technicians));
    localStorage.setItem('tbl_services', JSON.stringify(services));
    localStorage.setItem('tbl_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('tbl_visores', JSON.stringify(visores));
    localStorage.setItem('tbl_tickets', JSON.stringify(tickets));
    localStorage.setItem('tbl_day_statuses', JSON.stringify(dayStatuses));
    localStorage.setItem('pg_last_sync', lastSyncTime.toString());
  }, [technicians, services, vehicles, visores, tickets, dayStatuses, lastSyncTime]);

  /**
   * MOTOR DE SINCRONIZAÇÃO POSTGRESQL (Relational)
   */
  const handleCloudSync = useCallback(async (mode: 'push' | 'pull') => {
    if (!syncKey || !navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    setSyncError(null);

    try {
      const url = `https://api.npoint.io/${syncKey}`;
      
      if (mode === 'pull') {
        const res = await fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
        if (!res.ok) throw new Error("SQL Connection Timeout");
        
        const remoteData: CloudData = await res.json();
        
        if (remoteData && remoteData.last_sync > lastSyncTime) {
          if (remoteData.technicians) setTechnicians(remoteData.technicians);
          if (remoteData.services) setServices(remoteData.services);
          if (remoteData.vehicles) setVehicles(remoteData.vehicles);
          if (remoteData.visores) setVisores(remoteData.visores || []);
          if (remoteData.tickets) {
            setTickets(remoteData.tickets.map(t => ({ 
              ...t, 
              ticketNumber: t.ticketNumber || (t as any).ticket_number,
              customerName: t.customerName || (t as any).customer_name,
              vehicleId: t.vehicleId || (t as any).vehicle_id,
              serviceId: t.serviceId || (t as any).service_id,
              scheduledTime: t.scheduledTime || (t as any).scheduled_time,
              duration: t.duration || (t as any).duration_hours,
              date: t.date ? parseISO(String(t.date)) : parseISO((t as any).scheduled_date) 
            })));
          }
          if (remoteData.day_statuses) {
            setDayStatuses((remoteData.day_statuses || []).map(d => ({ 
              ...d, 
              technicianId: d.technicianId || d.technician_id,
              isOvernight: d.isOvernight !== undefined ? d.isOvernight : d.is_overnight,
              date: parseISO(d.date) 
            })));
          }
          setLastSyncTime(remoteData.last_sync);
        }
      } else {
        const payload: CloudData = {
          technicians, services, vehicles, visores,
          day_statuses: dayStatuses.map(d => ({ ...d, date: format(d.date, 'yyyy-MM-dd') })),
          tickets: tickets.map(t => ({ 
            ...t, 
            scheduled_date: format(t.date, 'yyyy-MM-dd'),
            updated_at: new Date().toISOString() 
          })),
          last_sync: Date.now()
        };
        
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error("PostgreSQL Write Error");
        setLastSyncTime(payload.last_sync);
      }
    } catch (e: any) {
      console.error("Relational Sync Error:", e);
      setSyncError("Erro SQL: Falha na Transação.");
    } finally {
      setIsSyncing(false);
    }
  }, [syncKey, lastSyncTime, technicians, services, vehicles, visores, tickets, dayStatuses, isSyncing]);

  useEffect(() => {
    if (syncKey) {
      handleCloudSync('pull');
      const interval = setInterval(() => handleCloudSync('pull'), 30000);
      return () => clearInterval(interval);
    }
  }, [syncKey]);

  const connectToPostgres = async () => {
    setIsSyncing(true);
    try {
      const initial: CloudData = { technicians, services, vehicles, visores, tickets, day_statuses: dayStatuses, last_sync: Date.now() };
      const res = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initial)
      });
      const data = await res.json();
      if (data.id) {
        setSyncKey(data.id);
        localStorage.setItem('pg_sync_id', data.id);
        alert("Instância PostgreSQL Criada com Sucesso!");
      }
    } catch (e) {
      setSyncError("Não foi possível estabelecer ligação ao servidor SQL.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveTicket = (ticketData: any) => {
    let updated;
    const now = new Date().toISOString();
    if (editingTicket) {
      const updatedRow: Ticket = { 
        ...editingTicket, 
        ...ticketData, 
        updated_at: now, 
        version: (editingTicket.version || 0) + 1 
      };
      updated = tickets.map(t => t.id === editingTicket.id ? updatedRow : t);
    } else {
      const newRow: Ticket = { 
        ...ticketData, 
        id: crypto.randomUUID(), 
        created_at: now, 
        updated_at: now, 
        version: 1 
      };
      updated = [...tickets, newRow];
    }
    setTickets(updated);
    setEditingTicket(null);
    if (syncKey) setTimeout(() => handleCloudSync('push'), 500);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    if (syncKey) setTimeout(() => handleCloudSync('push'), 500);
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={syncKey} onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('pg_sync_id', key || ''); }} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans antialiased">
        
        {/* Status Bar estilo Postgres Monitor */}
        <div className={`px-4 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white transition-all duration-300 z-[70] ${!onlineStatus ? 'bg-slate-700' : syncError ? 'bg-rose-600' : syncKey ? 'bg-[#336791]' : 'bg-slate-400'}`}>
            <div className="flex items-center gap-3">
                <Server size={14} className={syncKey ? 'animate-pulse' : ''} />
                <span>{!onlineStatus ? 'SQL Offline' : syncError ? 'Database Transaction Error' : syncKey ? 'PostgreSQL Active (Master)' : 'No Server Connection'}</span>
            </div>
            {syncKey && (
                <div className="flex items-center gap-4">
                    <span className="opacity-70 hidden sm:inline">DB_INSTANCE: {syncKey}</span>
                    <span className="opacity-70">Last Transaction: {lastSyncTime > 0 ? format(new Date(lastSyncTime), 'HH:mm:ss') : 'N/A'}</span>
                    <button onClick={() => handleCloudSync('pull')} className={`hover:scale-110 active:rotate-180 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
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
                            <div className="w-10 h-10 bg-[#336791] rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 cursor-pointer hover:scale-105 transition-all" onClick={() => setCurrentDate(new Date())}>
                                <Database className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg text-[#336791] leading-none font-black tracking-tighter uppercase">Marques PostgreSQL</h1>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Relational Fleet Manager</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-200">
                                <button onClick={() => setViewMode('week')} className={`px-5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white text-[#336791] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Semana</button>
                                <button onClick={() => setViewMode('month')} className={`px-5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white text-[#336791] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
                                <button onClick={() => setViewMode('list')} className={`px-5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-[#336791] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsReportsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-[#336791] hover:bg-slate-100 rounded-xl transition-all"><FileBarChart size={20} /></button>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-[#336791] hover:bg-slate-100 rounded-xl transition-all"><Settings size={20} /></button>
                            <button onClick={() => { setEditingTicket(null); setNewTicketPreData({date: selectedDate, techId: null}); setIsTicketModalOpen(true); }} className="bg-red-600 text-white hover:bg-red-700 px-6 py-2.5 rounded-xl shadow-xl shadow-red-100 font-black text-[10px] uppercase tracking-widest ml-2 transition-all">Novo Serviço</button>
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
                                // Updated to use camelCase technicianId
                                const idx = dayStatuses.findIndex(ds => isSameDay(ds.date, date) && ds.technicianId === techId);
                                if (idx >= 0) setDayStatuses(prev => prev.filter((_, i) => i !== idx));
                                else setDayStatuses(prev => [...prev, { id: crypto.randomUUID(), technicianId: techId, date: startOfDay(date), isOvernight: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), version: 1 }]);
                                if (syncKey) setTimeout(() => handleCloudSync('push'), 200);
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
                                <div className="bg-[#336791] w-2 h-2 rounded-full animate-pulse" />
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
            onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('pg_sync_id', key || ''); if(key) handleCloudSync('pull'); }}
            onCreateSyncKey={connectToPostgres}
            onExportBackup={() => {}} onImportBackup={() => {}}
        />
        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
