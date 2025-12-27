
import React, { useState, useEffect, useCallback } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { YearlyView } from './components/YearlyView';
import { TicketFormModal } from './components/TicketFormModal';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, Visor, Vehicle } from './types';
import { addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, format, isSameDay, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, FileBarChart, Calendar as CalendarIcon, List, LayoutGrid, Save, Navigation } from 'lucide-react';

const SEED_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'João Silva', avatarColor: 'bg-blue-600', password: '1234', basePostalCode: '4705-471' },
  { id: 'tech-2', name: 'Maria Costa', avatarColor: 'bg-emerald-600', password: '1234', basePostalCode: '4000-001' },
];

const SEED_SERVICES: ServiceDefinition[] = [
  { id: 'svc-1', name: 'Assistência', defaultDuration: 1, colorClass: 'bg-slate-100' },
  { id: 'svc-2', name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-600' },
  { id: 'svc-7', name: 'Reconstrução', defaultDuration: 6, colorClass: 'bg-orange-500' },
];

const getSafeLocalStorage = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved || saved === 'undefined' || saved === 'null') return defaultValue;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return defaultValue;
  }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [technicians, setTechnicians] = useState<Technician[]>(() => 
    getSafeLocalStorage('local_technicians', SEED_TECHNICIANS)
  );

  const [services, setServices] = useState<ServiceDefinition[]>(() => 
    getSafeLocalStorage('local_services', SEED_SERVICES)
  );

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const data = getSafeLocalStorage<any[]>('local_tickets', []);
    return data.map(t => ({ ...t, date: new Date(t.date) }));
  });

  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>(() => {
    const data = getSafeLocalStorage<any[]>('local_day_statuses', []);
    return data.map(d => ({ ...d, date: new Date(d.date) }));
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getSafeLocalStorage('local_vehicles', []));
  const [visores, setVisores] = useState<Visor[]>(() => getSafeLocalStorage('local_visores', []));

  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  
  const [routeAnalysisData, setRouteAnalysisData] = useState<{ tickets: Ticket[], techId: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('local_technicians', JSON.stringify(technicians));
    localStorage.setItem('local_services', JSON.stringify(services));
    localStorage.setItem('local_tickets', JSON.stringify(tickets));
    localStorage.setItem('local_day_statuses', JSON.stringify(dayStatuses));
    localStorage.setItem('local_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('local_visores', JSON.stringify(visores));
  }, [technicians, services, tickets, dayStatuses, vehicles, visores]);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else if (viewMode === 'month' || viewMode === 'list') {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
    }
  };

  const handleSaveTicket = (ticketData: Omit<Ticket, 'id'>) => {
    if (editingTicket) {
      setTickets(prev => prev.map(t => t.id === editingTicket.id ? { ...ticketData, id: t.id, date: new Date(ticketData.date) } : t));
    } else {
      setTickets(prev => [...prev, { ...ticketData, id: `tk-${Date.now()}`, date: new Date(ticketData.date) }]);
    }
    setIsTicketModalOpen(false);
    setEditingTicket(null);
  };

  const handleUpdateTicket = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
  }, []);

  const handleMoveTicket = useCallback((ticketId: string, newDate: Date, targetTechId: string, sourceTechId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        let updatedTechIds = [...t.technicianIds];
        if (targetTechId !== sourceTechId) {
          updatedTechIds = updatedTechIds.map(id => id === sourceTechId ? targetTechId : id);
          updatedTechIds = Array.from(new Set(updatedTechIds));
        }
        return { ...t, date: newDate, technicianIds: updatedTechIds };
      }
      return t;
    }));
  }, []);

  const handleApplyTravelUpdates = (updates: { ticketId: string, travelTimeMinutes: number }[]) => {
    setTickets(prev => prev.map(t => {
      const update = updates.find(u => u.ticketId === t.id);
      return update ? { ...t, travelTimeMinutes: update.travelTimeMinutes } : t;
    }));
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={null} onSetSyncKey={() => {}} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased">
      <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => {setCurrentDate(new Date()); setViewMode('week');}}>
                <span className="text-white font-black text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Marques Logistics</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Planning System</p>
              </div>
            </div>

            <nav className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
              <button onClick={() => setViewMode('week')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Semana</button>
              <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
              <button onClick={() => setViewMode('year')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Ano</button>
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button onClick={() => navigateDate('prev')} className="p-2.5 hover:bg-slate-50 text-slate-400 border-r border-slate-200"><ChevronLeft size={18}/></button>
                <span className="px-6 text-[10px] font-black uppercase tracking-widest text-slate-700 min-w-[140px] text-center">
                    {viewMode === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy', { locale: pt })}
                </span>
                <button onClick={() => navigateDate('next')} className="p-2.5 hover:bg-slate-50 text-slate-400 border-l border-slate-200"><ChevronRight size={18}/></button>
             </div>

             <div className="h-8 w-px bg-slate-200" />

             <div className="flex items-center gap-2">
                <button onClick={() => setIsReportsModalOpen(true)} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all" title="Relatórios"><FileBarChart size={20} /></button>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all" title="Configurações"><Settings size={20} /></button>
                <button onClick={() => {setEditingTicket(null); setIsTicketModalOpen(true);}} className="bg-red-600 text-white px-6 py-2.5 rounded-xl shadow-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all ml-2">Novo Agendamento</button>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 relative">
        {viewMode === 'week' && (
          <WeeklyScheduleView 
            currentDate={currentDate} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} vehicles={vehicles} visores={visores}
            onTicketUpdate={handleUpdateTicket}
            onMoveTicket={handleMoveTicket}
            onEditTicket={(t) => {setEditingTicket(t); setIsTicketModalOpen(true);}}
            onNewTicket={(date, techId) => {setSelectedDate(date); setIsTicketModalOpen(true);}}
            onToggleOvernight={(date, techId) => {
                const existing = dayStatuses.find(ds => isSameDay(new Date(ds.date), date) && ds.technicianId === techId);
                if (existing) setDayStatuses(p => p.filter(ds => ds.id !== existing.id));
                else setDayStatuses(p => [...p, { id: `ds-${Date.now()}`, technicianId: techId, date: startOfDay(date), isOvernight: true }]);
            }}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
            isCompact={false}
          />
        )}
        {viewMode === 'month' && (
          <CalendarView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={(d) => {setSelectedDate(d); setViewMode('week'); setCurrentDate(d);}} tickets={tickets} technicians={technicians} selectedTechId={null} />
        )}
        {viewMode === 'year' && (
          <YearlyView currentDate={currentDate} tickets={tickets} onSelectMonth={(d) => {setCurrentDate(d); setViewMode('month');}} />
        )}
        {viewMode === 'list' && (
          <ListView tickets={tickets} technicians={technicians} services={services} vehicles={vehicles} onEditTicket={(t) => {setEditingTicket(t); setIsTicketModalOpen(true);}} onUpdateTicket={handleUpdateTicket} />
        )}

        {viewMode === 'week' && (
          <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-40">
            <button 
              onClick={() => {
                const dayTickets = tickets.filter(t => isSameDay(new Date(t.date), selectedDate));
                if (dayTickets.length > 0) {
                  setRouteAnalysisData({ tickets: dayTickets, techId: dayTickets[0].technicianIds[0] });
                } else {
                  alert("Selecione um dia com serviços para analisar a rota.");
                }
              }}
              className="bg-slate-900 text-white p-5 rounded-full shadow-2xl hover:bg-black transition-all group flex items-center gap-3"
            >
              <Navigation className="group-hover:rotate-12 transition-transform" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-[10px] tracking-widest">Otimizar Rotas do Dia</span>
            </button>
          </div>
        )}
      </main>

      {routeAnalysisData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <RouteAnalyzer 
            tickets={routeAnalysisData.tickets} 
            allTickets={tickets}
            technicians={technicians} 
            dayStatuses={dayStatuses}
            onApplyTravelTimes={handleApplyTravelUpdates}
            onClose={() => setRouteAnalysisData(null)}
          />
        </div>
      )}

      <TicketFormModal 
        isOpen={isTicketModalOpen} onClose={() => {setIsTicketModalOpen(false); setEditingTicket(null);}} 
        onSave={handleSaveTicket} technicians={technicians} services={services} vehicles={vehicles} visores={visores}
        initialDate={selectedDate} selectedTechId={null} ticketToEdit={editingTicket}
        onDelete={(id) => setTickets(p => p.filter(t => t.id !== id))}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} 
        technicians={technicians} services={services} vehicles={vehicles} visores={visores} 
        syncKey={null}
        onAddTechnician={(t) => setTechnicians(p => [...p, t])} onRemoveTechnician={(id) => setTechnicians(p => p.filter(t => t.id !== id))}
        onAddService={(s) => setServices(p => [...p, s])} onRemoveService={(id) => setServices(p => p.filter(s => s.id !== id))}
        onAddVehicle={(v) => setVehicles(p => [...p, v])} onRemoveVehicle={(id) => setVehicles(p => p.filter(v => v.id !== id))}
        onAddVisor={(v) => setVisores(p => [...p, v])} onRemoveVisor={(id) => setVisores(p => p.filter(v => v.id !== id))}
        onSetSyncKey={() => {}} onCreateSyncKey={() => {}} onExportBackup={() => {}} onImportBackup={() => {}}
      />
      
      <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
