import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor } from '../types';
import { X, Trash2, Plus, User, Briefcase, Check, Monitor } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  services: ServiceDefinition[];
  visores: Visor[];
  onAddTechnician: (tech: Technician) => void;
  onRemoveTechnician: (id: string) => void;
  onAddService: (service: ServiceDefinition) => void;
  onRemoveService: (id: string) => void;
  onAddVisor: (visor: Visor) => void;
  onRemoveVisor: (id: string) => void;
}

const COLOR_PALETTE = [
  { name: 'Branco', class: 'bg-white' },
  { name: 'Azul Intenso', class: 'bg-blue-300' },
  { name: 'Esmeralda Forte', class: 'bg-emerald-300' },
  { name: 'Âmbar Escuro', class: 'bg-amber-300' },
  { name: 'Roxo Profundo', class: 'bg-purple-300' },
  { name: 'Rosa Vívido', class: 'bg-pink-300' },
  { name: 'Cinzento Sólido', class: 'bg-gray-300' },
  { name: 'Indigo Marcado', class: 'bg-indigo-300' },
  { name: 'Laranja Vibrante', class: 'bg-orange-300' },
  { name: 'Ciano Profundo', class: 'bg-cyan-300' },
  { name: 'Lima Escura', class: 'bg-lime-300' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  technicians,
  services,
  visores,
  onAddTechnician,
  onRemoveTechnician,
  onAddService,
  onRemoveService,
  onAddVisor,
  onRemoveVisor
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'visor'>('tech');
  const [newTechName, setNewTechName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(1);
  const [newServiceColor, setNewServiceColor] = useState('bg-white');
  const [newVisorName, setNewVisorName] = useState('');

  if (!isOpen) return null;

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName) return;
    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-red-600', 'bg-amber-600', 'bg-purple-600'];
    onAddTechnician({
      id: Date.now().toString(),
      name: newTechName,
      avatarColor: colors[Math.floor(Math.random() * colors.length)]
    });
    setNewTechName('');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    onAddService({
      id: Date.now().toString(),
      name: newServiceName,
      defaultDuration: Number(newServiceDuration),
      colorClass: newServiceColor
    });
    setNewServiceName('');
    setNewServiceDuration(1);
  };

  const handleAddVisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisorName) return;
    onAddVisor({
      id: Date.now().toString(),
      name: newVisorName
    });
    setNewVisorName('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[650px]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl text-gray-800 uppercase tracking-tight">Definições Operacionais</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tech')}
            className={`flex-1 py-4 text-xs uppercase tracking-widest border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'tech' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={16} /> Técnicos
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`flex-1 py-4 text-xs uppercase tracking-widest border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'service' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase size={16} /> Serviços
          </button>
          <button
            onClick={() => setActiveTab('visor')}
            className={`flex-1 py-4 text-xs uppercase tracking-widest border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'visor' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Monitor size={16} /> Visores
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {activeTab === 'tech' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddTech} className="flex gap-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <input
                  type="text"
                  placeholder="Nome do novo técnico..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                />
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all">
                  <Plus size={18} /> Alocar
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {technicians.map(tech => (
                  <div key={tech.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs shadow-inner ${tech.avatarColor}`}>
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-gray-700 uppercase tracking-tight text-sm">{tech.name}</span>
                    </div>
                    <button onClick={() => onRemoveTechnician(tech.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'service' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddService} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Nome do Serviço</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Instalação, Manutenção..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Tempo Médio (h)</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Cor do Cartão</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.class}
                        type="button"
                        onClick={() => setNewServiceColor(color.class)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center ${color.class} ${newServiceColor === color.class ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
                        title={color.name}
                      >
                        {newServiceColor === color.class && <Check size={16} className="text-gray-900" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg">
                        <Plus size={18} /> Registar Tipo de Serviço
                    </button>
                </div>
              </form>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                {services.map(service => (
                  <div key={service.id} className={`flex items-center justify-between p-4 rounded-xl border border-gray-300 shadow-sm transition-all ${service.colorClass}`}>
                    <div className="flex flex-col">
                      <span className="text-gray-900 uppercase tracking-tight text-sm">{service.name}</span>
                      <span className="text-[10px] text-gray-800 uppercase">{service.defaultDuration} horas</span>
                    </div>
                    <button onClick={() => onRemoveService(service.id)} className="text-gray-600 hover:text-red-700 p-2 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleAddVisor} className="flex gap-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <input
                  type="text"
                  placeholder="Nome do novo visor..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                  value={newVisorName}
                  onChange={(e) => setNewVisorName(e.target.value)}
                />
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all">
                  <Plus size={18} /> Adicionar Visor
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visores.map(visor => (
                  <div key={visor.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm group">
                    <div className="flex items-center gap-3">
                      <Monitor className="text-blue-500" size={20} />
                      <span className="text-gray-700 uppercase tracking-tight text-sm">{visor.name}</span>
                    </div>
                    <button onClick={() => onRemoveVisor(visor.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};