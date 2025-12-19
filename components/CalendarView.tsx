
import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  getDay,
  isToday,
  isWeekend
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
    return tickets.filter(t => isSameDay(t.date, date) && (!selectedTechId || t.technicianIds.includes(selectedTechId)));
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: 
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case TicketStatus.EM_ANDAMENTO: 
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case TicketStatus.NAO_CONFIRMADO: 
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case TicketStatus.CONFIRMADO: 
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case TicketStatus.PARCIALMENTE_RESOLVIDO: 
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case TicketStatus.NAO_REALIZADO: 
        return 'bg-red-50 text-red-800 border-red-100';
      default: 
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans antialiased">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, idx) => {
          const isWknd = idx >= 5;
          return (
            <div key={day} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${isWknd ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px border-b border-slate-200">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[110px]" />
        ))}
        
        {daysInMonth.map((day) => {
          const dayTickets = getDayTickets(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isWknd = isWeekend(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`bg-white min-h-[110px] p-2 cursor-pointer transition-colors hover:bg-slate-50 relative group
                ${isWknd ? 'bg-slate-100/50' : ''}
                ${isSelected ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-500 z-10' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                  ${isCurrentDay ? 'bg-red-600 text-white' : (isWknd ? 'text-slate-800' : 'text-slate-700')}
                  ${!isSameMonth(day, currentDate) ? 'text-slate-300' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {dayTickets.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {dayTickets.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayTickets.slice(0, 3).map(ticket => {
                    const tech = technicians.filter(t => ticket.technicianIds.includes(t.id))[0];
                    return (
                        <div 
                            key={ticket.id} 
                            className={`text-[9px] p-1 rounded border truncate flex items-center gap-1 uppercase font-semibold ${getStatusColor(ticket.status)}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tech?.avatarColor || 'bg-slate-400'}`} />
                            <span className="truncate">{ticket.scheduledTime} - {ticket.customerName}</span>
                        </div>
                    );
                })}
                {dayTickets.length > 3 && (
                  <div className="text-[9px] text-slate-400 text-center font-bold uppercase py-0.5">
                    + {dayTickets.length - 3} mais
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
