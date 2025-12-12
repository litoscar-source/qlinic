
import React, { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  isWeekend
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket, TicketStatus, Technician, ServiceDefinition, VehicleType, DayStatus } from '../types';
import { MapPin, Clock, GripHorizontal, Car, Truck, Bike, AlertTriangle, Moon, Plus } from 'lucide-react';

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
  // Type: 'cell' (empty space) or 'ticket' (existing ticket)
  const [contextMenu, setContextMenu] = useState<{ 
    x: number, 
    y: number, 
    type: 'cell' | 'ticket',
    data: any // TicketId string OR { date: Date, techId: string }
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
    // Ensure we select the date visually when right clicking
    onSelectDate(date);
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', data: { date, techId } });
  };

  const handleChangeStatus = (status: TicketStatus) => {
    if (contextMenu && contextMenu.type === 'ticket') {
        onTicketUpdate(contextMenu.data, { status });
        setContextMenu(null);
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
      case VehicleType.MOTO: return <Bike size={10} />;
      case VehicleType.CAMIAO: return <Truck size={10} />;
      default: return <Car size={10} />;
    }
  };

  const getCardStyle = (status: TicketStatus) => {
    if (status === TicketStatus.RESOLVIDO) {
        return 'bg-green-700 text-white border-green-800 shadow-md';
    }
    
    let borderClass = 'border-l-4';
    let bgClass = 'bg-white';
    
    switch (status) {
      case TicketStatus.CONFIRMADO: borderClass += ' border-blue-500'; break;
      case TicketStatus.PRE_AGENDADO: borderClass += ' border-gray-400 border-dashed'; bgClass = 'bg-gray-50'; break;
      case TicketStatus.CANCELADO: borderClass += ' border-red-500'; bgClass = 'bg-red-50 opacity-75'; break;
      case TicketStatus.NAO_REALIZADO: borderClass += ' border-orange-500'; break;
      case TicketStatus.NAO_RESOLVIDO: borderClass += ' border-red-600'; break;
      case TicketStatus.EM_ANDAMENTO: borderClass += ' border-blue-600'; break;
      default: borderClass += ' border-gray-200';
    }
    return `${bgClass} ${borderClass} border-y border-r border-gray-200 text-gray-800`;
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Serviço';
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>, ticketId: string) => {
    e.stopPropagation();
    if (isReadOnly) return;
    const newDuration = parseFloat(e.target.value);
    if (!isNaN(newDuration) && newDuration > 0) {
        onTicketUpdate(ticketId, { duration: newDuration });
    }
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

  // Dropping on a Ticket triggers Swap
  const handleDropOnTicket = (e: React.DragEvent, targetTicketId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to the cell
    const sourceTicketId = e.dataTransfer.getData('ticketId');
    
    if (sourceTicketId && sourceTicketId !== targetTicketId && onTicketSwap) {
        onTicketSwap(sourceTicketId, targetTicketId);
    }
  };

  // Dropping on the Cell triggers Move
  const handleDropOnCell = (e: React.DragEvent, date: Date, techId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId && onTicketMove) {
        onTicketMove(ticketId, date, techId);
    }
  };

  // Handle clicking on empty space (Left Click just selects date now)
  const handleCellClick = (e: React.MouseEvent, date: Date) => {
    // Only trigger if clicking directly on the cell div, not bubbles
    if (e.target === e.currentTarget) {
         onSelectDate(date);
    }
  };

  const gridTemplateColumns = `120px repeat(${technicians.length}, minmax(240px, 1fr))`;

  return (
    <>
    <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden select-none">
      <div className="overflow-auto h-full relative custom-scrollbar">
        <div style={{ minWidth: `${120 + technicians.length * 240}px` }}>
            {/* Header: Technicians */}
            <div 
                className="grid border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm"
                style={{ gridTemplateColumns }}
            >
                <div className="p-3 font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center justify-center border-r border-gray-200 bg-gray-100 z-30 sticky left-0">
                    Data
                </div>
                {technicians.map(tech => (
                    <div key={tech.id} className="p-2 flex items-center gap-2 border-r border-gray-200 last:border-r-0 bg-gray-50 justify-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${tech.avatarColor}`}>
                            {tech.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-700 text-sm truncate">{tech.name}</span>
                    </div>
                ))}
            </div>

            {/* Rows: Days */}
            <div className="divide-y divide-gray-200">
                {daysInWeek.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isWknd = isWeekend(day);
                    const isCurrent = isToday(day);

                    return (
                        <div 
                            key={day.toISOString()} 
                            className={`grid transition-colors group/row ${isWknd ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                            style={{ gridTemplateColumns }}
                        >
                            {/* Day Column (Sticky Left) */}
                            <div 
                                onClick={() => onSelectDate(day)}
                                className={`
                                    sticky left-0 z-10 p-2 border-r border-gray-300 flex flex-col justify-center items-center cursor-pointer
                                    ${isWknd ? 'bg-gray-200' : 'bg-white group-hover/row:bg-gray-50'}
                                    ${isSelected ? '!bg-blue-100 border-r-blue-300' : ''}
                                `}
                            >
                                <span className="text-[10px] font-bold uppercase text-gray-500">
                                    {format(day, 'EEE', { locale: pt })}
                                </span>
                                <div className={`text-xl font-bold leading-none my-1 ${isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {format(day, 'dd')}
                                </div>
                                <span className="text-[10px] text-gray-400">
                                    {format(day, 'MMM', { locale: pt })}
                                </span>
                            </div>

                            {/* Technician Columns (Cells) */}
                            {technicians.map(tech => {
                                const dayTechTickets = tickets.filter(t => 
                                    isSameDay(t.date, day) && 
                                    t.technicianIds.includes(tech.id)
                                ).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

                                // Check Overnight Status
                                const isOvernight = dayStatuses.some(ds => 
                                    isSameDay(ds.date, day) && 
                                    ds.technicianId === tech.id && 
                                    ds.isOvernight
                                );

                                return (
                                    <div 
                                        key={`${day}-${tech.id}`} 
                                        className={`
                                            p-1.5 border-r border-gray-200 last:border-r-0 relative transition-colors flex flex-col
                                            ${isWknd ? 'min-h-[100px]' : 'min-h-[160px]'} 
                                            ${isSelected ? 'bg-blue-50/30' : ''}
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
                                                
                                                return (
                                                    <div 
                                                        key={ticket.id}
                                                        draggable={!isReadOnly}
                                                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                                                        onDrop={(e) => handleDropOnTicket(e, ticket.id)} // SWAP Target
                                                        onDragOver={handleDragOver}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditTicket(ticket);
                                                        }}
                                                        onContextMenu={(e) => handleTicketContextMenu(e, ticket.id)}
                                                        className={`
                                                            rounded-md p-2 shadow-sm transition-all text-xs relative overflow-hidden group 
                                                            ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] hover:z-10 hover:shadow-md'}
                                                            ${getCardStyle(ticket.status)}
                                                        `}
                                                    >
                                                        {isResolved && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
                                                                <span className="text-2xl font-black uppercase transform -rotate-12 tracking-widest">RESOLVIDO</span>
                                                            </div>
                                                        )}

                                                        {/* Header: Time + Tickets (Ticket & Process) */}
                                                        <div className={`flex justify-between items-center mb-1 pb-1 border-b ${isResolved ? 'border-green-600' : 'border-gray-100'}`}>
                                                            <div className={`flex items-center gap-1 font-bold ${isResolved ? 'text-green-100' : 'text-gray-700'}`}>
                                                                <Clock size={10} />
                                                                {ticket.scheduledTime}
                                                            </div>
                                                            <div className={`font-bold flex items-center gap-1 ${isResolved ? 'text-white' : 'text-blue-700'}`}>
                                                                <span>{ticket.ticketNumber}</span>
                                                                {ticket.processNumber && (
                                                                    <span className={`text-[10px] font-normal opacity-90 ${isResolved ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                        / {ticket.processNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Client Name & Fault Indicator */}
                                                        <div className="flex justify-between items-start">
                                                            <div className={`font-bold text-sm mb-0.5 truncate ${isResolved ? 'text-white' : 'text-gray-900'}`} title={ticket.customerName}>
                                                                {ticket.customerName}
                                                            </div>
                                                            {hasFault && (
                                                                <div title="Avaria Reportada">
                                                                    <AlertTriangle size={12} className="text-red-500 animate-pulse" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Locality */}
                                                        <div className={`flex items-center gap-1 mb-1 font-semibold uppercase ${isResolved ? 'text-green-100' : 'text-gray-500'}`}>
                                                            <MapPin size={10} className="shrink-0" />
                                                            <span className="truncate">{ticket.locality || 'N/A'}</span>
                                                        </div>

                                                        {/* Footer Info: Service & Vehicle */}
                                                        <div className="flex justify-between items-center mt-1.5">
                                                            <div className="flex flex-col gap-0.5 max-w-[70%]">
                                                                <span className={`text-[10px] font-bold truncate ${isResolved ? 'text-green-100' : 'text-gray-600'}`}>
                                                                    {getServiceName(ticket.serviceId)}
                                                                </span>
                                                                <div className={`flex items-center gap-1 text-[10px] font-bold ${isResolved ? 'text-green-200' : 'text-gray-500'}`}>
                                                                    {getVehicleIcon(ticket.vehicleType)}
                                                                    {ticket.vehicleType}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Duration Editor */}
                                                            <div 
                                                                className={`flex items-center gap-0.5 rounded px-1 py-0.5 ${isResolved ? 'bg-green-800/50' : 'bg-gray-100 border border-gray-200'}`} 
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <input 
                                                                    type="number" 
                                                                    min="0.5" 
                                                                    step="0.5"
                                                                    disabled={isReadOnly}
                                                                    value={ticket.duration}
                                                                    onChange={(e) => handleDurationChange(e, ticket.id)}
                                                                    className={`w-6 text-center bg-transparent text-[10px] font-bold outline-none ${isResolved ? 'text-white' : 'text-gray-700'}`}
                                                                />
                                                                <span className={`text-[8px] ${isResolved ? 'text-green-300' : 'text-gray-400'}`}>h</span>
                                                            </div>
                                                        </div>

                                                        {!isResolved && !isReadOnly && (
                                                            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing">
                                                                <GripHorizontal size={12} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Overnight Indicator (Bottom of Cell) */}
                                        {isOvernight && (
                                            <div className="mt-2 bg-indigo-600 text-white text-[10px] font-bold py-1 px-2 rounded-md flex items-center justify-center gap-1 shadow-sm mx-1 mb-1">
                                                <Moon size={10} />
                                                NOITE FORA
                                            </div>
                                        )}
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
