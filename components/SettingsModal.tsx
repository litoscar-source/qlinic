import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Trash2, Plus, User, Briefcase, Check, Monitor, Info, Clock, Lock, Key, Cloud, Copy, RefreshCw, Smartphone, Palette, Download, Upload, ShieldCheck, Truck, FileJson, AlertCircle, Share2, QrCode, Loader2, Settings } from 'lucide-react';

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
  onUpdateTechnician?: (id: string, updates: Partial<Technician>) => void;
  onSetSyncKey: (key: string | null) => void;
  onCreateSyncKey: () => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, technicians, services, vehicles, visores, syncKey,
  onAddTechnician, onRemoveTechnician, onAddService, onRemoveService, onAddVehicle, onRemoveVehicle,
  onAddVisor, onRemoveVisor, onSetSyncKey, onCreateSyncKey, onExportBackup, onImportBackup
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'vehicle' | 'visor' | 'cloud' | 'data'>('tech');
  const [newTechName, setNewTechName] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('1234');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(1);
  const [newServiceColor, setNewServiceColor] = useState('bg-slate-100');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVisorName, setNewVisorName] = useState('');
  const [inputSyncKey, setInputSyncKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}?key=${syncKey}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const handleCreateCloud = async () => {
      setIsActivating(true);
      try {
          await onCreateSyncKey();
      } finally {
          setIsActivating(false);
      }
  };

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName) return;
    onAddTechnician({ 
      id: `tech-${Date.now()}`, 
      name: newTechName, 
      password: newTechPassword, 
      avatarColor: ['bg-blue-600', 'bg-emerald-600', 'bg-orange-600', 'bg-purple-600', 'bg-rose-600', 'bg-slate-800'][Math.floor(Math.random() * 6)] 
    });
    setNewTechName('');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    onAddService({ id: `svc-${Date.now()}`, name: newServiceName, defaultDuration: Number(newServiceDuration), colorClass: newServiceColor });
    setNewServiceName('');
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleName) return;
    onAddVehicle({ id: `v-${Date.now()}`, name: newVehicleName });
    setNewVehicleName('');
  };

  const handleAddVisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisorName) return;
    onAddVisor({ id: `vis-${Date.now()}`, name: newVisorName });
    setNewVisorName('');
  };

  const getTabClass = (id: string) => {
    const isActive = activeTab === id;
    let base = "flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ";
    if (id === 'cloud' || id === 'data') {
        const color = id === 'cloud' ? 'emerald' : 'blue';
        return base + (isActive ? `border-${color}-600 text-${color}-600 bg-${color}-50/30` : `border-transparent text-slate-400 hover:text-slate-600`);
    }
    return base + (isActive ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-400 hover:text-slate-600');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-xl"><Settings className="text-white" size={24} /></div>
            <div>
               <h2 className="text-2xl text-slate-900 font-black uppercase tracking-tight">Painel de Controlo</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configurações Gerais do Sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2.5 bg-white rounded-full border border-slate-200 transition-all active:scale-90"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('tech')} className={getTabClass('tech')}>Técnicos</button>
          <button onClick={() => setActiveTab('service')} className={getTabClass('service')}>Serviços</button>
          <button onClick={() => setActiveTab('vehicle')} className={getTabClass('vehicle')}>Viaturas</button>
          <button onClick={() => setActiveTab('visor')} className={getTabClass('visor')}>Visores</button>
          <button onClick={() => setActiveTab('cloud')} className={getTabClass('cloud')}>Cloud Sync</button>
          <button onClick={() => setActiveTab('data')} className={getTabClass('data')}>Backups</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          
          {activeTab === 'tech' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <form onSubmit={handleAddTech} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Registo de Novo Técnico</h3>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" required placeholder="Nome Completo..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white outline-none focus:border-red-600 transition-all" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} />
                        </div>
                        <div className="relative w-32">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" required maxLength={4} className="w-full pl-9 pr-4 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white text-center outline-none focus:border-red-600 transition-all" value={newTechPassword} onChange={(e) => setNewTechPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all">Adicionar</button>
                    </div>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {technicians.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${t.avatarColor} text-white flex items-center justify-center font-black shadow-md`}>{t.name.substring(0, 2).toUpperCase()}</div>
                                <div><p className="font-black text-sm uppercase text-slate-900 leading-none">{t.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Acesso PIN: {t.password || '1234'}</p></div>
                            </div>
                            <button onClick={() => onRemoveTechnician(t.id)} className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 flex flex-col items-center text-center">
                    <div className="bg-white p-6 rounded-full shadow-2xl shadow-emerald-100 mb-8 border-4 border-emerald-50"><Cloud className="text-emerald-600" size={56} /></div>
                    <h3 className="text-3xl font-black text-emerald-900 uppercase tracking-tight mb-4">Sincronização na Nuvem</h3>
                    <p className="text-emerald-700/80 text-sm max-w-md leading-relaxed mb-10 font-medium">Partilhe a agenda com todos os técnicos em tempo real. Os dados são salvaguardados automaticamente na infraestrutura segura do Qlinic.</p>
                    
                    {!syncKey ? (
                        <div className="space-y-4 w-full max-w-xs">
                            <button 
                                onClick={handleCreateCloud} 
                                disabled={isActivating}
                                className="w-full bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isActivating ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} 
                                {isActivating ? 'A ATIVAR...' : 'ATIVAR AGORA'}
                            </button>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Base de Dados Descentralizada</p>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col md:flex-row gap-10 items-center bg-white p-10 rounded-[3rem] border-2 border-emerald-200 shadow-2xl">
                            <div className="space-y-6 flex-1 text-left">
                                <div>
                                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Chave de Emparelhamento Ativa</label>
                                    <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 shadow-inner group">
                                        <code className="text-slate-900 font-black tracking-[0.3em] text-xl">{syncKey}</code>
                                        <button onClick={() => { navigator.clipboard.writeText(syncKey); alert("Chave copiada!"); }} className="p-3 text-slate-300 hover:text-emerald-600 bg-white rounded-xl border border-slate-100 shadow-sm transition-all active:scale-90"><Copy size={20}/></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <p className="text-slate-500 text-[11px] leading-relaxed font-medium">Os técnicos devem inserir esta chave no ecrã de login para aceder à agenda comum.</p>
                                    <button onClick={() => { if(window.confirm("Atenção: Isto irá desconectar todos os dispositivos. Continuar?")) onSetSyncKey(null); }} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 underline underline-offset-4">Encerrar Sincronização</button>
                                </div>
                            </div>
                            <div className="shrink-0 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-inner flex flex-col items-center gap-4">
                                <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 rounded-2xl shadow-xl border-8 border-white" />
                                <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <QrCode size={12}/> Scan to Connect
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-200/60">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3"><Key size={16}/> Ligar a uma Agenda Existente</h4>
                    <div className="flex gap-4">
                        <input type="text" placeholder="Insira a chave de 8 ou mais caracteres..." className="flex-1 px-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white outline-none focus:border-emerald-500 transition-all uppercase tracking-widest text-sm" value={inputSyncKey} onChange={(e) => setInputSyncKey(e.target.value)} />
                        <button onClick={() => { if(inputSyncKey) { onSetSyncKey(inputSyncKey); setInputSyncKey(''); } }} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Emparelhar</button>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <form onSubmit={handleAddService} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Designação do Serviço</label>
                            <input type="text" required className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-red-600 outline-none transition-all uppercase text-sm" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Estimado (Horas)</label>
                            <input type="number" required min={0.5} step={0.5} className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-red-600 outline-none transition-all text-sm" value={newServiceDuration} onChange={(e) => setNewServiceDuration(Number(e.target.value))} />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-black transition-all">Registar Serviço</button>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-10 rounded-full ${s.colorClass}`} />
                                <div><p className="font-black text-sm uppercase text-slate-900">{s.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{s.defaultDuration}H Padrão</p></div>
                            </div>
                            <button onClick={() => onRemoveService(s.id)} className="text-slate-200 hover:text-red-600 p-2 transition-colors"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <form onSubmit={handleAddVehicle} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex gap-4">
                    <div className="relative flex-1">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" required placeholder="Ex: Viatura 04 / Iveco..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-red-600 outline-none transition-all uppercase text-sm" value={newVehicleName} onChange={(e) => setNewVehicleName(e.target.value)} />
                    </div>
                    <button type="submit" className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition-all">Adicionar</button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicles.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                            <span className="font-black text-[11px] uppercase text-slate-700">{v.name}</span>
                            <button onClick={() => onRemoveVehicle(v.id)} className="text-slate-200 hover:text-red-600 p-2 transition-all"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'visor' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <form onSubmit={handleAddVisor} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex gap-4">
                    <input type="text" required placeholder="Modelo do Visor / Equipamento..." className="flex-1 px-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-red-600 outline-none transition-all uppercase text-sm" value={newVisorName} onChange={(e) => setNewVisorName(e.target.value)} />
                    <button type="submit" className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg">Registar</button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {visores.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                            <span className="font-black text-[11px] uppercase text-slate-700">{v.name}</span>
                            <button onClick={() => onRemoveVisor(v.id)} className="text-slate-200 hover:text-red-600 p-2 transition-all"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-blue-50 p-10 rounded-[3rem] border-2 border-blue-100 flex flex-col items-center text-center">
                        <div className="bg-white p-6 rounded-full shadow-xl mb-6 border-4 border-blue-50"><Download className="text-blue-600" size={48} /></div>
                        <h4 className="text-2xl font-black text-blue-900 uppercase tracking-tight mb-3">Backup Manual</h4>
                        <p className="text-blue-700/70 text-sm mb-10 leading-relaxed font-medium">Descarregue todos os dados da aplicação num ficheiro JSON seguro.</p>
                        <button onClick={onExportBackup} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Exportar Agora</button>
                    </div>
                    <div className="bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-800 flex flex-col items-center text-center shadow-2xl">
                        <div className="bg-white/10 p-6 rounded-full shadow-xl mb-6 border-4 border-slate-800"><Upload className="text-white" size={48} /></div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Restaurar Dados</h4>
                        <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">Substitua os dados atuais carregando um ficheiro de backup anterior.</p>
                        <label className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl cursor-pointer text-center flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <FileJson size={16}/> Carregar Ficheiro
                            <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};