
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
import { MapPin, Clock, GripHorizontal, Car, Truck, AlertTriangle, Moon, Plus, ArrowLeft } from 'lucide-react';

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

  // ESTILOS DO CARTÃO
  // Fundo = Baseado no Serviço
  // Borda Esquerda = Baseado no Estado
  const getCardStyle = (ticket: Ticket) => {
    const service = services.find(s => s.id === ticket.serviceId);
    const serviceName = service?.name.toLowerCase() || '';

    // 1. Determinar Background pelo Serviço
    let bgClass = 'bg-white';
    if (serviceName.includes('instalação')) bgClass = 'bg-blue-100';
    else if (serviceName.includes('calibração')) bgClass = 'bg-green-100';
    else if (serviceName.includes('acompanhamento') || serviceName.includes('verificação')) bgClass = 'bg-purple-100';
    else if (serviceName.includes('construção')) bgClass = 'bg-gray-200';
    else if (serviceName.includes('assistência')) bgClass = 'bg-white';
    
    // 2. Determinar Borda pelo Estado
    let borderClass = 'border-l-4';
    switch (ticket.status) {
      case TicketStatus.RESOLVIDO:
        borderClass += ' border-green-600'; 
        break;
      case TicketStatus.CONFIRMADO: 
        borderClass += ' border-black'; 
        break;
      case TicketStatus.PRE_AGENDADO: 
        borderClass += ' border-gray-400 border-dashed'; 
        break;
      case TicketStatus.NAO_REALIZADO: 
        borderClass += ' border-red-500'; 
        break;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: 
        borderClass += ' border-orange-500'; 
        break;
      default: 
        borderClass += ' border-gray-200';
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
                                                
                                                // Cor do texto mais escura para contraste em fundos coloridos
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
                                                            rounded-md p-2 shadow-sm transition-all text-sm relative overflow-hidden group 
                                                            ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] hover:z-10 hover:shadow-md'}
                                                            ${getCardStyle(ticket)}
                                                        `}
                                                    >
                                                        {isResolved && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
                                                                <span className="text-2xl font-black uppercase transform -rotate-12 tracking-widest text-green-900">RESOLVIDO</span>
                                                            </div>
                                                        )}

                                                        {/* Header: Time + Tickets */}
                                                        <div className={`flex justify-between items-center mb-1 pb-1 border-b ${isResolved ? 'border-green-300' : 'border-black/10'}`}>
                                                            <div className={`flex items-center gap-1 font-bold ${textColorClass} text-sm`}>
                                                                <Clock size={12} />
                                                                {ticket.scheduledTime}
                                                            </div>
                                                            <div className={`font-bold flex items-center gap-1 ${isResolved ? 'text-green-800' : 'text-blue-700'} text-xs`}>
                                                                <span>{ticket.ticketNumber}</span>
                                                                {ticket.processNumber && (
                                                                    <span className={`text-[10px] font-normal opacity-90 ${isResolved ? 'text-green-700' : 'text-gray-500'}`}>
                                                                        / {ticket.processNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Client Name */}
                                                        <div className="flex justify-between items-start">
                                                            <div className={`font-bold text-sm leading-tight mb-0.5 truncate ${textColorClass}`} title={ticket.customerName}>
                                                                {ticket.customerName}
                                                            </div>
                                                            {hasFault && (
                                                                <div title="Avaria Reportada">
                                                                    <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Locality */}
                                                        <div className={`flex items-center gap-1 mb-1 font-semibold uppercase text-xs ${isResolved ? 'text-green-700' : 'text-gray-600'}`}>
                                                            <MapPin size={12} className="shrink-0" />
                                                            <span className="truncate">{ticket.locality || 'N/A'}</span>
                                                        </div>

                                                        {/* Footer Info: Service & Vehicle */}
                                                        <div className="flex justify-between items-center mt-1.5">
                                                            <div className="flex flex-col gap-0.5 w-full">
                                                                <span className={`text-xs font-bold truncate ${isResolved ? 'text-green-700' : 'text-gray-500'}`}>
                                                                    {getServiceName(ticket.serviceId)}
                                                                </span>
                                                                <div className="flex justify-between items-center w-full">
                                                                    <div className={`flex items-center gap-1 text-xs font-bold ${isResolved ? 'text-green-700' : 'text-gray-500'}`}>
                                                                        {getVehicleIcon(ticket.vehicleType)}
                                                                        {ticket.vehicleType}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {!isResolved && !isReadOnly && (
                                                            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing">
                                                                <GripHorizontal size={14} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Overnight Indicator */}
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
