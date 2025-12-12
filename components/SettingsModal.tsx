
import React, { useState } from 'react';
import { Technician, ServiceDefinition } from '../types';
import { X, Trash2, Plus, User, Briefcase } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  services: ServiceDefinition[];
  onAddTechnician: (tech: Technician) => void;
  onRemoveTechnician: (id: string) => void;
  onAddService: (service: ServiceDefinition) => void;
  onRemoveService: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  technicians,
  services,
  onAddTechnician,
  onRemoveTechnician,
  onAddService,
  onRemoveService
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service'>('tech');
  
  // Tech Form State
  const [newTechName, setNewTechName] = useState('');
  
  // Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(1);
  const [newServiceColor, setNewServiceColor] = useState('bg-blue-100 text-blue-800 border-blue-200');

  if (!isOpen) return null;

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName) return;
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[600px]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tech')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'tech' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={18} />
            Técnicos
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'service' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase size={18} />
            Tipos de Serviço
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {activeTab === 'tech' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddTech} className="flex gap-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <input
                  type="text"
                  placeholder="Nome do novo técnico..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} /> Adicionar
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {technicians.map(tech => (
                  <div key={tech.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${tech.avatarColor}`}>
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-700">{tech.name}</span>
                    </div>
                    <button 
                      onClick={() => onRemoveTechnician(tech.id)}
                      className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleAddService} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nome do Serviço</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Instalação"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Duração Padrão (h)</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div>
                   <label className="block text-xs font-semibold text-gray-500 mb-2">Cor de Identificação</label>
                   <div className="flex gap-2 flex-wrap">
                      {[
                        { l: 'Azul', c: 'bg-blue-100 text-blue-800 border-blue-200' },
                        { l: 'Verde', c: 'bg-green-100 text-green-800 border-green-200' },
                        { l: 'Amarelo', c: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                        { l: 'Vermelho', c: 'bg-red-100 text-red-800 border-red-200' },
                        { l: 'Roxo', c: 'bg-purple-100 text-purple-800 border-purple-200' },
                        { l: 'Laranja', c: 'bg-orange-100 text-orange-800 border-orange-200' },
                        { l: 'Cinza', c: 'bg-gray-100 text-gray-800 border-gray-200' },
                      ].map((opt) => (
                        <button
                          key={opt.c}
                          type="button"
                          onClick={() => setNewServiceColor(opt.c)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${opt.c} ${newServiceColor === opt.c ? 'ring-2 ring-offset-1 ring-black/50' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {opt.l}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Plus size={18} /> Adicionar Serviço
                    </button>
                </div>
              </form>

              <div className="space-y-2">
                {services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-md text-xs font-bold border ${service.colorClass}`}>
                        {service.defaultDuration}h
                      </span>
                      <span className="font-medium text-gray-700">{service.name}</span>
                    </div>
                    <button 
                      onClick={() => onRemoveService(service.id)}
                      className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                    >
                      <Trash2 size={16} />
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
