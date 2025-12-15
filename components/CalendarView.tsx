import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  getDay,
  isToday
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician } from '../types';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  tickets: Ticket[];
  technicians: Technician[];
  selectedTechId: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  tickets,
  technicians,
  selectedTechId
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate empty cells for start of month grid
  const startDay = getDay(monthStart); // 0 = Sunday
  const emptyDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }); // Adjust for Monday start

  const getDayTickets = (date: Date) => {
    return tickets.filter(t => isSameDay(t.date, date) && (!selectedTechId || t.technicianId === selectedTechId));
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: return 'bg-green-100 text-green-700 border-green-200';
      case TicketStatus.PENDENTE: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TicketStatus.EM_ANDAMENTO: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TicketStatus.NAO_RESOLVIDO: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px border-b border-gray-200">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[120px]" />
        ))}
        
        {daysInMonth.map((day) => {
          const dayTickets = getDayTickets(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`bg-white min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-gray-50 relative group
                ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                  ${isCurrentDay ? 'bg-blue-600 text-white' : 'text-gray-700'}
                  ${!isSameMonth(day, currentDate) ? 'text-gray-300' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {dayTickets.length > 0 && (
                  <span className="text-xs font-semibold text-gray-400">
                    {dayTickets.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayTickets.slice(0, 3).map(ticket => {
                    const tech = technicians.find(t => t.id === ticket.technicianId);
                    return (
                        <div 
                            key={ticket.id} 
                            className={`text-[10px] p-1 rounded border truncate flex items-center gap-1 ${getStatusColor(ticket.status)}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tech?.avatarColor || 'bg-gray-400'}`} />
                            <span className="truncate font-medium">{ticket.scheduledTime} - {ticket.customerName}</span>
                        </div>
                    );
                })}
                {dayTickets.length > 3 && (
                  <div className="text-[10px] text-gray-500 text-center font-medium">
                    + {dayTickets.length - 3} outros
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};