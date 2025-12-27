
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Trash2, User, Lock, Cloud, Key, RefreshCw, Copy, Loader2, Database, Info, HardDrive, ShieldCheck, Terminal, Server } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'cloud' | 'sql'>('tech');
  const [newTechName, setNewTechName] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('1234');
  const [manualSyncKey, setManualSyncKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `
-- TABELA DE TÉCNICOS
CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    password TEXT DEFAULT '1234',
    avatar_color TEXT
);

-- TABELA DE SERVIÇOS
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    default_duration INT,
    color_class TEXT
);

-- TABELA DE INTERVENÇÕES (TICKETS)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE,
    customer_name TEXT,
    address TEXT,
    service_id UUID REFERENCES services(id),
    status TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    version INT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`.trim();

  return (
    <div className="fixed inset-0 bg-[#0c1621]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <div>
               <h2 className="text-2xl text-[#336791] font-black uppercase tracking-tight">PostgreSQL Management</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controlo de Dados Relacionais</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 bg-white rounded-full border border-slate-200 transition-all"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-white">
          <button onClick={() => setActiveTab('tech')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tech' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>Staff</button>
          <button onClick={() => setActiveTab('service')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'service' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>Tabelas Mestre</button>
          <button onClick={() => setActiveTab('cloud')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>SQL Server</button>
          <button onClick={() => setActiveTab('sql')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sql' ? 'text-amber-600 border-b-4 border-amber-600 bg-amber-50/20' : 'text-slate-400'}`}>Exportar Schema</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          
          {activeTab === 'sql' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl relative">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(sqlSchema); alert("SQL Copiado!"); }} className="p-2 bg-slate-800 text-amber-500 rounded-lg hover:bg-slate-700 transition-all"><Copy size={16}/></button>
                      </div>
                      <h4 className="text-amber-500 font-mono text-xs mb-4 uppercase tracking-widest flex items-center gap-2"><Terminal size={14}/> SQL Table Definitions</h4>
                      <pre className="text-blue-300 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre">
                          {sqlSchema}
                      </pre>
                  </div>
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
                      <Info className="text-amber-600 shrink-0" size={20} />
                      <p className="text-[10px] text-amber-800 font-medium leading-relaxed uppercase">
                          Utilize este Schema para criar as tabelas no seu servidor PostgreSQL. 
                          A aplicação utiliza UUIDs para garantir a integridade referencial entre múltiplos computadores.
                      </p>
                  </div>
              </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-300">
                <div className="bg-blue-50 p-10 rounded-[3rem] border-2 border-blue-100 flex flex-col items-center text-center">
                    <div className="bg-white p-6 rounded-full shadow-2xl mb-8 border-4 border-blue-50"><Server className="text-[#336791]" size={56} /></div>
                    <h3 className="text-3xl font-black text-[#336791] uppercase tracking-tight mb-4">PostgreSQL Instance</h3>
                    <p className="text-blue-700/80 text-sm max-w-md leading-relaxed mb-10 font-medium">Ligue este PC a um Servidor SQL para sincronizar transações e tabelas relacionais em tempo real.</p>
                    
                    {!syncKey ? (
                        <div className="space-y-6 w-full max-w-md">
                            <button onClick={() => { setIsActivating(true); onCreateSyncKey(); }} disabled={isActivating} className="w-full bg-[#336791] text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isActivating ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} 
                                START NEW SQL INSTANCE
                            </button>
                            <div className="flex gap-2">
                                <input type="text" placeholder="SQL Instance ID..." className="flex-1 px-5 py-4 border-2 border-blue-200 rounded-2xl font-bold bg-white outline-none focus:border-[#336791] transition-all uppercase tracking-widest text-sm" value={manualSyncKey} onChange={(e) => setManualSyncKey(e.target.value)} />
                                <button onClick={() => { if(manualSyncKey) { onSetSyncKey(manualSyncKey); setManualSyncKey(''); } }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">CONNECT</button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] border-2 border-blue-200 shadow-2xl space-y-6">
                            <div className="text-left">
                                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Key size={14}/> DB_CONNECTION_STRING (ID)</label>
                                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                                    <code className="text-slate-900 font-black tracking-widest text-lg">{syncKey}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(syncKey); alert("Copiado!"); }} className="p-3 text-slate-300 hover:text-[#336791] transition-all"><Copy size={20}/></button>
                                </div>
                            </div>
                            <div className="bg-[#0c1621] p-6 rounded-2xl flex items-center gap-4 text-left shadow-xl">
                                <Terminal className="text-emerald-500" size={32} />
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Estado da Ligação</p>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">ESTABLISHED (Read/Write)</p>
                                </div>
                                <ShieldCheck className="text-emerald-500 ml-auto" size={24} />
                            </div>
                            <button onClick={() => onSetSyncKey(null)} className="w-full text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 underline transition-all">Disconnect from SQL Server</button>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex gap-4">
                    <div className="relative flex-1">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Nome do Técnico..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-[#336791] outline-none transition-all uppercase text-sm" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} />
                    </div>
                    <button onClick={() => { if(newTechName) onAddTechnician({ id: crypto.randomUUID(), name: newTechName, password: newTechPassword, avatarColor: 'bg-slate-800' }); setNewTechName(''); }} className="px-10 py-4 bg-[#336791] text-white rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-blue-800 transition-all">Insert Row</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {technicians.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${t.avatarColor} text-white flex items-center justify-center font-black shadow-md`}>{t.name.substring(0, 2).toUpperCase()}</div>
                                <div><p className="font-black text-sm uppercase text-slate-900 leading-none">{t.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">ID: {t.id.substring(0, 8)}...</p></div>
                            </div>
                            <button onClick={() => onRemoveTechnician(t.id)} className="text-slate-300 hover:text-red-600 p-2 transition-all"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-red-600 pl-3">Types Collection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-10 rounded-full ${s.colorClass}`} />
                                    <div><p className="font-black text-sm uppercase text-slate-900">{s.name}</p></div>
                                </div>
                                <button onClick={() => onRemoveService(s.id)} className="text-slate-200 hover:text-red-600 p-2 transition-colors"><Trash2 size={20}/></button>
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
