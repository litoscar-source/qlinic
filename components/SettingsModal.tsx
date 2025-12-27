
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Trash2, User, Lock, Cloud, Key, RefreshCw, Copy, Loader2, Database, Info, HardDrive } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  visores: Visor[];
  syncKey: string | null;
  onAddTechnician: (tech: Technician) => void;
  onRemoveTechnician: (id: string) => void;
  onAddService: (service: ServiceDefinition) => void;
  onRemoveService: (id: string) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onRemoveVehicle: (id: string) => void;
  onAddVisor: (visor: Visor) => void;
  onRemoveVisor: (id: string) => void;
  onSetSyncKey: (key: string | null) => void;
  onCreateSyncKey: () => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, technicians, services, vehicles, visores, syncKey,
  onAddTechnician, onRemoveTechnician, onAddService, onRemoveService, onAddVehicle, onRemoveVehicle,
  onAddVisor, onRemoveVisor, onSetSyncKey, onCreateSyncKey
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'cloud'>('tech');
  const [newTechName, setNewTechName] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('1234');
  const [manualSyncKey, setManualSyncKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const handleActivateCloud = async () => {
      setIsActivating(true);
      try {
          await onCreateSyncKey();
      } finally {
          setIsActivating(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <div>
               <h2 className="text-2xl text-slate-900 font-black uppercase tracking-tight">Consola de Gestão</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuração do Sistema</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 bg-white rounded-full border border-slate-200 transition-all"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-white">
          <button onClick={() => setActiveTab('tech')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tech' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/20' : 'text-slate-400'}`}>Técnicos</button>
          <button onClick={() => setActiveTab('service')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'service' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/20' : 'text-slate-400'}`}>Infraestrutura</button>
          <button onClick={() => setActiveTab('cloud')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-emerald-50/20' : 'text-slate-400'}`}>Cloud (Mongo DB Style)</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white">
          
          {activeTab === 'tech' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex gap-4">
                    <div className="relative flex-1">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Nome Completo..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-red-600 outline-none transition-all uppercase text-sm" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} />
                    </div>
                    <div className="relative w-32">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" maxLength={4} className="w-full pl-9 pr-4 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white text-center focus:border-red-600 outline-none transition-all" value={newTechPassword} onChange={(e) => setNewTechPassword(e.target.value)} />
                    </div>
                    <button onClick={() => { if(newTechName) onAddTechnician({ id: `tech-${Date.now()}`, name: newTechName, password: newTechPassword, avatarColor: 'bg-slate-800' }); setNewTechName(''); }} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-red-700 transition-all">Registar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {technicians.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${t.avatarColor} text-white flex items-center justify-center font-black shadow-md`}>{t.name.substring(0, 2).toUpperCase()}</div>
                                <div><p className="font-black text-sm uppercase text-slate-900 leading-none">{t.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">PIN: {t.password || '1234'}</p></div>
                            </div>
                            <button onClick={() => onRemoveTechnician(t.id)} className="text-slate-300 hover:text-red-600 p-2 transition-all"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 flex flex-col items-center text-center">
                    <div className="bg-white p-6 rounded-full shadow-2xl mb-8 border-4 border-emerald-50"><Cloud className="text-emerald-600" size={56} /></div>
                    <h3 className="text-3xl font-black text-emerald-900 uppercase tracking-tight mb-4">Sincronização de Dados</h3>
                    <p className="text-emerald-700/80 text-sm max-w-md leading-relaxed mb-10 font-medium">Os dados são armazenados numa estrutura documental segura, permitindo acesso em tempo real por toda a equipa.</p>
                    
                    {!syncKey ? (
                        <div className="space-y-6 w-full max-w-md">
                            <button onClick={handleActivateCloud} disabled={isActivating} className="w-full bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isActivating ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} 
                                ATIVAR CLOUD DATABASE
                            </button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-emerald-200"></div></div>
                                <span className="relative bg-emerald-50 px-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Recuperar Base Existente</span>
                            </div>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Chave de Acesso (ID)..." className="flex-1 px-5 py-4 border-2 border-emerald-200 rounded-2xl font-bold bg-white outline-none focus:border-emerald-500 transition-all uppercase tracking-widest text-sm" value={manualSyncKey} onChange={(e) => setManualSyncKey(e.target.value)} />
                                <button onClick={() => { if(manualSyncKey) { onSetSyncKey(manualSyncKey); setManualSyncKey(''); } }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">LIGAR</button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] border-2 border-emerald-200 shadow-2xl space-y-6">
                            <div className="text-left">
                                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Key size={14}/> ID de Ligação Ativa</label>
                                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                                    <code className="text-slate-900 font-black tracking-widest text-lg">{syncKey}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(syncKey); alert("Copiado!"); }} className="p-3 text-slate-300 hover:text-emerald-600 transition-all"><Copy size={20}/></button>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-2xl flex items-center gap-4 text-left shadow-xl">
                                <HardDrive className="text-emerald-500" size={32} />
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Estado da Réplica</p>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Ligado à Rede Local & Nuvem</p>
                                </div>
                            </div>
                            <button onClick={() => { if(window.confirm("Deseja desligar a sincronização?")) onSetSyncKey(null); }} className="w-full text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 underline transition-all">Desativar Ligação</button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100"><Database className="text-slate-400" size={32}/></div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Persistência Local (Mongo Cache)</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Os dados estão seguros e indexados neste dispositivo.</p>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-red-600 pl-3">Serviços</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-10 rounded-full ${s.colorClass}`} />
                                    <div><p className="font-black text-sm uppercase text-slate-900">{s.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{s.defaultDuration}H</p></div>
                                </div>
                                <button onClick={() => onRemoveService(s.id)} className="text-slate-200 hover:text-red-600 p-2 transition-colors"><Trash2 size={20}/></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Viaturas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vehicles.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <span className="font-black text-[11px] uppercase text-slate-700">{v.name}</span>
                                <button onClick={() => onRemoveVehicle(v.id)} className="text-slate-300 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
