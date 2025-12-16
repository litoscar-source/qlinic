
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
import { Ticket, TicketStatus, Technician, ServiceDefinition, VehicleType, DayStatus } from '../types';
import { MapPin, Clock, GripHorizontal, Car, Truck, AlertTriangle, Moon, Plus, ArrowLeft, Users } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentDate: Date;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
  onTicketMove?: (ticketId: string, newDate: Date, newTechId: string) => void;
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

  // Context Menu State
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
             onTicketMove(ticket.id, newDate, ticket.technicianIds[0]);
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
        return <Truck size={12} />;
      default: 
        return <Car size={12} />;
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Serviço';
  };

  const getCardStyle = (ticket: Ticket) => {
    const service = services.find(s => s.id === ticket.serviceId);
    const serviceName = service?.name.toLowerCase() || '';

    let bgClass = 'bg-white';
    if (serviceName.includes('instalação')) bgClass = 'bg-blue-50';
    else if (serviceName.includes('calibração')) bgClass = 'bg-green-50';
    else if (serviceName.includes('acompanhamento') || serviceName.includes('verificação')) bgClass = 'bg-purple-50';
    else if (serviceName.includes('construção')) bgClass = 'bg-gray-100';
    else if (serviceName.includes('assistência')) bgClass = 'bg-white';
    
    let borderClass = 'border-l-4';
    switch (ticket.status) {
      case TicketStatus.RESOLVIDO: borderClass += ' border-green-600'; break;
      case TicketStatus.CONFIRMADO: borderClass += ' border-black'; break;
      case TicketStatus.PRE_AGENDADO: borderClass += ' border-gray-400 border-dashed'; break;
      case TicketStatus.NAO_REALIZADO: borderClass += ' border-red-500'; break;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: borderClass += ' border-orange-500'; break;
      default: borderClass += ' border-gray-300';
    }

    return `${bgClass} ${borderClass} border-y border-r border-gray-200`;
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('ticketId', ticketId);
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
    if (ticketId && onTicketMove) {
        onTicketMove(ticketId, date, techId);
    }
  };

  const handleCellClick = (e: React.MouseEvent, date: Date) => {
    if (e.target === e.currentTarget) {
         onSelectDate(date);
    }
  };

  // Fixed column width for technicians, flexible for days
  const gridTemplateColumns = `220px repeat(7, minmax(160px, 1fr))`;

  return (
    <>
    <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden select-none">
      <div className="overflow-auto h-full relative custom-scrollbar">
        <div style={{ minWidth: '1340px' }}> {/* Force width to prevent squashing on small screens */}
            
            {/* Header: Days of Week */}
            <div 
                className="grid border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm"
                style={{ gridTemplateColumns }}
            >
                {/* Top Left Corner */}
                <div className="p-3 font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center justify-center border-r border-gray-200 bg-white z-30 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2">
                         <Users size={16} />
                         Equipa
                    </div>
                </div>

                {/* Days Columns */}
                {daysInWeek.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isWknd = isWeekend(day);
                    const isCurrent = isToday(day);

                    return (
                        <div 
                            key={day.toISOString()}
                            onClick={() => onSelectDate(day)}
                            className={`
                                p-2 border-r border-gray-200 last:border-r-0 flex flex-col items-center justify-center cursor-pointer transition-colors
                                ${isWknd ? 'bg-gray-100/50' : 'bg-gray-50'}
                                ${isSelected ? 'bg-blue-50/80 ring-inset ring-2 ring-blue-500' : 'hover:bg-gray-100'}
                                ${isCurrent ? 'bg-blue-50' : ''}
                            `}
                        >
                            <span className="text-[10px] font-bold uppercase text-gray-500">
                                {format(day, 'EEE', { locale: pt })}
                            </span>
                            <div className={`text-xl font-bold leading-none my-1 ${isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                                {format(day, 'dd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Body: Technicians Rows */}
            <div className="divide-y divide-gray-200">
                {technicians.map(tech => (
                    <div 
                        key={tech.id} 
                        className="grid group/row hover:bg-gray-50/30 transition-colors"
                        style={{ gridTemplateColumns }}
                    >
                        {/* Technician Name (Sticky Left) */}
                        <div className="sticky left-0 z-10 bg-white p-3 border-r border-gray-200 flex items-center gap-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover/row:bg-gray-50/50 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${tech.avatarColor} shrink-0`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-700 text-sm truncate">{tech.name}</span>
                        </div>

                        {/* Days Cells */}
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
                            
                            const isWknd = isWeekend(day);
                            const isSelected = isSameDay(day, selectedDate);

                            return (
                                <div
                                    key={`${day.toISOString()}-${tech.id}`}
                                    className={`
                                        p-1.5 border-r border-gray-200 last:border-r-0 min-h-[140px] flex flex-col
                                        ${isWknd ? 'bg-gray-100/30' : ''}
                                        ${isSelected ? 'bg-blue-50/20' : ''}
                                    `}
                                    onClick={(e) => handleCellClick(e, day)}
                                    onContextMenu={(e) => handleCellContextMenu(e, day, tech.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropOnCell(e, day, tech.id)}
                                >
                                    <div className="flex-1 space-y-2">
                                        {dayTechTickets.map(ticket => {
                                            const isResolved = ticket.status === TicketStatus.RESOLVIDO;
                                            const hasFault = !!ticket.faultDescription;
                                            const textColorClass = isResolved ? 'text-green-800' : 'text-gray-800';
                                            
                                            return (
                                                <div 
                                                    key={ticket.id}
                                                    draggable={!isReadOnly}
                                                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                                                    onDrop={(e) => handleDropOnTicket(e, ticket.id)}
                                                    onDragOver={handleDragOver}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditTicket(ticket);
                                                    }}
                                                    onContextMenu={(e) => handleTicketContextMenu(e, ticket.id)}
                                                    className={`
                                                        rounded p-1.5 shadow-sm transition-all text-xs relative overflow-hidden group 
                                                        ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] hover:z-10 hover:shadow-md'}
                                                        ${getCardStyle(ticket)}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <div className={`font-bold ${textColorClass} flex items-center gap-1`}>
                                                            <Clock size={10} />
                                                            {ticket.scheduledTime}
                                                        </div>
                                                        <span className="font-mono text-[10px] text-gray-500">{ticket.ticketNumber}</span>
                                                    </div>

                                                    <div className="flex justify-between items-start">
                                                        <p className={`font-bold leading-tight truncate ${textColorClass}`} title={ticket.customerName}>
                                                            {ticket.customerName}
                                                        </p>
                                                        {hasFault && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                                                    </div>

                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                                        <MapPin size={10} />
                                                        <span className="truncate">{ticket.locality || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/5">
                                                         <span className="font-medium text-[10px] text-gray-600 truncate max-w-[70px]">
                                                            {getServiceName(ticket.serviceId)}
                                                         </span>
                                                         {ticket.vehicleType && getVehicleIcon(ticket.vehicleType)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Overnight Indicator */}
                                    {isOvernight && (
                                        <div className="mt-auto pt-2">
                                            <div className="bg-indigo-600 text-white text-[9px] font-bold py-0.5 px-1.5 rounded flex items-center justify-center gap-1 shadow-sm">
                                                <Moon size={8} />
                                                NOITE
                                            </div>
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

    {/* Context Menu */}
    {contextMenu && (
        <div 
            ref={contextMenuRef}
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 w-56 text-sm ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            {contextMenu.type === 'ticket' ? (
                <>
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                        Ações Rápidas
                    </div>
                    <button
                        onClick={handleMoveBack3Days}
                        className="w-full text-left px-4 py-2.5 hover:bg-orange-50 hover:text-orange-700 transition-colors text-gray-700 font-medium flex items-center gap-2 border-b border-gray-100"
                    >
                        <ArrowLeft size={16} /> Recuar 3 Dias
                    </button>
                    
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100 mt-1">
                        Alterar Estado
                    </div>
                    {Object.values(TicketStatus).map(status => (
                        <button
                            key={status}
                            onClick={() => handleChangeStatus(status)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition-colors text-gray-700 font-medium border-b border-gray-50 last:border-b-0"
                        >
                            {status}
                        </button>
                    ))}
                </>
            ) : (
                <>
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                        Ações do Dia
                    </div>
                    <button
                        onClick={() => handleCellAction('new')}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition-colors text-gray-700 font-medium flex items-center gap-2"
                    >
                        <Plus size={16} /> Novo Serviço
                    </button>
                    <button
                        onClick={() => handleCellAction('overnight')}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-gray-700 font-medium flex items-center gap-2 border-t border-gray-100"
                    >
                        <Moon size={16} /> Alternar Noite Fora
                    </button>
                </>
            )}
        </div>
    )}
    </>
  );
};
