
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Truck, Lock, User as UserIcon, Eye } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulação de autenticação (Hardcoded para demonstração)
    if (username === 'admin' && password === 'admin') {
      onLogin({ username: 'admin', name: 'Administrador', role: 'admin' });
    } else if (username === 'view' && password === 'view') {
      onLogin({ username: 'view', name: 'Visitante', role: 'viewer' });
    } else {
      setError('Credenciais inválidas. Tente admin/admin ou view/view');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <Truck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">TechDispatch AI</h1>
          <p className="text-blue-100 text-sm mt-2">Gestão de Equipas Técnicas</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utilizador</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="admin"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Entrar
          </button>

          <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
            <p className="font-semibold mb-2">Credenciais Demo:</p>
            <div className="flex justify-center gap-4">
              <span className="bg-gray-50 px-2 py-1 rounded border">admin / admin</span>
              <span className="bg-gray-50 px-2 py-1 rounded border">view / view</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
