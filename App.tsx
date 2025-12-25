
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
import { addWeeks, subWeeks, format, isSameDay, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, Route, FileBarChart, LogOut, Calendar, LayoutGrid, List, Maximize2, Minimize2, Cloud, CloudOff, RefreshCw, AlertCircle, Download, Upload } from 'lucide-react';

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
  { id: 'v-1', name: 'Carro' },
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
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string} | null>(null);

  // Auto-configuração via URL query param (?key=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get('key');
    if (keyFromUrl && keyFromUrl !== syncKey) {
        setSyncKey(keyFromUrl);
        localStorage.setItem('cloud_sync_key', keyFromUrl);
        // Limpa a URL para não ficar "feio"
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sync automático
  useEffect(() => {
    if (syncKey) {
      handleCloudSync('pull');
      const interval = setInterval(() => handleCloudSync('pull'), 20000); // 20 segs para mobile ser mais ágil
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
          if (data && (data.lastSync > lastSyncTime || lastSyncTime === 0)) {
            if (data.technicians) setTechnicians(data.technicians);
            if (data.services) setServices(data.services);
            if (data.vehicles) setVehicles(data.vehicles);
            if (data.visores) setVisores(data.visores);
            if (data.tickets) setTickets(data.tickets.map(t => ({ ...t, date: new Date(t.date) })));
            if (data.dayStatuses) setDayStatuses((data.dayStatuses || []).map(d => ({ ...d, date: new Date(d.date) })));
            setLastSyncTime(data.lastSync);
            setSyncError(null);
          }
        } else {
            setSyncError(res.status === 404 ? "Chave Cloud Inválida" : "Erro Servidor");
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
            setSyncError("Erro de Escrita");
        }
      }
    } catch (e: any) {
      setSyncError("Sem Ligação");
    } finally {
      setIsSyncing(false);
    }
  };

  const createNewSyncKey = async () => {
    setIsSyncing(true);
    try {
      const payload: CloudData = { technicians, services, vehicles, visores, tickets, dayStatuses, lastSync: Date.now() };
      const res = await fetch('https://jsonblob.com/api/jsonBlob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const location = res.headers.get('Location');
      const id = location ? location.split('/').pop() : null;
      
      if (id) {
        setSyncKey(id);
        localStorage.setItem('cloud_sync_key', id);
        setLastSyncTime(payload.lastSync);
      }
    } catch (e: any) {
      alert("Erro ao ativar Cloud");
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
    setNewTicketPreData(null);
    if (syncKey) setTimeout(() => handleCloudSync('push'), 200);
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setEditingTicket(null);
    if (syncKey) setTimeout(() => handleCloudSync('push'), 200);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: Date.now() } : t));
    if (syncKey) setTimeout(() => handleCloudSync('push'), 200);
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={syncKey} onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('cloud_sync_key', key || ''); if(key) handleCloudSync('pull'); }} />;

  if (user.role === 'technician' && user.technicianId) {
      const currentTech = technicians.find(t => t.id === user.technicianId);
      return (
          <div className="flex flex-col h-screen overflow-hidden">
            <div className={`p-1 text-center text-[9px] font-black uppercase tracking-widest text-white shrink-0 z-[60] shadow-sm flex items-center justify-center gap-2 ${syncKey ? (syncError ? 'bg-amber-500' : 'bg-emerald-600') : 'bg-slate-400'}`}>
                {syncKey ? (syncError ? <AlertCircle size={10} /> : <Cloud size={10} />) : <CloudOff size={10} />}
                {syncKey ? (syncError || `Sincronizado: ${format(new Date(lastSyncTime), 'HH:mm')}`) : 'Modo Offline'}
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
        <div className={`p-1 text-center text-[9px] font-black uppercase tracking-[0.2em] text-white z-[60] transition-all flex items-center justify-center gap-2 shadow-sm ${syncKey ? (syncError ? 'bg-amber-500' : 'bg-emerald-600') : 'bg-slate-400'}`}>
            {syncKey ? (syncError ? <AlertCircle size={10} /> : <Cloud size={10} />) : <CloudOff size={10} />}
            {syncKey ? (syncError || `Ligado à Cloud • Sincronizado: ${format(new Date(lastSyncTime), 'HH:mm')}`) : 'Dados Apenas Locais'}
            {syncKey && <button onClick={() => handleCloudSync('pull')} className={`ml-2 p-1 hover:bg-white/10 rounded transition-colors ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={10}/></button>}
        </div>

        <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-50">
            <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={() => setCurrentDate(new Date())}>
                         <span className="text-white text-lg font-bold">M</span>
                    </div>
                    <div>
                        <h1 className="text-base text-slate-900 leading-none font-bold tracking-tight">Balanças Marques</h1>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Qlinic Logistics</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-white rounded-md text-slate-600"><ChevronLeft size={16}/></button>
                        <span className="px-2 text-slate-800 w-36 text-center text-[10px] uppercase tracking-widest font-bold">
                            {format(currentDate, 'MMMM yyyy', { locale: pt })}
                        </span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-white rounded-md text-slate-600"><ChevronRight size={16}/></button>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => setIsReportsModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><FileBarChart size={18} /></button>
                    {user.role === 'admin' && (
                        <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><Settings size={18} /></button>
                    )}
                    <button onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }} className="bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 rounded shadow shadow-red-200 font-bold text-[10px] uppercase tracking-widest ml-1 transition-all">Novo</button>
                    <button onClick={() => setUser(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><LogOut size={18} /></button>
                </div>
            </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
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
                   <div className="h-full overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200">
                       <CalendarView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} tickets={tickets} technicians={technicians} selectedTechId={null} />
                   </div>
               ) : (
                   <ListView tickets={tickets} technicians={technicians} services={services} vehicles={vehicles} onEditTicket={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }} onUpdateTicket={handleUpdateTicket} isReadOnly={user.role === 'viewer'} />
               )}
            </div>

            <footer className="h-60 bg-white border border-slate-200 rounded-xl shadow-sm z-30 shrink-0 flex flex-col overflow-hidden hidden md:flex">
               <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Route size={14} className="text-red-600" />
                        <span className="text-slate-700 text-[10px] uppercase tracking-widest font-bold">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}</span>
                    </div>
                    <button onClick={() => setIsCompactView(!isCompactView)} className={`flex items-center gap-1.5 px-3 py-1 rounded text-[9px] uppercase tracking-widest font-bold transition-all border ${isCompactView ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                        {isCompactView ? <Maximize2 size={12} /> : <Minimize2 size={12} />} {isCompactView ? 'Vista Alargada' : 'Compactar'}
                    </button>
               </div>
               <div className="flex-1 px-4 py-1.5 bg-white overflow-hidden">
                 <div className="grid grid-cols-4 gap-4 h-full">
                    <div className="col-span-1 border-r border-slate-100 pr-2 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[9px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Agenda do Dia</h4>
                        <div className="space-y-0.5">
                            {tickets.filter(t => isSameDay(t.date, selectedDate)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(tick => (
                                <div key={tick.id} onClick={() => { setEditingTicket(tick); setIsTicketModalOpen(true); }} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] uppercase font-semibold hover:bg-red-50 hover:border-red-300 cursor-pointer truncate transition-all">
                                    <span className="text-red-600 mr-2">{tick.scheduledTime}</span> {tick.customerName}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3 h-full overflow-hidden">
                        <RouteAnalyzer tickets={tickets.filter(t => isSameDay(t.date, selectedDate))} technicians={technicians} dayStatuses={dayStatuses} />
                    </div>
                 </div>
               </div>
            </footer>
        </main>

        <TicketFormModal isOpen={isTicketModalOpen} onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); setNewTicketPreData(null); }} onSave={handleSaveTicket} onDelete={handleDeleteTicket} onUpdate={handleUpdateTicket} technicians={technicians} services={services} vehicles={vehicles} visores={visores || []} initialDate={newTicketPreData ? newTicketPreData.date : selectedDate} selectedTechId={newTicketPreData ? newTicketPreData.techId : null} ticketToEdit={editingTicket} isReadOnly={user.role === 'viewer'} />

        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} technicians={technicians} services={services} vehicles={vehicles} visores={visores || []} syncKey={syncKey} onAddTechnician={(t) => { setTechnicians(prev => [...prev, t]); if(syncKey) handleCloudSync('push'); }} onRemoveTechnician={(id) => { setTechnicians(prev => prev.filter(t => t.id !== id)); if(syncKey) handleCloudSync('push'); }} onAddService={(s) => { setServices(prev => [...prev, s]); if(syncKey) handleCloudSync('push'); }} onRemoveService={(id) => { setServices(prev => prev.filter(s => s.id !== id)); if(syncKey) handleCloudSync('push'); }} onAddVehicle={(v) => { setVehicles(prev => [...prev, v]); if(syncKey) handleCloudSync('push'); }} onRemoveVehicle={(id) => { setVehicles(prev => prev.filter(v => v.id !== id)); if(syncKey) handleCloudSync('push'); }} onAddVisor={(v) => { setVisores(prev => [...prev, v]); if(syncKey) handleCloudSync('push'); }} onRemoveVisor={(id) => { setVisores(prev => prev.filter(v => v.id !== id)); if(syncKey) handleCloudSync('push'); }} onUpdateTechnician={(id, updates) => { setTechnicians(prev => prev.map(t => t.id === id ? {...t, ...updates} : t)); if(syncKey) handleCloudSync('push'); }} onSetSyncKey={(key) => { setSyncKey(key); localStorage.setItem('cloud_sync_key', key || ''); if(key) handleCloudSync('pull'); }} onCreateSyncKey={createNewSyncKey} onExportBackup={() => {}} onImportBackup={() => {}} />

        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores || []} />
    </div>
  );
}

export default App;
