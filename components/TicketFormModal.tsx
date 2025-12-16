
import React, { useState, useEffect } from 'react';
import { Technician, Ticket, VehicleType, TicketStatus, ServiceDefinition } from '../types';
import { X, Save, MapPin, Hash, User, Clock, Users, Wrench, Trash2, FileText, AlertCircle } from 'lucide-react';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: Omit<Ticket, 'id'>) => void;
  onDelete?: (ticketId: string) => void;
  technicians: Technician[];
  services: ServiceDefinition[];
  initialDate: Date;
  selectedTechId: string | null;
  ticketToEdit?: Ticket | null;
  isReadOnly?: boolean;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  technicians,
  services,
  initialDate,
  selectedTechId,
  ticketToEdit,
  isReadOnly = false
}) => {
  const [formData, setFormData] = useState({
    technicianIds: [] as string[],
    ticketNumber: '',
    customerName: '',
    address: '',
    vehicleType: VehicleType.CARRINHA,
    serviceId: '',
    status: TicketStatus.PENDENTE,
    scheduledTime: '09:00',
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
                vehicleType: ticketToEdit.vehicleType,
                serviceId: ticketToEdit.serviceId,
                status: ticketToEdit.status,
                scheduledTime: ticketToEdit.scheduledTime,
                duration: ticketToEdit.duration,
                notes: ticketToEdit.notes || '',
                locality: ticketToEdit.locality || '',
                processNumber: ticketToEdit.processNumber || '',
                faultDescription: ticketToEdit.faultDescription || ''
            });
        } else {
            // Default service
            const defaultService = services[0];
            
            setFormData({
                technicianIds: selectedTechId ? [selectedTechId] : (technicians[0] ? [technicians[0].id] : []),
                ticketNumber: '',
                customerName: '',
                address: '',
                vehicleType: VehicleType.CARRINHA,
                serviceId: defaultService ? defaultService.id : '',
                status: TicketStatus.PENDENTE,
                scheduledTime: '09:00',
                duration: defaultService ? defaultService.defaultDuration : 1,
                notes: '',
                locality: '',
                processNumber: '',
                faultDescription: ''
            });
        }
    }
  }, [isOpen, selectedTechId, technicians, services, ticketToEdit]);

  // Update duration automatically when service changes
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        setFormData(prev => ({
            ...prev,
            serviceId: service.id,
            duration: service.defaultDuration
        }));
    }
  };

  const toggleTechnician = (techId: string) => {
    if (isReadOnly) return;
    setFormData(prev => {
        const current = prev.technicianIds;
        if (current.includes(techId)) {
            // Prevent removing the last one
            if (current.length === 1) return prev;
            return { ...prev, technicianIds: current.filter(id => id !== techId) };
        } else {
            return { ...prev, technicianIds: [...current, techId] };
        }
    });
  };

  const handleDelete = () => {
      if (ticketToEdit && onDelete && window.confirm("Tem a certeza que deseja eliminar este serviço?")) {
          onDelete(ticketToEdit.id);
          onClose();
      }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    onSave({
      ...formData,
      date: ticketToEdit ? ticketToEdit.date : initialDate
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wrench className="text-blue-600" size={24} />
            {ticketToEdit ? (isReadOnly ? 'Detalhes do Serviço' : 'Editar Serviço') : 'Novo Serviço'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Multi-Technician Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users size={16} />
                Técnicos Alocados
            </label>
            {technicians.length === 0 ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    Aviso: Não há técnicos registados.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {technicians.map(t => {
                        const isSelected = formData.technicianIds.includes(t.id);
                        return (
                            <button
                                key={t.id}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => toggleTechnician(t.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                    isSelected 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                    : 'border-gray-200 text-gray-600'
                                } ${!isReadOnly ? 'hover:border-blue-300' : 'cursor-default'}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${t.avatarColor}`}>
                                    {t.name.substring(0,2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium truncate">{t.name}</span>
                                {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />}
                            </button>
                        );
                    })}
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Service Type */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
                <select
                    disabled={isReadOnly}
                    value={formData.serviceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                    {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.defaultDuration}h)</option>
                    ))}
                </select>
             </div>

             {/* Duration */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração Prevista (Horas)</label>
                <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    disabled={isReadOnly}
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Início</label>
               <div className="relative">
                 <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                 <input
                  type="time"
                  required
                  disabled={isReadOnly}
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                />
               </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº do Ticket</label>
                <div className="relative">
                    <Hash className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    placeholder="EX: TCK-001"
                    value={formData.ticketNumber}
                    onChange={(e) => setFormData({...formData, ticketNumber: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº do Processo</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Opcional"
                    value={formData.processNumber}
                    onChange={(e) => setFormData({...formData, processNumber: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    />
                </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                type="text"
                required
                disabled={isReadOnly}
                placeholder="Nome do Cliente"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    placeholder="Rua e Código Postal (Importante para rotas)"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidade (Resumo)</label>
                <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ex: LISBOA"
                value={formData.locality}
                onChange={(e) => setFormData({...formData, locality: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veículo</label>
              <select
                disabled={isReadOnly}
                value={formData.vehicleType}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value as VehicleType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none disabled:bg-gray-100"
              >
                {Object.values(VehicleType).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                disabled={isReadOnly}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as TicketStatus})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none disabled:bg-gray-100"
              >
                {Object.values(TicketStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                 <AlertCircle size={16} className="text-red-500"/>
                 Descrição de Avaria (Se aplicável)
             </label>
             <textarea
                disabled={isReadOnly}
                placeholder="Descreva a avaria reportada..."
                value={formData.faultDescription}
                onChange={(e) => setFormData({...formData, faultDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none disabled:bg-gray-100"
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Notas Internas</label>
             <textarea
                disabled={isReadOnly}
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none disabled:bg-gray-100"
             />
          </div>

          <div className="pt-4 flex justify-between shrink-0">
            {ticketToEdit && onDelete && !isReadOnly && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                    <Trash2 size={18} />
                    Eliminar
                </button>
            )}
            <div className="flex space-x-3 ml-auto">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                Fechar
                </button>
                {!isReadOnly && (
                    <button
                    type="submit"
                    disabled={technicians.length === 0 || services.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <Save size={18} />
                    Guardar
                    </button>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
