
import React, { useState } from 'react';
import { Ticket, RouteAnalysis, Technician, DayStatus } from '../types';
import { analyzeRoute } from '../services/geminiService';
import { Map, Loader2, Navigation, AlertCircle, ExternalLink, XCircle } from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-gray-100 p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2 font-bold">
          <Map className="text-red-600" size={14} /> Cálculo de Logística Baseado em CP7
        </h3>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading || tickets.length < 1}
            className="px-4 py-2 bg-red-600 text-white text-[10px] rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-all uppercase shadow-lg shadow-red-100 font-bold"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />} Analisar Itinerário
          </button>
        )}
      </div>

      {error && <div className="p-2 bg-red-50 text-red-600 rounded-lg text-[10px] flex items-center gap-2 mb-2 font-bold"><AlertCircle size={14} /> {error}</div>}

      {analysis ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-3 mb-3 shrink-0">
            <div className="p-3 bg-red-50/70 rounded-2xl border border-red-100">
              <p className="text-[9px] text-red-500 uppercase font-black tracking-widest mb-1">Tempo Total Condução</p>
              <p className="text-xl text-slate-900 font-black">{analysis.totalTime}</p>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
              <p className="text-[9px] text-blue-500 uppercase font-black tracking-widest mb-1">Distância Estimada</p>
              <p className="text-xl text-slate-900 font-black">{analysis.totalDistance}</p>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 mb-3 custom-scrollbar">
            {analysis.segments.map((segment, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-[10px] font-bold">
                <div className="min-w-0 pr-3">
                  <p className="text-slate-400 uppercase tracking-tighter truncate">A PARTIR DE: <span className="text-slate-900">{segment.from}</span></p>
                  <p className="text-slate-400 uppercase tracking-tighter truncate">DESTINO: <span className="text-slate-900">{segment.to}</span></p>
                </div>
                <div className="shrink-0 text-right bg-white p-1.5 rounded-lg shadow-sm border border-slate-100">
                  <span className="text-red-600 block leading-none mb-1">{segment.estimatedTime}</span>
                  <span className="block text-[8px] text-slate-400 uppercase tracking-widest">{segment.distance}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="shrink-0 flex items-center justify-between p-3 bg-slate-900 rounded-2xl shadow-xl">
            <div className="flex gap-4">
                {analysis.groundingUrls.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] text-white hover:text-red-400 transition-colors uppercase font-black tracking-widest">
                    <Navigation size={14} className="text-red-500" /> ABRIR GPS {analysis.groundingUrls.length > 1 ? idx + 1 : ''}
                  </a>
                ))}
            </div>
            <button onClick={() => setAnalysis(null)} className="flex items-center gap-2 text-[9px] text-slate-400 hover:text-white uppercase font-black tracking-widest transition-all">
                <XCircle size={14} /> Limpar
            </button>
          </div>
        </div>
      ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 mt-2">
             <Map size={32} className="mb-2 opacity-20" />
             <p className="text-[10px] uppercase tracking-[0.2em] font-black">Pronto para calcular rota do dia</p>
          </div>
      )}
    </div>
  );
};
