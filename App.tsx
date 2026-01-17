
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
import { MobileTechnicianView } from './components/MobileTechnicianView';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, Visor, Vehicle } from './types';
import { parseDynamicsFile } from './services/dynamicsImportService';
import { dataService } from './services/dataService';
import { addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, format, isSameDay, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, FileBarChart, Calendar as CalendarIcon, List, LayoutGrid, Save, Navigation, Loader2, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visores, setVisores] = useState<Visor[]>([]);

  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  
  const [routeAnalysisData, setRouteAnalysisData] = useState<{ tickets: Ticket[], techId: string } | null>(null);

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    const loadData = async () => {
      // Se não houver utilizador logado, não carrega os dados principais (o LoginScreen carrega o que precisa)
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await dataService.fetchAllData();
        setTechnicians(data.technicians);
        setServices(data.services);
        setTickets(data.tickets);
        setDayStatuses(data.dayStatuses);
        setVehicles(data.vehicles);
        setVisores(data.visores);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro de conexão à base de dados. Verifique a sua internet ou configurações.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]); // Adicionado 'user' como dependência para recarregar ao fazer login

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else if (viewMode === 'month' || viewMode === 'list') {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
    }
  };

  const handleSaveTicket = async (ticketData: Omit<Ticket, 'id'>) => {
    try {
      if (editingTicket) {
        const updatedTicket = { ...ticketData, id: editingTicket.id, date: new Date(ticketData.date) };
        await dataService.updateTicket(editingTicket.id, updatedTicket);
        setTickets(prev => prev.map(t => t.id === editingTicket.id ? updatedTicket : t));
      } else {
        const newTicket = { ...ticketData, id: crypto.randomUUID(), date: new Date(ticketData.date) };
        await dataService.createTicket(newTicket);
        setTickets(prev => [...prev, newTicket]);
      }
      setIsTicketModalOpen(false);
      setEditingTicket(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao gravar. Tente novamente.");
    }
  };

  const handleUpdateTicket = useCallback(async (ticketId: string, updates: Partial<Ticket>) => {
    // Otimista
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
    try {
      await dataService.updateTicket(ticketId, updates);
    } catch (e) {
      console.error(e);
      alert("Erro ao sincronizar atualização.");
      // Reverteria aqui num cenário real
    }
  }, []);

  const handleDeleteTicket = async (id: string) => {
    try {
        await dataService.deleteTicket(id);
        setTickets(p => p.filter(t => t.id !== id));
    } catch (e) {
        alert("Erro ao eliminar.");
    }
  };

  const handleMoveTicket = useCallback(async (ticketId: string, newDate: Date, targetTechId: string, sourceTechId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        let updatedTechIds = [...t.technicianIds];
        if (targetTechId !== sourceTechId) {
          updatedTechIds = updatedTechIds.map(id => id === sourceTechId ? targetTechId : id);
          updatedTechIds = Array.from(new Set(updatedTechIds));
        }
        const updates = { date: newDate, technicianIds: updatedTechIds };
        // Sync sem bloquear UI
        dataService.updateTicket(ticketId, updates).catch(err => console.error(err));
        return { ...t, ...updates };
      }
      return t;
    }));
  }, []);

  const handleApplyTravelUpdates = (updates: { ticketId: string, travelTimeMinutes: number }[]) => {
    setTickets(prev => prev.map(t => {
      const update = updates.find(u => u.ticketId === t.id);
      if (update) {
          dataService.updateTicket(t.id, { travelTimeMinutes: update.travelTimeMinutes });
          return { ...t, travelTimeMinutes: update.travelTimeMinutes };
      }
      return t;
    }));
  };

  const handleToggleOvernight = async (date: Date, techId: string) => {
    const existing = dayStatuses.find(ds => isSameDay(new Date(ds.date), date) && ds.technicianId === techId);
    if (existing) {
        try {
            await dataService.removeDayStatus(existing.id);
            setDayStatuses(p => p.filter(ds => ds.id !== existing.id));
        } catch(e) { console.error(e); }
    } else {
        const newStatus = { id: crypto.randomUUID(), technicianId: techId, date: startOfDay(date), isOvernight: true };
        try {
            await dataService.addDayStatus(newStatus);
            setDayStatuses(p => [...p, newStatus]);
        } catch(e) { console.error(e); }
    }
  };

  // --- Handlers de Configuração (Async) ---
  const handleAddTech = async (t: Technician) => {
      await dataService.addTechnician(t);
      setTechnicians(p => [...p, t]);
  };
  const handleRemoveTech = async (id: string) => {
      await dataService.removeTechnician(id);
      setTechnicians(p => p.filter(t => t.id !== id));
  };
  const handleAddService = async (s: ServiceDefinition) => {
      await dataService.addService(s);
      setServices(p => [...p, s]);
  };
  const handleRemoveService = async (id: string) => {
      await dataService.removeService(id);
      setServices(p => p.filter(s => s.id !== id));
  };
  const handleAddVehicle = async (v: Vehicle) => {
      await dataService.addVehicle(v);
      setVehicles(p => [...p, v]);
  };
  const handleRemoveVehicle = async (id: string) => {
      await dataService.removeVehicle(id);
      setVehicles(p => p.filter(v => v.id !== id));
  };
  const handleAddVisor = async (v: Visor) => {
      await dataService.addVisor(v);
      setVisores(p => [...p, v]);
  };
  const handleRemoveVisor = async (id: string) => {
      await dataService.removeVisor(id);
      setVisores(p => p.filter(v => v.id !== id));
  };

  const handleImportDynamics = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              setIsLoading(true);
              const data = e.target?.result as ArrayBuffer;
              const importedTickets = await parseDynamicsFile(data, services, technicians);
              if (importedTickets.length > 0) {
                  const newTickets = importedTickets.map(t => ({ 
                      ...t, 
                      id: crypto.randomUUID()
                  }));
                  // Batch insert via Supabase
                  await dataService.syncImportedTickets(newTickets as Ticket[]);
                  setTickets(prev => [...prev, ...newTickets as Ticket[]]);
                  alert(`Importação concluída: ${newTickets.length} atividades de serviço adicionadas.`);
              } else {
                  alert('Não foram encontrados dados compatíveis no ficheiro.');
              }
          } catch (err) {
              console.error(err);
              alert('Erro ao processar ficheiro do Dynamics ou gravar na base de dados.');
          } finally {
              setIsLoading(false);
          }
      };
      reader.readAsArrayBuffer(file);
  };

  const handleExportBackup = () => {
    const backupData = { technicians, services, tickets, dayStatuses, vehicles, visores, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qlinic_supabase_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logout handler
  const handleLogout = () => {
    if(window.confirm("Deseja mesmo sair?")) {
      setUser(null);
    }
  };

  if (!user) return <LoginScreen onLogin={setUser} syncKey={null} onSetSyncKey={() => {}} />;

  if (isLoading) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
              <Loader2 className="animate-spin text-red-600" size={48} />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">A carregar dados da cloud...</p>
          </div>
      );
  }

  // --- MODO TÉCNICO MÓVEL ---
  if (user.role === 'technician' && user.technicianId) {
      const activeTech = technicians.find(t => t.id === user.technicianId);
      if (activeTech) {
          return (
              <MobileTechnicianView 
                  tickets={tickets} 
                  technicianId={user.technicianId} 
                  technician={activeTech}
                  services={services}
                  vehicles={vehicles}
                  onUpdateStatus={(id, status) => handleUpdateTicket(id, { status })}
                  onViewDetails={() => {}}
                  onUpdateProfile={(updates) => {
                      // Simular update profile local e cloud
                      const updatedTechs = technicians.map(t => t.id === user.technicianId ? { ...t, ...updates } : t);
                      setTechnicians(updatedTechs);
                      // Nota: adicionar endpoint na dataService para updateTechnician se necessário
                  }}
                  onLogout={handleLogout}
              />
          );
      }
  }

  // --- MODO GESTÃO / ADMIN ---
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
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cloud System</p>
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
                <button onClick={handleLogout} className="p-2.5 text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-md shadow-slate-200" title="Terminar Sessão"><LogOut size={18} /></button>
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
            onToggleOvernight={handleToggleOvernight}
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
        onDelete={handleDeleteTicket}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} 
        technicians={technicians} services={services} vehicles={vehicles} visores={visores} 
        syncKey={null}
        onAddTechnician={handleAddTech} onRemoveTechnician={handleRemoveTech}
        onAddService={handleAddService} onRemoveService={handleRemoveService}
        onAddVehicle={handleAddVehicle} onRemoveVehicle={handleRemoveVehicle}
        onAddVisor={handleAddVisor} onRemoveVisor={handleRemoveVisor}
        onSetSyncKey={() => {}} onCreateSyncKey={() => {}} 
        onExportBackup={handleExportBackup} 
        onImportBackup={() => {}} // Desativado importação local para evitar conflitos, use import dynamics
        onImportDynamics={handleImportDynamics}
      />
      
      <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
