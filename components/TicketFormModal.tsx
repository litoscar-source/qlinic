
import React, { useState, useEffect } from 'react';
import { Technician, Ticket, VehicleType, TicketStatus, ServiceDefinition } from '../types';
import { X, Save, MapPin, Hash, User, Users, Wrench, Trash2, Building, AlertTriangle, Car, FileText } from 'lucide-react';
import { format } from 'date-fns';

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
    processNumber: '',
    customerName: '',
    address: '',
    locality: '',
    vehicleType: VehicleType.CARRINHA,
    serviceId: '',
    status: TicketStatus.PRE_AGENDADO,
    dateString: '', 
    scheduledTime: '09:00',
    duration: 1,
    travelDuration: 0,
    notes: '',
    faultDescription: ''
  });

  useEffect(() => {
    if (isOpen) {
        if (ticketToEdit) {
            // Edit Mode
            setFormData({
                technicianIds: ticketToEdit.technicianIds,
                ticketNumber: ticketToEdit.ticketNumber,
                processNumber: ticketToEdit.processNumber || '',
                customerName: ticketToEdit.customerName,
                address: ticketToEdit.address,
                locality: ticketToEdit.locality || '',
                vehicleType: ticketToEdit.vehicleType,
                serviceId: ticketToEdit.serviceId,
                status: ticketToEdit.status,
                dateString: format(ticketToEdit.date, 'yyyy-MM-dd'),
                scheduledTime: ticketToEdit.scheduledTime,
                duration: ticketToEdit.duration,
                travelDuration: ticketToEdit.travelDuration || 0,
                notes: ticketToEdit.notes || '',
                faultDescription: ticketToEdit.faultDescription || ''
            });
        } else {
            // Create Mode
            const defaultService = services[0];
            setFormData({
                technicianIds: selectedTechId ? [selectedTechId] : (technicians[0] ? [technicians[0].id] : []),
                ticketNumber: '',
                processNumber: '',
                customerName: '',
                address: '',
                locality: '',
                vehicleType: VehicleType.CARRINHA,
                serviceId: defaultService ? defaultService.id : '',
                status: TicketStatus.PRE_AGENDADO,
                dateString: format(initialDate, 'yyyy-MM-dd'),
                scheduledTime: '09:00',
                duration: defaultService ? defaultService.defaultDuration : 1,
                travelDuration: 0,
                notes: '',
                faultDescription: ''
            });
        }
    }
  }, [isOpen, ticketToEdit, selectedTechId, technicians, services, initialDate]);

  // Update duration automatically when service changes
  const handleServiceChange = (serviceId: string) => {
    if (isReadOnly) return;
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const ticketDate = new Date(formData.dateString);
    onSave({
      ...formData,
      date: ticketDate
    });
    onClose();
  };
  
  const handleDelete = () => {
    if (ticketToEdit && onDelete && !isReadOnly) {
        if (window.confirm('Tem a certeza que deseja eliminar este serviço?')) {
            onDelete(ticketToEdit.id);
            onClose();
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
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
          
          {/* Avaria Field (Novo) */}
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <label className="block text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
                <AlertTriangle size={16} />
                Descrição da Avaria / Problema
            </label>
            <textarea
                rows={2}
                placeholder="Descreva o problema reportado..."
                value={formData.faultDescription}
                disabled={isReadOnly}
                onChange={(e) => setFormData({...formData, faultDescription: e.target.value})}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {/* Multi-Technician Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users size={16} />
                Técnicos Alocados
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                : 'border-gray-200 hover:border-blue-300 text-gray-600 disabled:opacity-60 disabled:hover:border-gray-200'
                            }`}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
               <input
                  type="date"
                  required
                  disabled={isReadOnly}
                  value={formData.dateString}
                  onChange={(e) => setFormData({...formData, dateString: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
                <select
                    value={formData.serviceId}
                    disabled={isReadOnly}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                    {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.defaultDuration}h)</option>
                    ))}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Hora Início</label>
               <input
                  type="time"
                  required
                  disabled={isReadOnly}
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duração (h)</label>
                <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    disabled={isReadOnly}
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseFloat(e.target.value)})}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-teal-700 mb-1 flex items-center gap-1"><Car size={12}/> H. Viagem</label>
                <input
                    type="number"
                    min="0"
                    step="0.25"
                    disabled={isReadOnly}
                    value={formData.travelDuration}
                    onChange={(e) => setFormData({...formData, travelDuration: parseFloat(e.target.value)})}
                    className="w-full px-2 py-2 border border-teal-200 bg-teal-50 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-teal-900 disabled:opacity-60"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Processo (EPRC)</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="EPRC..."
                    value={formData.processNumber}
                    onChange={(e) => setFormData({...formData, processNumber: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidade</label>
                <div className="relative">
                    <Building className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    placeholder="Ex: Lisboa, Porto..."
                    value={formData.locality}
                    onChange={(e) => setFormData({...formData, locality: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>
            </div>
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    placeholder="Rua, Nº, Andar"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>
           </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veículo</label>
              <select
                value={formData.vehicleType}
                disabled={isReadOnly}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value as VehicleType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {Object.values(VehicleType).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.status}
                disabled={isReadOnly}
                onChange={(e) => setFormData({...formData, status: e.target.value as TicketStatus})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {Object.values(TicketStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between shrink-0">
             {ticketToEdit && onDelete && !isReadOnly ? (
                 <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                 >
                    <Trash2 size={18} />
                    Eliminar
                 </button>
             ) : (
                 <div></div> 
             )}
            
            <div className="flex space-x-3">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                Cancelar
                </button>
                {!isReadOnly && (
                    <button
                    type="submit"
                    disabled={technicians.length === 0 || services.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <Save size={18} />
                    {ticketToEdit ? 'Guardar' : 'Agendar'}
                    </button>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
