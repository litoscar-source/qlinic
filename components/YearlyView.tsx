
import React from 'react';
import { format, startOfYear, eachMonthOfInterval, endOfYear, isSameMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ticket } from '../types';
import { LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';

interface YearlyViewProps {
  currentDate: Date;
  tickets: Ticket[];
  onSelectMonth: (date: Date) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({ currentDate, tickets, onSelectMonth }) => {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const getMonthStats = (month: Date) => {
    const monthTickets = tickets.filter(t => isSameMonth(new Date(t.date), month));
    return {
      count: monthTickets.length,
      intensity: Math.min(monthTickets.length / 20, 1) // Baseado em 20 serviços/mês como 100%
    };
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-sm custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <LayoutGrid className="text-red-600" size={24} />
            <h2 className="text-2xl font-black uppercase tracking-tight">Panorama Anual {format(currentDate, 'yyyy')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map(month => {
          const { count, intensity } = getMonthStats(month);
          return (
            <button
              key={month.toISOString()}
              onClick={() => onSelectMonth(month)}
              className="group p-6 rounded-[2.5rem] bg-slate-50 border border-slate-200 hover:border-red-600 hover:shadow-xl transition-all flex flex-col items-center text-center relative overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-5 transition-opacity"
                style={{ opacity: intensity * 0.1 }}
              />
              
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{format(month, 'MMMM', { locale: pt })}</span>
              <div className="text-4xl font-black text-slate-900 group-hover:text-red-600 transition-colors mb-4">{count}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Intervenções</div>
              
              <div className="mt-6 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-red-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${intensity * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 p-8 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="bg-red-600 p-4 rounded-2xl shadow-lg rotate-3"><CalendarIcon size={32} /></div>
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Resumo do Ano</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter">{tickets.filter(t => isSameMonth(new Date(t.date), currentDate)).length} Serviços agendados para este ano</h3>
            </div>
         </div>
      </div>
    </div>
  );
};
