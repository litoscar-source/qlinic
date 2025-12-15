
import React, { useState, useEffect } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { Technician, Ticket, ServiceDefinition, User, DayStatus } from './types';
import { addWeeks, subWeeks, format, isSameDay, startOfDay, addMonths, subMonths, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Settings, Route, FileBarChart, Download, LogOut, Save, Calendar, LayoutGrid, Users, Trash2, History } from 'lucide-react';

// --- DADOS DE EXEMPLO (SEED DATA) ---
// Usados apenas se não houver dados no LocalStorage
const SEED_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'João Silva', avatarColor: 'bg-blue-500' },
  { id: 'tech-2', name: 'Maria Costa', avatarColor: 'bg-emerald-500' },
  { id: 'tech-3', name: 'Pedro Santos', avatarColor: 'bg-amber-500' },
  { id: 'tech-4', name: 'Ana Pereira', avatarColor: 'bg-purple-500' },
  { id: 'tech-5', name: 'Rui Ferreira', avatarColor: 'bg-red-500' },
];

const SEED_SERVICES: ServiceDefinition[] = [
  { id: 'svc-1', name: 'Assistência', defaultDuration: 1, colorClass: 'bg-white border-gray-200' },
  { id: 'svc-2', name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'svc-3', name: 'Calibração', defaultDuration: 1.5, colorClass: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'svc-4', name: 'Acompanhamento', defaultDuration: 1, colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'svc-5', name: 'Verificação', defaultDuration: 1, colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'svc-6', name: 'Construção', defaultDuration: 8, colorClass: 'bg-gray-200 text-gray-800 border-gray-300' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  // --- STATE INITIALIZATION WITH LOCAL STORAGE ---
  // Inicializamos o state lendo do localStorage para evitar "flicker" ou perda de dados no refresh.
  
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    try {
      const saved = localStorage.getItem('local_technicians');
      return saved ? JSON.parse(saved) : SEED_TECHNICIANS;
    } catch (e) {
      console.error("Erro ao carregar técnicos:", e);
      return SEED_TECHNICIANS;
    }
  });

  const [services, setServices] = useState<ServiceDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('local_services');
      return saved ? JSON.parse(saved) : SEED_SERVICES;
    } catch (e) {
      console.error("Erro ao carregar serviços:", e);
      return SEED_SERVICES;
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem('local_tickets');
      if (saved) {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          date: new Date(t.date) // Restaurar objeto Date
        }));
      }
      return [];
    } catch (e) {
      console.error("Erro ao carregar tickets:", e);
      return [];
    }
  });

  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>(() => {
    try {
      const saved = localStorage.getItem('local_day_statuses');
      if (saved) {
        return JSON.parse(saved).map((d: any) => ({
          ...d,
          date: new Date(d.date) // Restaurar objeto Date
        }));
      }
      return [];
    } catch (e) {
      console.error("Erro ao carregar status de dia:", e);
      return [];
    }
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // View State
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [filterTechId, setFilterTechId] = useState<string | null>(null);
  
  // Modal State
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  
  // Auto-fill for empty cell click
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string} | null>(null);

  // --- PERSISTÊNCIA AUTOMÁTICA ---
  // Salvar sempre que houver alterações no estado
  useEffect(() => {
    localStorage.setItem('local_technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem('local_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('local_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('local_day_statuses', JSON.stringify(dayStatuses));
  }, [dayStatuses]);


  // --- ACTIONS ---

  const handleSaveTicket = (ticketData: Omit<Ticket, 'id'>) => {
    if (editingTicket) {
      // Update
      setTickets(prev => prev.map(t => 
        t.id === editingTicket.id ? { ...ticketData, id: t.id } : t
      ));
    } else {
      // Create
      const newTicket: Ticket = {
        ...ticketData,
        id: `local-ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      setTickets(prev => [...prev, newTicket]);
    }
    setEditingTicket(null);
    setNewTicketPreData(null);
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setEditingTicket(null);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
  };
  
  const handleMoveTicket = (ticketId: string, newDate: Date, newTechId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { 
        ...t, 
        date: newDate, 
        technicianIds: [newTechId] 
    } : t));
  };

  const handleSwapTickets = (sourceId: string, targetId: string) => {
    const sourceTicket = tickets.find(t => t.id === sourceId);
    const targetTicket = tickets.find(t => t.id === targetId);

    if (sourceTicket && targetTicket) {
        setTickets(prev => prev.map(t => {
            if (t.id === sourceId) {
                return { ...t, date: targetTicket.date, technicianIds: targetTicket.technicianIds, scheduledTime: targetTicket.scheduledTime };
            }
            if (t.id === targetId) {
                return { ...t, date: sourceTicket.date, technicianIds: sourceTicket.technicianIds, scheduledTime: sourceTicket.scheduledTime };
            }
            return t;
        }));
    }
  };

  const handleToggleOvernight = (date: Date, techId: string) => {
      const existingIndex = dayStatuses.findIndex(ds => 
          isSameDay(ds.date, date) && ds.technicianId === techId
      );

      if (existingIndex >= 0) {
          setDayStatuses(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
          setDayStatuses(prev => [...prev, {
              id: `local-status-${Date.now()}`,
              technicianId: techId,
              date: startOfDay(date),
              isOvernight: true
          }]);
      }
  };

  // --- SETTINGS HANDLERS ---
  const handleAddTechnician = (tech: Technician) => {
      setTechnicians(prev => [...prev, { ...tech, id: `local-tech-${Date.now()}` }]);
  };

  const handleRemoveTechnician = (id: string) => {
      setTechnicians(prev => prev.filter(t => t.id !== id));
  };

  const handleAddService = (svc: ServiceDefinition) => {
      setServices(prev => [...prev, { ...svc, id: `local-svc-${Date.now()}` }]);
  };

  const handleRemoveService = (id: string) => {
      setServices(prev => prev.filter(s => s.id !== id));
  };
  
  const handleResetDatabase = () => {
    if (window.confirm("ATENÇÃO: Isto irá apagar TODOS os dados locais e restaurar os dados de exemplo. Tem a certeza?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  // --- NAVIGATION ---
  const handlePrev = () => {
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNext = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsTicketModalOpen(true);
  };
  const handleNewTicketFromCell = (date: Date, techId: string) => {
      if (user?.role === 'viewer') return;
      setNewTicketPreData({ date, techId });
      setEditingTicket(null);
      setIsTicketModalOpen(true);
  };
  const openNewTicketModal = () => {
    setEditingTicket(null);
    setNewTicketPreData(null);
    setIsTicketModalOpen(true);
  };
  const handleLogout = () => setUser(null);

  const selectedDayTickets = tickets.filter(
    t => isSameDay(t.date, selectedDate) && (!filterTechId || t.technicianIds.includes(filterTechId))
  ).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const handleExportDatabase = () => {
      const dbData = { technicians, services, tickets, dayStatuses };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `qlinic_backup_${format(new Date(), 'yyyyMMdd')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // RENDER LOGIN IF NO USER
  if (!user) {
      return <LoginScreen onLogin={setUser} />;
  }

  const isReadOnly = user.role === 'viewer';

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] overflow-hidden">
        
        {/* Offline Banner */}
        <div className="bg-orange-500 text-white p-1 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
            <Save size={12} />
            <span>MODO LOCAL (BASE DE DADOS NO NAVEGADOR) - Os dados são guardados automaticamente.</span>
        </div>

        {/* Top Navigation Bar */}
        <header className="bg-red-600 border-b border-red-700 shadow-md shrink-0 z-20">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* MARQUES Logo Recreation */}
                    <div className="w-10 h-10 bg-red-600 border-2 border-white flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer" onClick={() => setCurrentDate(new Date())}>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-[120%] h-[1px] bg-white/20 absolute"></div>
                             <div className="h-[120%] w-[1px] bg-white/20 absolute"></div>
                         </div>
                         <div className="relative z-10 text-white font-black text-[8px] tracking-tighter leading-none text-center">
                             <span className="block text-xs tracking-widest">MARQUES</span>
                         </div>
                         <div className="absolute w-6 h-6 border border-white rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-[8px] mt-0.5 ml-0.5">Q</span>
                         </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight tracking-wide">Qlinic</h1>
                        <p className="text-xs text-red-100 flex items-center gap-1 font-medium">
                           Técnicos Externos {user.role === 'viewer' && '(Modo Leitura)'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-red-700/50 rounded-lg p-1 border border-red-500/30">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-red-600 rounded-md transition-all">
                            <ChevronLeft size={16} className="text-white" />
                        </button>
                        <span className="px-4 font-semibold text-white w-36 text-center text-sm capitalize">
                            {format(currentDate, viewMode === 'week' ? 'MMM yyyy' : 'MMMM yyyy', { locale: pt })}
                        </span>
                        <button onClick={handleNext} className="p-1.5 hover:bg-red-600 rounded-md transition-all">
                            <ChevronRight size={16} className="text-white" />
                        </button>
                    </div>

                    <button 
                        onClick={() => setCurrentDate(subDays(currentDate, 3))}
                        className="flex items-center gap-1 bg-red-800/40 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 transition-all shadow-sm"
                        title="Voltar 3 Dias"
                    >
                       <History size={14} /> -3 Dias
                    </button>

                    <div className="flex bg-red-800/40 rounded-lg p-1 gap-1 border border-red-500/20">
                         <button 
                            onClick={() => setViewMode('week')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white text-red-600 shadow-sm' : 'text-red-100 hover:bg-red-700/50'}`}
                         >
                            <LayoutGrid size={14} /> Semana
                         </button>
                         <button 
                            onClick={() => setViewMode('month')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white text-red-600 shadow-sm' : 'text-red-100 hover:bg-red-700/50'}`}
                         >
                            <Calendar size={14} /> Mês
                         </button>
                    </div>

                    {/* Tech Filter Dropdown */}
                    <div className="relative group">
                         <button className="flex items-center gap-2 bg-red-800/40 hover:bg-red-700/50 text-white px-3 py-2 rounded-lg text-xs font-bold border border-red-500/20 transition-all">
                            <Users size={14} />
                            {filterTechId ? technicians.find(t => t.id === filterTechId)?.name : 'Todos'}
                         </button>
                         <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-1 hidden group-hover:block z-50">
                             <button 
                                onClick={() => setFilterTechId(null)} 
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${!filterTechId ? 'font-bold text-red-600 bg-red-50' : 'text-gray-700'}`}
                             >
                                Todos
                             </button>
                             {technicians.map(t => (
                                 <button 
                                    key={t.id}
                                    onClick={() => setFilterTechId(t.id)} 
                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 ${filterTechId === t.id ? 'font-bold text-red-600 bg-red-50' : 'text-gray-700'}`}
                                 >
                                    <div className={`w-2 h-2 rounded-full ${t.avatarColor}`} />
                                    {t.name}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportDatabase}
                        className="p-2 text-white/80 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Exportar Base de Dados (JSON)"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => setIsReportsModalOpen(true)}
                        className="p-2 text-white/80 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Relatórios"
                    >
                        <FileBarChart size={18} />
                    </button>
                    
                    {!isReadOnly && (
                        <>
                            <div className="h-6 w-px bg-red-500 mx-1"></div>
                            <button 
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-2 text-white/80 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                title="Configurações"
                            >
                                <Settings size={18} />
                            </button>
                            <button 
                                onClick={openNewTicketModal}
                                className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm ml-2"
                            >
                                <Plus size={18} />
                                Novo
                            </button>
                        </>
                    )}

                    <div className="h-6 w-px bg-red-500 mx-1"></div>
                    
                    <button 
                        onClick={handleResetDatabase}
                        className="p-2 text-red-300 hover:bg-red-800 rounded-lg transition-colors"
                        title="Apagar Base de Dados (Reset)"
                    >
                        <Trash2 size={16} />
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-red-200 hover:bg-red-800 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>

        {/* Main Content Area - Split Vertical */}
        <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top: Schedule View (Flex Grow) */}
            <div className="flex-[3] overflow-hidden p-4 pb-0 flex flex-col">
               {viewMode === 'week' ? (
                   <WeeklyScheduleView 
                    currentDate={currentDate}
                    tickets={tickets.filter(t => !filterTechId || t.technicianIds.includes(filterTechId))}
                    dayStatuses={dayStatuses}
                    technicians={technicians}
                    services={services}
                    onTicketUpdate={handleUpdateTicket}
                    onTicketMove={handleMoveTicket}
                    onTicketSwap={handleSwapTickets}
                    onEditTicket={handleEditTicket}
                    onNewTicket={handleNewTicketFromCell}
                    onToggleOvernight={handleToggleOvernight}
                    onSelectDate={setSelectedDate}
                    selectedDate={selectedDate}
                    isReadOnly={isReadOnly}
                  />
               ) : (
                   <div className="h-full overflow-y-auto bg-white rounded-t-2xl shadow-sm border border-gray-200 p-2">
                       <CalendarView 
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            tickets={tickets}
                            technicians={technicians}
                            selectedTechId={filterTechId}
                       />
                   </div>
               )}
            </div>

            {/* Bottom Panel: Details & Routes */}
            <div className="flex-[2] bg-white border-t border-gray-200 overflow-hidden flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
               <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <Route size={18} className="text-gray-500" />
                    <h3 className="font-bold text-gray-800 text-sm">Detalhes e Rotas - {format(selectedDate, "d 'de' MMMM", { locale: pt })}</h3>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6">
                 {/* Content Wrapper for horizontal layout of bottom panel items */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1: Daily List */}
                    <div className="lg:col-span-1 border-r border-gray-100 pr-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Serviços do Dia</h4>
                        {selectedDayTickets.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">Sem serviços para {format(selectedDate, 'dd/MM')}</p>
                                {filterTechId && <p className="text-xs text-gray-400 mt-1">(Filtro de técnico ativo)</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedDayTickets.map(ticket => {
                                    const service = services.find(s => s.id === ticket.serviceId);
                                    const ticketTechs = technicians.filter(t => ticket.technicianIds.includes(t.id));
                                    
                                    return (
                                        <div key={ticket.id} onClick={() => handleEditTicket(ticket)} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg cursor-pointer transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-1 rounded shrink-0">{ticket.scheduledTime}</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{ticket.customerName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 shrink-0"><MapPin size={10}/> {ticket.locality}</p>
                                                        {/* Mini Avatars */}
                                                        <div className="flex -space-x-1">
                                                            {ticketTechs.map(tt => (
                                                                <div key={tt.id} className={`w-3 h-3 rounded-full ${tt.avatarColor} border border-white`}></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${service?.colorClass}`}>
                                                    {service?.name}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Column 2 & 3: Route Analyzer */}
                    <div className="lg:col-span-2">
                        <RouteAnalyzer 
                            tickets={selectedDayTickets}
                            technicians={technicians}
                            dayStatuses={dayStatuses}
                        />
                    </div>
                 </div>
               </div>
            </div>
        </div>

        <TicketFormModal 
            isOpen={isTicketModalOpen} 
            onClose={() => {
                setIsTicketModalOpen(false);
                setEditingTicket(null);
                setNewTicketPreData(null);
            }}
            onSave={handleSaveTicket}
            onDelete={handleDeleteTicket}
            technicians={technicians}
            services={services}
            initialDate={newTicketPreData ? newTicketPreData.date : selectedDate}
            selectedTechId={newTicketPreData ? newTicketPreData.techId : filterTechId}
            ticketToEdit={editingTicket}
            isReadOnly={isReadOnly}
        />

        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            technicians={technicians}
            services={services}
            onAddTechnician={handleAddTechnician}
            onRemoveTechnician={handleRemoveTechnician}
            onAddService={handleAddService}
            onRemoveService={handleRemoveService}
        />

        <ReportsModal
            isOpen={isReportsModalOpen}
            onClose={() => setIsReportsModalOpen(false)}
            tickets={tickets}
            dayStatuses={dayStatuses}
            technicians={technicians}
        />
    </div>
  );
}

export default App;
