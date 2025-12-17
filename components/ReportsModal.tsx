import React, { useState, useMemo } from 'react';
import { Ticket, DayStatus, Technician, ServiceDefinition } from '../types';
import { X, Download, PieChart, TrendingUp, Calendar, Users, Moon, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameMonth, isSameDay, isSameWeek, subYears, addMonths, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
  services: ServiceDefinition[];
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  tickets,
  dayStatuses,
  technicians,
  services
}) => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const lastYearData = useMemo(() => {
    if (!isOpen) return [];
    const lastYearDate = subYears(selectedDate, 1);
    return tickets.filter(t => {
      const matchTech = !selectedTechId || t.technicianIds.includes(selectedTechId);
      let matchTime = false;
      
      if (period === 'daily') matchTime = isSameDay(t.date, lastYearDate);
      else if (period === 'weekly') matchTime = isSameWeek(t.date, lastYearDate, { weekStartsOn: 1 });
      else matchTime = isSameMonth(t.date, lastYearDate);
      
      return matchTech && matchTime;
    });
  }, [tickets, period, selectedDate, selectedTechId, isOpen]);

  const kpis = useMemo(() => {
    if (!isOpen) return { totalServices: 0, totalDuration: 0, totalTravelTime: 0, overnights: 0, avgDuration: 0, lyTotal: 0, diffTotal: 0 };
    
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

    const lyTotal = lastYearData.length;
    const diffTotal = lyTotal > 0 ? ((totalServices - lyTotal) / lyTotal) * 100 : 0;

    return {
      totalServices,
      totalDuration,
      totalTravelTime,
      overnights,
      avgDuration: totalServices > 0 ? totalDuration / totalServices : 0,
      lyTotal,
      diffTotal
    };
  }, [filteredData, lastYearData, dayStatuses, period, selectedDate, selectedTechId, isOpen]);

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

  if (!isOpen) return null;

  const downloadCSV = () => {
    const headers = ["Data", "Tecnico", "Ticket", "Cliente", "Serviço", "Duração Cliente(h)", "Viagem Estimada(min)"];
    const rows = filteredData.map(t => [
      format(t.date, 'yyyy-MM-dd'),
      technicians.filter(tech => t.technicianIds.includes(tech.id)).map(tech => tech.name).join(';'),
      t.ticketNumber,
      `"${t.customerName}"`,
      services.find(s => s.id === t.serviceId)?.name || 'N/A',
      t.duration,
      t.travelTimeMinutes || 30
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `relatorio_kpi_${period}_${format(selectedDate, 'yyyyMMdd')}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                <PieChart className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-xl text-gray-800">Relatórios e KPIs</h2>
                <p className="text-xs text-gray-500 font-medium">Análise de performance e logística</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-wrap items-center gap-4 shrink-0">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['daily', 'weekly', 'monthly'] as PeriodType[]).map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-md text-xs transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Mensal'}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronLeft size={16}/></button>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <input 
                        type="month" 
                        value={format(selectedDate, 'yyyy-MM')} 
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="text-sm outline-none border-none bg-transparent font-medium uppercase"
                    />
                </div>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronRight size={16}/></button>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <Users size={16} className="text-gray-400" />
                <select 
                    value={selectedTechId || ''} 
                    onChange={(e) => setSelectedTechId(e.target.value || null)}
                    className="text-sm outline-none border-none bg-transparent"
                >
                    <option value="">Todos os Técnicos</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>

            <button onClick={downloadCSV} className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-xs transition-all shadow-md">
                <Download size={16} /> Exportar CSV
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total Serviços</p>
                        {kpis.diffTotal !== 0 && (
                            <span className={`flex items-center text-[10px] px-1.5 py-0.5 rounded ${kpis.diffTotal > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {kpis.diffTotal > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(Math.round(kpis.diffTotal))}% (v LY)
                            </span>
                        )}
                    </div>
                    <p className="text-3xl text-gray-800">{kpis.totalServices}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">V Ano Anterior: {kpis.lyTotal}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo em Clientes</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl text-blue-600">{Math.round(kpis.totalDuration)}</p>
                        <span className="text-sm text-gray-400 mb-1">horas</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">Média: {kpis.avgDuration.toFixed(1)}h / serviço</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo em Viagem</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl text-indigo-600">{kpis.totalTravelTime.toFixed(1)}</p>
                        <span className="text-sm text-gray-400 mb-1">horas</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">Estimativa AI</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Noites Fora</p>
                    <div className="flex items-center gap-3">
                        <p className="text-3xl text-orange-600">{kpis.overnights}</p>
                        <div className="bg-orange-50 p-1.5 rounded-lg">
                            <Moon size={20} className="text-orange-500" />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">Dormidas registadas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" />
                        Produtividade por Tipo de Serviço
                    </h3>
                    <div className="space-y-5">
                        {serviceTypeStats.map(([name, stat]) => {
                            const percent = kpis.totalServices > 0 ? (stat.count / kpis.totalServices) * 100 : 0;
                            return (
                                <div key={name}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-gray-700 uppercase tracking-tight text-xs">{name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 text-[10px] uppercase">{stat.hours}h totais</span>
                                            <span className="text-gray-900 font-medium">{stat.count}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {serviceTypeStats.length === 0 && (
                            <div className="text-center py-10 text-gray-400 italic text-sm">Nenhum dado para este período.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-800 mb-6 flex items-center gap-2">
                        <Users size={18} className="text-blue-500" />
                        Performance Individual (No Período)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                                    <th className="pb-3">Técnico</th>
                                    <th className="pb-3 text-center">Serviços</th>
                                    <th className="pb-3 text-center">Horas</th>
                                    <th className="pb-3 text-center">Noites</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {technicians.map(tech => {
                                    const techTickets = filteredData.filter(t => t.technicianIds.includes(tech.id));
                                    const tHours = techTickets.reduce((acc, t) => acc + t.duration, 0);
                                    const tOvernights = dayStatuses.filter(ds => {
                                        let matchTime = false;
                                        if (period === 'daily') matchTime = isSameDay(ds.date, selectedDate);
                                        else if (period === 'weekly') matchTime = isSameWeek(ds.date, selectedDate, { weekStartsOn: 1 });
                                        else matchTime = isSameMonth(ds.date, selectedDate);
                                        return ds.technicianId === tech.id && matchTime && ds.isOvernight;
                                    }).length;

                                    return (
                                        <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full ${tech.avatarColor} text-[8px] flex items-center justify-center text-white`}>
                                                        {tech.name.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <span className="text-gray-700 uppercase tracking-tight text-xs">{tech.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center text-gray-800">{techTickets.length}</td>
                                            <td className="py-3 text-center text-blue-600">{tHours.toFixed(1)}h</td>
                                            <td className="py-3 text-center text-orange-600">{tOvernights}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};