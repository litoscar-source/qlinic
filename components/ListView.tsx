
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, Technician, ServiceDefinition, Vehicle } from '../types';
import { Search, Filter, ArrowUpDown, Clock, MapPin, ChevronRight, CheckCircle2, AlertCircle, HelpCircle, Truck, FileText, Monitor } from 'lucide-react';
import { format } from 'date-fns';

interface ListViewProps {
  tickets: Ticket[];
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  onEditTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tickets, technicians, services, vehicles, onEditTicket, onUpdateTicket
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Adicionamos referências locais a visores via localStorage para exibição se necessário, 
  // mas aqui o ideal é que o App.tsx já as passasse ou que usemos os IDs para procurar nos dados.
  // Como visores não estão nas props, vamos assumir que o nome está disponível ou mostrar apenas se necessário.

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(t => {
        const matchesSearch = 
          t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.locality && t.locality.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (t.address && t.address.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [tickets, searchTerm, statusFilter, sortOrder]);

  const getStatusBadge = (status: TicketStatus) => {
    const baseCls = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ";
    switch (status) {
      case TicketStatus.RESOLVIDO: return <span className={baseCls + "bg-emerald-50 text-emerald-700 border-emerald-200"}><CheckCircle2 size={10} /> {status}</span>;
      case TicketStatus.CONFIRMADO: return <span className={baseCls + "bg-slate-900 text-white border-slate-900"}><CheckCircle2 size={10} /> {status}</span>;
      case TicketStatus.PARCIALMENTE_RESOLVIDO: return <span className={baseCls + "bg-orange-50 text-orange-700 border-orange-200"}><AlertCircle size={10} /> {status}</span>;
      default: return <span className={baseCls + "bg-slate-50 text-slate-500 border-slate-200"}><Clock size={10} /> {status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por cliente, ticket, localidade ou morada..."
            className="w-full pl-12 pr-6 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-100 focus:border-red-600 font-bold text-sm transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="px-5 py-3 border border-slate-200 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest bg-white text-slate-700 shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">TODOS OS ESTADOS</option>
            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm"
          >
            <ArrowUpDown size={14} /> {sortOrder === 'desc' ? 'MAIS RECENTE' : 'MAIS ANTIGO'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data / Hora</th>
              <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Equipa Alocada</th>
              <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente / Ticket</th>
              <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Serviço / Viatura</th>
              <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
              <th className="px-8 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTickets.map(ticket => {
              const techList = technicians.filter(t => ticket.technicianIds.includes(t.id));
              const service = services.find(s => s.id === ticket.serviceId);
              const vehicle = vehicles.find(v => v.id === ticket.vehicleId);
              
              // Se tiver visorId, sinalizar (o nome teria que vir de uma lista de visores)
              const hasVisor = !!ticket.visorId;

              return (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer" onClick={() => onEditTicket(ticket)}>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">{format(new Date(ticket.date), 'dd/MM/yyyy')}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                        <Clock size={10} /> {ticket.scheduledTime}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex -space-x-2">
                      {techList.map(t => (
                        <div key={t.id} className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm ${t.avatarColor}`} title={t.name}>
                          {t.name.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col max-w-[250px]">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{ticket.customerName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">#{ticket.ticketNumber}</span>
                        {ticket.locality && (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter truncate">
                            <MapPin size={10} /> {ticket.locality}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{service?.name || 'OUTRO'}</span>
                        {hasVisor && (
                           <div className="bg-amber-100 text-amber-600 p-1 rounded-md" title="Requer Visor">
                             <Monitor size={10} />
                           </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Truck size={10} className="text-slate-300" /> {vehicle?.name || 'PENDENTE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="p-2 text-slate-300 group-hover:text-red-600 group-hover:bg-red-50 rounded-xl transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-32 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-300">
                    <FileText size={48} className="opacity-20" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">Nenhum serviço encontrado</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
        <span>Listagem de {filteredTickets.length} serviços agendados</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-slate-600">Resolvido</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-900" /> <span className="text-slate-600">Confirmado</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> <span className="text-slate-600">Parcial</span></div>
        </div>
      </div>
    </div>
  );
};
