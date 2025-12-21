
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor } from '../types';
import { X, Trash2, Plus, User, Briefcase, Check, Monitor, Info, Clock, Lock, Key, Cloud, Copy, RefreshCw, Smartphone, Palette, Download, Upload, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  services: ServiceDefinition[];
  visores: Visor[];
  syncKey: string | null;
  onAddTechnician: (tech: Technician) => void;
  onRemoveTechnician: (id: string) => void;
  onAddService: (service: ServiceDefinition) => void;
  onRemoveService: (id: string) => void;
  onAddVisor: (visor: Visor) => void;
  onRemoveVisor: (id: string) => void;
  onUpdateTechnician?: (id: string, updates: Partial<Technician>) => void;
  onSetSyncKey: (key: string | null) => void;
  onCreateSyncKey: () => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SERVICE_COLORS = [
  { name: 'Cinza', class: 'bg-slate-100' },
  { name: 'Azul', class: 'bg-blue-600' },
  { name: 'Verde', class: 'bg-emerald-500' },
  { name: 'Amarelo', class: 'bg-amber-400' },
  { name: 'Laranja', class: 'bg-orange-500' },
  { name: 'Roxo', class: 'bg-purple-600' },
  { name: 'Vermelho', class: 'bg-red-600' },
  { name: 'Ciano', class: 'bg-cyan-500' },
  { name: 'Rosa', class: 'bg-rose-500' },
  { name: 'Preto', class: 'bg-slate-900' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, technicians, services, visores, syncKey,
  onAddTechnician, onRemoveTechnician, onAddService, onRemoveService,
  onAddVisor, onRemoveVisor, onUpdateTechnician, onSetSyncKey, onCreateSyncKey,
  onExportBackup, onImportBackup
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'visor' | 'cloud' | 'data'>('tech');
  const [newTechName, setNewTechName] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('1234');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(1);
  const [newServiceColor, setNewServiceColor] = useState('bg-slate-100');
  const [newVisorName, setNewVisorName] = useState('');
  const [inputSyncKey, setInputSyncKey] = useState('');

  if (!isOpen) return null;

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName) return;
    onAddTechnician({
      id: `tech-${Date.now()}`,
      name: newTechName,
      password: newTechPassword,
      avatarColor: 'bg-slate-800'
    });
    setNewTechName('');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    onAddService({
      id: `svc-${Date.now()}`,
      name: newServiceName,
      defaultDuration: Number(newServiceDuration),
      colorClass: newServiceColor
    });
    setNewServiceName('');
    setNewServiceColor('bg-slate-100');
  };

  const handleAddVisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisorName) return;
    onAddVisor({ id: `vis-${Date.now()}`, name: newVisorName });
    setNewVisorName('');
  };

  const handleConnectSync = () => {
      const cleanKey = inputSyncKey.trim();
      if (cleanKey) {
          onSetSyncKey(cleanKey);
          setInputSyncKey('');
          alert("Ligar à Cloud... A chave será verificada em segundos.");
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[750px] border border-slate-200">
        
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
               <Briefcase className="text-white" size={24} />
            </div>
            <div>
               <h2 className="text-2xl text-slate-900 font-bold uppercase tracking-tight">Definições</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuração do Sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 transition-all p-2 bg-white rounded-full border border-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('tech')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold uppercase tracking-widest border-b-4 ${activeTab === 'tech' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400'}`}>Técnicos</button>
          <button onClick={() => setActiveTab('service')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold uppercase tracking-widest border-b-4 ${activeTab === 'service' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400'}`}>Serviços</button>
          <button onClick={() => setActiveTab('visor')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold uppercase tracking-widest border-b-4 ${activeTab === 'visor' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400'}`}>Visores</button>
          <button onClick={() => setActiveTab('cloud')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold uppercase tracking-widest border-b-4 ${activeTab === 'cloud' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20' : 'border-transparent text-slate-400'}`}>Cloud Sync</button>
          <button onClick={() => setActiveTab('data')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold uppercase tracking-widest border-b-4 ${activeTab === 'data' ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-slate-400'}`}>Backup</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          {activeTab === 'tech' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleAddTech} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" required placeholder="Nome do Técnico..." className="px-6 py-4 border border-slate-300 rounded-2xl outline-none font-bold bg-white text-slate-900" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} />
                    <input type="text" required placeholder="PIN..." className="px-6 py-4 border border-slate-300 rounded-2xl outline-none font-bold bg-white text-slate-900" value={newTechPassword} onChange={(e) => setNewTechPassword(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl">Adicionar Técnico</button>
              </form>
              <div className="grid grid-cols-2 gap-4">
                {technicians.map(tech => (
                  <div key={tech.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 group hover:border-red-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${tech.avatarColor} text-white flex items-center justify-center font-bold`}>{tech.name.substring(0,2).toUpperCase()}</div>
                      <div className="flex flex-col"><span className="text-sm font-bold uppercase">{tech.name}</span><span className="text-[10px] text-slate-400">PIN: {tech.password}</span></div>
                    </div>
                    <button onClick={() => onRemoveTechnician(tech.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><Cloud size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Sincronização Cloud</h3>
                            <p className="text-xs text-emerald-700 mt-1 font-medium leading-relaxed">Sincronize a agenda entre telemóveis e computadores em tempo real.</p>
                        </div>
                    </div>

                    {syncKey ? (
                        <div className="space-y-4 pt-4 border-t border-emerald-200">
                            <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Chave de Sincronização Ativa</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white border-2 border-emerald-200 rounded-2xl px-6 py-4 font-black text-slate-900 tracking-widest text-sm overflow-hidden truncate">
                                    {syncKey}
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(syncKey); alert("Chave Copiada!"); }} className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 shadow-lg">
                                    <Copy size={24} />
                                </button>
                            </div>
                            <button onClick={() => { if(confirm("Desativar cloud neste dispositivo?")) onSetSyncKey(null); }} className="text-xs text-rose-600 font-black uppercase tracking-widest hover:underline mt-4">Desativar Sincronização</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col items-center text-center gap-4">
                                <Smartphone size={32} className="text-emerald-600" />
                                <h4 className="text-sm font-black text-slate-900 uppercase">Usar Chave Existente</h4>
                                <input type="text" placeholder="Cole a chave aqui..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500" value={inputSyncKey} onChange={(e) => setInputSyncKey(e.target.value)} />
                                <button onClick={handleConnectSync} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase text-[10px]">Conectar Dispositivo</button>
                            </div>
                            <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center gap-4 text-white">
                                <RefreshCw size={32} />
                                <h4 className="text-sm font-black uppercase">Iniciar Nova Cloud</h4>
                                <p className="text-[10px]">Crie um ecossistema novo para a sua equipa.</p>
                                <button onClick={onCreateSyncKey} className="w-full bg-white text-emerald-600 py-4 rounded-xl font-black uppercase text-[10px] shadow-lg transition-all active:scale-95">Ativar Agora</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleAddService} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Serviço</label>
                            <input type="text" required placeholder="Ex: Manutenção, Urgência..." className="w-full px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white text-slate-900" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração Estimada (Horas)</label>
                            <input type="number" step="0.5" required className="w-full px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white text-slate-900" value={newServiceDuration} onChange={(e) => setNewServiceDuration(Number(e.target.value))} />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Palette size={12} className="text-red-600" /> Cor na Agenda
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_COLORS.map(color => (
                                <button key={color.class} type="button" onClick={() => setNewServiceColor(color.class)}
                                    className={`w-10 h-10 rounded-xl border-4 transition-all ${color.class} ${newServiceColor === color.class ? 'border-red-600 scale-110 shadow-lg' : 'border-white hover:scale-105'}`}
                                    title={color.name} />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Criar Serviço</button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 group hover:border-red-200">
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-10 rounded-full ${s.colorClass || 'bg-slate-100'} shadow-sm`} />
                                <div>
                                    <span className="font-bold text-sm uppercase text-slate-900">{s.name}</span>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{s.defaultDuration} Horas</p>
                                </div>
                            </div>
                            <button onClick={() => onRemoveService(s.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 p-2 transition-all"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><ShieldCheck size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Segurança e Backup</h3>
                            <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">Crie cópias de segurança locais para garantir que nunca perde os seus dados.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={onExportBackup} className="bg-white p-6 rounded-3xl border border-blue-200 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group">
                            <div className="bg-blue-100 p-4 rounded-full text-blue-600 group-hover:scale-110 transition-transform"><Download size={32} /></div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">Exportar Backup</h4>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Descarregar ficheiro JSON</p>
                            </div>
                        </button>

                        <label className="bg-white p-6 rounded-3xl border border-blue-200 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group cursor-pointer">
                            <div className="bg-slate-100 p-4 rounded-full text-slate-600 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">Restaurar Backup</h4>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Importar ficheiro guardado</p>
                            </div>
                            <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'visor' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleAddVisor} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex gap-3">
                    <input type="text" required placeholder="Nome do Visor..." className="flex-1 px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white text-slate-900" value={newVisorName} onChange={(e) => setNewVisorName(e.target.value)} />
                    <button type="submit" className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-[11px]">Adicionar</button>
                </form>
                <div className="grid grid-cols-2 gap-4">
                    {visores.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                            <span className="font-bold text-sm uppercase">{v.name}</span>
                            <button onClick={() => onRemoveVisor(v.id)} className="text-slate-300 hover:text-red-600 transition-all"><Trash2 size={20}/></button>
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
