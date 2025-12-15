
import React, { useState } from 'react';
import { Ticket, RouteAnalysis, Technician } from '../types';
import { analyzeRoute } from '../services/geminiService';
import { Map, Loader2, Navigation, AlertCircle, Calculator, Wrench, Car } from 'lucide-react';

interface RouteAnalyzerProps {
  dayTickets: Ticket[];
  technicians: Technician[];
}

export const RouteAnalyzer: React.FC<RouteAnalyzerProps> = ({ dayTickets, technicians }) => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [analyses, setAnalyses] = useState<Record<string, RouteAnalysis>>({});
  const [error, setError] = useState<string | null>(null);

  // Filter technicians that actually have tickets this day
  const activeTechnicianIds = Array.from(new Set(dayTickets.flatMap(t => t.technicianIds)));
  const activeTechnicians = technicians.filter(t => activeTechnicianIds.includes(t.id));

  const handleAnalyzeTechnician = async (tech: Technician) => {
    const techTickets = dayTickets.filter(t => t.technicianIds.includes(tech.id));
    
    if (techTickets.length < 2) {
      setError(`O técnico ${tech.name} precisa de pelo menos 2 serviços para rota.`);
      return;
    }

    setLoadingMap(prev => ({ ...prev, [tech.id]: true }));
    setError(null);

    try {
      const result = await analyzeRoute(techTickets, tech.name);
      setAnalyses(prev => ({ ...prev, [tech.id]: result }));
    } catch (err: any) {
      setError(err.message || "Erro ao calcular rota.");
    } finally {
      setLoadingMap(prev => ({ ...prev, [tech.id]: false }));
    }
  };

  if (activeTechnicians.length === 0) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
            Sem técnicos alocados para este dia.
        </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <Map className="text-indigo-600" size={20} />
         <h3 className="font-bold text-gray-800">Otimização de Rotas</h3>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {activeTechnicians.map(tech => {
            const isLoading = loadingMap[tech.id];
            const analysis = analyses[tech.id];
            const techTicketsCount = dayTickets.filter(t => t.technicianIds.includes(tech.id)).length;

            return (
                <div key={tech.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Header */}
                    <div className="p-3 bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${tech.avatarColor}`}>
                                {tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">{tech.name}</p>
                                <p className="text-xs text-gray-500">{techTicketsCount} paragens</p>
                            </div>
                        </div>
                        
                        {!analysis && (
                            <button
                                onClick={() => handleAnalyzeTechnician(tech)}
                                disabled={isLoading || techTicketsCount < 2}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Calculator size={14} />}
                                Calcular
                            </button>
                        )}
                    </div>

                    {/* Analysis Result */}
                    {analysis && (
                        <div className="p-3 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <div className="flex items-center gap-1 text-blue-600 mb-1">
                                        <Car size={12} />
                                        <span className="text-[10px] font-bold uppercase">Deslocação</span>
                                    </div>
                                    <p className="text-sm font-bold text-blue-900">{analysis.travelTime}</p>
                                    <p className="text-[10px] text-blue-700">{analysis.totalDistance}</p>
                                </div>
                                <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                    <div className="flex items-center gap-1 text-orange-600 mb-1">
                                        <Wrench size={12} />
                                        <span className="text-[10px] font-bold uppercase">Serviço</span>
                                    </div>
                                    <p className="text-sm font-bold text-orange-900">{analysis.serviceTime}</p>
                                </div>
                            </div>
                            
                            <div className="relative pl-3 border-l-2 border-gray-200 space-y-4">
                                {analysis.segments.map((seg, idx) => (
                                    <div key={idx} className="relative text-xs">
                                        <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-gray-500 w-2/3 truncate pr-2">De: {seg.from}</span>
                                            <span className="font-bold text-green-600">{seg.travelTime}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-100">
                                <a 
                                    href={analysis.groundingUrls[0]} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <Navigation size={12} /> Ver Mapa
                                </a>
                                <button 
                                    onClick={() => setAnalyses(prev => {
                                        const next = {...prev};
                                        delete next[tech.id];
                                        return next;
                                    })}
                                    className="text-xs text-gray-400 hover:text-red-500"
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
