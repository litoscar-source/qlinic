
import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isWeekend } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition, DayStatus, Visor, Vehicle } from '../types';
import { MapPin, Clock, Moon, Plus, Users, MoreHorizontal, MousePointer2, Hash, FileText, Truck } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentDate: Date;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  visores?: Visor[];
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
  onEditTicket: (ticket: Ticket) => void;
  onNewTicket?: (date: Date, techId: string) => void;
  onToggleOvernight?: (date: Date, techId: string) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  isReadOnly?: boolean;
  isCompact?: boolean;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  currentDate, tickets, dayStatuses, technicians, services, vehicles, onTicketUpdate, onEditTicket, onNewTicket, onToggleOvernight, onSelectDate, selectedDate, isReadOnly = false, isCompact = false
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, day: Date, techId: string } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, day: Date, techId: string) => {
    e.preventDefault();
    if (isReadOnly) return;
    setContextMenu({ x: e.clientX, y: e.clientY, day, techId });
  };

  const isDarkColor = (colorClass: string) => {
    const darkColors = ['bg-blue-600', 'bg-purple-600', 'bg-red-600', 'bg-slate-900', 'bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-rose-500', 'bg-slate-800', 'bg-amber-600'];
    return darkColors.includes(colorClass);
  };

  const getCardStyle = (ticket: Ticket, service: ServiceDefinition | undefined) => {
    let baseStyle = `${service?.colorClass || 'bg-slate-100'} border shadow-sm transition-all duration-200 border-black/10 `;
    let statusBorder = 'border-l-[5px]';
    switch (ticket.status) {
      case TicketStatus.RESOLVIDO: statusBorder += ' border-l-emerald-600'; break;
      case TicketStatus.CONFIRMADO: statusBorder += ' border-l-slate-900'; break;
      case TicketStatus.NAO_CONFIRMADO: statusBorder += ' border-l-rose-500 border-dashed'; break;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: statusBorder += ' border-l-orange-500'; break;
      default: statusBorder += ' border-l-blue-600';
    }
    return `${baseStyle} ${statusBorder}`;
  };

  const getTextColor = (ticket: Ticket, service: ServiceDefinition | undefined) => {
    if (service && isDarkColor(service.colorClass)) return 'text-white';
    return 'text-slate-900';
  };

  const gridTemplateColumns = `160px repeat(5, minmax(130px, 1fr)) repeat(2, 80px)`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-300 flex flex-col h-full overflow-hidden select-none relative font-sans text-slate-900 antialiased z-10">
      <div className="overflow-auto h-full relative custom-scrollbar">
        <div style={{ minWidth: '1050px' }}>
            <div className="grid border-b border-slate-300 bg-slate-50 sticky top-0 z-40" style={{ gridTemplateColumns }}>
                <div className="p-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center border-r border-slate-300 bg-white z-50 sticky left-0 shadow-sm">
                    <Users size={12} className="mr-1.5 text-red-600" /> EQUIPA
                </div>
                {daysInWeek.map(day => (
                    <div key={day.toISOString()} onClick={() => onSelectDate(day)} 
                        className={`py-1 border-r border-slate-300 last:border-r-0 flex flex-col items-center justify-center cursor-pointer transition-colors 
                        ${isWeekend(day) ? 'bg-slate-800 text-white' : (isToday(day) ? 'bg-red-100 text-red-700' : 'bg-slate-50 text-slate-500')}`}>
                        <span className="text-[9px] uppercase font-bold tracking-tight">{format(day, 'EEE', { locale: pt })}</span>
                        <div className="text-sm leading-none font-bold">{format(day, 'dd')}</div>
                    </div>
                ))}
            </div>

            <div className="divide-y divide-slate-200">
                {technicians.map(tech => (
                    <div key={tech.id} className="grid group/row" style={{ gridTemplateColumns }}>
                        <div className={`sticky left-0 z-30 bg-white border-r border-slate-300 flex items-center gap-2 shadow-sm group-hover/row:bg-slate-50 transition-all ${isCompact ? 'p-1 h-[60px]' : 'p-2 min-h-[160px]'}`}>
                            <div className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md ${tech.avatarColor} ${isCompact ? 'w-6 h-6 text-[9px]' : 'w-10 h-10 text-[11px]'}`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`text-slate-900 truncate uppercase tracking-tight font-bold ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>{tech.name}</span>
                        </div>

                        {daysInWeek.map(day => {
                            const dayTechTickets = tickets.filter(t => isSameDay(t.date, day) && t.technicianIds.includes(tech.id)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));
                            const isOvernight = dayStatuses.some(ds => isSameDay(ds.date, day) && ds.technicianId === tech.id && ds.isOvernight);
                            return (
                                <div key={`${day.toISOString()}-${tech.id}`} 
                                    className={`group/cell border-r border-slate-200 last:border-r-0 flex flex-col gap-1 relative overflow-hidden transition-all ${isCompact ? 'p-1 pb-4' : 'p-2 pb-8'} ${isWeekend(day) ? 'bg-slate-200/40' : (isOvernight ? 'bg-amber-50/40' : 'hover:bg-slate-50/80')}`} 
                                    onContextMenu={(e) => handleContextMenu(e, day, tech.id)} 
                                    onClick={() => onSelectDate(day)}>
                                    
                                    {!isReadOnly && (
                                        <div className={`absolute top-1 right-1 flex gap-1 z-30 transition-all pointer-events-auto ${isOvernight ? 'opacity-100' : 'opacity-0 group-hover/cell:opacity-100'}`}>
                                            <button onClick={(e) => { e.stopPropagation(); onToggleOvernight?.(day, tech.id); }} className={`p-1 rounded shadow-md border transition-all ${isOvernight ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 hover:text-amber-500 border-slate-200 hover:bg-amber-50'}`} title="Dormida Fora">
                                                <Moon size={isCompact ? 10 : 12} fill={isOvernight ? "currentColor" : "none"} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onNewTicket?.(day, tech.id); }} className="p-1 rounded bg-red-600 text-white shadow-md border border-red-700 hover:bg-red-700 active:scale-90 transition-all" title="Novo Serviço">
                                                <Plus size={isCompact ? 10 : 12} />
                                            </button>
                                        </div>
                                    )}

                                    {isOvernight && (
                                        <div onClick={(e) => { e.stopPropagation(); onToggleOvernight?.(day, tech.id); }} className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-black py-1 flex items-center justify-center gap-1.5 z-20 uppercase tracking-widest cursor-pointer hover:bg-amber-600 shadow-lg"><Moon size={10} fill="currentColor" /> DORMIDA</div>
                                    )}

                                    <div className={`flex-1 flex gap-1 ${isCompact ? 'flex-row items-center h-full' : 'flex-col mt-1'}`}>
                                        {dayTechTickets.map(ticket => {
                                            const service = services.find(s => s.id === ticket.serviceId);
                                            const vehicle = vehicles.find(v => v.id === ticket.vehicleId);
                                            const textCls = getTextColor(ticket, service);
                                            const isDark = service ? isDarkColor(service.colorClass) : false;
                                            return (
                                                <div key={`${ticket.id}-${tech.id}`} onClick={(e) => { e.stopPropagation(); onEditTicket(ticket); }} className={`rounded shadow-md relative font-sans ${getCardStyle(ticket, service)} ${isCompact ? 'p-1 h-[34px] flex-1 min-w-[100px] border-l-[4px]' : 'p-2.5 mb-1.5 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 border-l-[6px]'}`}>
                                                    <div className={`flex justify-between items-center ${isCompact ? 'mb-0' : 'mb-0.5'}`}>
                                                        <div className={`flex items-center gap-1 font-semibold ${isCompact ? 'text-[8px]' : 'text-[10px]'} ${textCls}`}><Clock size={isCompact ? 8 : 10} /> {ticket.scheduledTime}</div>
                                                        {!isCompact && <div className={`flex items-center gap-1 font-mono text-[9px] ${textCls} opacity-70`}>#{ticket.ticketNumber}</div>}
                                                    </div>
                                                    <p className={`uppercase truncate font-bold leading-tight ${isCompact ? 'text-[8px] max-w-[80px]' : 'text-[11px] mb-1.5'} ${textCls}`}>{ticket.customerName}</p>
                                                    {!isCompact && (
                                                      <div className="space-y-1">
                                                        <div className={`flex items-center gap-2 px-1.5 py-0.5 rounded border ${isDark ? 'bg-white/10 border-white/5' : 'bg-black/5 border-black/5'}`}>
                                                          <div className="flex items-center gap-1 shrink-0"><Hash size={9} className={isDark ? 'text-white/60' : 'text-slate-400'} /><span className={`font-mono text-[9px] font-bold ${textCls}`}>{ticket.ticketNumber}</span></div>
                                                        </div>
                                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isDark ? 'bg-white/10 border-white/5' : 'bg-white/40 border-black/5'}`}>
                                                          <div className="flex items-center gap-2 flex-1 truncate">
                                                            <MapPin size={9} className={isDark ? 'text-white/80' : 'text-red-600/70'} />
                                                            <span className={`truncate uppercase font-semibold text-[9px] ${textCls} opacity-90`}>{ticket.locality || 'PORTUGAL'}</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                    {isCompact && <div className={`text-[7px] font-mono mt-0.5 ${textCls} opacity-60 truncate`}>{vehicle?.name || ticket.ticketNumber}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
