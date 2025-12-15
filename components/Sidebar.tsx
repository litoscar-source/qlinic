
import React from 'react';
import { Technician } from '../types';
import { Users, LayoutDashboard, Truck, Settings } from 'lucide-react';

interface SidebarProps {
  technicians: Technician[];
  selectedTechId: string | null;
  onSelectTech: (id: string | null) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  technicians, 
  selectedTechId, 
  onSelectTech,
  onOpenSettings 
}) => {
  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-gray-100 flex items-center space-x-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Truck className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">TechDispatch</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</p>
          <button 
            onClick={() => onSelectTech(null)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              selectedTechId === null 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Visão Semanal</span>
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 mt-1"
          >
            <Settings size={20} />
            <span className="font-medium">Configurações</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Técnicos</p>
            <Users size={14} className="text-gray-400" />
          </div>
          
          <div className="space-y-1">
            {technicians.length === 0 && (
                <p className="text-xs text-gray-400 px-2 italic">Nenhum técnico. Adicione em Configurações.</p>
            )}
            {technicians.map((tech) => (
              <button
                key={tech.id}
                onClick={() => onSelectTech(tech.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedTechId === tech.id 
                    ? 'bg-blue-50 ring-1 ring-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${tech.avatarColor}`}
                >
                  {tech.name.substring(0, 2).toUpperCase()}
                </div>
                <span className={`font-medium ${selectedTechId === tech.id ? 'text-blue-900' : 'text-gray-700'}`}>
                  {tech.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-sm font-medium opacity-90">Gestão de Equipa</p>
          <p className="text-xs mt-1 opacity-75">Otimize as rotas para poupar tempo.</p>
        </div>
      </div>
    </div>
  );
};
