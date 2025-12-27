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
  isWeekend,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician } from '../types';
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Users } from 'lucide-react';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  tickets: Ticket[];
  technicians: Technician[];
  selectedTechId: string | null;
  isReadOnly?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  tickets,
  technicians,
  selectedTechId,
  isReadOnly = false
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Incluir dias das semanas anteriores e posteriores para grid completa
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const daysInGrid = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayTickets = (date: Date) => {
    return tickets.filter(t => isSameDay(t.date, date) && (!selectedTechId || t.technicianIds.includes(selectedTechId)));
  };

  const getDayWorkload = (date: Date) => {
    const dayTickets = getDayTickets(date);
    if (dayTickets.length === 0) return 'none';
    if (dayTickets.length < 3) return 'low';
    if (dayTickets.length < 6) return 'medium';
    return 'high';
  };

  const getWorkloadStyle = (level: string) => {
      switch(level) {
          case 'high': return 'bg-red-50 text-red-700 border-red-200';
          case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
          case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          default: return 'bg-white text-slate-400 border-slate-100';
      }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden font-sans antialiased flex flex-col h-full flex-1 animate-in fade-in duration-500">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => {
          const isWknd = idx >= 5;
          return (
            <div key={day} className={`py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] ${isWknd ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 3)}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 bg-slate-200 gap-px overflow-y-auto custom-scrollbar">
        {daysInGrid.map((day) => {
          const dayTickets = getDayTickets(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isWknd = isWeekend(day);
          const inMonth = isSameMonth(day, currentDate);
          const workload = getDayWorkload(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`min-h-[120px] p-3 cursor-pointer transition-all relative flex flex-col group
                ${inMonth ? (isWknd ? 'bg-slate-50' : 'bg-white') : 'bg-slate-100/50 opacity-40'}
                ${isSelected ? 'ring-4 ring-inset ring-red-600/20 bg-red-50/10 z-10' : 'hover:bg-slate-50'}
              `}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`
                  w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black transition-all
                  ${isCurrentDay ? 'bg-red-600 text-white shadow-lg shadow-red-200' : (isWknd ? 'text-slate-400' : 'text-slate-900')}
                  ${isSelected ? 'scale-110 ring-2 ring-red-600 ring-offset-2' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {dayTickets.length > 0 && (
                   <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${getWorkloadStyle(workload)}`}>
                      <Users size={10} /> {dayTickets.length}
                   </div>
                )}
              </div>

              <div className="flex-1 space-y-1 overflow-hidden">
                {dayTickets.slice(0, 3).map(ticket => {
                    const tech = technicians.filter(t => ticket.technicianIds.includes(t.id))[0];
                    return (
                        <div key={ticket.id} className="text-[8px] p-1.5 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center gap-2 uppercase font-black tracking-tight text-slate-700 truncate hover:scale-[1.02] transition-transform">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tech?.avatarColor || 'bg-slate-300'}`} />
                            <span className="truncate">{ticket.scheduledTime} · {ticket.customerName}</span>
                        </div>
                    );
                })}
                {dayTickets.length > 3 && (
                  <div className="text-[8px] text-slate-400 text-center font-black uppercase tracking-widest py-1.5 flex items-center justify-center gap-1">
                    + {dayTickets.length - 3} serviços <ChevronRight size={10} />
                  </div>
                )}
              </div>
              
              {inMonth && !isReadOnly && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-red-600 text-white p-1.5 rounded-lg shadow-lg">
                          <Users size={12} />
                      </div>
                  </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};