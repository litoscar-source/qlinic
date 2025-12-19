
import React, { useState } from 'react';
import { Ticket, TicketStatus, Technician, ServiceDefinition } from '../types';
import { Clock, MapPin, Navigation, CheckCircle2, AlertCircle, Phone, FileText, ChevronRight, Calendar, User, Search } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MobileTechnicianViewProps {
  tickets: Ticket[];
  technicianId: string;
  services: ServiceDefinition[];
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  onViewDetails: (ticket: Ticket) => void;
}

export const MobileTechnicianView: React.FC<MobileTechnicianViewProps> = ({
  tickets,
  technicianId,
  services,
  onUpdateStatus,
  onViewDetails
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const techTickets = tickets
    .filter(t => t.technicianIds.includes(technicianId) && isSameDay(t.date, selectedDate))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: return 'bg-emerald-500';
      case TicketStatus.CONFIRMADO: return 'bg-slate-900';
      case TicketStatus.PARCIALMENTE_RESOLVIDO: return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      {/* Mini Calendar Header */}
      <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Minha Agenda</h2>
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-red-100">
                {format(selectedDate, 'd MMMM', { locale: pt })}
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[-2, -1, 0, 1, 2, 3, 4, 5, 6].map(offset => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const isSelected = isSameDay(date, selectedDate);
                return (
                    <button key={offset} onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center min-w-[50px] p-3 rounded-2xl transition-all border-2 ${isSelected ? 'bg-red-600 border-red-700 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                        <span className="text-[9px] font-bold uppercase opacity-70">{format(date, 'EEE', { locale: pt })}</span>
                        <span className="text-lg font-black">{format(date, 'd')}</span>
                    </button>
                );
            })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {techTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <Calendar size={64} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-[11px]">Sem serviços para hoje</p>
                <p className="text-[10px] mt-1 font-medium italic">Aproveite o tempo de descanso!</p>
            </div>
        ) : (
            techTickets.map(ticket => {
                const service = services.find(s => s.id === ticket.serviceId);
                const isResolved = ticket.status === TicketStatus.RESOLVIDO;
                
                return (
                    <div key={ticket.id} className={`bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all active:scale-[0.98] ${isResolved ? 'opacity-60 grayscale' : ''}`}>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-900 text-white p-2 rounded-xl">
                                        <Clock size={16} />
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{ticket.scheduledTime}</span>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{ticket.customerName}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-slate-500">
                                        <MapPin size={16} className="text-red-500 shrink-0" />
                                        <span className="text-xs font-bold uppercase">{ticket.locality || 'Portugal'}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">{ticket.address}</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Serviço</p>
                                            <p className="text-xs font-bold text-slate-800 uppercase">{service?.name}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">#{ticket.ticketNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-100 flex gap-2 border-t border-slate-200">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.address)}`} 
                                className="flex-1 bg-white border border-slate-300 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-sm active:bg-slate-50">
                                <Navigation size={18} /> GPS
                            </a>
                            <button onClick={() => onViewDetails(ticket)}
                                className="flex-1 bg-red-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100 active:scale-95">
                                <ChevronRight size={18} /> Detalhes
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Mobile Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex justify-around items-center z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 text-red-600">
            <Calendar size={24} />
            <span className="text-[8px] font-black uppercase tracking-widest">Agenda</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300">
            <User size={24} />
            <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300">
            <Search size={24} />
            <span className="text-[8px] font-black uppercase tracking-widest">Historico</span>
        </button>
      </div>
    </div>
  );
};
