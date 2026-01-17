
import React, { useState, useEffect } from 'react';
import { User, Technician } from '../types';
import { supabase } from '../services/supabaseClient';
import { Truck, ShieldCheck, User as UserIcon, Lock, ArrowRight, UserCheck, Cloud, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  syncKey: string | null;
  onSetSyncKey: (key: string | null) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, syncKey, onSetSyncKey }) => {
  const [role, setRole] = useState<'admin' | 'viewer' | 'technician'>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showCloudInput, setShowCloudInput] = useState(false);
  const [tempSyncKey, setTempSyncKey] = useState(syncKey || '');
  const [isLoadingTechs, setIsLoadingTechs] = useState(false);

  useEffect(() => {
    // Carrega técnicos diretamente do Supabase ao montar o componente
    const loadTechs = async () => {
      setIsLoadingTechs(true);
      try {
        const { data, error } = await supabase.from('technicians').select('*');
        if (error) throw error;
        if (data) {
          setTechnicians(data as Technician[]);
        }
      } catch (err) {
        console.error("Erro ao carregar técnicos:", err);
        // Fallback: Tenta carregar do localStorage se a API falhar (modo offline)
        const saved = localStorage.getItem('local_technicians');
        if (saved) setTechnicians(JSON.parse(saved));
      } finally {
        setIsLoadingTechs(false);
      }
    };
    loadTechs();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'technician' && !selectedTechId) {
      setError('Selecione o seu nome.');
      return;
    }

    const tech = technicians.find(t => t.id === selectedTechId);

    if (role === 'admin') {
      if (password === '9816') {
        onLogin({ id: 'u1', name: 'Administrador', email: 'admin@qlinic.pt', role: 'admin' });
      } else setError('PIN Administrador Incorreto.');
    } else if (role === 'viewer') {
      if (password === '2025') {
        onLogin({ id: 'u2', name: 'Visitante', email: 'view@qlinic.pt', role: 'viewer' });
      } else setError('Acesso negado.');
    } else if (role === 'technician') {
      const correctPassword = tech?.password || '1234';
      if (password === correctPassword) {
        onLogin({ 
          id: `u-${selectedTechId}`, 
          name: tech?.name || 'Técnico', 
          email: 'tech@qlinic.pt', 
          role: 'technician',
          technicianId: selectedTechId 
        });
      } else setError('PIN Incorreto.');
    }
  };

  const handleApplyCloudKey = () => {
      onSetSyncKey(tempSyncKey);
      setShowCloudInput(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased overflow-y-auto">
      <div className="mb-6 sm:mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-red-600 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-200 border-4 border-white rotate-3">
           <span className="text-white text-2xl sm:text-3xl font-black tracking-tighter">M</span>
        </div>
        <h1 className="text-3xl sm:text-4xl text-slate-900 tracking-tight font-black uppercase">Balanças Marques</h1>
        <p className="text-slate-400 mt-2 font-bold tracking-widest uppercase text-[10px]">Logistics Management System</p>
      </div>
      
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        
        {/* Cloud Status / Sync Setup */}
        <div className="mb-8">
            {!syncKey && !showCloudInput ? (
                <button onClick={() => setShowCloudInput(true)} className="w-full bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                    <Cloud size={16} /> Ligar à Nuvem do Gestor
                </button>
            ) : syncKey && !showCloudInput ? (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-1.5 rounded-full text-white shadow-sm shadow-emerald-200"><CheckCircle2 size={14} /></div>
                        <div>
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Cloud Ativa</p>
                            <p className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{syncKey}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCloudInput(true)} className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline">Alterar</button>
                </div>
            ) : (
                <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 space-y-4 animate-in zoom-in-95 duration-300">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Key size={14}/> Sincronizar Base de Dados</p>
                    <div className="flex gap-2">
                        <input type="text" value={tempSyncKey} onChange={(e) => setTempSyncKey(e.target.value)} placeholder="Chave da Nuvem..." className="flex-1 px-4 py-3 rounded-xl border-2 border-emerald-200 font-bold text-xs uppercase outline-none focus:border-emerald-500 bg-white" />
                        <button onClick={handleApplyCloudKey} className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-200">Ligar</button>
                    </div>
                    <p className="text-[9px] text-emerald-600/70 font-bold leading-relaxed">Insira a chave fornecida pelo gestor para aceder à agenda partilhada.</p>
                    <button onClick={() => setShowCloudInput(false)} className="text-[9px] font-black text-slate-400 uppercase w-full text-center hover:text-slate-600 transition-colors">Voltar</button>
                </div>
            )}
        </div>

        <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Autenticação</span>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => { setRole('admin'); setPassword(''); setError(''); }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'admin' ? 'border-red-600 bg-red-50 text-red-700 shadow-md scale-105' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <ShieldCheck size={20} />
                <span className="text-[9px] font-black uppercase">Gestor</span>
              </button>
              
              <button type="button" onClick={() => { setRole('technician'); setPassword(''); setError(''); }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'technician' ? 'border-red-600 bg-red-50 text-red-700 shadow-md scale-105' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <Truck size={20} />
                <span className="text-[9px] font-black uppercase">Técnico</span>
              </button>

              <button type="button" onClick={() => { setRole('viewer'); setPassword(''); setError(''); }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'viewer' ? 'border-red-600 bg-red-50 text-red-700 shadow-md scale-105' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <UserIcon size={20} />
                <span className="text-[9px] font-black uppercase">View</span>
              </button>
            </div>
          </div>

          {role === 'technician' && (
            <div className="space-y-2 animate-in slide-in-from-left-4 duration-500">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quem é você?</label>
                <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select required value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)} disabled={isLoadingTechs}
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 font-bold bg-slate-50 text-slate-900 text-sm appearance-none transition-all shadow-inner disabled:opacity-50">
                        <option value="">{isLoadingTechs ? 'A carregar equipa...' : 'Selecione o seu nome...'}</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Acesso (PIN)</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl outline-none transition-all font-bold bg-slate-50 text-slate-900 shadow-inner ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-red-600'}`}
                    placeholder="PIN" />
            </div>
            {error && <p className="text-red-500 text-[9px] font-black uppercase mt-2 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl transition-all shadow-2xl shadow-red-100 active:scale-95 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px]">
            Entrar no Sistema
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
      
      <div className="mt-10 flex flex-col items-center gap-1 opacity-40">
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">&copy; Balanças Marques &bull; Logistics</p>
        <p className="text-[8px] text-slate-400 font-bold">BRAGA, PORTUGAL</p>
      </div>
    </div>
  );
};
