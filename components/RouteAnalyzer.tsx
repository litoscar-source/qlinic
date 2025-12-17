import React, { useState } from 'react';
import { Ticket, RouteAnalysis, Technician, DayStatus } from '../types';
import { analyzeRoute } from '../services/geminiService';
import { Map, Loader2, Navigation, AlertCircle, ExternalLink } from 'lucide-react';
import { subDays, isSameDay } from 'date-fns';

interface RouteAnalyzerProps {
  tickets: Ticket[];
  technicians?: Technician[];
  dayStatuses?: DayStatus[];
  technicianName?: string;
}

export const RouteAnalyzer: React.FC<RouteAnalyzerProps> = ({ 
    tickets, 
    technicians, 
    dayStatuses = [],
    technicianName: propTechnicianName 
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPrimaryTechId = () => {
    if (!tickets.length) return null;
    const techCounts: Record<string, number> = {};
    tickets.forEach(t => {
        t.technicianIds.forEach(id => {
            techCounts[id] = (techCounts[id] || 0) + 1;
        });
    });
    return Object.keys(techCounts).reduce((a, b) => techCounts[a] > techCounts[b] ? a : b, Object.keys(techCounts)[0]);
  };

  const getTechnicianName = () => {
      if (propTechnicianName) return propTechnicianName;
      if (!technicians || tickets.length === 0) return 'Técnico';
      const primaryTechId = getPrimaryTechId();
      const tech = technicians.find(t => t.id === primaryTechId);
      return tech ? tech.name : 'Técnico';
  };

  const handleAnalyze = async () => {
    if (tickets.length < 1) {
      setError("Selecione um serviço.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const name = getTechnicianName();
      const techId = getPrimaryTechId();
      const routeDate = tickets[0].date;
      let yesterdayOvernight = false;
      let todayOvernight = false;

      if (techId && routeDate) {
          const yesterday = subDays(routeDate, 1);
          yesterdayOvernight = dayStatuses.some(ds => ds.technicianId === techId && ds.isOvernight && isSameDay(ds.date, yesterday));
          todayOvernight = dayStatuses.some(ds => ds.technicianId === techId && ds.isOvernight && isSameDay(ds.date, routeDate));
      }

      const result = await analyzeRoute(tickets, name, { yesterdayOvernight, todayOvernight });
      setAnalysis(result);
    } catch (err) {
      setError("Erro na rota. Verifique a IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 font-normal">
          <Map className="text-red-600" size={14} /> Logística (Saída: 4705-471)
        </h3>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading || tickets.length < 1}
            className="px-3 py-1.5 bg-red-600 text-white text-[10px] rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-all uppercase shadow-md font-normal"
          >
            {loading ? <Loader2 className="animate-spin" size={12} /> : <Navigation size={12} />} Gerar Rota
          </button>
        )}
      </div>

      {error && <div className="p-2 bg-red-50 text-red-600 rounded text-[10px] flex items-center gap-1 mb-2 font-normal"><AlertCircle size={12} /> {error}</div>}

      {analysis ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-red-50/50 rounded-lg border border-red-100/50 font-normal">
              <p className="text-[9px] text-red-400 uppercase font-normal">Tempo Previsto</p>
              <p className="text-lg text-red-900 font-normal">{analysis.totalTime}</p>
            </div>
            <div className="p-2 bg-red-50/50 rounded-lg border border-red-100/50 font-normal">
              <p className="text-[9px] text-red-400 uppercase font-normal">Distância Total</p>
              <p className="text-lg text-red-900 font-normal">{analysis.totalDistance}</p>
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {analysis.segments.map((segment, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between items-center text-[10px] font-normal">
                <div className="min-w-0 pr-2 font-normal">
                  <p className="text-gray-400 truncate font-normal">PARA: <span className="text-gray-900 font-normal">{segment.to}</span></p>
                </div>
                <div className="shrink-0 text-right font-normal">
                  <span className="text-red-600 font-normal">{segment.estimatedTime}</span>
                  <span className="block text-[8px] text-gray-500 font-normal">{segment.distance}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex gap-2">
                {analysis.groundingUrls.length > 0 && (
                  <a href={analysis.groundingUrls[0]} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-700 hover:underline uppercase font-normal">
                    <ExternalLink size={10} /> Google Maps
                  </a>
                )}
            </div>
            <button onClick={() => setAnalysis(null)} className="text-[10px] text-gray-500 hover:text-red-600 uppercase underline font-normal">Limpar Análise</button>
          </div>
        </div>
      ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-100 font-normal">
             <Map size={24} className="mb-2 opacity-30" />
             <p className="text-[10px] uppercase tracking-tight font-normal">Agendamentos no dia para gerar logística</p>
          </div>
      )}
    </div>
  );
};