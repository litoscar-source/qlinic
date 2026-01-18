
import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isWeekend } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition, DayStatus, Visor, Vehicle } from '../types';
import { MapPin, Clock, Moon, Plus, Users, Truck, PackageSearch, Calculator, Navigation } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentDate: Date;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  visores?: Visor[];
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
  onMoveTicket?: (ticketId: string, newDate: Date, targetTechId: string, sourceTechId: string) => void;
  onEditTicket: (ticket: Ticket) => void;
  onNewTicket?: (date: Date, techId: string) => void;
  onToggleOvernight?: (date: Date, techId: string) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  isReadOnly?: boolean;
  isCompact?: boolean;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  currentDate, tickets, dayStatuses, technicians, services, vehicles, visores = [], onTicketUpdate, onMoveTicket, onEditTicket, onNewTicket, onToggleOvernight, onSelectDate, selectedDate, isReadOnly = false, isCompact = false
}) => {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const isDarkColor = (colorClass: string) => {
    const darkColors = ['bg-blue-600', 'bg-purple-600', 'bg-red-600', 'bg-slate-900', 'bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-rose-500', 'bg-slate-800'];
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

  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceTechId: string) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceTechId', sourceTechId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetTechId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    setDragOverCell(null);
    const ticketId = e.dataTransfer.getData('ticketId');
    const sourceTechId = e.dataTransfer.getData('sourceTechId');
    if (ticketId && onMoveTicket) {
      onMoveTicket(ticketId, targetDate, targetTechId, sourceTechId);
    }
  };

  const gridTemplateColumns = `160px repeat(7, minmax(130px, 1fr))`;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-300 flex flex-col h-full overflow-hidden select-none relative font-sans text-slate-900 antialiased z-10">
      <div className="overflow-auto h-full relative custom-scrollbar">
        <div style={{ minWidth: '1100px' }}>
            <div className="grid border-b border-slate-300 bg-slate-50 sticky top-0 z-40" style={{ gridTemplateColumns }}>
                <div className="p-3 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center border-r border-slate-300 bg-white z-50 sticky left-0 shadow-sm">
                    <Users size={12} className="mr-2 text-red-600" /> EQUIPA
                </div>
                {daysInWeek.map(day => (
                    <div key={day.toISOString()} onClick={() => onSelectDate(day)} 
                        className={`py-2 border-r border-slate-300 last:border-r-0 flex flex-col items-center justify-center cursor-pointer transition-colors 
                        ${isWeekend(day) ? 'bg-slate-800 text-white' : (isToday(day) ? 'bg-red-100 text-red-700' : 'bg-slate-50 text-slate-500 hover:text-red-600')} 
                        ${isSameDay(day, selectedDate) ? 'ring-2 ring-inset ring-red-400' : ''}`}>
                        <span className="text-[9px] uppercase font-black tracking-tight">{format(day, 'EEE', { locale: pt })}</span>
                        <div className="text-sm leading-none font-black">{format(day, 'dd')}</div>
                    </div>
                ))}
            </div>

            <div className="divide-y divide-slate-200">
                {technicians.map(tech => (
                    <div key={tech.id} className="grid group/row" style={{ gridTemplateColumns }}>
                        <div className={`sticky left-0 z-30 bg-white border-r border-slate-300 flex items-center gap-3 shadow-sm group-hover/row:bg-slate-50 transition-all p-4 min-h-[180px]`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-md ${tech.avatarColor}`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-slate-900 truncate uppercase tracking-tighter font-black text-[11px]">{tech.name}</span>
                        </div>

                        {daysInWeek.map(day => {
                            const dayId = `${day.toISOString()}-${tech.id}`;
                            const isOver = dragOverCell === dayId;
                            
                            const dayTechTickets = tickets.filter(t => {
                                const tDate = t.date instanceof Date ? t.date : new Date(t.date);
                                return isSameDay(tDate, day) && t.technicianIds.includes(tech.id);
                            }).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

                            const totalWorkHours = dayTechTickets.reduce((acc, t) => acc + (t.duration || 0), 0);
                            const totalTravelHours = dayTechTickets.reduce((acc, t) => acc + ((t.travelTimeMinutes || 0) / 60), 0);
                            const totalDayHours = totalWorkHours + totalTravelHours;
                            const balance = 8 - totalDayHours;

                            const isOvernight = dayStatuses.some(ds => {
                                const dDate = ds.date instanceof Date ? ds.date : new Date(ds.date);
                                return isSameDay(dDate, day) && ds.technicianId === tech.id && ds.isOvernight;
                            });

                            return (
                                <div key={dayId} 
                                    className={`group/cell border-r border-slate-200 last:border-r-0 flex flex-col gap-1 relative overflow-hidden transition-all p-2 pb-20
                                    ${isWeekend(day) ? 'bg-slate-100/50' : (isOvernight ? 'bg-amber-50/40' : 'hover:bg-slate-50/80')} 
                                    ${isOver ? 'bg-red-50 ring-2 ring-inset ring-red-300' : ''}
                                    ${isSameDay(day, selectedDate) ? 'bg-red-50/20 shadow-inner' : ''}`} 
                                    onDragOver={(e) => { e.preventDefault(); setDragOverCell(dayId); }}
                                    onDragLeave={() => setDragOverCell(null)}
                                    onDrop={(e) => handleDrop(e, day, tech.id)}
                                    onClick={() => onSelectDate(day)}>
                                    
                                    {!isReadOnly && (
                                        <div className="absolute top-1 right-1 flex gap-1 z-50 opacity-0 group-hover/cell:opacity-100 transition-all">
                                            <button onClick={(e) => { e.stopPropagation(); onToggleOvernight?.(day, tech.id); }} className={`p-1 rounded shadow-md border transition-all ${isOvernight ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 hover:text-amber-500 border-slate-200 hover:bg-amber-50'}`} title="Dormida">
                                                <Moon size={12} fill={isOvernight ? "currentColor" : "none"} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onNewTicket?.(day, tech.id); }} className="p-1 rounded bg-red-600 text-white shadow-md border border-red-700 hover:bg-red-700 transition-all" title="Novo">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-1.5 mt-1 z-10 relative">
                                        {dayTechTickets.map(ticket => {
                                            const service = services.find(s => s.id === ticket.serviceId);
                                            const vehicle = vehicles.find(v => v.id === ticket.vehicleId);
                                            const visor = visores.find(v => v.id === ticket.visorId);
                                            const textCls = getTextColor(ticket, service);
                                            return (
                                                <div 
                                                    key={`${ticket.id}-${tech.id}`} 
                                                    draggable={!isReadOnly}
                                                    onDragStart={(e) => handleDragStart(e, ticket.id, tech.id)}
                                                    onClick={(e) => { e.stopPropagation(); onEditTicket(ticket); }} 
                                                    className={`rounded-xl shadow-sm p-2 cursor-grab active:cursor-grabbing transition-transform hover:scale-[1.02] flex flex-col gap-0.5 ${getCardStyle(ticket, service)}`}>
                                                    
                                                    {ticket.travelTimeMinutes && (
                                                      <div className={`flex items-center gap-1 text-[9px] font-black uppercase mb-1 ${textCls}`}>
                                                        <Navigation size={9} /> +{ticket.travelTimeMinutes}min Viagem
                                                      </div>
                                                    )}

                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-[10px] font-black uppercase ${textCls} opacity-90`}>{ticket.scheduledTime} ({ticket.duration}h)</span>
                                                        <div className="flex items-center gap-1">
                                                          {ticket.visorId && <PackageSearch size={10} className={textCls} />}
                                                          <span className={`text-[9px] font-black uppercase ${textCls} opacity-60`}>#{ticket.ticketNumber}</span>
                                                        </div>
                                                    </div>

                                                    <p className={`text-[8px] font-bold uppercase truncate opacity-70 ${textCls}`}>{service?.name || '---'}</p>

                                                    <p className={`uppercase truncate font-black tracking-tight text-[10px] leading-tight ${textCls}`}>{ticket.customerName}</p>
                                                    
                                                    {ticket.locality && (
                                                        <div className={`flex items-center gap-1 ${textCls} opacity-80`}>
                                                            <MapPin size={8} />
                                                            <span className="text-[8px] font-bold uppercase truncate">{ticket.locality}</span>
                                                        </div>
                                                    )}

                                                    {visor && <p className={`text-[8px] font-bold mt-0.5 uppercase truncate ${textCls} opacity-80`}>Visor: {visor.name}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* FOOTER DE SALDO - LIGHT THEME */}
                                    <div className={`absolute bottom-0 left-0 right-0 p-2 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider z-40 border-t transition-colors
                                        ${balance < 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5 font-black">
                                              <Calculator size={12} className={balance < 0 ? "text-red-500" : "text-slate-400"} />
                                              <span className="text-[11px]">{totalDayHours.toFixed(1)}h</span>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border shadow-sm ${
                                              balance < 0 ? 'bg-white text-red-600 border-red-100' : 'bg-white text-emerald-600 border-emerald-100'
                                          }`}>
                                              {balance >= 0 ? `+${balance.toFixed(1)}h` : `${balance.toFixed(1)}h`}
                                          </span>
                                        </div>
                                        <div className={`flex items-center justify-between text-[9px] font-semibold opacity-80`}>
                                           <span>TRAB: {totalWorkHours.toFixed(1)}h</span>
                                           <span>DESL: {totalTravelHours.toFixed(1)}h</span>
                                        </div>
                                    </div>

                                    {isOvernight && (
                                        <div className="absolute bottom-[58px] left-0 right-0 bg-amber-500 text-white text-[8px] font-black py-1 flex items-center justify-center gap-1 uppercase tracking-widest shadow-md z-30 border-t border-amber-600">
                                            <Moon size={9} fill="currentColor" /> DORMIDA
                                        </div>
                                    )}
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
