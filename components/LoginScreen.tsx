
import React, { useState } from 'react';
import { User } from '../types';
import { Truck, ShieldCheck, User as UserIcon, Lock, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'admin' | 'viewer'>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      if (password === '9816') {
        onLogin({
          id: 'u1',
          name: 'Administrador',
          email: 'admin@qlinic.pt',
          role: 'admin'
        });
      } else {
        setError('Palavra-passe incorreta.');
      }
    } else {
      if (password === '2025') {
        onLogin({
          id: 'u2',
          name: 'Visitante',
          email: 'visitante@qlinic.pt',
          role: 'viewer'
        });
      } else {
        setError('Palavra-passe incorreta.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="bg-red-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white">
           <span className="text-white font-black text-2xl tracking-tighter">Q</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Qlinic Dispatch</h1>
        <p className="text-gray-500 mt-2">Gestão de Técnicos Externos</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" />
          Acesso ao Sistema
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Perfil de Acesso</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setRole('admin'); setPassword(''); setError(''); }}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'admin' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Truck size={24} />
                <span className="font-bold text-sm">Gestor</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setRole('viewer'); setPassword(''); setError(''); }}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'viewer' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <UserIcon size={24} />
                <span className="font-bold text-sm">Leitura</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Palavra-passe</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="Introduza o código de acesso"
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            Entrar no Sistema
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Qlinic Dispatch AI. Modo Local.
      </p>
    </div>
  );
};
