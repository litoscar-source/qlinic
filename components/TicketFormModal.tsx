
import React, { useState, useEffect } from 'react';
import { Technician, Ticket, TicketStatus, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Save, MapPin, Clock, Users, Wrench, Trash2, AlertCircle, Monitor, Calendar, FileText, Info, Truck, PackageSearch } from 'lucide-react';
import { format } from 'date-fns';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: Omit<Ticket, 'id'>) => void;
  onDelete?: (ticketId: string) => void;
  onUpdate?: (id: string, updates: Partial<Ticket>) => void;
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  visores: Visor[];
  initialDate: Date;
  selectedTechId: string | null;
  ticketToEdit?: Ticket | null;
  isReadOnly?: boolean;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen, onClose, onSave, onDelete, onUpdate, technicians, services, vehicles, visores, initialDate, selectedTechId, ticketToEdit, isReadOnly = false
}) => {
  const [formData, setFormData] = useState({
    technicianIds: [] as string[],
    ticketNumber: '',
    customerName: '',
    address: '',
    vehicleId: '',
    serviceId: '',
    visorId: '',
    status: TicketStatus.NAO_CONFIRMADO,
    scheduledTime: '09:00',
    date: '',
    duration: 1,
    notes: '',
    locality: '',
    processNumber: '',
    faultDescription: ''
  });

  useEffect(() => {
    if (isOpen) {
        if (ticketToEdit) {
            setFormData({
                technicianIds: ticketToEdit.technicianIds,
                ticketNumber: ticketToEdit.ticketNumber,
                customerName: ticketToEdit.customerName,
                address: ticketToEdit.address,
                vehicleId: ticketToEdit.vehicleId || (vehicles[0]?.id || ''),
                serviceId: ticketToEdit.serviceId,
                visorId: ticketToEdit.visorId || '',
                status: ticketToEdit.status,
                scheduledTime: ticketToEdit.scheduledTime,
                date: format(ticketToEdit.date, 'yyyy-MM-dd'),
                duration: ticketToEdit.duration,
                notes: ticketToEdit.notes || '',
                locality: ticketToEdit.locality || '',
                processNumber: ticketToEdit.processNumber || '',
                faultDescription: ticketToEdit.faultDescription || ''
            });
        } else {
            const defaultService = services[0];
            setFormData({
                technicianIds: selectedTechId ? [selectedTechId] : (technicians[0] ? [technicians[0].id] : []),
                ticketNumber: '',
                customerName: '',
                address: '',
                vehicleId: vehicles[0]?.id || '',
                serviceId: defaultService ? defaultService.id : '',
                visorId: '',
                status: TicketStatus.NAO_CONFIRMADO,
                scheduledTime: '09:00',
                date: format(initialDate, 'yyyy-MM-dd'),
                duration: defaultService ? defaultService.defaultDuration : 1,
                notes: '',
                locality: '',
                processNumber: '',
                faultDescription: ''
            });
        }
    }
  }, [isOpen, selectedTechId, technicians, services, vehicles, ticketToEdit, initialDate]);

  const handleQuickStatus = (status: TicketStatus) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, status }));
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        setFormData(prev => ({ ...prev, serviceId: service.id, duration: service.defaultDuration }));
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);
  const isReconstruction = selectedService?.name.toLowerCase().includes('reconstrução');

  const toggleTechnician = (techId: string) => {
    if (isReadOnly) return;
    setFormData(prev => {
        const cur = prev.technicianIds;
        if (cur.includes(techId)) {
            if (cur.length === 1) return prev;
            return { ...prev, technicianIds: cur.filter(id => id !== techId) };
        } else return { ...prev, technicianIds: [...cur, techId] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    // Validação extra para reconstrução
    if (isReconstruction && !formData.visorId) {
        alert("Por favor, selecione o Visor para este serviço de Reconstrução.");
        return;
    }

    onSave({
        ...formData,
        date: new Date(formData.date + 'T00:00:00'),
        visorId: isReconstruction ? formData.visorId : undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-300">
        <div className="bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center px-8 py-5">
            <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-100">
                    <Wrench className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                        {ticketToEdit ? 'Editar Intervenção' : 'Novo Agendamento'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{ticketToEdit ? `REGISTO #${ticketToEdit.ticketNumber}` : 'CRIAÇÃO DE NOVA ORDEM'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white hover:text-red-600 rounded-full text-slate-400 transition-all border border-transparent hover:border-slate-200"><X size={24} /></button>
          </div>
          
          <div className="flex bg-white px-8 py-4 border-b border-slate-100 gap-3 items-center overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mr-4 flex items-center gap-2">Estado Atual</span>
              {[TicketStatus.NAO_CONFIRMADO, TicketStatus.CONFIRMADO, TicketStatus.PARCIALMENTE_RESOLVIDO, TicketStatus.RESOLVIDO].map(st => (
                  <button key={st} type="button" onClick={() => handleQuickStatus(st)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
                        formData.status === st ? 'bg-red-600 text-white border-red-700 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}>
                      {st}
                  </button>
              ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 border-b border-slate-100 pb-2"><Clock size={14} className="text-red-600" /> Agendamento Temporal</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Data</label>
                            <input type="date" required disabled={isReadOnly} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-transparent font-bold text-slate-900 text-lg outline-none" />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hora de Início</label>
                            <input type="time" required disabled={isReadOnly} value={formData.scheduledTime} onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})} className="w-full bg-transparent font-bold text-slate-900 text-lg outline-none" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 border-b border-slate-100 pb-2"><Users size={14} className="text-blue-600" /> Equipa Técnica</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {technicians.map(t => {
                            const sel = formData.technicianIds.includes(t.id);
                            return (
                                <button key={t.id} type="button" disabled={isReadOnly} onClick={() => toggleTechnician(t.id)} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${sel ? 'border-red-600 bg-red-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md ${sel ? 'bg-red-600' : t.avatarColor}`}>{t.name.substring(0,2).toUpperCase()}</div>
                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${sel ? 'text-red-700' : 'text-slate-600'}`}>{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 border-b border-slate-100 pb-2"><Monitor size={14} className="text-orange-600" /> Serviço e Frota</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Serviço</label>
                            <select disabled={isReadOnly} value={formData.serviceId} onChange={(e) => handleServiceChange(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold bg-white text-sm outline-none text-slate-900">
                                {services.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veículo Alocado</label>
                            <div className="relative">
                                <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select required disabled={isReadOnly} value={formData.vehicleId} onChange={(e) => setFormData({...formData, vehicleId: e.target.value})} className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl font-bold bg-white text-sm outline-none text-slate-900">
                                    <option value="">-- SELECIONE --</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* CAMPO DINÂMICO PARA VISOR QUANDO É RECONSTRUÇÃO */}
                    {isReconstruction && (
                      <div className="bg-orange-50 p-5 rounded-2xl border-2 border-orange-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-1">
                          <PackageSearch size={16} className="text-orange-600" />
                          <label className="block text-[10px] font-black text-orange-700 uppercase tracking-widest">Equipamento (Visor) Obrigatório</label>
                        </div>
                        <select 
                          required 
                          disabled={isReadOnly} 
                          value={formData.visorId} 
                          onChange={(e) => setFormData({...formData, visorId: e.target.value})} 
                          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl font-bold bg-white text-sm outline-none text-slate-900 focus:border-orange-500 shadow-sm"
                        >
                          <option value="">-- SELECIONE MODELO DO VISOR --</option>
                          {visores.map(v => <option key={v.id} value={v.id}>{v.name.toUpperCase()}</option>)}
                        </select>
                        <p className="text-[9px] text-orange-600 font-bold uppercase tracking-tighter italic">Este campo é necessário para o picking logístico.</p>
                      </div>
                    )}
                </div>
            </div>

            <div className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 border-b border-slate-100 pb-2"><FileText size={14} className="text-slate-600" /> Dados Operacionais</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº Ticket ERP</label>
                            <input type="text" required disabled={isReadOnly} value={formData.ticketNumber} onChange={(e) => setFormData({...formData, ticketNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-sm uppercase bg-white text-slate-900" placeholder="TK-0000" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proc. Interno</label>
                            <input type="text" disabled={isReadOnly} value={formData.processNumber} onChange={(e) => setFormData({...formData, processNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-sm bg-white text-slate-900" placeholder="Referência" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-5">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={16} className="text-red-600" /> Localização do Cliente</h4>
                    <div className="space-y-4">
                        <input type="text" required disabled={isReadOnly} value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold uppercase text-slate-900 text-sm bg-white" placeholder="NOME DO CLIENTE" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" required disabled={isReadOnly} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-medium text-slate-700 text-xs bg-white" placeholder="CP7 / Morada" />
                            <input type="text" disabled={isReadOnly} value={formData.locality} onChange={(e) => setFormData({...formData, locality: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold uppercase text-slate-900 text-xs bg-white" placeholder="CIDADE" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-red-600 uppercase tracking-[0.3em] flex items-center gap-2 border-b border-red-100 pb-2"><AlertCircle size={14} /> Detalhes</h3>
                    <textarea disabled={isReadOnly} value={formData.faultDescription} onChange={(e) => setFormData({...formData, faultDescription: e.target.value})} className="w-full px-5 py-4 border border-slate-300 rounded-2xl outline-none h-40 resize-none font-medium text-slate-700 text-sm focus:border-red-400 bg-white shadow-inner" placeholder="Notas técnicas..." />
                </div>
            </div>
          </div>

          <div className="mt-12 pt-8 flex justify-between items-center shrink-0 border-t border-slate-100">
            {ticketToEdit && onDelete && !isReadOnly && (
                <button type="button" onClick={() => { if(window.confirm("Eliminar serviço?")) { onDelete(ticketToEdit.id); onClose(); } }} className="bg-rose-50 text-rose-600 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-100 transition-all flex items-center gap-2">
                    <Trash2 size={16} /> Eliminar
                </button>
            )}
            <div className="flex gap-4 ml-auto">
                <button type="button" onClick={onClose} className="px-8 py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600">Cancelar</button>
                {!isReadOnly && (
                    <button type="submit" className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-2xl shadow-red-200 uppercase tracking-[0.2em] text-[11px] transition-all flex items-center gap-3">
                        <Save size={20} /> Gravar Agendamento
                    </button>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
