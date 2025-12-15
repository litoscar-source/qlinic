
import React from 'react';
import { Ticket, DayStatus, Technician } from '../types';
import { X, Download, PieChart, TrendingUp } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  technicians: Technician[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  tickets,
  technicians
}) => {
  if (!isOpen) return null;

  const currentMonth = new Date();
  
  // Filter tickets for current month stats
  const monthTickets = tickets.filter(t => isSameMonth(t.date, currentMonth));
  
  const stats = {
      total: monthTickets.length,
      resolved: monthTickets.filter(t => t.status === 'Resolvido').length,
      pending: monthTickets.filter(t => t.status === 'Pendente').length,
      confirmed: monthTickets.filter(t => t.status === 'Confirmado').length
  };

  const downloadCSV = () => {
    // Simple CSV export
    const headers = ["Data", "Hora", "Ticket", "Cliente", "Técnico", "Estado", "Serviço", "Localidade"];
    const rows = tickets.map(t => {
        const techName = technicians.find(tech => t.technicianIds.includes(tech.id))?.name || 'N/A';
        return [
            format(t.date, 'yyyy-MM-dd'),
            t.scheduledTime,
            t.ticketNumber,
            `"${t.customerName}"`, // Escape quotes
            `"${techName}"`,
            t.status,
            t.serviceId,
            `"${t.locality || ''}"`
        ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_servicos.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PieChart className="text-blue-600" />
            Relatórios e Estatísticas
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase">Total (Mês)</p>
                    <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-bold text-green-500 uppercase">Resolvidos</p>
                    <p className="text-3xl font-bold text-green-700">{stats.resolved}</p>
                </div>
                 <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-600 uppercase">Pendentes</p>
                    <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase">Confirmados</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.confirmed}</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Volume por Técnico (Este Mês)
                </h3>
                <div className="space-y-3">
                    {technicians.map(tech => {
                        const count = monthTickets.filter(t => t.technicianIds.includes(tech.id)).length;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={tech.id} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${tech.avatarColor}`}>
                                    {tech.name.substring(0,2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{tech.name}</span>
                                        <span className="font-bold text-gray-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${tech.avatarColor.replace('bg-', 'bg-')}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-lg"
                >
                    <Download size={18} />
                    Exportar CSV Completo
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
