
import React, { useState } from 'react';
import { Ticket, Technician, TicketStatus, DayStatus } from '../types';
import { format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { BarChart3, Download, X, Calendar as CalendarIcon, FileSpreadsheet, FileText, Moon, Clock, CheckCircle2, Car, Wrench } from 'lucide-react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, tickets, dayStatuses, technicians }) => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  if (!isOpen) return null;

  // Filter Data
  const interval = { start: parseISO(startDate), end: parseISO(endDate) };
  
  const filteredTickets = tickets.filter(t => 
    isWithinInterval(t.date, interval)
  );

  const filteredDayStatuses = dayStatuses.filter(ds => 
    isWithinInterval(ds.date, interval) && ds.isOvernight
  );

  // KPIs
  const totalServices = filteredTickets.length;
  // duration = horas de serviço
  const totalServiceHours = filteredTickets.reduce((acc, t) => acc + t.duration, 0);
  // travelDuration = horas de viagem (se undefined assume 0)
  const totalTravelHours = filteredTickets.reduce((acc, t) => acc + (t.travelDuration || 0), 0);
  
  const totalResolved = filteredTickets.filter(t => t.status === TicketStatus.RESOLVIDO).length;
  const totalNightsAway = filteredDayStatuses.length;
  
  // Group by Technician
  const techStats = technicians.map(tech => {
    const techTickets = filteredTickets.filter(t => t.technicianIds.includes(tech.id));
    const techNights = filteredDayStatuses.filter(ds => ds.technicianId === tech.id).length;
    
    return {
        name: tech.name,
        count: techTickets.length,
        serviceHours: techTickets.reduce((acc, t) => acc + t.duration, 0),
        travelHours: techTickets.reduce((acc, t) => acc + (t.travelDuration || 0), 0),
        nights: techNights
    };
  }).sort((a,b) => b.count - a.count);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Hora', 'Ticket', 'Processo EPRC', 'Cliente', 'Localidade', 'Técnicos', 'Estado', 'H. Serviço', 'H. Viagem', 'Avaria'];
    const rows = filteredTickets.map(t => [
        format(t.date, 'dd/MM/yyyy'),
        t.scheduledTime,
        t.ticketNumber,
        t.processNumber || '',
        `"${t.customerName}"`,
        t.locality,
        `"${t.technicianIds.map(id => technicians.find(tc => tc.id === id)?.name).join(', ')}"`,
        t.status,
        t.duration.toString().replace('.', ','),
        (t.travelDuration || 0).toString().replace('.', ','),
        `"${t.faultDescription || ''}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Relatórios Mensais</h2>
                    <p className="text-sm text-gray-500">Indicadores de Desempenho (KPI's)</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Início</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Fim</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
                </div>
                <div className="ml-auto flex gap-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        <FileSpreadsheet size={16} /> Exportar Excel
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <CheckCircle2 size={18} />
                        <span className="font-bold text-xs uppercase">Total Serviços</span>
                    </div>
                    <p className="text-3xl font-black text-blue-900">{totalServices}</p>
                    <p className="text-xs text-blue-600 mt-1">{totalResolved} Resolvidos</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <Wrench size={18} />
                        <span className="font-bold text-xs uppercase">Horas Serviço</span>
                    </div>
                    <p className="text-3xl font-black text-orange-900">{totalServiceHours.toFixed(1)}h</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-teal-600 mb-2">
                        <Car size={18} />
                        <span className="font-bold text-xs uppercase">Horas Viagem</span>
                    </div>
                    <p className="text-3xl font-black text-teal-900">{totalTravelHours.toFixed(1)}h</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <Moon size={18} />
                        <span className="font-bold text-xs uppercase">Noites Fora</span>
                    </div>
                    <p className="text-3xl font-black text-indigo-900">{totalNightsAway}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Clock size={18} />
                        <span className="font-bold text-xs uppercase">Horas Totais</span>
                    </div>
                    <p className="text-3xl font-black text-gray-800">{(totalServiceHours + totalTravelHours).toFixed(1)}h</p>
                </div>
            </div>

            {/* Tech Table */}
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                Performance por Técnico (Detalhado)
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Técnico</th>
                            <th className="px-4 py-3 text-center">Nº Serviços</th>
                            <th className="px-4 py-3 text-center">H. Serviço</th>
                            <th className="px-4 py-3 text-center">H. Viagem</th>
                            <th className="px-4 py-3 text-center">Total H.</th>
                            <th className="px-4 py-3 text-center">Noites Fora</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {techStats.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-gray-400">Sem dados para as datas selecionadas.</td>
                            </tr>
                        ) : (
                            techStats.map((tech, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {tech.name.substring(0,1)}
                                        </div>
                                        {tech.name}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-800 bg-gray-50">{tech.count}</td>
                                    <td className="px-4 py-3 text-center text-orange-600 font-medium">{tech.serviceHours.toFixed(1)}h</td>
                                    <td className="px-4 py-3 text-center text-teal-600 font-medium">{tech.travelHours.toFixed(1)}h</td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900 bg-gray-50">{(tech.serviceHours + tech.travelHours).toFixed(1)}h</td>
                                    <td className="px-4 py-3 text-center text-indigo-600 font-medium">{tech.nights}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
