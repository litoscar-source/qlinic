
import React, { useState, useEffect } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { Technician, Ticket, VehicleType, TicketStatus, ServiceDefinition, User, DayStatus } from './types';
import { addWeeks, subWeeks, format, isSameDay, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Settings, Truck, Database, Route, FileBarChart, Download, LogOut, RefreshCw } from 'lucide-react';
import { db } from './firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// INITIAL DATA FOR SEEDING ONLY
const SEED_TECHNICIANS: Omit<Technician, 'id'>[] = [
  { name: 'João Silva', avatarColor: 'bg-blue-500' },
  { name: 'Maria Costa', avatarColor: 'bg-emerald-500' },
  { name: 'Pedro Santos', avatarColor: 'bg-amber-500' },
  { name: 'Ana Pereira', avatarColor: 'bg-purple-500' },
  { name: 'Rui Ferreira', avatarColor: 'bg-red-500' },
];

const SEED_SERVICES: Omit<ServiceDefinition, 'id'>[] = [
  { name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Reparação', defaultDuration: 2, colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Manutenção', defaultDuration: 1.5, colorClass: 'bg-green-100 text-green-800 border-green-200' },
  { name: 'Orçamento', defaultDuration: 0.5, colorClass: 'bg-gray-100 text-gray-800 border-gray-200' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Data State
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  
  // Modal State
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  
  // Auto-fill for empty cell click
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string} | null>(null);

  // --- FIREBASE SUBSCRIPTIONS ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Subscribe Technicians
      const unsubTech = onSnapshot(collection(db, 'technicians'), (snapshot) => {
        const techs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
        setTechnicians(techs);
      }, (error) => setDbError("Erro ao carregar técnicos: " + error.message));

      // 2. Subscribe Services
      const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
        const svcs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceDefinition));
        setServices(svcs);
      }, (error) => setDbError("Erro ao carregar serviços: " + error.message));

      // 3. Subscribe Tickets
      const unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
        const tcks = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date), // Convert Timestamp to Date
          } as Ticket;
        });
        setTickets(tcks);
      }, (error) => setDbError("Erro ao carregar tickets: " + error.message));

      // 4. Subscribe DayStatuses
      const unsubDayStatus = onSnapshot(collection(db, 'day_statuses'), (snapshot) => {
        const dss = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          } as DayStatus;
        });
        setDayStatuses(dss);
      }, (error) => setDbError("Erro ao carregar status: " + error.message));

      setLoading(false);

      return () => {
        unsubTech();
        unsubServices();
        unsubTickets();
        unsubDayStatus();
      };
    } catch (e: any) {
        setDbError(e.message);
        setLoading(false);
    }
  }, [user]);

  // --- DATABASE ACTIONS ---

  const handleSeedDatabase = async () => {
    if (!window.confirm("Isto irá adicionar dados de exemplo à base de dados. Continuar?")) return;
    setLoading(true);
    try {
        const batch = writeBatch(db);
        
        // Add Techs
        SEED_TECHNICIANS.forEach(tech => {
            const docRef = doc(collection(db, 'technicians'));
            batch.set(docRef, tech);
        });

        // Add Services
        SEED_SERVICES.forEach(svc => {
            const docRef = doc(collection(db, 'services'));
            batch.set(docRef, svc);
        });

        await batch.commit();
        alert("Base de dados populada com sucesso!");
    } catch (error) {
        console.error("Erro ao popular:", error);
        alert("Erro ao popular base de dados.");
    } finally {
        setLoading(false);
    }
  };

  const handleSaveTicket = async (ticketData: Omit<Ticket, 'id'>) => {
    try {
      if (editingTicket) {
        // Update
        const docRef = doc(db, 'tickets', editingTicket.id);
        await updateDoc(docRef, { ...ticketData });
      } else {
        // Create
        await addDoc(collection(db, 'tickets'), ticketData);
      }
      setEditingTicket(null);
      setNewTicketPreData(null);
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert("Erro ao guardar serviço.");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      setEditingTicket(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Erro ao eliminar serviço.");
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), updates);
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };
  
  const handleMoveTicket = async (ticketId: string, newDate: Date, newTechId: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
          date: newDate,
          technicianIds: [newTechId]
      });
    } catch (error) {
      console.error("Error moving ticket:", error);
    }
  };

  const handleSwapTickets = async (sourceId: string, targetId: string) => {
    const sourceTicket = tickets.find(t => t.id === sourceId);
    const targetTicket = tickets.find(t => t.id === targetId);

    if (sourceTicket && targetTicket) {
        try {
            const batch = writeBatch(db);
            
            const sourceRef = doc(db, 'tickets', sourceId);
            batch.update(sourceRef, {
                date: targetTicket.date,
                technicianIds: targetTicket.technicianIds,
                scheduledTime: targetTicket.scheduledTime
            });

            const targetRef = doc(db, 'tickets', targetId);
            batch.update(targetRef, {
                date: sourceTicket.date,
                technicianIds: sourceTicket.technicianIds,
                scheduledTime: sourceTicket.scheduledTime
            });

            await batch.commit();
        } catch (error) {
            console.error("Error swapping tickets:", error);
        }
    }
  };

  const handleToggleOvernight = async (date: Date, techId: string) => {
      // Find if exists in current state (which is synced with DB)
      // Note: For cleaner implementation we query DB, but state is usually fresh enough
      const existing = dayStatuses.find(ds => 
          isSameDay(ds.date, date) && ds.technicianId === techId
      );

      try {
          if (existing) {
              await deleteDoc(doc(db, 'day_statuses', existing.id));
          } else {
              await addDoc(collection(db, 'day_statuses'), {
                  technicianId: techId,
                  date: startOfDay(date), // Ensure time is zeroed
                  isOvernight: true
              });
          }
      } catch (error) {
          console.error("Error toggling overnight:", error);
      }
  };

  // --- SETTINGS HANDLERS (Direct to Firebase) ---
  const handleAddTechnician = async (tech: Technician) => {
      // Remove ID as Firestore generates it, or use it if provided
      const { id, ...data } = tech;
      await addDoc(collection(db, 'technicians'), data);
  };

  const handleRemoveTechnician = async (id: string) => {
      await deleteDoc(doc(db, 'technicians', id));
  };

  const handleAddService = async (svc: ServiceDefinition) => {
      const { id, ...data } = svc;
      await addDoc(collection(db, 'services'), data);
  };

  const handleRemoveService = async (id: string) => {
      await deleteDoc(doc(db, 'services', id));
  };

  // --- NAVIGATION ---
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
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
    t => isSameDay(t.date, selectedDate)
  ).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const handleExportDatabase = () => {
      const dbData = { technicians, services, tickets, dayStatuses };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "database_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // RENDER LOGIN IF NO USER
  if (!user) {
      return <LoginScreen onLogin={setUser} />;
  }

  // RENDER LOADING
  if (loading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-4">
              <Database className="animate-bounce text-blue-500" size={48} />
              <p className="font-medium">A ligar à base de dados...</p>
          </div>
      );
  }

  const isReadOnly = user.role === 'viewer';

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] overflow-hidden">
        
        {/* Error Banner */}
        {dbError && (
            <div className="bg-red-600 text-white p-2 text-center text-sm font-bold flex items-center justify-center gap-2">
                <LogOut size={16} />
                {dbError}. Verifique o ficheiro firebaseConfig.ts.
            </div>
        )}

        {/* Top Navigation Bar */}
        <header className="bg-red-600 border-b border-red-700 shadow-md shrink-0 z-20">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* MARQUES Logo Recreation */}
                    <div className="w-10 h-10 bg-red-600 border-2 border-white flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform">
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

                <div className="flex items-center bg-red-700/50 rounded-lg p-1 mx-4 border border-red-500/30">
                    <button onClick={handlePrevWeek} className="p-1.5 hover:bg-red-600 rounded-md transition-all">
                        <ChevronLeft size={16} className="text-white" />
                    </button>
                    <span className="px-4 font-semibold text-white w-36 text-center text-sm">
                        {format(currentDate, 'MMM yyyy', { locale: pt })}
                    </span>
                    <button onClick={handleNextWeek} className="p-1.5 hover:bg-red-600 rounded-md transition-all">
                        <ChevronRight size={16} className="text-white" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {technicians.length === 0 && !isReadOnly && (
                        <button 
                            onClick={handleSeedDatabase}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm mr-2"
                        >
                            <RefreshCw size={14} />
                            Popular DB
                        </button>
                    )}

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
                    >
                        <FileBarChart size={18} />
                        Relatórios
                    </button>
                    
                    {!isReadOnly && (
                        <>
                            <div className="h-6 w-px bg-red-500 mx-1"></div>
                            <button 
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-2 text-white/80 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <Settings size={18} />
                            </button>
                            <button 
                                onClick={openNewTicketModal}
                                className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm ml-2"
                            >
                                <Plus size={18} />
                                Novo Serviço
                            </button>
                        </>
                    )}
                    
                    <button 
                        onClick={handleLogout}
                        className="ml-3 p-2 text-red-200 hover:bg-red-800 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>

        {/* Main Content Area - Split Vertical */}
        <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top: Weekly Schedule (Flex Grow) */}
            <div className="flex-[3] overflow-hidden p-4 pb-0">
               <WeeklyScheduleView 
                currentDate={currentDate}
                tickets={tickets}
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
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedDayTickets.map(ticket => {
                                    const service = services.find(s => s.id === ticket.serviceId);
                                    return (
                                        <div key={ticket.id} onClick={() => handleEditTicket(ticket)} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg cursor-pointer transition-all">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-1 rounded">{ticket.scheduledTime}</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{ticket.customerName}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/> {ticket.locality}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
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
                            dayTickets={selectedDayTickets}
                            technicians={technicians}
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
            selectedTechId={newTicketPreData ? newTicketPreData.techId : null}
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
