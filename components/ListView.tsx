
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, Technician, ServiceDefinition, Vehicle } from '../types';
import { Search, Filter, ArrowUpDown, Clock, MapPin, User, ChevronRight, CheckCircle2, AlertCircle, HelpCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ListViewProps {
  tickets: Ticket[];
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  onEditTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  isReadOnly?: boolean;
}

export const ListView: React.FC<ListViewProps> = ({
  tickets,
  technicians,
  services,
  vehicles,
  onEditTicket,
  onUpdateTicket,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(t => {
        const matchesSearch = 
          t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.locality && t.locality.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [tickets, searchTerm, statusFilter, sortOrder]);

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: return <CheckCircle2 size={16} className="text-emerald-600" />;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: return <AlertCircle size={16} className="text-orange-600" />;
      case TicketStatus.NAO_CONFIRMADO: return <HelpCircle size={16} className="text-rose-600" />;
      default: return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case TicketStatus.CONFIRMADO: return 'bg-slate-800 text-white border-slate-900';
      case TicketStatus.NAO_CONFIRMADO: return 'bg-rose-100 text-rose-900 border-rose-300';
      case TicketStatus.PARCIALMENTE_RESOLVIDO: return 'bg-orange-100 text-orange-900 border-orange-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden font-sans antialiased">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por cliente, ticket ou localidade..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 font-semibold text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select 
              className="px-3 py-2 border border-slate-300 rounded-lg outline-none text-[11px] font-bold uppercase tracking-widest bg-white text-slate-900"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">TODOS OS ESTADOS</option>
              {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors text-[11px] font-bold uppercase tracking-widest text-slate-900 shadow-sm"
          >
            <ArrowUpDown size={14} /> {sortOrder === 'desc' ? 'MAIS RECENTE' : 'MAIS ANTIGO'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Data / Hora</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Técnico</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cliente / Ticket</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Serviço / Viatura</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-3 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredTickets.map(ticket => {
              const tech = technicians.filter(t => ticket.technicianIds.includes(t.id));
              const service = services.find(s => s.id === ticket.serviceId);
              const vehicle = vehicles.find(v => v.id === ticket.vehicleId);
              
              return (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{format(ticket.date, 'dd/MM/yyyy')}</span>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                        <Clock size={10} /> {ticket.scheduledTime}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {tech.map(t => (
                        <div key={t.id} className={`inline-block h-7 w-7 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${t.avatarColor}`} title={t.name}>
                          {t.name.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{ticket.customerName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase tracking-wider">#{ticket.ticketNumber}</span>
                        {ticket.locality && (
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                            <MapPin size={10} /> {ticket.locality}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{service?.name || 'OUTRO'}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Truck size={10} className="text-slate-400" /> {vehicle?.name || 'SEM VIATURA'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${getStatusBadgeClass(ticket.status)} shadow-sm`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onEditTicket(ticket)}
                      className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center text-slate-400 italic font-semibold uppercase tracking-widest">
                  Nenhum serviço encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        <span>Total de {filteredTickets.length} serviços listados</span>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div> <span className="text-emerald-700">Resolvido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></div> <span className="text-rose-700">Pendente</span>
          </div>
        </div>
      </div>
    </div>
  );
};
