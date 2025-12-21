
import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isWeekend } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition, DayStatus, Visor } from '../types';
import { MapPin, Clock, Moon, Plus, Users, MoreHorizontal, MousePointer2 } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentDate: Date;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
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
  currentDate,
  tickets,
  dayStatuses,
  technicians,
  services,
  onTicketUpdate,
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

  const gridTemplateColumns = `160px repeat(5, minmax(130px, 1fr)) repeat(2, 70px)`;

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
                        <div className={`sticky left-0 z-30 bg-white border-r border-slate-300 flex items-center gap-2 shadow-sm group-hover/row:bg-slate-50 transition-all ${isCompact ? 'p-1 h-[42px]' : 'p-2 h-[150px]'}`}>
                            <div className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md ${tech.avatarColor} ${isCompact ? 'w-5 h-5 text-[8px]' : 'w-9 h-9 text-[11px]'}`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`text-slate-900 truncate uppercase tracking-tight font-bold ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>{tech.name}</span>
                        </div>

                        {daysInWeek.map(day => {
                            const dayTechTickets = tickets.filter(t => isSameDay(t.date, day) && t.technicianIds.includes(tech.id)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));
                            const isOvernight = dayStatuses.some(ds => isSameDay(ds.date, day) && ds.technicianId === tech.id && ds.isOvernight);

                            return (
                                <div key={`${day.toISOString()}-${tech.id}`}
                                    className={`group/cell border-r border-slate-200 last:border-r-0 flex flex-col gap-1 relative overflow-hidden transition-colors 
                                    ${isCompact ? 'p-0.5 pb-4' : 'p-1.5 pb-8'} 
                                    ${isWeekend(day) ? 'bg-slate-200/40' : (isOvernight ? 'bg-amber-50/40' : 'hover:bg-slate-50/80')}`}
                                    onContextMenu={(e) => handleContextMenu(e, day, tech.id)}
                                    onClick={() => onSelectDate(day)}>
                                    
                                    {/* Botões rápidos no hover da célula */}
                                    {!isReadOnly && (
                                        <div className="absolute top-1 right-1 flex gap-1 z-30 opacity-0 group-hover/cell:opacity-100 transition-all pointer-events-auto">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggleOvernight?.(day, tech.id); }}
                                                className={`p-1 rounded shadow-md border transition-all ${isOvernight ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 hover:text-amber-500 border-slate-200 hover:bg-amber-50'}`}
                                                title="Marcar Dormida"
                                            >
                                                <Moon size={isCompact ? 10 : 12} fill={isOvernight ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onNewTicket?.(day, tech.id); }}
                                                className="p-1 rounded bg-red-600 text-white shadow-md border border-red-700 hover:bg-red-700 transition-all active:scale-90"
                                                title="Nova Intervenção"
                                            >
                                                <Plus size={isCompact ? 10 : 12} />
                                            </button>
                                        </div>
                                    )}

                                    {isOvernight && (
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); onToggleOvernight?.(day, tech.id); }}
                                            className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-bold py-1.5 flex items-center justify-center gap-1.5 z-20 uppercase tracking-widest cursor-pointer hover:bg-amber-600 transition-colors shadow-lg">
                                            <Moon size={10} fill="currentColor" /> DORMIDA
                                        </div>
                                    )}

                                    <div className={`flex-1 flex gap-1 ${isCompact ? 'flex-row items-center h-full' : 'flex-col mt-1'}`}>
                                        {dayTechTickets.map(ticket => {
                                            const service = services.find(s => s.id === ticket.serviceId);
                                            const textCls = getTextColor(ticket, service);
                                            const isDark = service ? isDarkColor(service.colorClass) : false;
                                            
                                            return (
                                                <div key={`${ticket.id}-${tech.id}`} onClick={(e) => { e.stopPropagation(); onEditTicket(ticket); }}
                                                    className={`rounded shadow-md relative font-sans ${getCardStyle(ticket, service)} ${isCompact ? 'p-0.5 h-[34px] flex-1 min-w-[100px] border-l-[4px]' : 'p-2 mb-1 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 border-l-[6px]'}`}>
                                                    
                                                    <div className={`flex justify-between items-center ${isCompact ? 'mb-0' : 'mb-0.5'}`}>
                                                        <div className={`flex items-center gap-1 font-black ${isCompact ? 'text-[8px]' : 'text-[10px]'} ${textCls}`}>
                                                            <Clock size={isCompact ? 8 : 10} /> {ticket.scheduledTime}
                                                        </div>
                                                        {!isCompact && <MoreHorizontal size={10} className={isDark ? 'text-white/50' : 'text-slate-400'} />}
                                                    </div>

                                                    <p className={`uppercase tracking-tight truncate font-black leading-tight ${isCompact ? 'text-[8px] max-w-[80px]' : 'text-[11px] mb-1.5'} ${textCls}`}>
                                                        {ticket.customerName}
                                                    </p>

                                                    {!isCompact && (
                                                      <div className={`flex flex-col gap-0.5 rounded px-1.5 py-1 border ${isDark ? 'bg-white/20 border-white/10' : 'bg-white/50 border-black/5'}`}>
                                                          <div className="flex items-center gap-1">
                                                              <MapPin size={9} className={isDark ? 'text-white' : 'text-red-600'} />
                                                              <span className={`truncate uppercase font-black text-[9px] ${textCls}`}>{ticket.locality || 'PORTUGAL'}</span>
                                                          </div>
                                                      </div>
                                                    )}
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

      {/* Menu de Contexto (Botão Direito) - Fora da hierarquia de transição para evitar bugs de visualização */}
      {contextMenu && (
        <div 
          className="fixed z-[1000] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl p-2 min-w-[220px] animate-in fade-in zoom-in duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opções Avançadas</p>
            <p className="text-[10px] font-bold text-slate-900">{format(contextMenu.day, "EEEE, dd 'de' MMMM", { locale: pt })}</p>
          </div>
          
          <button 
            onClick={() => { onNewTicket?.(contextMenu.day, contextMenu.techId); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl transition-all text-[11px] font-bold uppercase tracking-tight group"
          >
            <div className="bg-red-100 p-1.5 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Plus size={14} />
            </div>
            Adicionar Novo Serviço
          </button>
          
          <button 
            onClick={() => { onToggleOvernight?.(contextMenu.day, contextMenu.techId); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-slate-700 hover:text-amber-600 rounded-xl transition-all text-[11px] font-bold uppercase tracking-tight group"
          >
            <div className="bg-amber-100 p-1.5 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Moon size={14} />
            </div>
            Alternar Dormida
          </button>

          <div className="my-2 border-t border-slate-100" />
          
          <button 
            onClick={() => setContextMenu(null)}
            className="w-full flex items-center justify-center py-2 text-[9px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.2em] transition-colors"
          >
            Fechar Menu
          </button>
        </div>
      )}
    </div>
  );
};
