
import React, { useState, useEffect } from 'react';
import { User, Technician } from '../types';
import { Truck, ShieldCheck, User as UserIcon, Lock, ArrowRight, UserCheck, Cloud, Key, RefreshCw } from 'lucide-react';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCloudInput, setShowCloudInput] = useState(false);
  const [tempSyncKey, setTempSyncKey] = useState(syncKey || '');

  useEffect(() => {
    const saved = localStorage.getItem('local_technicians');
    if (saved) setTechnicians(JSON.parse(saved));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'technician' && !selectedTechId) {
      setError('Por favor, selecione o seu nome.');
      return;
    }

    const tech = technicians.find(t => t.id === selectedTechId);

    if (role === 'admin') {
      if (password === '9816') {
        onLogin({ id: 'u1', name: 'Administrador', email: 'admin@qlinic.pt', role: 'admin' });
      } else setError('Palavra-passe incorreta.');
    } else if (role === 'viewer') {
      if (password === '2025') {
        onLogin({ id: 'u2', name: 'Visitante', email: 'view@qlinic.pt', role: 'viewer' });
      } else setError('Palavra-passe incorreta.');
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
      } else setError('PIN incorreto.');
    }
  };

  const handleApplyCloudKey = () => {
      onSetSyncKey(tempSyncKey);
      setShowCloudInput(false);
      // Recarregar técnicos após ligar cloud
      setTimeout(() => {
          const saved = localStorage.getItem('local_technicians');
          if (saved) setTechnicians(JSON.parse(saved));
      }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased overflow-y-auto">
      <div className="mb-6 sm:mb-10 text-center">
        <div className="bg-red-600 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-200 border-4 border-white rotate-3">
           <span className="text-white text-2xl sm:text-3xl font-black tracking-tighter">M</span>
        </div>
        <h1 className="text-3xl sm:text-4xl text-slate-900 tracking-tight font-black uppercase">Balanças Marques</h1>
        <p className="text-slate-400 mt-2 font-bold tracking-widest uppercase text-[10px]">Logistics Management System</p>
      </div>
      
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        
        {/* Cloud Status / Setup */}
        <div className="mb-8">
            {!syncKey && !showCloudInput ? (
                <button onClick={() => setShowCloudInput(true)} className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                    <Cloud size={14} /> Ligar à Nuvem (Sincronizar)
                </button>
            ) : syncKey && !showCloudInput ? (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <Cloud className="text-emerald-500" size={14} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cloud Ativa: {syncKey}</span>
                    </div>
                    <button onClick={() => setShowCloudInput(true)} className="text-[9px] font-bold text-red-600 uppercase underline">Alterar</button>
                </div>
            ) : (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in duration-300">
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Key size={12}/> Chave de Sincronização</p>
                    <div className="flex gap-2">
                        <input type="text" value={tempSyncKey} onChange={(e) => setTempSyncKey(e.target.value)} placeholder="Ex: 132435..." className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-emerald-200" />
                        <button onClick={handleApplyCloudKey} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase">Ligar</button>
                    </div>
                    <button onClick={() => setShowCloudInput(false)} className="text-[9px] font-bold text-slate-400 uppercase w-full text-center">Cancelar</button>
                </div>
            )}
        </div>

        <h2 className="text-lg text-slate-900 mb-6 flex items-center gap-3 font-bold uppercase tracking-tight border-b border-slate-100 pb-4">
          <ShieldCheck className="text-red-600" size={22} />
          Acesso Reservado
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quem é você?</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => { setRole('admin'); setPassword(''); setError(''); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'admin' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <ShieldCheck size={18} />
                <span className="text-[8px] font-black uppercase tracking-tight">Gestor</span>
              </button>
              
              <button type="button" onClick={() => { setRole('technician'); setPassword(''); setError(''); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'technician' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <Truck size={18} />
                <span className="text-[8px] font-black uppercase tracking-tight">Técnico</span>
              </button>

              <button type="button" onClick={() => { setRole('viewer'); setPassword(''); setError(''); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'viewer' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <UserIcon size={18} />
                <span className="text-[8px] font-black uppercase tracking-tight">View</span>
              </button>
            </div>
          </div>

          {role === 'technician' && (
            <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Selecione o seu nome</label>
                <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select required value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 font-bold bg-slate-50 text-slate-900 text-sm appearance-none transition-all">
                        <option value="">Nome do Técnico...</option>
                        {technicians.length > 0 ? (
                            technicians.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)
                        ) : (
                            <option value="">Ligue à Cloud para ver técnicos</option>
                        )}
                    </select>
                </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Código de Acesso</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl outline-none transition-all font-bold bg-slate-50 text-slate-900 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-red-600'}`}
                    placeholder="PIN" />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{error}</p>}
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl transition-all shadow-xl shadow-red-200 active:scale-95 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px]">
            Confirmar e Entrar
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Balanças Marques &bull; Braga, PT
      </p>
    </div>
  );
};
