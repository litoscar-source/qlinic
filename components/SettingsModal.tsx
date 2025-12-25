
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Trash2, Plus, User, Briefcase, Check, Monitor, Info, Clock, Lock, Key, Cloud, Copy, RefreshCw, Smartphone, Palette, Download, Upload, ShieldCheck, Truck, FileJson, AlertCircle, Share2, QrCode } from 'lucide-react';

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

  if (!isOpen) return null;

  // URL de partilha com QR Code
  const shareUrl = `${window.location.origin}${window.location.pathname}?key=${syncKey}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

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
    setNewTechPassword('1234');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    onAddService({ id: `svc-${Date.now()}`, name: newServiceName, defaultDuration: Number(newServiceDuration), colorClass: newServiceColor });
    setNewServiceName('');
    setNewServiceColor('bg-slate-100');
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

  const serviceColors = [
    { label: 'Cinza', value: 'bg-slate-100' },
    { label: 'Azul', value: 'bg-blue-600' },
    { label: 'Verde', value: 'bg-emerald-600' },
    { label: 'Laranja', value: 'bg-orange-500' },
    { label: 'Roxo', value: 'bg-purple-600' },
    { label: 'Rosa', value: 'bg-rose-500' },
    { label: 'Escuro', value: 'bg-slate-900' },
  ];

  const getTabClass = (id: string) => {
    const isActive = activeTab === id;
    let base = "flex-1 min-w-[100px] py-4 text-[10px] font-bold uppercase tracking-widest border-b-4 transition-all ";
    if (id === 'cloud' || id === 'data') {
        const color = id === 'cloud' ? 'emerald' : 'blue';
        return base + (isActive ? `border-${color}-600 text-${color}-600 bg-${color}-50/30` : `border-transparent text-slate-400 hover:text-slate-600`);
    }
    return base + (isActive ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-400 hover:text-slate-600');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[750px] border border-slate-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg"><Briefcase className="text-white" size={24} /></div>
            <div>
               <h2 className="text-2xl text-slate-900 font-bold uppercase tracking-tight">Definições</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuração do Sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 bg-white rounded-full border border-slate-200 transition-all"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('tech')} className={getTabClass('tech')}>Técnicos</button>
          <button onClick={() => setActiveTab('service')} className={getTabClass('service')}>Serviços</button>
          <button onClick={() => setActiveTab('vehicle')} className={getTabClass('vehicle')}>Frota</button>
          <button onClick={() => setActiveTab('visor')} className={getTabClass('visor')}>Visores</button>
          <button onClick={() => setActiveTab('cloud')} className={getTabClass('cloud')}>Cloud</button>
          <button onClick={() => setActiveTab('data')} className={getTabClass('data')}>Backup</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          
          {activeTab === 'tech' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleAddTech} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Plus size={14}/> Adicionar Técnico</h3>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" required placeholder="Nome..." className="w-full pl-12 pr-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white text-slate-900 outline-none" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} />
                        </div>
                        <div className="relative w-32">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" required placeholder="PIN" maxLength={4} className="w-full pl-9 pr-4 py-4 border border-slate-300 rounded-2xl font-bold bg-white text-slate-900 outline-none" value={newTechPassword} onChange={(e) => setNewTechPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-[11px] shadow-xl hover:bg-red-700 transition-all">Registar</button>
                    </div>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {technicians.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-red-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${t.avatarColor} text-white flex items-center justify-center font-bold shadow-md`}>{t.name.substring(0, 2).toUpperCase()}</div>
                                <div><p className="font-bold text-sm uppercase text-slate-900">{t.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PIN: {t.password || '1234'}</p></div>
                            </div>
                            <button onClick={() => onRemoveTechnician(t.id)} className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-emerald-50 p-10 rounded-[2.5rem] border border-emerald-100 flex flex-col items-center text-center">
                    <div className="bg-white p-6 rounded-full shadow-lg mb-6"><Cloud className="text-emerald-600" size={48} /></div>
                    <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight mb-2">Sincronização Cloud</h3>
                    <p className="text-emerald-700/70 text-sm max-w-md leading-relaxed mb-8">Ative a nuvem para que os técnicos vejam os dados no telemóvel instantaneamente.</p>
                    
                    {!syncKey ? (
                        <button onClick={onCreateSyncKey} className="bg-emerald-600 text-white px-12 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-3">
                            <RefreshCw size={20} /> Ativar Cloud
                        </button>
                    ) : (
                        <div className="w-full flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-[2.5rem] border-2 border-emerald-200 shadow-xl">
                            <div className="space-y-4 flex-1 text-left">
                                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">Acesso do Técnico</label>
                                <p className="text-slate-600 text-xs leading-relaxed">Peça ao técnico para apontar a câmara do telemóvel para o código ao lado para configurar automaticamente.</p>
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <code className="text-slate-900 font-black tracking-widest text-lg">{syncKey}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link copiado!"); }} className="p-2 text-slate-400 hover:text-emerald-600 transition-all"><Share2 size={20}/></button>
                                </div>
                                <button onClick={() => onSetSyncKey(null)} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 underline">Desativar Nuvem</button>
                            </div>
                            <div className="shrink-0 bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-inner flex flex-col items-center gap-3">
                                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 rounded-xl shadow-md border-4 border-white" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><QrCode size={10}/> SCAN TO CONNECT</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Key size={14}/> Ligar a Nuvem Existente</h4>
                    <div className="flex gap-3">
                        <input type="text" placeholder="Cole aqui a chave..." className="flex-1 px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white outline-none" value={inputSyncKey} onChange={(e) => setInputSyncKey(e.target.value)} />
                        <button onClick={() => { onSetSyncKey(inputSyncKey); setInputSyncKey(''); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest">Conectar</button>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleAddService} className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Serviço</label>
                            <input type="text" required className="w-full px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duração (Horas)</label>
                            <input type="number" required min={0.5} step={0.5} className="w-full px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white" value={newServiceDuration} onChange={(e) => setNewServiceDuration(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cor</label>
                        <div className="flex flex-wrap gap-2">
                            {serviceColors.map(c => (
                                <button key={c.value} type="button" onClick={() => setNewServiceColor(c.value)} className={`w-8 h-8 rounded-full border-2 transition-all ${c.value} ${newServiceColor === c.value ? 'ring-4 ring-red-100 border-red-600 scale-110' : 'border-transparent'}`} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[11px] shadow-xl">Adicionar Serviço</button>
                </form>
                <div className="space-y-3">
                    {services.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-4"><div className={`w-4 h-10 rounded-full ${s.colorClass}`} /><div><p className="font-bold text-sm uppercase text-slate-900">{s.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.defaultDuration}H Estimadas</p></div></div>
                            <button onClick={() => onRemoveService(s.id)} className="text-slate-300 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleAddVehicle} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex gap-3">
                    <input type="text" required placeholder="Viatura..." className="flex-1 px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white" value={newVehicleName} onChange={(e) => setNewVehicleName(e.target.value)} />
                    <button type="submit" className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-[11px] shadow-xl">Adicionar</button>
                </form>
                <div className="grid grid-cols-2 gap-4">
                    {vehicles.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                            <span className="font-bold text-sm uppercase">{v.name}</span>
                            <button onClick={() => onRemoveVehicle(v.id)} className="text-slate-300 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'visor' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleAddVisor} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex gap-3">
                    <input type="text" required placeholder="Modelo Equipamento..." className="flex-1 px-6 py-4 border border-slate-300 rounded-2xl font-bold bg-white" value={newVisorName} onChange={(e) => setNewVisorName(e.target.value)} />
                    <button type="submit" className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-[11px] shadow-xl">Registar</button>
                </form>
                <div className="grid grid-cols-2 gap-4">
                    {visores.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                            <span className="font-bold text-sm uppercase text-slate-700">{v.name}</span>
                            <button onClick={() => onRemoveVisor(v.id)} className="text-slate-300 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-10 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center">
                        <div className="bg-white p-6 rounded-full shadow-lg mb-6"><Download className="text-blue-600" size={40} /></div>
                        <h4 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2">Exportar Backup</h4>
                        <button onClick={onExportBackup} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Descarregar JSON</button>
                    </div>
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center">
                        <div className="bg-white/10 p-6 rounded-full shadow-lg mb-6"><Upload className="text-white" size={40} /></div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Restaurar Backup</h4>
                        <label className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] shadow-lg cursor-pointer text-center flex items-center justify-center gap-2">
                            <FileJson size={14}/> Carregar Ficheiro
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
