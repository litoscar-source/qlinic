import React, { useState } from 'react';
import { Ticket, RouteAnalysis } from '../types';
import { analyzeRoute } from '../services/geminiService';
import { Map, Loader2, Navigation, AlertCircle } from 'lucide-react';

interface RouteAnalyzerProps {
  tickets: Ticket[];
  technicianName: string;
}

export const RouteAnalyzer: React.FC<RouteAnalyzerProps> = ({ tickets, technicianName }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (tickets.length < 2) {
      setError("Adicione pelo menos 2 tickets para calcular a rota.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRoute(tickets, technicianName);
      setAnalysis(result);
    } catch (err) {
      setError("Falha ao analisar rota. Verifique a chave API ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Map className="text-indigo-600" size={20} />
          Análise de Rota Inteligente
        </h3>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading || tickets.length < 2}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />}
            Calcular Tempos
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div>
              <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Tempo Total</p>
              <p className="text-xl font-bold text-indigo-900">{analysis.totalTime}</p>
            </div>
            <div className="w-px bg-indigo-200"></div>
            <div>
              <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Distância Total</p>
              <p className="text-xl font-bold text-indigo-900">{analysis.totalDistance}</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
            <div className="space-y-6 relative">
              {analysis.segments.map((segment, idx) => (
                <div key={idx} className="ml-10 relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 z-10"></div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">De: {segment.from}</p>
                        <p className="text-sm font-medium text-gray-800 mt-1">Para: {segment.to}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          {segment.estimatedTime}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">{segment.distance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {analysis.groundingUrls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Fontes Google Maps:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.groundingUrls.map((url, i) => (
                  <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                  >
                    Ver no Mapa {i+1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button 
                onClick={() => setAnalysis(null)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
                Limpar análise
            </button>
          </div>
        </div>
      )}
    </div>
  );
};