
import React, { useState } from 'react';
import { Ticket, RouteAnalysis, Technician, DayStatus } from '../types';
import { analyzeRoute } from '../services/geminiService';
import { Map, Loader2, Navigation, AlertCircle, XCircle, CheckCircle2, Save, ExternalLink } from 'lucide-react';
import { subDays, isSameDay } from 'date-fns';

interface RouteAnalyzerProps {
  tickets: Ticket[]; // Tickets do dia atual
  allTickets?: Ticket[]; // Todos os tickets para busca histórica
  technicians?: Technician[];
  dayStatuses?: DayStatus[];
  technicianName?: string;
  onApplyTravelTimes?: (updates: { ticketId: string, travelTimeMinutes: number }[]) => void;
  onClose?: () => void;
}

export const RouteAnalyzer: React.FC<RouteAnalyzerProps> = ({ 
    tickets = [], 
    allTickets = [],
    technicians = [], 
    dayStatuses = [],
    technicianName: propTechnicianName,
    onApplyTravelTimes,
    onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<(RouteAnalysis & { travelUpdates: any[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const getPrimaryTechId = () => {
    if (!tickets.length) return null;
    const techCounts: Record<string, number> = {};
    tickets.forEach(t => {
        (t.technicianIds || []).forEach(id => {
            techCounts[id] = (techCounts[id] || 0) + 1;
        });
    });
    const keys = Object.keys(techCounts);
    if (!keys.length) return null;
    return keys.reduce((a, b) => techCounts[a] > techCounts[b] ? a : b);
  };

  const getTechnician = () => {
      const techId = getPrimaryTechId();
      return technicians.find(t => t.id === techId);
  };

  const getTechnicianName = () => {
      if (propTechnicianName) return propTechnicianName;
      const tech = getTechnician();
      return tech ? tech.name : 'Técnico';
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const tech = getTechnician();
      const name = tech?.name || 'Técnico';
      const techId = tech?.id;
      const basePostalCode = tech?.basePostalCode; // CP7 base do técnico
      
      const routeDate = tickets[0]?.date;
      
      let yesterdayOvernight = false;
      let todayOvernight = false;
      let previousDayLastLocation = undefined;

      if (techId && routeDate) {
          const yesterday = subDays(routeDate, 1);
          
          // Verifica se dormiu fora ontem
          yesterdayOvernight = dayStatuses.some(ds => 
            ds.technicianId === techId && 
            ds.isOvernight && 
            isSameDay(ds.date, yesterday)
          );

          // Verifica se dorme fora hoje
          todayOvernight = dayStatuses.some(ds => 
            ds.technicianId === techId && 
            ds.isOvernight && 
            isSameDay(ds.date, routeDate)
          );

          // Se dormiu fora ontem, procura a localização do último serviço de ontem
          if (yesterdayOvernight) {
              const yesterdayTickets = allTickets.filter(t => 
                isSameDay(new Date(t.date), yesterday) && 
                t.technicianIds.includes(techId)
              ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
              
              if (yesterdayTickets.length > 0) {
                  const lastTicket = yesterdayTickets[yesterdayTickets.length - 1];
                  previousDayLastLocation = `${lastTicket.address}, ${lastTicket.locality || ''}`;
              }
          }
      }

      const result = await analyzeRoute(tickets, name, { 
        yesterdayOvernight, 
        todayOvernight, 
        basePostalCode, // Passamos o CP7 base do técnico
        previousDayLastLocation 
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Falha na análise logística.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (analysis?.travelUpdates && onApplyTravelTimes) {
      onApplyTravelTimes(analysis.travelUpdates);
      setApplied(true);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-full max-h-[80vh] w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl"><Navigation size={20} /></div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Otimizador de Percurso</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{getTechnicianName()}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><XCircle size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {!analysis && !loading && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="bg-slate-50 p-8 rounded-full"><Map size={48} className="text-slate-200" /></div>
            <div className="max-w-xs mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Vou calcular o percurso de hoje considerando as dormidas e a base de partida do técnico ({getTechnician()?.basePostalCode || '4705-471'}).
                </p>
            </div>
            <button onClick={handleAnalyze} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2">
              <Navigation size={16} /> Calcular Rota Inteligente
            </button>
          </div>
        )}

        {loading && (
          <div className="py-20 flex flex-col items-center space-y-4">
            <Loader2 className="animate-spin text-red-600" size={48} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A consultar Maps para território nacional...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
            <AlertCircle className="text-red-600" size={24} />
            <p className="text-xs font-bold text-red-800">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Condução</p>
                <p className="text-2xl font-black text-slate-900">{analysis.totalTime}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Distância Total</p>
                <p className="text-2xl font-black text-slate-900">{analysis.totalDistance}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Itinerário Detalhado</p>
              {analysis.segments?.map((seg, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-900 uppercase truncate">{seg.from} <span className="text-red-600 mx-1">→</span> {seg.to}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{seg.distance}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[10px] font-black text-red-600">{seg.estimatedTime}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {analysis.groundingUrls?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {analysis.groundingUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="bg-blue-50 px-3 py-1.5 rounded-lg text-[9px] font-black text-blue-700 border border-blue-200 flex items-center gap-1 shadow-sm">
                    <ExternalLink size={10} /> Maps {i+1}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {analysis && (
        <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
          <button onClick={handleApply} disabled={applied} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl transition-all ${applied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}>
            {applied ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {applied ? 'Tempos de Viagem Aplicados' : 'Gravar Tempos de Viagem'}
          </button>
        </div>
      )}
    </div>
  );
};
