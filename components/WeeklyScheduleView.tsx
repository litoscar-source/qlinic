
import React from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition } from '../types';
import { MapPin, Clock } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentDate: Date;
  tickets: Ticket[];
  technicians: Technician[];
  services: ServiceDefinition[];
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  currentDate,
  tickets,
  technicians,
  services,
  onTicketUpdate,
  onSelectDate,
  selectedDate
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Starts Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getStatusBorder = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: return 'border-green-400 border-l-4';
      case TicketStatus.PENDENTE: return 'border-yellow-400 border-l-4';
      case TicketStatus.EM_ANDAMENTO: return 'border-blue-400 border-l-4';
      case TicketStatus.NAO_RESOLVIDO: return 'border-red-400 border-l-4';
      default: return 'border-gray-200 border-l-4';
    }
  };

  const getServiceColor = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.colorClass : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Outro';
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>, ticketId: string) => {
    e.stopPropagation();
    const newDuration = parseFloat(e.target.value);
    if (!isNaN(newDuration) && newDuration > 0) {
        onTicketUpdate(ticketId, { duration: newDuration });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
            {/* Header: Technicians */}
            <div className="grid grid-cols-[150px_repeat(auto-fit,minmax(250px,1fr))] border-b border-gray-200 bg-gray-50">
                <div className="p-4 font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center justify-center border-r border-gray-200">
                    Dia / Técnico
                </div>
                {technicians.map(tech => (
                    <div key={tech.id} className="p-3 flex items-center gap-3 border-r border-gray-200 last:border-r-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${tech.avatarColor}`}>
                            {tech.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-700">{tech.name}</span>
                    </div>
                ))}
            </div>

            {/* Rows: Days */}
            <div className="divide-y divide-gray-200">
                {daysInWeek.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                        <div key={day.toISOString()} className={`grid grid-cols-[150px_repeat(auto-fit,minmax(250px,1fr))] hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                            {/* Day Column */}
                            <div 
                                onClick={() => onSelectDate(day)}
                                className={`p-4 border-r border-gray-200 flex flex-col justify-center cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                            >
                                <span className="text-xs font-bold uppercase text-gray-400">
                                    {format(day, 'EEEE', { locale: pt })}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-bold ${isToday(day) ? 'text-blue-600' : 'text-gray-800'}`}>
                                        {format(day, 'dd')}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {format(day, 'MMM', { locale: pt })}
                                    </span>
                                </div>
                            </div>

                            {/* Technician Columns (Cells) */}
                            {technicians.map(tech => {
                                const dayTechTickets = tickets.filter(t => 
                                    isSameDay(t.date, day) && 
                                    t.technicianIds.includes(tech.id)
                                ).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

                                return (
                                    <div 
                                        key={`${day}-${tech.id}`} 
                                        className="p-2 border-r border-gray-200 last:border-r-0 min-h-[120px] space-y-2 relative"
                                        onClick={() => onSelectDate(day)}
                                    >
                                        {dayTechTickets.map(ticket => (
                                            <div 
                                                key={ticket.id}
                                                className={`rounded-lg p-2 shadow-sm transition-all text-xs group cursor-pointer bg-white border ${getStatusBorder(ticket.status)}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {ticket.scheduledTime}
                                                    </span>
                                                    <span className="opacity-70 font-mono">{ticket.ticketNumber}</span>
                                                </div>
                                                
                                                <div className="font-semibold text-gray-800 mb-0.5 line-clamp-1">
                                                    {ticket.customerName}
                                                </div>
                                                <div className="text-gray-600 mb-1 flex items-center gap-1 line-clamp-1">
                                                    <MapPin size={10} />
                                                    {ticket.address}
                                                </div>

                                                <div className="flex justify-between items-center mt-2 pt-1 border-t border-black/5">
                                                    <span className={`font-medium px-1.5 py-0.5 rounded text-[10px] uppercase border ${getServiceColor(ticket.serviceId)}`}>
                                                        {getServiceName(ticket.serviceId)}
                                                    </span>
                                                    
                                                    {/* In-place Hour Editor */}
                                                    <div className="flex items-center gap-1" title="Editar horas previstas">
                                                        <input 
                                                            type="number" 
                                                            min="0.5"
                                                            step="0.5"
                                                            value={ticket.duration}
                                                            onChange={(e) => handleDurationChange(e, ticket.id)}
                                                            className="w-10 h-5 text-center bg-gray-50 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="text-[10px]">h</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Multi-Tech Indicator */}
                                                {ticket.technicianIds.length > 1 && (
                                                    <div className="mt-1 flex -space-x-1 overflow-hidden">
                                                        {ticket.technicianIds.filter(id => id !== tech.id).map((id) => (
                                                            <div key={id} className="w-4 h-4 rounded-full bg-gray-400 border border-white text-[8px] flex items-center justify-center text-white" title="Também alocado">
                                                                +
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
