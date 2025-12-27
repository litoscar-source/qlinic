
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Trash2, User, Lock, Cloud, Key, RefreshCw, Copy, Loader2, Database, Info, HardDrive, ShieldCheck, Terminal, Server, Globe } from 'lucide-react';

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
  // Supabase Props
  supabaseUrl?: string;
  supabaseKey?: string;
  onSaveSupabaseConfig?: (url: string, key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, technicians, services, vehicles, visores, syncKey,
  onAddTechnician, onRemoveTechnician, onAddService, onRemoveService, onAddVehicle, onRemoveVehicle,
  onAddVisor, onRemoveVisor, onSetSyncKey, onCreateSyncKey,
  supabaseUrl = '', supabaseKey = '', onSaveSupabaseConfig
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'cloud' | 'sql'>('tech');
  const [newTechName, setNewTechName] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('1234');
  
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseKey);

  if (!isOpen) return null;

  const sqlTables = `
-- CRIE ESTAS TABELAS NO SUPABASE SQL EDITOR
CREATE TABLE technicians (id UUID PRIMARY KEY, name TEXT, password TEXT, avatar_color TEXT);
CREATE TABLE services (id UUID PRIMARY KEY, name TEXT, default_duration INT, color_class TEXT);
CREATE TABLE vehicles (id UUID PRIMARY KEY, name TEXT);
CREATE TABLE day_statuses (id UUID PRIMARY KEY, technicianId UUID, date DATE, isOvernight BOOLEAN);
CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    ticketNumber TEXT,
    customerName TEXT,
    address TEXT,
    serviceId UUID,
    vehicleId UUID,
    status TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    locality TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);`.trim();

  return (
    <div className="fixed inset-0 bg-[#0c1621]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <div>
               <h2 className="text-2xl text-[#336791] font-black uppercase tracking-tight">PostgreSQL Multi-Posto</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronização Cloud via Supabase</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 bg-white rounded-full border border-slate-200 transition-all"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-white">
          <button onClick={() => setActiveTab('tech')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tech' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>Técnicos</button>
          <button onClick={() => setActiveTab('service')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'service' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>Frota & Serviços</button>
          <button onClick={() => setActiveTab('cloud')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-emerald-50/20' : 'text-slate-400'}`}>Ligação Cloud</button>
          <button onClick={() => setActiveTab('sql')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sql' ? 'text-amber-600 border-b-4 border-amber-600 bg-amber-50/20' : 'text-slate-400'}`}>SQL Editor</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          
          {activeTab === 'cloud' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-100">
                    <div className="flex items-center gap-4 mb-6">
                        <Globe className="text-emerald-600" size={32} />
                        <div>
                            <h3 className="text-lg font-black text-emerald-900 uppercase">Configuração Multi-Posto</h3>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Ligue todos os dispositivos à mesma base de dados</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL (Supabase)</label>
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-5 py-3 border-2 border-emerald-200 rounded-xl font-mono text-xs outline-none focus:border-emerald-500 transition-all" placeholder="https://xxxx.supabase.co" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Anon Key / API Key</label>
                            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="w-full px-5 py-3 border-2 border-emerald-200 rounded-xl font-mono text-xs outline-none focus:border-emerald-500 transition-all" placeholder="eyJhbGc..." />
                        </div>
                        <button onClick={() => onSaveSupabaseConfig?.(url, key)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all">
                            ATIVAR SINCRONIZAÇÃO EM TEMPO REAL
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
                    <Info className="text-blue-600 shrink-0" size={20} />
                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-700 font-bold uppercase">Como aceder noutros postos?</p>
                        <p className="text-[9px] text-slate-500 leading-relaxed uppercase">
                            1. Crie uma conta gratuita no <b>Supabase.com</b><br/>
                            2. Cole as credenciais acima nos outros computadores e telemóveis.<br/>
                            3. Todos os dados serão partilhados instantaneamente.
                        </p>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'sql' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl relative">
                      <h4 className="text-amber-500 font-mono text-[10px] mb-4 uppercase tracking-widest">Execute isto no Supabase SQL Editor:</h4>
                      <pre className="text-blue-300 font-mono text-[9px] leading-relaxed overflow-x-auto whitespace-pre">
                          {sqlTables}
                      </pre>
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
                    <button onClick={() => { if(newTechName) onAddTechnician({ id: crypto.randomUUID(), name: newTechName, password: newTechPassword, avatarColor: 'bg-slate-800' }); setNewTechName(''); }} className="px-10 py-4 bg-[#336791] text-white rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-blue-800 transition-all">Registar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {technicians.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${t.avatarColor} text-white flex items-center justify-center font-black shadow-md`}>{t.name.substring(0, 2).toUpperCase()}</div>
                                <span className="font-black text-sm uppercase text-slate-900">{t.name}</span>
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
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-red-600 pl-3">Serviços Disponíveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-10 rounded-full ${s.colorClass}`} />
                                    <p className="font-black text-sm uppercase text-slate-900">{s.name}</p>
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
