
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
import { Database, RefreshCw, Wifi, WifiOff, Server, CloudLightning, FileBarChart, Settings, Maximize2, Minimize2, Calendar as CalendarIcon, List, Columns } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('sb_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('sb_key') || '');
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  const [isCompactView, setIsCompactView] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('local_technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
    }
  }, [supabaseUrl, supabaseKey]);

  const fetchAllData = useCallback(async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      const [
        { data: techs }, 
        { data: svcs }, 
        { data: vhcl }, 
        { data: vis },
        { data: tix }, 
        { data: days }
      ] = await Promise.all([
        supabase.from('technicians').select('*'),
        supabase.from('services').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('visores').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('day_statuses').select('*')
      ]);

      if (techs) setTechnicians(techs);
      if (svcs) setServices(svcs.map(s => ({...s, defaultDuration: s.default_duration || s.defaultDuration})));
      if (vhcl) setVehicles(vhcl);
      if (vis) setVisores(vis);
      
      if (tix) {
          // MAPEAMENTO CRÍTICO: Converter nomes de colunas SQL para propriedades da aplicação
          const mappedTickets = tix.map((t: any) => ({
              ...t,
              date: parseISO(t.scheduled_date),
              scheduledTime: t.scheduled_time,
              technicianIds: t.technician_ids || [], // Garante que é um array
              serviceId: t.service_id,
              vehicleId: t.vehicle_id,
              visorId: t.visor_id,
              ticketNumber: t.ticket_number,
              customerName: t.customer_name,
              processNumber: t.process_number,
              faultDescription: t.fault_description
          }));
          setTickets(mappedTickets);
      }
      
      if (days) {
          setDayStatuses(days.map((d: any) => ({ 
              ...d, 
              date: parseISO(d.date),
              technicianId: d.technician_id,
              isOvernight: d.is_overnight
          })));
      }
      
    } catch (e) {
      console.error("Erro ao sincronizar com Postgres:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
      fetchAllData();
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchAllData();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [supabase, fetchAllData]);

  const handleSaveTicket = async (ticketData: any) => {
    if (!supabase) {
        alert("Configure o SQL Cloud primeiro!");
        return;
    }
    const now = new Date().toISOString();
    
    // Preparar payload compatível com as colunas SQL
    const payload = {
      ticket_number: ticketData.ticketNumber,
      customer_name: ticketData.customerName,
      address: ticketData.address,
      locality: ticketData.locality,
      service_id: ticketData.serviceId,
      vehicle_id: ticketData.vehicleId,
      visor_id: ticketData.visorId,
      status: ticketData.status,
      scheduled_date: format(ticketData.date, 'yyyy-MM-dd'),
      scheduled_time: ticketData.scheduledTime,
      technician_ids: ticketData.technicianIds, // Array format
      process_number: ticketData.processNumber,
      fault_description: ticketData.faultDescription,
      duration: ticketData.duration,
      updated_at: now
    };

    if (editingTicket) {
      await supabase.from('tickets').update(payload).eq('id', editingTicket.id);
    } else {
      const newId = crypto.randomUUID();
      await supabase.from('tickets').insert([{ ...payload, id: newId, created_at: now }]);
    }
    
    // Recarregar para garantir consistência
    fetchAllData();
    setEditingTicket(null);
    setIsTicketModalOpen(false);
  };

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    if (!supabase) return;
    // Mapear updates se necessário
    const sqlUpdates: any = {};
    if (updates.status) sqlUpdates.status = updates.status;
    if (updates.technicianIds) sqlUpdates.technician_ids = updates.technicianIds;
    
    await supabase.from('tickets').update(sqlUpdates).eq('id', ticketId);
    fetchAllData();
  };

  const handleToggleOvernight = async (date: Date, techId: string) => {
    if (!supabase) return;
    const existing = dayStatuses.find(ds => isSameDay(ds.date, date) && ds.technicianId === techId);
    
    if (existing) {
      await supabase.from('day_statuses').delete().eq('id', existing.id);
    } else {
      await supabase.from('day_statuses').insert([{
        id: crypto.randomUUID(),
        technician_id: techId,
        date: format(date, 'yyyy-MM-dd'),
        is_overnight: true
      }]);
    }
    fetchAllData();
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
                technician={technicians.find(t => t.id === user.technicianId) || { id: user.technicianId, name: 'Técnico', avatarColor: 'bg-slate-500' }}
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
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:rotate-6 transition-transform" onClick={() => setCurrentDate(new Date())}>
                                    <span className="text-white font-black text-xl">M</span>
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-lg text-slate-900 leading-none font-black tracking-tighter uppercase">Marques Logistics</h1>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">PostgreSQL Multi-Posto</p>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-slate-200 hidden md:block" />

                            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                                <button onClick={() => setViewMode('week')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'week' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Columns size={14} /> Semana
                                </button>
                                <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'month' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <CalendarIcon size={14} /> Mês
                                </button>
                                <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <List size={14} /> Lista
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsCompactView(!isCompactView)} className={`p-2.5 rounded-xl transition-all border ${!isCompactView ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'text-slate-400 border-transparent hover:bg-slate-100'}`} title={isCompactView ? "Expandir Calendário" : "Compactar Calendário"}>
                                {isCompactView ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                            </button>
                            <button onClick={() => setIsReportsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100"><FileBarChart size={20} /></button>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100"><Settings size={20} /></button>
                            <button onClick={() => { setEditingTicket(null); setNewTicketPreData({date: selectedDate, techId: null}); setIsTicketModalOpen(true); }} className="bg-red-600 text-white px-6 py-2.5 rounded-xl shadow-xl font-black text-[10px] uppercase tracking-widest ml-2 hover:bg-red-700 transition-colors">Novo Serviço</button>
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
                            <span className="text-slate-700 text-[10px] uppercase tracking-[0.2em] font-black">Análise de Rota Inteligente (Gemini)</span>
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
            onDelete={async (id) => { 
                if (supabase) await supabase.from('tickets').delete().eq('id', id); 
                fetchAllData();
            }}
        />
        
        <SettingsModal 
            isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} 
            technicians={technicians} services={services} vehicles={vehicles} visores={visores} syncKey={supabaseUrl}
            onAddTechnician={async (t) => { 
                if (supabase) await supabase.from('technicians').insert([t]); 
                fetchAllData();
            }}
            onRemoveTechnician={async (id) => { 
                if (supabase) await supabase.from('technicians').delete().eq('id', id); 
                fetchAllData();
            }}
            onAddService={async (s) => { 
                if (supabase) await supabase.from('services').insert([{...s, default_duration: s.defaultDuration, color_class: s.colorClass}]); 
                fetchAllData();
            }}
            onRemoveService={async (id) => { 
                if (supabase) await supabase.from('services').delete().eq('id', id); 
                fetchAllData();
            }}
            onAddVehicle={async (v) => { 
                if (supabase) await supabase.from('vehicles').insert([v]); 
                fetchAllData();
            }}
            onRemoveVehicle={async (id) => { 
                if (supabase) await supabase.from('vehicles').delete().eq('id', id); 
                fetchAllData();
            }}
            onAddVisor={async (vs) => { 
                if (supabase) await supabase.from('visores').insert([vs]); 
                fetchAllData();
            }}
            onRemoveVisor={async (id) => { 
                if (supabase) await supabase.from('visores').delete().eq('id', id); 
                fetchAllData();
            }}
            onSetSyncKey={() => {}} 
            onCreateSyncKey={() => {}}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
            onSaveSupabaseConfig={(url, key) => {
              setSupabaseUrl(url);
              setSupabaseKey(key);
              localStorage.setItem('sb_url', url);
              localStorage.setItem('sb_key', key);
              alert("Configuração guardada! Reiniciando ligação...");
              window.location.reload();
            }}
        />
        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
