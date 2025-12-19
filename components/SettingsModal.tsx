
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor } from '../types';
import { X, Trash2, Plus, User, Briefcase, Check, Monitor, Info, Clock } from 'lucide-react';

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
  { name: 'Branco', class: 'bg-white', text: 'text-slate-900' },
  { name: 'Azul Intenso', class: 'bg-blue-600', text: 'text-white' },
  { name: 'Esmeralda', class: 'bg-emerald-600', text: 'text-white' },
  { name: 'Âmbar', class: 'bg-amber-500', text: 'text-slate-900' },
  { name: 'Roxo', class: 'bg-purple-600', text: 'text-white' },
  { name: 'Vermelho', class: 'bg-red-600', text: 'text-white' },
  { name: 'Cinzento Escuro', class: 'bg-slate-800', text: 'text-white' },
  { name: 'Indigo', class: 'bg-indigo-600', text: 'text-white' },
  { name: 'Laranja', class: 'bg-orange-500', text: 'text-white' },
  { name: 'Ciano', class: 'bg-cyan-500', text: 'text-slate-900' },
  { name: 'Verde Lima', class: 'bg-lime-400', text: 'text-slate-900' },
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
    setNewServiceColor('bg-white');
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

  const isColorDark = (colorClass: string) => {
      const darkClasses = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-red-600', 'bg-slate-800', 'bg-indigo-600', 'bg-orange-500'];
      return darkClasses.includes(colorClass);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden flex flex-col h-[750px] border border-slate-200">
        
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
               <Briefcase className="text-white" size={24} />
            </div>
            <div>
               <h2 className="text-2xl text-slate-900 font-bold uppercase tracking-tight">Definições Operacionais</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuração de Agentes, Serviços e Logística</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 transition-all p-2 bg-white rounded-full border border-slate-200 shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('tech')}
            className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-[0.3em] border-b-4 transition-all flex items-center justify-center gap-3 ${
              activeTab === 'tech' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400 hover:bg-slate-50'
            }`}
          >
            <User size={18} /> Técnicos
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-[0.3em] border-b-4 transition-all flex items-center justify-center gap-3 ${
              activeTab === 'service' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Briefcase size={18} /> Serviços
          </button>
          <button
            onClick={() => setActiveTab('visor')}
            className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-[0.3em] border-b-4 transition-all flex items-center justify-center gap-3 ${
              activeTab === 'visor' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Monitor size={18} /> Visores
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          {activeTab === 'tech' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleAddTech} className="flex gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <input
                  type="text"
                  placeholder="Nome completo do técnico..."
                  className="flex-1 px-6 py-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-red-100 font-bold bg-white text-slate-900"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                />
                <button type="submit" className="px-10 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 flex items-center gap-3 transition-all font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-red-200 active:scale-95">
                  <Plus size={20} /> Registar
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {technicians.map(tech => (
                  <div key={tech.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-red-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${tech.avatarColor}`}>
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-slate-900 font-bold uppercase tracking-tight text-sm">{tech.name}</span>
                    </div>
                    <button onClick={() => onRemoveTechnician(tech.id)} className="text-slate-300 hover:text-red-600 p-2 transition-all hover:bg-red-50 rounded-lg">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'service' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleAddService} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Designação do Serviço</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Instalação de Sistema Laser"
                      className="w-full px-6 py-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-red-100 font-bold bg-white text-slate-900"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Média Horas</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      required
                      className="w-full px-6 py-4 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-red-100 font-bold bg-white text-slate-900"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Cor Identificativa na Agenda</label>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.class}
                        type="button"
                        onClick={() => setNewServiceColor(color.class)}
                        className={`w-14 h-14 rounded-2xl border-4 transition-all flex items-center justify-center shadow-md ${color.class} ${newServiceColor === color.class ? 'border-red-600 ring-4 ring-red-50 scale-110' : 'border-white hover:border-slate-300'}`}
                      >
                        {newServiceColor === color.class && <Check size={24} className={color.text} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-200 pt-6">
                    <button type="submit" className="px-12 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 uppercase tracking-[0.2em] text-[11px] font-bold flex items-center gap-3 transition-all shadow-2xl shadow-red-200 active:scale-95">
                        <Plus size={20} /> Criar Novo Serviço
                    </button>
                </div>
              </form>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {services.map(service => {
                  const isDark = isColorDark(service.colorClass);
                  return (
                    <div key={service.id} className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 shadow-md transition-all ${service.colorClass} ${isDark ? 'border-transparent' : 'border-slate-100'}`}>
                      <div className="flex flex-col">
                        <span className={`font-bold uppercase tracking-widest text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{service.name}</span>
                        <span className={`text-[10px] font-bold uppercase opacity-80 flex items-center gap-2 mt-1 ${isDark ? 'text-white' : 'text-slate-500'}`}>
                            <Clock size={12} /> {service.defaultDuration} horas estimadas
                        </span>
                      </div>
                      <button onClick={() => onRemoveService(service.id)} className={`p-3 rounded-xl transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/20' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}>
                        <Trash2 size={22} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4 mb-4">
                 <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                 <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Os visores registados aqui ficarão disponíveis para seleção exclusiva em serviços do tipo <strong>"Reconstrução"</strong>. Estes dados são vitais para o relatório de picking de armazém.
                 </p>
              </div>

              <form onSubmit={handleAddVisor} className="flex gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <input
                  type="text"
                  placeholder="Código ou Nome do Visor (Ex: Visor LED G5)..."
                  className="flex-1 px-6 py-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-red-100 font-bold bg-white text-slate-900"
                  value={newVisorName}
                  onChange={(e) => setNewVisorName(e.target.value)}
                />
                <button type="submit" className="px-10 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 flex items-center gap-3 transition-all font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-red-200 active:scale-95">
                  <Plus size={20} /> Adicionar
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visores.map(visor => (
                  <div key={visor.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 p-3 rounded-xl text-white shadow-md">
                        <Monitor size={20} />
                      </div>
                      <span className="text-slate-900 font-bold uppercase tracking-tight text-sm">{visor.name}</span>
                    </div>
                    <button onClick={() => onRemoveVisor(visor.id)} className="text-slate-300 hover:text-red-600 p-2 transition-all hover:bg-red-50 rounded-lg">
                      <Trash2 size={20} />
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
