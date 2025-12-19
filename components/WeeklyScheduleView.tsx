
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isWeekend } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition, DayStatus, Visor } from '../types';
import { MapPin, Clock, Moon, Plus, Users, CheckCircle2, FileText, AlertTriangle, CheckCircle, HelpCircle, MoreHorizontal } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentDate: Date;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
  visores?: Visor[];
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
  onTicketMove?: (ticketId: string, newDate: Date, newTechId: string, sourceTechId?: string | null) => void;
  onTicketSwap?: (sourceId: string, targetId: string) => void;
  onEditTicket: (ticket: Ticket) => void;
  onNewTicket?: (date: Date, techId: string) => void;
  onToggleOvernight?: (date: Date, techId: string) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  isReadOnly?: boolean;
  isCompact?: boolean;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  currentDate,
  tickets,
  dayStatuses,
  technicians,
  services,
  visores = [],
  onTicketUpdate,
  onTicketMove,
  onTicketSwap,
  onEditTicket,
  onNewTicket,
  onToggleOvernight,
  onSelectDate,
  selectedDate,
  isReadOnly = false,
  isCompact = false
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const [activeMenu, setActiveMenu] = useState<{ 
    x: number, 
    y: number, 
    type: 'cell' | 'status', 
    data: any 
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleCellContextMenu = (e: React.MouseEvent, date: Date, techId: string) => {
    e.preventDefault();
    if (isReadOnly) return;
    onSelectDate(date);
    setActiveMenu({ x: e.clientX, y: e.clientY, type: 'cell', data: { date, techId } });
  };

  const handleStatusQuickChange = (e: React.MouseEvent, ticket: Ticket) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) return;
    setActiveMenu({ x: e.clientX, y: e.clientY, type: 'status', data: ticket });
  };

  const getCardStyle = (ticket: Ticket, service: ServiceDefinition | undefined) => {
    let baseStyle = `${service?.colorClass || 'bg-slate-50'} border shadow-sm transition-all duration-200 `;
    let statusBorder = 'border-l-[4px]';
    baseStyle += ' border-slate-400/50';

    switch (ticket.status) {
      case TicketStatus.RESOLVIDO: statusBorder += ' border-l-emerald-600'; break;
      case TicketStatus.CONFIRMADO: statusBorder += ' border-l-slate-900'; break;
      case TicketStatus.NAO_CONFIRMADO: statusBorder += ' border-l-rose-500 border-dashed'; break;
      case TicketStatus.NAO_REALIZADO: statusBorder += ' border-l-red-800'; break;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: statusBorder += ' border-l-orange-500'; break;
      default: statusBorder += ' border-l-blue-600';
    }
    return `${baseStyle} ${statusBorder}`;
  };

  const getTextColor = (status: TicketStatus) => {
    if (status === TicketStatus.NAO_CONFIRMADO) return 'text-rose-800';
    if (status === TicketStatus.RESOLVIDO) return 'text-emerald-900';
    return 'text-slate-900';
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceTechId: string) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceTechId', sourceTechId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const gridTemplateColumns = `160px repeat(7, minmax(130px, 1fr))`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-300 flex flex-col h-full overflow-hidden select-none relative font-sans text-slate-900 antialiased">
      <div className="overflow-auto h-full relative custom-scrollbar">
        <div style={{ minWidth: '1050px' }}>
            <div className="grid border-b border-slate-300 bg-slate-50 sticky top-0 z-20" style={{ gridTemplateColumns }}>
                <div className="p-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center border-r border-slate-300 bg-white z-30 sticky left-0 shadow-sm">
                    <Users size={12} className="mr-1.5 text-red-600" /> EQUIPA
                </div>
                {daysInWeek.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isWknd = isWeekend(day);
                    const isCurrent = isToday(day);
                    return (
                        <div 
                          key={day.toISOString()} 
                          onClick={() => onSelectDate(day)} 
                          className={`py-1 border-r border-slate-300 last:border-r-0 flex flex-col items-center justify-center cursor-pointer transition-colors 
                            ${isWknd ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500'} 
                            ${isSelected && !isWknd ? 'bg-blue-50 ring-inset ring-1 ring-blue-400' : ''} 
                            ${isCurrent ? 'bg-red-100 !text-red-700' : ''}`}
                        >
                            <span className={`text-[9px] uppercase font-bold tracking-tight ${isWknd ? 'text-slate-400' : 'text-slate-400'}`}>
                              {format(day, 'EEE', { locale: pt })}
                            </span>
                            <div className={`text-sm leading-none font-bold ${isCurrent ? 'text-red-700' : (isWknd ? 'text-white' : 'text-slate-900')}`}>
                              {format(day, 'dd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="divide-y divide-slate-200">
                {technicians.map(tech => (
                    <div key={tech.id} className="grid group/row" style={{ gridTemplateColumns }}>
                        <div className={`sticky left-0 z-10 bg-white border-r border-slate-300 flex items-center gap-2 shadow-sm group-hover/row:bg-slate-50 transition-all ${isCompact ? 'p-1 h-[42px]' : 'p-2 h-[150px]'}`}>
                            <div className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md ${tech.avatarColor} ${isCompact ? 'w-5 h-5 text-[8px]' : 'w-9 h-9 text-[11px]'}`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`text-slate-900 truncate uppercase tracking-tight font-bold ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>{tech.name}</span>
                        </div>

                        {daysInWeek.map(day => {
                            const dayTechTickets = tickets.filter(t => isSameDay(t.date, day) && t.technicianIds.includes(tech.id)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));
                            const isOvernight = dayStatuses.some(ds => isSameDay(ds.date, day) && ds.technicianId === tech.id && ds.isOvernight);
                            const isSelected = isSameDay(day, selectedDate);
                            const isWknd = isWeekend(day);

                            return (
                                <div key={`${day.toISOString()}-${tech.id}`}
                                    className={`border-r border-slate-200 last:border-r-0 flex flex-col gap-1 relative overflow-hidden transition-colors 
                                      ${isCompact ? 'p-0.5 pb-4' : 'p-1.5 pb-8'} 
                                      ${isWknd ? 'bg-slate-200/40' : ''} 
                                      ${isSelected ? 'bg-blue-50/40 shadow-inner' : ''}`}
                                    onClick={() => onSelectDate(day)}
                                    onContextMenu={(e) => handleCellContextMenu(e, day, tech.id)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (e.currentTarget instanceof HTMLElement) {
                                          e.currentTarget.classList.add('bg-blue-100/50');
                                        }
                                    }}
                                    onDragLeave={(e) => {
                                        if (e.currentTarget instanceof HTMLElement) {
                                          e.currentTarget.classList.remove('bg-blue-100/50');
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.currentTarget instanceof HTMLElement) {
                                          e.currentTarget.classList.remove('bg-blue-100/50');
                                        }
                                        const ticketId = e.dataTransfer.getData('ticketId');
                                        const sourceTechId = e.dataTransfer.getData('sourceTechId');
                                        if (ticketId && onTicketMove) {
                                          onTicketMove(ticketId, day, tech.id, sourceTechId);
                                        }
                                    }}>
                                    
                                    {isOvernight && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-bold py-1.5 px-1 flex items-center justify-center gap-1.5 z-10 uppercase tracking-[0.2em] border-t border-amber-600 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                                            <Moon size={10} fill="currentColor" /> DORMIDA
                                        </div>
                                    )}

                                    <div className={`flex-1 flex gap-1 ${isCompact ? 'flex-row items-center content-center h-full' : 'flex-col mt-1'}`}>
                                        {dayTechTickets.map(ticket => {
                                            const service = services.find(s => s.id === ticket.serviceId);
                                            const textCls = getTextColor(ticket.status);
                                            
                                            return (
                                                <div key={`${ticket.id}-${tech.id}`} draggable={!isReadOnly}
                                                    onDragStart={(e) => handleDragStart(e, ticket.id, tech.id)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={(e) => { e.stopPropagation(); onEditTicket(ticket); }}
                                                    onContextMenu={(e) => handleStatusQuickChange(e, ticket)}
                                                    className={`rounded shadow-sm relative font-sans ${getCardStyle(ticket, service)} ${isCompact ? 'p-0.5 h-[34px] flex-1 min-w-[100px] border-l-[3px]' : 'p-2 mb-0.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 border-l-[6px]'}`}>
                                                    
                                                    <div className={`flex justify-between items-center ${isCompact ? 'mb-0' : 'mb-0.5'}`}>
                                                        <div className={`flex items-center gap-1 font-bold ${isCompact ? 'text-[8px]' : 'text-[10px]'} ${textCls}`}>
                                                            <Clock size={isCompact ? 8 : 10} className="shrink-0" /> {ticket.scheduledTime}
                                                        </div>
                                                        {!isCompact && (
                                                            <MoreHorizontal size={10} className="text-slate-400" />
                                                        )}
                                                    </div>

                                                    <p className={`uppercase tracking-tight truncate font-bold leading-tight ${isCompact ? 'text-[8px] max-w-[80px]' : 'text-[11px] mb-1'} ${textCls}`}>
                                                        {ticket.customerName}
                                                    </p>

                                                    {!isCompact && (
                                                      <div className="flex flex-col gap-0.5 bg-white/50 rounded px-1.5 py-1 border border-black/10">
                                                          <div className="flex items-center gap-1">
                                                              <MapPin size={9} className="text-red-600 shrink-0" />
                                                              <span className="text-slate-900 truncate uppercase font-bold text-[9px]">{ticket.locality || 'SEM LOCALIDADE'}</span>
                                                          </div>
                                                          <div className="flex items-center gap-1">
                                                              <FileText size={9} className="text-slate-600 shrink-0" />
                                                              <span className="text-slate-700 uppercase font-bold truncate text-[9px]">{service?.name}</span>
                                                          </div>
                                                      </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {!isReadOnly && dayTechTickets.length === 0 && !isCompact && (
                                            <div className="flex-1 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <button onClick={() => onNewTicket?.(day, tech.id)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {activeMenu && (
          <div className="fixed bg-white border border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-[100] animate-in fade-in zoom-in duration-100 min-w-[200px]"
            style={{ left: Math.min(activeMenu.x + 4, window.innerWidth - 210), top: Math.min(activeMenu.y + 4, window.innerHeight - 200) }} onClick={(e) => e.stopPropagation()}>
              {activeMenu.type === 'cell' ? (
                  <div className="flex flex-col gap-1">
                      <div className="px-3 py-1.5 text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] border-b border-slate-100 mb-0.5">Agendamento</div>
                      <button onClick={() => { onNewTicket?.(activeMenu.data.date, activeMenu.data.techId); setActiveMenu(null); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest bg-slate-50 hover:bg-red-600 hover:text-white flex items-center gap-2 rounded-lg transition-all border border-slate-200 shadow-sm">
                          <Plus size={14} /> Novo Serviço
                      </button>
                      <button onClick={() => { onToggleOvernight?.(activeMenu.data.date, activeMenu.data.techId); setActiveMenu(null); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2 rounded-lg transition-all border border-transparent">
                          <Moon size={14} /> Marcar Dormida
                      </button>
                  </div>
              ) : (
                  <div className="flex flex-col gap-1">
                      <div className="px-3 py-1.5 text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] border-b border-slate-100 mb-0.5">Alterar Estado</div>
                      {[
                        { s: TicketStatus.NAO_CONFIRMADO, i: HelpCircle, c: 'text-rose-700 hover:bg-rose-50' },
                        { s: TicketStatus.CONFIRMADO, i: CheckCircle, c: 'text-slate-900 hover:bg-slate-100' },
                        { s: TicketStatus.PARCIALMENTE_RESOLVIDO, i: AlertTriangle, c: 'text-orange-700 hover:bg-orange-50' },
                        { s: TicketStatus.RESOLVIDO, i: CheckCircle2, c: 'text-emerald-700 hover:bg-emerald-50' }
                      ].map(item => (
                          <button key={item.s} onClick={() => { onTicketUpdate(activeMenu.data.id, { status: item.s }); setActiveMenu(null); }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase flex items-center gap-2 rounded-lg transition-all border border-transparent ${item.c}`}>
                              <item.i size={14} /> {item.s}
                          </button>
                      ))}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
