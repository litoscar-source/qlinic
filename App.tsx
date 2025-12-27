
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { MobileTechnicianView } from './components/MobileTechnicianView';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, Visor, Vehicle, TicketStatus } from './types';
import { format, isSameDay, startOfDay, parseISO } from 'date-fns';
// Fix: Added missing icons FileBarChart and Settings to the import list from lucide-react
import { Database, RefreshCw, Wifi, WifiOff, Server, CloudLightning, FileBarChart, Settings } from 'lucide-react';

const SEED_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'João Silva', avatarColor: 'bg-blue-600', password: '1234' },
  { id: 'tech-2', name: 'Maria Costa', avatarColor: 'bg-emerald-600', password: '1234' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('sb_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('sb_key') || '');
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  const [isCompactView, setIsCompactView] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visores, setVisores] = useState<Visor[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string | null}>({ date: new Date(), techId: null });

  // Inicializar Cliente Supabase
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
    }
  }, [supabaseUrl, supabaseKey]);

  // Carregar Dados Iniciais
  const fetchAllData = useCallback(async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      const [
        { data: techs }, 
        { data: svcs }, 
        { data: vhcl }, 
        { data: tix }, 
        { data: days }
      ] = await Promise.all([
        supabase.from('technicians').select('*'),
        supabase.from('services').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('day_statuses').select('*')
      ]);

      if (techs) setTechnicians(techs);
      if (svcs) setServices(svcs);
      if (vhcl) setVehicles(vhcl);
      if (tix) setTickets(tix.map((t: any) => ({ ...t, date: parseISO(t.scheduled_date || t.date) })));
      if (days) setDayStatuses(days.map((d: any) => ({ ...d, date: parseISO(d.date) })));
      
    } catch (e) {
      console.error("Erro ao sincronizar com Postgres:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
      fetchAllData();
      
      // Subscrever a alterações em Tempo Real (Multi-posto)
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchAllData(); // Recarregar tudo quando houver mudança em qualquer posto
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [supabase, fetchAllData]);

  // CRUD Operations via Supabase
  const handleSaveTicket = async (ticketData: any) => {
    if (!supabase) return;
    const now = new Date().toISOString();
    const payload = {
      ...ticketData,
      scheduled_date: format(ticketData.date, 'yyyy-MM-dd'),
      updated_at: now
    };

    if (editingTicket) {
      await supabase.from('tickets').update(payload).eq('id', editingTicket.id);
    } else {
      await supabase.from('tickets').insert([{ ...payload, id: crypto.randomUUID(), created_at: now }]);
    }
    setEditingTicket(null);
    setIsTicketModalOpen(false);
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!supabase) return;
    await supabase.from('tickets').update(updates).eq('id', ticketId);
  };

  const handleToggleOvernight = async (date: Date, techId: string) => {
    if (!supabase) return;
    const existing = dayStatuses.find(ds => isSameDay(ds.date, date) && ds.technicianId === techId);
    if (existing) {
      await supabase.from('day_statuses').delete().eq('id', existing.id);
    } else {
      await supabase.from('day_statuses').insert([{
        id: crypto.randomUUID(),
        technicianId: techId,
        date: format(date, 'yyyy-MM-dd'),
        isOvernight: true
      }]);
    }
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={supabaseUrl ? 'CONECTADO' : null} onSetSyncKey={() => setIsSettingsModalOpen(true)} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans antialiased">
        <div className={`px-4 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white transition-all duration-300 z-[70] ${!onlineStatus ? 'bg-slate-700' : supabase ? 'bg-[#336791]' : 'bg-amber-600'}`}>
            <div className="flex items-center gap-3">
                {supabase ? <CloudLightning size={14} className="animate-pulse" /> : <WifiOff size={14} />}
                <span>{supabase ? 'Ligação SQL Multi-posto Ativa' : 'Aguardando Configuração Supabase'}</span>
            </div>
            {supabase && (
                <div className="flex items-center gap-4">
                    <button onClick={fetchAllData} className={`hover:scale-110 active:rotate-180 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={12} />
                    </button>
                </div>
            )}
        </div>

        {user.role === 'technician' && user.technicianId ? (
            <MobileTechnicianView 
                tickets={tickets} 
                technicianId={user.technicianId} 
                technician={technicians.find(t => t.id === user.technicianId)! || { name: 'Técnico', avatarColor: 'bg-slate-500' }}
                services={services} 
                vehicles={vehicles}
                onUpdateStatus={(id, status) => handleUpdateTicket(id, { status })}
                onViewDetails={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }}
                onUpdateProfile={() => {}}
                onLogout={() => setUser(null)}
            />
        ) : (
            <>
                <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-50">
                    <div className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#336791] rounded-xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => setCurrentDate(new Date())}>
                                <Database className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg text-[#336791] leading-none font-black tracking-tighter uppercase">Marques Multi-Posto</h1>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Base de Dados PostgreSQL Cloud</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsReportsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-[#336791] rounded-xl"><FileBarChart size={20} /></button>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-[#336791] rounded-xl"><Settings size={20} /></button>
                            <button onClick={() => { setEditingTicket(null); setNewTicketPreData({date: selectedDate, techId: null}); setIsTicketModalOpen(true); }} className="bg-red-600 text-white px-6 py-2.5 rounded-xl shadow-xl font-black text-[10px] uppercase tracking-widest ml-2">Novo Serviço</button>
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
                                onToggleOvernight={handleToggleOvernight}
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
                    <footer className="h-64 bg-white border border-slate-200 rounded-3xl shadow-sm hidden md:flex flex-col">
                        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between">
                            <span className="text-slate-700 text-[10px] uppercase tracking-[0.2em] font-black">Análise de Rota</span>
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
            onDelete={async (id) => { if (supabase) await supabase.from('tickets').delete().eq('id', id); }}
        />
        
        <SettingsModal 
            isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} 
            technicians={technicians} services={services} vehicles={vehicles} visores={visores} syncKey={supabaseUrl}
            onAddTechnician={async (t) => { if (supabase) await supabase.from('technicians').insert([t]); }}
            onRemoveTechnician={async (id) => { if (supabase) await supabase.from('technicians').delete().eq('id', id); }}
            onAddService={async (s) => { if (supabase) await supabase.from('services').insert([s]); }}
            onRemoveService={async (id) => { if (supabase) await supabase.from('services').delete().eq('id', id); }}
            onAddVehicle={async (v) => { if (supabase) await supabase.from('vehicles').insert([v]); }}
            onRemoveVehicle={async (id) => { if (supabase) await supabase.from('vehicles').delete().eq('id', id); }}
            onAddVisor={() => {}} onRemoveVisor={() => {}}
            onSetSyncKey={() => {}} 
            onCreateSyncKey={() => {}}
            onExportBackup={() => {}} onImportBackup={() => {}}
            // Novos props para Supabase
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
            onSaveSupabaseConfig={(url, key) => {
              setSupabaseUrl(url);
              setSupabaseKey(key);
              localStorage.setItem('sb_url', url);
              localStorage.setItem('sb_key', key);
              alert("Configuração guardada! A app irá ligar-se ao PostgreSQL.");
            }}
        />
        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
