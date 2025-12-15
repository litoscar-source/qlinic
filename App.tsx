
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { Technician, Ticket, VehicleType, TicketStatus, ServiceDefinition } from './types';
import { addWeeks, subWeeks, format, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react';

// INITIAL DATA
const INITIAL_TECHNICIANS: Technician[] = [
  { id: '1', name: 'João Silva', avatarColor: 'bg-blue-500' },
  { id: '2', name: 'Maria Costa', avatarColor: 'bg-emerald-500' },
  { id: '3', name: 'Pedro Santos', avatarColor: 'bg-amber-500' },
  { id: '4', name: 'Ana Pereira', avatarColor: 'bg-purple-500' },
];

const INITIAL_SERVICES: ServiceDefinition[] = [
  { id: 's1', name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 's2', name: 'Reconstrução', defaultDuration: 2, colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 's3', name: 'Calibração', defaultDuration: 1, colorClass: 'bg-green-100 text-green-800 border-green-200' },
  { id: 's4', name: 'Acompanhamento', defaultDuration: 1, colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: '101',
    technicianIds: ['1'],
    ticketNumber: 'TCK-001',
    customerName: 'Café Central',
    address: 'Av. da Liberdade 100, Lisboa',
    vehicleType: VehicleType.CARRINHA,
    serviceId: 's1',
    status: TicketStatus.RESOLVIDO,
    date: new Date(),
    scheduledTime: '09:00',
    duration: 4,
  },
  {
    id: '102',
    technicianIds: ['1'],
    ticketNumber: 'TCK-002',
    customerName: 'Loja Tech',
    address: 'Rua Augusta 50, Lisboa',
    vehicleType: VehicleType.MOTO,
    serviceId: 's4',
    status: TicketStatus.PENDENTE,
    date: new Date(),
    scheduledTime: '14:30',
    duration: 1,
  },
  {
    id: '104',
    technicianIds: ['2', '3'],
    ticketNumber: 'TCK-004',
    customerName: 'Fábrica Moderna',
    address: 'Zona Industrial, Porto',
    vehicleType: VehicleType.CAMIAO,
    serviceId: 's2',
    status: TicketStatus.EM_ANDAMENTO,
    date: new Date(),
    scheduledTime: '10:00',
    duration: 5,
  }
];

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  
  // Data State
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [services, setServices] = useState<ServiceDefinition[]>(INITIAL_SERVICES);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  
  // Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const handleAddTicket = (newTicket: Omit<Ticket, 'id'>) => {
    const ticket: Ticket = {
      ...newTicket,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTickets([...tickets, ticket]);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
  };

  // Settings Handlers
  const handleAddTechnician = (tech: Technician) => {
    setTechnicians([...technicians, tech]);
  };
  const handleRemoveTechnician = (id: string) => {
    setTechnicians(technicians.filter(t => t.id !== id));
  };
  const handleAddService = (service: ServiceDefinition) => {
    setServices([...services, service]);
  };
  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const selectedDayTickets = tickets.filter(
    t => isSameDay(t.date, selectedDate) && 
    (!selectedTechId || t.technicianIds.includes(selectedTechId))
  ).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const selectedTechnician = technicians.find(t => t.id === selectedTechId);

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden">
      <Sidebar 
        technicians={technicians} 
        selectedTechId={selectedTechId} 
        onSelectTech={setSelectedTechId} 
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <main className="ml-64 flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="px-8 py-5 bg-white border-b border-gray-200 shrink-0 flex justify-between items-center z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planeamento Semanal</h1>
            <p className="text-gray-500 text-sm mt-1">
               Gerir alocações de serviço e rotas
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button onClick={handlePrevWeek} className="p-2 hover:bg-white rounded-md transition-all shadow-sm">
                    <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <span className="px-4 font-semibold text-gray-700 w-40 text-center">
                    {format(currentDate, 'MMM yyyy', { locale: pt })}
                </span>
                <button onClick={handleNextWeek} className="p-2 hover:bg-white rounded-md transition-all shadow-sm">
                    <ChevronRight size={18} className="text-gray-600" />
                </button>
             </div>

             <button 
                onClick={() => setIsTicketModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
                <Plus size={20} />
                Novo Serviço
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            
            {/* Weekly Grid Section */}
            <div className="flex-1 overflow-auto p-6">
              <WeeklyScheduleView 
                currentDate={currentDate}
                tickets={tickets}
                technicians={technicians}
                services={services}
                onTicketUpdate={handleUpdateTicket}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>

            {/* Daily Detail & Route Sidebar */}
            <div className="w-96 shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
               <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                        {format(selectedDate, "d 'de' MMMM", { locale: pt })}
                        </h3>
                        <p className="text-sm text-gray-500">
                             {selectedDayTickets.length} Serviços Agendados
                        </p>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-md capitalize">
                      {format(selectedDate, "EEEE", { locale: pt })}
                    </span>
                  </div>

                  {selectedDayTickets.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="text-gray-300" size={32} />
                      </div>
                      <p className="text-gray-500 font-medium">Sem agendamentos</p>
                      <p className="text-gray-400 text-sm mt-1">Selecione um dia na grelha para ver detalhes.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayTickets.map(ticket => {
                            const service = services.find(s => s.id === ticket.serviceId);
                            const serviceName = service ? service.name : 'Outro';
                            const serviceColor = service ? service.colorClass : 'bg-gray-100';

                            return (
                            <div key={ticket.id} className="group relative pl-4 border-l-2 border-gray-200 hover:border-blue-500 transition-colors">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300 group-hover:border-blue-500 transition-colors" />
                                
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-gray-900">{ticket.scheduledTime} ({ticket.duration}h)</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                                        ${ticket.status === TicketStatus.RESOLVIDO ? 'bg-green-100 text-green-700' : 
                                          ticket.status === TicketStatus.PENDENTE ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-600'}
                                    `}>
                                        {ticket.status}
                                    </span>
                                </div>
                                
                                <h4 className="font-semibold text-gray-800 mt-1">{ticket.customerName}</h4>
                                <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                    <MapPin size={12} />
                                    <span className="truncate">{ticket.address}</span>
                                </div>
                                <div className={`flex items-center gap-1 text-xs mt-1 font-medium p-1 rounded w-fit border ${serviceColor}`}>
                                    <span>{serviceName}</span>
                                </div>

                                {/* Técnicos */}
                                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                                    {ticket.technicianIds.map(tId => {
                                        const t = technicians.find(tec => tec.id === tId);
                                        return t ? (
                                            <div key={tId} className={`w-6 h-6 rounded-full flex shrink-0 items-center justify-center text-white text-[10px] font-bold ${t.avatarColor}`} title={t.name}>
                                                {t.name.substring(0,2).toUpperCase()}
                                            </div>
                                        ) : null;
                                    })}
                                    <span className="text-xs text-gray-400 border-l pl-2 ml-1">{ticket.ticketNumber}</span>
                                </div>
                            </div>
                         );
                      })}
                    </div>
                  )}

                  {/* Route Analyzer */}
                  {selectedDayTickets.length >= 2 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <RouteAnalyzer 
                            tickets={selectedDayTickets} 
                            technicianName={selectedTechId ? selectedTechnician?.name || 'Técnico Selecionado' : 'Rota Combinada'} 
                        />
                    </div>
                  )}
               </div>
            </div>
        </div>

        <TicketFormModal 
            isOpen={isTicketModalOpen} 
            onClose={() => setIsTicketModalOpen(false)}
            onSave={handleAddTicket}
            technicians={technicians}
            services={services}
            initialDate={selectedDate}
            selectedTechId={selectedTechId}
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
      </main>
    </div>
  );
}

export default App;
