
import React, { useState } from 'react';
import { Technician, ServiceDefinition, Visor, Vehicle } from '../types';
import { X, Trash2, User, Globe, Truck, Monitor, Wrench, Database, Info, Key, CloudLightning, Palette } from 'lucide-react';

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
  supabaseUrl?: string;
  supabaseKey?: string;
  onSaveSupabaseConfig?: (url: string, key: string) => void;
}

const SERVICE_COLORS = [
    { name: 'Red', class: 'bg-red-600' },
    { name: 'Blue', class: 'bg-blue-600' },
    { name: 'Emerald', class: 'bg-emerald-600' },
    { name: 'Amber', class: 'bg-amber-600' },
    { name: 'Purple', class: 'bg-purple-600' },
    { name: 'Indigo', class: 'bg-indigo-600' },
    { name: 'Slate', class: 'bg-slate-900' },
    { name: 'Rose', class: 'bg-rose-500' },
    { name: 'Orange', class: 'bg-orange-500' },
    { name: 'Teal', class: 'bg-teal-600' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, technicians, services, vehicles, visores,
  onAddTechnician, onRemoveTechnician, onAddService, onRemoveService, onAddVehicle, onRemoveVehicle,
  onAddVisor, onRemoveVisor,
  supabaseUrl = '', supabaseKey = '', onSaveSupabaseConfig
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'service' | 'fleet' | 'cloud' | 'sql'>('tech');
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-red-600');
  
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseKey);

  if (!isOpen) return null;

  const sqlTables = `
-- SCHEMA COMPLETO PARA SUPABASE SQL EDITOR

CREATE TABLE technicians (
    id UUID PRIMARY KEY, 
    name TEXT, 
    password TEXT DEFAULT '1234', 
    avatar_color TEXT
);

CREATE TABLE services (
    id UUID PRIMARY KEY, 
    name TEXT, 
    default_duration INT, 
    color_class TEXT
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY, 
    name TEXT
);

CREATE TABLE visores (
    id UUID PRIMARY KEY, 
    name TEXT
);

CREATE TABLE day_statuses (
    id UUID PRIMARY KEY, 
    technician_id UUID, 
    date DATE, 
    is_overnight BOOLEAN DEFAULT FALSE
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    ticket_number TEXT,
    customer_name TEXT,
    address TEXT,
    locality TEXT,
    service_id UUID REFERENCES services(id),
    vehicle_id UUID REFERENCES vehicles(id),
    visor_id UUID REFERENCES visores(id),
    status TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    technician_ids TEXT[], -- Armazena IDs como array
    process_number TEXT,
    fault_description TEXT,
    duration INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`.trim();

  return (
    <div className="fixed inset-0 bg-[#0c1621]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <div>
               <h2 className="text-2xl text-[#336791] font-black uppercase tracking-tight">Painel de Administração</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestão de Recursos e Sincronização SQL</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 bg-white rounded-full border border-slate-200 transition-all"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-white overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('tech')} className={`min-w-[120px] flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tech' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>Técnicos</button>
          <button onClick={() => setActiveTab('service')} className={`min-w-[120px] flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'service' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/20' : 'text-slate-400'}`}>Serviços</button>
          <button onClick={() => setActiveTab('fleet')} className={`min-w-[120px] flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'fleet' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-emerald-50/20' : 'text-slate-400'}`}>Frota & Visores</button>
          <button onClick={() => setActiveTab('cloud')} className={`min-w-[120px] flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'text-[#336791] border-b-4 border-[#336791] bg-blue-50/20' : 'text-slate-400'}`}>Cloud</button>
          <button onClick={() => setActiveTab('sql')} className={`min-w-[120px] flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sql' ? 'text-amber-600 border-b-4 border-amber-600 bg-amber-50/20' : 'text-slate-400'}`}>SQL Editor</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          
          {activeTab === 'tech' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex gap-4">
                    <div className="relative flex-1">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Nome do Técnico..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-[#336791] outline-none transition-all uppercase text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    </div>
                    <button onClick={() => { if(newName) { onAddTechnician({ id: crypto.randomUUID(), name: newName, password: '1234', avatarColor: 'bg-slate-800' }); setNewName(''); } }} className="px-10 py-4 bg-[#336791] text-white rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-blue-800 transition-all">Registar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Wrench size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Nome do Serviço (ex: Reconstrução)..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 rounded-2xl font-bold bg-white focus:border-red-600 outline-none transition-all uppercase text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <button onClick={() => { if(newName) { onAddService({ id: crypto.randomUUID(), name: newName, defaultDuration: 1, colorClass: selectedColor }); setNewName(''); } }} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-red-800 transition-all">Adicionar</button>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Palette size={14} /> Selecione a cor do serviço:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_COLORS.map(color => (
                                <button 
                                    key={color.class} 
                                    onClick={() => setSelectedColor(color.class)}
                                    className={`w-8 h-8 rounded-full border-4 transition-all ${color.class} ${selectedColor === color.class ? 'border-white ring-2 ring-slate-900 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-10 rounded-lg ${s.colorClass} shadow-inner`} />
                                <p className="font-black text-sm uppercase text-slate-900">{s.name}</p>
                            </div>
                            <button onClick={() => onRemoveService(s.id)} className="text-slate-200 hover:text-red-600 p-2 transition-colors"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'fleet' && (
            <div className="space-y-12 animate-in fade-in duration-300">
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Truck size={16} className="text-emerald-600" /> Gestão de Frota (Veículos)</h3>
                    <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-200 flex gap-4">
                        <input type="text" placeholder="Identificação da Viatura..." className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl font-bold bg-white focus:border-emerald-600 outline-none transition-all uppercase text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        <button onClick={() => { if(newName) { onAddVehicle({ id: crypto.randomUUID(), name: newName }); setNewName(''); } }} className="px-8 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">Registar</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {vehicles.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <span className="font-bold text-sm uppercase text-slate-900">{v.name}</span>
                                <button onClick={() => onRemoveVehicle(v.id)} className="text-slate-300 hover:text-red-600 p-1.5"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Monitor size={16} className="text-blue-600" /> Lista de Visores</h3>
                    <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-200 flex gap-4">
                        <input type="text" placeholder="Nome do Visor/Equipamento..." className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl font-bold bg-white focus:border-blue-600 outline-none transition-all uppercase text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        <button onClick={() => { if(newName) { onAddVisor({ id: crypto.randomUUID(), name: newName }); setNewName(''); } }} className="px-8 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">Adicionar</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {visores.map(vs => (
                            <div key={vs.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <span className="font-bold text-sm uppercase text-slate-900">{vs.name}</span>
                                <button onClick={() => onRemoveVisor(vs.id)} className="text-slate-300 hover:text-red-600 p-1.5"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
                <div className="bg-[#336791]/5 p-8 rounded-[2rem] border-2 border-[#336791]/10">
                    <div className="flex items-center gap-4 mb-6">
                        <Globe className="text-[#336791]" size={32} />
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase">Configuração SQL Cloud</h3>
                            <p className="text-[10px] font-bold text-[#336791] uppercase">Base de Dados PostgreSQL Multi-Posto</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL (Supabase)</label>
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-[#336791] transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Anon Key / API Key</label>
                            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-[#336791] transition-all" />
                        </div>
                        <button onClick={() => onSaveSupabaseConfig?.(url, key)} className="w-full bg-[#336791] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                            <CloudLightning size={18} /> ATIVAR LIGAÇÃO SQL EM TEMPO REAL
                        </button>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'sql' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-white"><Database size={100} /></div>
                      <h4 className="text-amber-500 font-mono text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2"><Key size={14}/> SQL Schema (IMPORTANTE: Copie isto para o SQL Editor do Supabase)</h4>
                      <pre className="text-blue-300 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre custom-scrollbar bg-black/50 p-6 rounded-2xl border border-white/10">
                          {sqlTables}
                      </pre>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
