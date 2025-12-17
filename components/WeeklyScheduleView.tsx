import React, { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  isWeekend,
  subDays
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition, VehicleType, DayStatus, Visor } from '../types';
import { MapPin, Clock, Truck, Car, AlertTriangle, Moon, Plus, ArrowLeft, Users, CheckCircle2, Monitor } from 'lucide-react';

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
  isReadOnly = false
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const [contextMenu, setContextMenu] = useState<{ 
    x: number, 
    y: number, 
    type: 'cell' | 'ticket',
    data: any 
  } | null>(null);
  
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleTicketContextMenu = (e: React.MouseEvent, ticketId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) return;
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'ticket', data: ticketId });
  };

  const handleCellContextMenu = (e: React.MouseEvent, date: Date, techId: string) => {
    e.preventDefault();
    if (isReadOnly) return;
    onSelectDate(date);
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', data: { date, techId } });
  };

  const handleChangeStatus = (status: TicketStatus) => {
    if (contextMenu && contextMenu.type === 'ticket') {
        onTicketUpdate(contextMenu.data, { status });
        setContextMenu(null);
    }
  };

  const handleMoveBack3Days = () => {
     if (contextMenu && contextMenu.type === 'ticket' && onTicketMove) {
         const ticket = tickets.find(t => t.id === contextMenu.data);
         if (ticket) {
             const newDate = subDays(ticket.date, 3);
             onTicketMove(ticket.id, newDate, ticket.technicianIds[0], ticket.technicianIds[0]);
             setContextMenu(null);
         }
     }
  };

  const handleCellAction = (action: 'new' | 'overnight') => {
      if (contextMenu && contextMenu.type === 'cell') {
          const { date, techId } = contextMenu.data;
          if (action === 'new' && onNewTicket) {
              onNewTicket(date, techId);
          } else if (action === 'overnight' && onToggleOvernight) {
              onToggleOvernight(date, techId);
          }
          setContextMenu(null);
      }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case VehicleType.CAMIAO_PEQUENO:
      case VehicleType.CAMIAO_GRANDE:
      case VehicleType.IVECO:
        return <Truck size={10} />;
      default: 
        return <Car size={10} />;
    }
  };

  const getCardStyle = (ticket: Ticket, service: ServiceDefinition | undefined) => {
    let style = `${service?.colorClass || 'bg-white'} border border-gray-300 shadow-md `;
    
    let statusBorder = 'border-l-[8px]';
    switch (ticket.status) {
      case TicketStatus.RESOLVIDO: statusBorder += ' border-l-green-600'; break;
      case TicketStatus.CONFIRMADO: statusBorder += ' border-l-gray-900'; break;
      case TicketStatus.NAO_CONFIRMADO: statusBorder += ' border-l-red-500 border-dashed'; break;
      case TicketStatus.NAO_REALIZADO: statusBorder += ' border-l-red-800'; break;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: statusBorder += ' border-l-orange-500'; break;
      default: statusBorder += ' border-l-blue-600';
    }
    
    return `${style} ${statusBorder}`;
  };

  const getTextColor = (status: TicketStatus) => {
    if (status === TicketStatus.NAO_CONFIRMADO) return 'text-red-700';
    if (status === TicketStatus.CONFIRMADO) return 'text-black';
    if (status === TicketStatus.RESOLVIDO) return 'text-green-800';
    return 'text-gray-900';
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceTechId: string) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceTechId', sourceTechId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTicket = (e: React.DragEvent, targetTicketId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const sourceTicketId = e.dataTransfer.getData('ticketId');
    if (sourceTicketId && sourceTicketId !== targetTicketId && onTicketSwap) {
        onTicketSwap(sourceTicketId, targetTicketId);
    }
  };

  const handleDropOnCell = (e: React.DragEvent, date: Date, techId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    const sourceTechId = e.dataTransfer.getData('sourceTechId');
    if (ticketId && onTicketMove) {
        onTicketMove(ticketId, date, techId, sourceTechId);
    }
  };

  const gridTemplateColumns = `180px repeat(7, minmax(150px, 1fr))`;

  return (
    <>
    <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden select-none">
      <div className="overflow-auto h-full relative custom-scrollbar">
        <div style={{ minWidth: '1240px' }}>
            <div 
                className="grid border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm"
                style={{ gridTemplateColumns }}
            >
                <div className="p-3 text-gray-500 text-[10px] uppercase tracking-widest flex items-center justify-center border-r border-gray-200 bg-white z-30 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] font-normal">
                    <div className="flex items-center gap-2">
                         <Users size={14} /> EQUIPA
                    </div>
                </div>

                {daysInWeek.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isWknd = isWeekend(day);
                    const isCurrent = isToday(day);

                    return (
                        <div 
                            key={day.toISOString()}
                            onClick={() => onSelectDate(day)}
                            className={`
                                p-2 border-r border-gray-200 last:border-r-0 flex flex-col items-center justify-center cursor-pointer transition-colors font-normal
                                ${isWknd ? 'bg-gray-100/50' : 'bg-gray-50'}
                                ${isSelected ? 'bg-blue-50 ring-inset ring-2 ring-blue-500' : 'hover:bg-gray-100'}
                                ${isCurrent ? 'bg-red-50' : ''}
                            `}
                        >
                            <span className="text-[10px] uppercase text-gray-400 font-normal">
                                {format(day, 'EEE', { locale: pt })}
                            </span>
                            <div className={`text-xl leading-none my-0.5 font-normal ${isCurrent ? 'text-red-700' : 'text-gray-800'}`}>
                                {format(day, 'dd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="divide-y divide-gray-200">
                {technicians.map(tech => (
                    <div 
                        key={tech.id} 
                        className="grid group/row hover:bg-gray-50/20 transition-colors"
                        style={{ gridTemplateColumns }}
                    >
                        <div className="sticky left-0 z-10 bg-white p-3 border-r border-gray-200 flex items-center gap-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover/row:bg-gray-50/50 transition-colors font-normal">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg ${tech.avatarColor} shrink-0 font-normal`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-gray-800 text-xs truncate uppercase tracking-tighter font-normal">{tech.name}</span>
                        </div>

                        {daysInWeek.map(day => {
                             const dayTechTickets = tickets.filter(t => 
                                isSameDay(t.date, day) && 
                                t.technicianIds.includes(tech.id)
                            ).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

                            const isOvernight = dayStatuses.some(ds => 
                                isSameDay(ds.date, day) && 
                                ds.technicianId === tech.id && 
                                ds.isOvernight
                            );
                            
                            const isSelected = isSameDay(day, selectedDate);

                            return (
                                <div
                                    key={`${day.toISOString()}-${tech.id}`}
                                    className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[190px] flex flex-col gap-2 ${isSelected ? 'bg-blue-50/10' : ''}`}
                                    onClick={() => onSelectDate(day)}
                                    onContextMenu={(e) => handleCellContextMenu(e, day, tech.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropOnCell(e, day, tech.id)}
                                >
                                    <div className="flex-1 space-y-2">
                                        {dayTechTickets.map(ticket => {
                                            const service = services.find(s => s.id === ticket.serviceId);
                                            const hasFault = !!ticket.faultDescription;
                                            const textCls = getTextColor(ticket.status);
                                            const isRecon = service?.name.toLowerCase().includes('reconstrução');
                                            const visorName = isRecon && ticket.visorId ? visores.find(v => v.id === ticket.visorId)?.name : null;
                                            
                                            return (
                                                <div 
                                                    key={`${ticket.id}-${tech.id}`}
                                                    draggable={!isReadOnly}
                                                    onDragStart={(e) => handleDragStart(e, ticket.id, tech.id)}
                                                    onDrop={(e) => handleDropOnTicket(e, ticket.id)}
                                                    onDragOver={handleDragOver}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditTicket(ticket);
                                                    }}
                                                    onContextMenu={(e) => handleTicketContextMenu(e, ticket.id)}
                                                    className={`
                                                        rounded-lg p-3 transition-all relative group font-normal
                                                        ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'}
                                                        ${getCardStyle(ticket, service)}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className={`flex items-center gap-1.5 text-[12px] font-normal ${textCls}`}>
                                                            <Clock size={11} className="shrink-0" />
                                                            {ticket.scheduledTime}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0 bg-white/40 px-1 rounded">
                                                            {ticket.status === TicketStatus.CONFIRMADO && <CheckCircle2 size={12} className="text-black" />}
                                                            <span className="text-[9px] text-gray-700 font-normal">#{ticket.ticketNumber}</span>
                                                        </div>
                                                    </div>

                                                    <p className={`leading-tight text-sm mb-2 uppercase tracking-tight truncate text-center font-normal ${textCls}`} title={ticket.customerName}>
                                                        {ticket.customerName}
                                                    </p>

                                                    <div className="flex items-center gap-1.5 mb-2 bg-white/20 p-1 rounded justify-center">
                                                        <MapPin size={10} className="shrink-0 text-red-600" />
                                                        <span className="text-[10px] text-gray-800 truncate uppercase tracking-tight font-normal">{ticket.locality || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-black/10">
                                                         <div className="flex flex-col">
                                                            <span className="text-[9px] uppercase text-gray-700 tracking-wider font-normal">
                                                                {service?.name || 'Serviço'}
                                                            </span>
                                                         </div>
                                                    </div>
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
    </>
  );
};