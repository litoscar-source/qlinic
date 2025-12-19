
import React, { useState, useMemo } from 'react';
import { Ticket, DayStatus, Technician, ServiceDefinition, Visor } from '../types';
import { X, Download, PieChart, TrendingUp, Calendar, Users, Moon, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Printer, Monitor } from 'lucide-react';
import { format, isSameMonth, isSameDay, isSameWeek, subYears, addMonths, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
  visores?: Visor[];
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  tickets,
  dayStatuses,
  technicians,
  services,
  visores = []
}) => {
  const [activeView, setActiveView] = useState<'kpi' | 'visores'>('kpi');
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!isOpen) return [];
    return tickets.filter(t => {
      const matchTech = !selectedTechId || t.technicianIds.includes(selectedTechId);
      let matchTime = false;
      
      if (period === 'daily') matchTime = isSameDay(t.date, selectedDate);
      else if (period === 'weekly') matchTime = isSameWeek(t.date, selectedDate, { weekStartsOn: 1 });
      else matchTime = isSameMonth(t.date, selectedDate);
      
      return matchTech && matchTime;
    });
  }, [tickets, period, selectedDate, selectedTechId, isOpen]);

  // Lógica específica para o Relatório de Visores (entre datas)
  const visorReportData = useMemo(() => {
      if (!isOpen) return [];
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      
      return tickets.filter(t => {
          const service = services.find(s => s.id === t.serviceId);
          const isRecon = service?.name.toLowerCase().includes('reconstrução');
          const inDate = isWithinInterval(new Date(t.date), { start, end });
          return isRecon && inDate && t.visorId;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tickets, services, startDate, endDate, isOpen]);

  const kpis = useMemo(() => {
    if (!isOpen) return { totalServices: 0, totalDuration: 0, totalTravelTime: 0, overnights: 0, avgDuration: 0 };
    
    const totalServices = filteredData.length;
    const totalDuration = filteredData.reduce((acc, t) => acc + t.duration, 0);
    const totalTravelTime = filteredData.reduce((acc, t) => acc + (t.travelTimeMinutes || 30), 0) / 60;
    
    const overnights = dayStatuses.filter(ds => {
      const matchTech = !selectedTechId || ds.technicianId === selectedTechId;
      let matchTime = false;
      if (period === 'daily') matchTime = isSameDay(ds.date, selectedDate);
      else if (period === 'weekly') matchTime = isSameWeek(ds.date, selectedDate, { weekStartsOn: 1 });
      else matchTime = isSameMonth(ds.date, selectedDate);
      return matchTech && matchTime && ds.isOvernight;
    }).length;

    return {
      totalServices,
      totalDuration,
      totalTravelTime,
      overnights,
      avgDuration: totalServices > 0 ? totalDuration / totalServices : 0,
    };
  }, [filteredData, dayStatuses, period, selectedDate, selectedTechId, isOpen]);

  const serviceTypeStats = useMemo(() => {
    if (!isOpen) return [];
    const stats: Record<string, { count: number, hours: number }> = {};
    filteredData.forEach(t => {
      const s = services.find(svc => svc.id === t.serviceId);
      const name = s ? s.name : 'Outros';
      if (!stats[name]) stats[name] = { count: 0, hours: 0 };
      stats[name].count++;
      stats[name].hours += t.duration;
    });
    return Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  }, [filteredData, services, isOpen]);

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1));

  const printVisorReport = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const visorHtmlRows = visorReportData.map(t => {
          const visor = visores.find(v => v.id === t.visorId);
          const techs = technicians.filter(tech => t.technicianIds.includes(tech.id)).map(te => te.name).join(', ');
          return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-size: 12px;">${format(new Date(t.date), 'dd/MM/yyyy')}</td>
                <td style="padding: 12px; font-size: 12px; font-weight: bold;">${t.customerName}</td>
                <td style="padding: 12px; font-size: 12px; color: #d32f2f;">${t.ticketNumber}</td>
                <td style="padding: 12px; font-size: 12px; background: #fff8e1; font-weight: bold;">${visor?.name || '---'}</td>
                <td style="padding: 12px; font-size: 11px; color: #666;">${techs}</td>
            </tr>
          `;
      }).join('');

      printWindow.document.write(`
        <html>
            <head>
                <title>Relatório de Picking - Visores</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    h1 { color: #d32f2f; margin-bottom: 5px; }
                    .header { border-bottom: 2px solid #d32f2f; margin-bottom: 20px; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f5f5f5; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REQUISIÇÃO DE VISORES</h1>
                    <p style="margin: 0; color: #666;">Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Ticket</th>
                            <th>Visor / Equipamento</th>
                            <th>Técnicos Alocados</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${visorHtmlRows || '<tr><td colspan="5" style="text-align:center; padding: 40px;">Sem reconstruções agendadas para este período.</td></tr>'}
                    </tbody>
                </table>
                <p style="margin-top: 40px; font-size: 10px; color: #999; text-align: center;">Gerado por Qlinic Dispatch Pro em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh] border border-slate-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-200">
                <PieChart className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-xl text-slate-900 font-bold uppercase tracking-tight">Centro de Relatórios</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Performance & Logística</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 transition-all p-2 bg-white rounded-full border border-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-white">
            <button onClick={() => setActiveView('kpi')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-4 ${activeView === 'kpi' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400'}`}>Indicadores KPI</button>
            <button onClick={() => setActiveView('visores')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-4 ${activeView === 'visores' ? 'border-red-600 text-red-600 bg-red-50/20' : 'border-transparent text-slate-400'}`}>Logística de Visores</button>
        </div>

        {activeView === 'kpi' ? (
          <>
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center gap-4 shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['daily', 'weekly', 'monthly'] as PeriodType[]).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${period === p ? 'bg-white text-red-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{p === 'daily' ? 'Dia' : p === 'weekly' ? 'Semana' : 'Mês'}</button>
                    ))}
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={16}/></button>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input type="month" value={format(selectedDate, 'yyyy-MM')} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="text-[11px] font-bold uppercase outline-none bg-transparent" />
                    </div>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={16}/></button>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <Users size={16} className="text-slate-400" />
                    <select value={selectedTechId || ''} onChange={(e) => setSelectedTechId(e.target.value || null)} className="text-[11px] font-bold uppercase outline-none bg-transparent">
                        <option value="">Equipa Completa</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">Total Serviços</p>
                        <p className="text-4xl text-slate-900 font-bold">{kpis.totalServices}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">Horas em Cliente</p>
                        <p className="text-4xl text-red-600 font-bold">{Math.round(kpis.totalDuration)}h</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">Viagem Estimada</p>
                        <p className="text-4xl text-blue-600 font-bold">{kpis.totalTravelTime.toFixed(1)}h</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">Dormidas Fora</p>
                        <div className="flex items-center gap-3">
                            <p className="text-4xl text-orange-500 font-bold">{kpis.overnights}</p>
                            <Moon className="text-orange-300" size={24} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-900 font-bold uppercase text-[11px] tracking-widest mb-8 flex items-center gap-3">
                            <TrendingUp size={18} className="text-red-600" /> Distribuição de Serviços
                        </h3>
                        <div className="space-y-6">
                            {serviceTypeStats.map(([name, stat]) => {
                                const percent = kpis.totalServices > 0 ? (stat.count / kpis.totalServices) * 100 : 0;
                                return (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-800 font-bold uppercase text-[10px] tracking-tight">{name}</span>
                                            <span className="text-slate-400 font-bold text-[10px]">{stat.count} ({Math.round(percent)}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                                            <div className="bg-red-600 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-900 font-bold uppercase text-[11px] tracking-widest mb-8 flex items-center gap-3">
                            <Users size={18} className="text-blue-600" /> Ranking de Performance
                        </h3>
                        <div className="space-y-4">
                            {technicians.map(tech => {
                                const tTickets = filteredData.filter(t => t.technicianIds.includes(tech.id)).length;
                                return (
                                    <div key={tech.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full ${tech.avatarColor} text-[10px] flex items-center justify-center text-white font-bold`}>{tech.name.substring(0,2).toUpperCase()}</div>
                                            <span className="text-slate-800 font-bold text-xs uppercase">{tech.name}</span>
                                        </div>
                                        <span className="text-slate-900 font-bold text-xs">{tTickets} Op.</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-50/50 p-8 overflow-hidden">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 flex items-center gap-6">
                <div className="flex flex-col">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Data Início</label>
                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs outline-none focus:ring-4 focus:ring-red-100" />
                </div>
                <div className="flex flex-col">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Data Fim</label>
                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs outline-none focus:ring-4 focus:ring-red-100" />
                </div>
                <button onClick={printVisorReport} className="ml-auto bg-red-600 text-white px-8 py-3 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Printer size={16} /> Imprimir Lista de Picking
                </button>
             </div>

             <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Monitor size={14} className="text-red-600" /> Visores para Reconstruções ({visorReportData.length})
                    </h4>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0">
                         <tr>
                            <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Data</th>
                            <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Cliente</th>
                            <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Ticket</th>
                            <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Equipamento (Visor)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {visorReportData.map(t => {
                            const visor = visores.find(v => v.id === t.visorId);
                            return (
                               <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                                  <td className="px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-tight">{t.customerName}</td>
                                  <td className="px-6 py-4 text-xs font-bold text-red-600">{t.ticketNumber}</td>
                                  <td className="px-6 py-4">
                                     <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg text-[10px] font-bold uppercase border border-amber-200 shadow-sm">
                                        {visor?.name || 'Indefinido'}
                                     </span>
                                  </td>
                               </tr>
                            );
                         })}
                         {visorReportData.length === 0 && (
                            <tr>
                               <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">Sem dados para o intervalo selecionado.</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
