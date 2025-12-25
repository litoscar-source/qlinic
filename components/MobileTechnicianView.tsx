
import React, { useState } from 'react';
import { Ticket, TicketStatus, Technician, ServiceDefinition, Vehicle } from '../types';
import { Clock, MapPin, Navigation, CheckCircle2, AlertCircle, FileText, ChevronRight, Calendar, User, Search, CheckCircle, X, ChevronDown, HelpCircle, Phone, Info, MoreVertical, LogOut, Key, Shield, Lock, Truck } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MobileTechnicianViewProps {
  tickets: Ticket[];
  technicianId: string;
  technician: Technician;
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  onViewDetails: (ticket: Ticket) => void;
  onUpdateProfile: (updates: Partial<Technician>) => void;
  onLogout: () => void;
}

type MobileTab = 'agenda' | 'perfil' | 'procurar';

export const MobileTechnicianView: React.FC<MobileTechnicianViewProps> = ({
  tickets,
  technicianId,
  technician,
  services,
  vehicles,
  onUpdateStatus,
  onViewDetails,
  onUpdateProfile,
  onLogout
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTicketDetails, setActiveTicketDetails] = useState<Ticket | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>('agenda');
  const [newPwd, setNewPwd] = useState('');
  
  const techTickets = tickets
    .filter(t => t.technicianIds.includes(technicianId) && isSameDay(t.date, selectedDate))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVIDO: return { color: 'bg-emerald-500', icon: <CheckCircle2 size={16} /> };
      case TicketStatus.CONFIRMADO: return { color: 'bg-slate-900', icon: <CheckCircle size={16} /> };
      case TicketStatus.PARCIALMENTE_RESOLVIDO: return { color: 'bg-orange-500', icon: <AlertCircle size={16} /> };
      case TicketStatus.EM_ANDAMENTO: return { color: 'bg-blue-500', icon: <Clock size={16} /> };
      case TicketStatus.NAO_CONFIRMADO: return { color: 'bg-rose-500', icon: <HelpCircle size={16} /> };
      default: return { color: 'bg-red-500', icon: <X size={16} /> };
    }
  };

  const handleStatusChange = (ticketId: string, status: TicketStatus) => {
    onUpdateStatus(ticketId, status);
    setShowStatusMenu(null);
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPwd.length < 4) {
          alert("A senha deve ter pelo menos 4 caracteres.");
          return;
      }
      onUpdateProfile({ password: newPwd });
      setNewPwd('');
      alert("PIN atualizado com sucesso!");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans overflow-hidden">
      
      {activeTab === 'agenda' && (
        <>
          <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-20 shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Minha Agenda</h2>
                <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-red-100 shadow-sm">
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
                            className={`flex flex-col items-center min-w-[56px] p-3 rounded-2xl transition-all border-2 active:scale-90 ${isSelected ? 'bg-red-600 border-red-700 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                            <span className="text-[9px] font-bold uppercase opacity-70">{format(date, 'EEE', { locale: pt })}</span>
                            <span className="text-lg font-black">{format(date, 'd')}</span>
                        </button>
                    );
                })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
            {techTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                    <div className="bg-white p-6 rounded-full shadow-inner mb-6">
                        <Calendar size={64} className="opacity-20" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-xs text-slate-400">Sem serviços agendados</p>
                    <p className="text-[10px] mt-1 font-bold text-slate-300 italic">Desfrute da folga!</p>
                </div>
            ) : (
                techTickets.map(ticket => {
                    const service = services.find(s => s.id === ticket.serviceId);
                    const vehicle = vehicles.find(v => v.id === ticket.vehicleId);
                    const isResolved = ticket.status === TicketStatus.RESOLVIDO;
                    const statusCfg = getStatusConfig(ticket.status);
                    
                    return (
                        <div key={ticket.id} className={`bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden transition-all active:scale-[0.98] ${isResolved ? 'opacity-70' : ''}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-900 text-white p-2.5 rounded-2xl shadow-lg shadow-slate-100">
                                            <Clock size={18} />
                                        </div>
                                        <span className="text-xl font-black text-slate-900">{ticket.scheduledTime}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === ticket.id ? null : ticket.id); }}
                                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase text-white shadow-md flex items-center gap-2 transition-all ${statusCfg.color}`}
                                    >
                                        {statusCfg.icon}
                                        {ticket.status}
                                        <ChevronDown size={14} />
                                    </button>
                                </div>

                                {showStatusMenu === ticket.id && (
                                  <div className="absolute inset-x-0 top-0 bottom-0 bg-white/95 backdrop-blur-sm z-30 p-4 flex flex-col justify-center gap-2 animate-in fade-in slide-in-from-top-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center mb-2">Alterar Estado do Serviço</p>
                                    {[TicketStatus.EM_ANDAMENTO, TicketStatus.PARCIALMENTE_RESOLVIDO, TicketStatus.RESOLVIDO, TicketStatus.NAO_REALIZADO].map(st => (
                                      <button 
                                        key={st} 
                                        onClick={() => handleStatusChange(ticket.id, st)}
                                        className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${ticket.status === st ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'}`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                    <button onClick={() => setShowStatusMenu(null)} className="mt-4 p-3 text-slate-400 font-bold uppercase text-[10px]">Fechar</button>
                                  </div>
                                )}

                                <div className="space-y-5" onClick={() => setActiveTicketDetails(ticket)}>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{ticket.customerName}</h3>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin size={16} className="text-red-500 shrink-0" />
                                            <span className="text-xs font-black uppercase tracking-tight">{ticket.locality || 'Portugal'}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 font-bold italic truncate">{ticket.address}</p>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-3xl flex items-center justify-between border border-slate-100 shadow-inner">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Procedimento / Viatura</p>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                    {service?.name} 
                                                    <span className="text-slate-400 mx-2">|</span> 
                                                    <span className="text-red-600">{vehicle?.name || '---'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-red-600 bg-white px-3 py-1.5 rounded-xl border border-red-100 shadow-sm">#{ticket.ticketNumber}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.address)}`} 
                                    className="flex-1 bg-white border-2 border-slate-200 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest shadow-sm active:bg-slate-50">
                                    <Navigation size={20} className="text-blue-600" /> GPS
                                </a>
                                <button onClick={() => setActiveTicketDetails(ticket)}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
                                    <Info size={20} /> Detalhes
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </>
      )}

      {activeTab === 'perfil' && (
        <div className="flex-1 overflow-y-auto p-8 bg-white space-y-10 animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col items-center gap-4 mt-6">
                <div className={`w-32 h-32 rounded-[2.5rem] ${technician.avatarColor} flex items-center justify-center text-white text-4xl font-black shadow-2xl border-8 border-slate-50 rotate-3`}>
                    {technician.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{technician.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
                        <Shield size={12} className="text-emerald-500" /> Perfil Técnico Ativo
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Key size={14} className="text-red-600" /> Alterar Palavra-passe (PIN)
                    </h4>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                placeholder="Novo PIN..."
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black outline-none focus:border-red-600 transition-all text-slate-900"
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                            Gravar Nova Senha
                        </button>
                    </form>
                </div>

                <button onClick={onLogout} className="w-full bg-red-50 text-red-600 p-6 rounded-[2.5rem] flex items-center justify-center gap-4 font-black uppercase text-xs tracking-widest border border-red-100 transition-all active:bg-red-100">
                    <LogOut size={24} /> Terminar Sessão
                </button>
            </div>
        </div>
      )}

      {/* Ticket Details Overlay */}
      {activeTicketDetails && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex flex-col animate-in slide-in-from-bottom-full duration-500">
          <div className="bg-white rounded-t-[3rem] mt-20 flex-1 flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div className="bg-red-600 p-3 rounded-2xl text-white shadow-lg shadow-red-200">
                  <FileText size={28} />
               </div>
               <button onClick={() => setActiveTicketDetails(null)} className="p-3 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all">
                  <X size={24} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32 custom-scrollbar">
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Entidade do Cliente</h4>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{activeTicketDetails.customerName}</h2>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket ID</p>
                     <p className="text-xl font-black text-red-600 tracking-tight">#{activeTicketDetails.ticketNumber}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Horário</p>
                     <p className="text-xl font-black text-slate-900 tracking-tight">{activeTicketDetails.scheduledTime}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                     <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <MapPin size={24} />
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Morada de Intervenção</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{activeTicketDetails.address}</p>
                        {activeTicketDetails.locality && <p className="text-sm font-black text-slate-900 uppercase mt-1">{activeTicketDetails.locality}</p>}
                     </div>
                  </div>

                  <div className="flex gap-4 items-start">
                     <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                        <AlertCircle size={24} />
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Técnica</p>
                        <div className="bg-white border-2 border-slate-100 p-5 rounded-3xl shadow-inner italic text-sm text-slate-600 leading-relaxed">
                           {activeTicketDetails.faultDescription || activeTicketDetails.notes || 'Nenhuma descrição técnica disponível.'}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <a href={`tel:${activeTicketDetails.notes?.match(/\d{9}/)?.[0] || ''}`} className="flex-1 bg-emerald-600 text-white p-5 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">
                     <Phone size={24} /> Ligar
                  </a>
                  <button onClick={() => { handleStatusChange(activeTicketDetails.id, TicketStatus.RESOLVIDO); setActiveTicketDetails(null); }} className="flex-1 bg-slate-900 text-white p-5 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all">
                     <CheckCircle2 size={24} /> Finalizar
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* RE-STYLED MOBILE FOOTER - Fixed and Pure White for Visibility */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex justify-around items-center z-[50] shadow-[0_-10px_30px_rgba(0,0,0,0.15)] pb-8 rounded-t-[2.5rem]">
        <button 
            onClick={() => { setActiveTab('agenda'); setSelectedDate(new Date()); }} 
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'agenda' ? 'text-red-600' : 'text-slate-400'}`}
        >
            <div className={`p-2 rounded-2xl ${activeTab === 'agenda' ? 'bg-red-50' : 'bg-transparent'}`}>
                <Calendar size={32} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Agenda</span>
        </button>
        
        <button 
            onClick={() => setActiveTab('procurar')} 
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'procurar' ? 'text-red-600' : 'text-slate-400'}`}
        >
            <div className={`p-2 rounded-2xl ${activeTab === 'procurar' ? 'bg-red-50' : 'bg-transparent'}`}>
                <Search size={32} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Procurar</span>
        </button>

        <button 
            onClick={() => setActiveTab('perfil')} 
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'perfil' ? 'text-red-600' : 'text-slate-400'}`}
        >
            <div className={`p-2 rounded-2xl ${activeTab === 'perfil' ? 'bg-red-50' : 'bg-transparent'}`}>
                <User size={32} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Perfil</span>
        </button>
      </div>
    </div>
  );
};
