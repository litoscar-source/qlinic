
import React, { useState, useEffect } from 'react';
import { User, Technician } from '../types';
import { Truck, ShieldCheck, User as UserIcon, Lock, ArrowRight, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'admin' | 'viewer' | 'technician'>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);

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
      } else setError('Palavra-passe de Gestor incorreta.');
    } else if (role === 'viewer') {
      if (password === '2025') {
        onLogin({ id: 'u2', name: 'Visitante', email: 'view@qlinic.pt', role: 'viewer' });
      } else setError('Palavra-passe de Visualizador incorreta.');
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
      } else setError('PIN do Técnico incorreto.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-red-200 border-4 border-white rotate-3">
           <span className="text-white text-3xl font-black tracking-tighter">Q</span>
        </div>
        <h1 className="text-4xl text-slate-900 tracking-tight font-black uppercase">Qlinic Dispatch</h1>
        <p className="text-slate-400 mt-2 font-bold tracking-widest uppercase text-[10px]">Gestão de Intervenções Técnicas</p>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 animate-in zoom-in duration-500">
        <h2 className="text-xl text-slate-900 mb-8 flex items-center gap-3 font-bold uppercase tracking-tight">
          <ShieldCheck className="text-red-600" size={24} />
          Acesso ao Sistema
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Utilizador</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => { setRole('admin'); setPassword(''); setError(''); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'admin' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <ShieldCheck size={20} />
                <span className="text-[9px] font-black uppercase tracking-tight">Gestor</span>
              </button>
              
              <button type="button" onClick={() => { setRole('technician'); setPassword(''); setError(''); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'technician' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <Truck size={20} />
                <span className="text-[9px] font-black uppercase tracking-tight">Técnico</span>
              </button>

              <button type="button" onClick={() => { setRole('viewer'); setPassword(''); setError(''); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'viewer' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <UserIcon size={20} />
                <span className="text-[9px] font-black uppercase tracking-tight">View</span>
              </button>
            </div>
          </div>

          {role === 'technician' && (
            <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identificação do Técnico</label>
                <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select required value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 font-bold bg-slate-50 text-slate-900 text-sm appearance-none transition-all">
                        <option value="">Selecione o seu nome...</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Palavra-passe / PIN</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl outline-none transition-all font-bold bg-slate-50 text-slate-900 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-red-600'}`}
                    placeholder="••••" />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{error}</p>}
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl transition-all shadow-xl shadow-red-200 active:scale-95 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px]">
            Iniciar Sessão
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
      
      <p className="mt-10 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] animate-in fade-in duration-1000">
        &copy; {new Date().getFullYear()} Qlinic Dispatch AI &bull; Braga, Portugal
      </p>
    </div>
  );
};
