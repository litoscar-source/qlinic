import React, { useState, useEffect, useRef } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, TicketStatus, Visor } from './types';
import { addWeeks, subWeeks, format, isSameDay, startOfDay, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Settings, Route, FileBarChart, Download, Upload, LogOut, Save, Calendar, LayoutGrid, Users, FileText, HardDrive, Link, AlertCircle } from 'lucide-react';

const SEED_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'João Silva', avatarColor: 'bg-blue-600' },
  { id: 'tech-2', name: 'Maria Costa', avatarColor: 'bg-emerald-600' },
  { id: 'tech-3', name: 'Pedro Santos', avatarColor: 'bg-amber-600' },
  { id: 'tech-4', name: 'Ana Pereira', avatarColor: 'bg-purple-600' },
  { id: 'tech-5', name: 'Rui Ferreira', avatarColor: 'bg-red-600' },
];

const SEED_SERVICES: ServiceDefinition[] = [
  { id: 'svc-1', name: 'Assistência', defaultDuration: 1, colorClass: 'bg-white' },
  { id: 'svc-2', name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-300' },
  { id: 'svc-3', name: 'Calibração', defaultDuration: 1.5, colorClass: 'bg-emerald-300' },
  { id: 'svc-4', name: 'Acompanhamento', defaultDuration: 1, colorClass: 'bg-purple-300' },
  { id: 'svc-5', name: 'Verificação', defaultDuration: 1, colorClass: 'bg-indigo-300' },
  { id: 'svc-7', name: 'Reconstrução', defaultDuration: 6, colorClass: 'bg-orange-300' },
  { id: 'svc-6', name: 'Construção', defaultDuration: 8, colorClass: 'bg-amber-300' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [fileSystemError, setFileSystemError] = useState<string | null>(null);
  
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('local_technicians');
    return saved ? JSON.parse(saved) : SEED_TECHNICIANS;
  });

  const [services, setServices] = useState<ServiceDefinition[]>(() => {
    const saved = localStorage.getItem('local_services');
    return saved ? JSON.parse(saved) : SEED_SERVICES;
  });

  const [visores, setVisores] = useState<Visor[]>(() => {
    const saved = localStorage.getItem('local_visores');
    return saved ? JSON.parse(saved) : [];
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('local_tickets');
    if (saved) return JSON.parse(saved).map((t: any) => ({ ...t, date: new Date(t.date) }));
    return [];
  });

  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>(() => {
    const saved = localStorage.getItem('local_day_statuses');
    if (saved) return JSON.parse(saved).map((d: any) => ({ ...d, date: new Date(d.date) }));
    return [];
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('local_technicians', JSON.stringify(technicians));
    localStorage.setItem('local_services', JSON.stringify(services));
    localStorage.setItem('local_visores', JSON.stringify(visores));
    localStorage.setItem('local_tickets', JSON.stringify(tickets));
    localStorage.setItem('local_day_statuses', JSON.stringify(dayStatuses));
    
    if (fileHandle) {
      saveToLinkedFile();
    }
  }, [technicians, services, visores, tickets, dayStatuses, fileHandle]);

  const saveToLinkedFile = async () => {
    try {
      const data = { technicians, services, tickets, dayStatuses, visores };
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (err) {
      console.error("Erro ao gravar no ficheiro local:", err);
      setFileHandle(null);
      setFileSystemError("A ligação ao ficheiro foi bloqueada. Use a exportação manual.");
    }
  };

  const handleLinkFile = async () => {
    setFileSystemError(null);
    try {
      const win = window as any;
      if (!win.showOpenFilePicker) {
        throw new Error("O seu navegador não suporta gravação direta.");
      }
      
      const [handle] = await win.showOpenFilePicker({
        types: [{ description: 'Base de Dados Qlinic (JSON)', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      
      const file = await handle.getFile();
      const content = await file.text();
      const data = JSON.parse(content);
      
      if (data) {
        setTechnicians(data.technicians || SEED_TECHNICIANS);
        setServices(data.services || SEED_SERVICES);
        setVisores(data.visores || []);
        setTickets((data.tickets || []).map((t: any) => ({ ...t, date: new Date(t.date) })));
        setDayStatuses((data.dayStatuses || []).map((d: any) => ({ ...d, date: new Date(d.date) })));
        setFileHandle(handle);
      }
    } catch (err: any) {
      console.error("Erro no File System:", err);
      if (err.name === 'SecurityError' || err.message.includes('sub frames')) {
        setFileSystemError("O acesso direto a ficheiros está bloqueado neste ambiente (iframe). Use os botões Importar/Exportar para salvar os dados no seu computador.");
      } else if (err.name !== 'AbortError') {
        setFileSystemError("Erro ao aceder ao ficheiro.");
      }
    }
  };

  const handleExportDatabase = () => {
      const dbData = { technicians, services, tickets, dayStatuses, visores };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `qlinic_backup_${format(new Date(), 'yyyyMMdd')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.technicians) setTechnicians(data.technicians);
              if (data.services) setServices(data.services);
              if (data.visores) setVisores(data.visores);
              if (data.tickets) setTickets(data.tickets.map((t: any) => ({ ...t, date: new Date(t.date) })));
              if (data.dayStatuses) setDayStatuses(data.dayStatuses.map((d: any) => ({ ...d, date: new Date(d.date) })));
              alert("Dados importados com sucesso.");
          } catch (err) { alert("Ficheiro inválido."); }
      };
      reader.readAsText(file);
      if (e.target) e.target.value = '';
  };

  const handleSaveTicket = (ticketData: Omit<Ticket, 'id'>) => {
    if (editingTicket) {
      setTickets(prev => prev.map(t => t.id === editingTicket.id ? { ...ticketData, id: t.id } : t));
    } else {
      const newTicket: Ticket = { ...ticketData, id: `local-ticket-${Date.now()}` };
      setTickets(prev => [...prev, newTicket]);
    }
    setEditingTicket(null);
    setNewTicketPreData(null);
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setEditingTicket(null);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
  };
  
  const handleMoveTicket = (ticketId: string, newDate: Date, newTechId: string, sourceTechId?: string | null) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      let newTechList = [...t.technicianIds];
      if (sourceTechId && newTechList.includes(sourceTechId)) {
          const index = newTechList.indexOf(sourceTechId);
          if (!newTechList.includes(newTechId)) {
              newTechList[index] = newTechId;
          } else {
              newTechList.splice(index, 1);
          }
      } else {
          newTechList = [newTechId];
      }
      return { ...t, date: newDate, technicianIds: newTechList };
    }));
  };

  const handleSwapTickets = (sourceId: string, targetId: string) => {
    const sourceTicket = tickets.find(t => t.id === sourceId);
    const targetTicket = tickets.find(t => t.id === targetId);
    if (sourceTicket && targetTicket) {
        setTickets(prev => prev.map(t => {
            if (t.id === sourceId) return { ...t, date: targetTicket.date, technicianIds: targetTicket.technicianIds, scheduledTime: targetTicket.scheduledTime };
            if (t.id === targetId) return { ...t, date: sourceTicket.date, technicianIds: sourceTicket.technicianIds, scheduledTime: sourceTicket.scheduledTime };
            return t;
        }));
    }
  };

  const handleToggleOvernight = (date: Date, techId: string) => {
      const existingIndex = dayStatuses.findIndex(ds => isSameDay(ds.date, date) && ds.technicianId === techId);
      if (existingIndex >= 0) setDayStatuses(prev => prev.filter((_, i) => i !== existingIndex));
      else setDayStatuses(prev => [...prev, { id: `local-status-${Date.now()}`, technicianId: techId, date: startOfDay(date), isOvernight: true }]);
  };

  const handleExportReconstructions = () => {
    const startDate = prompt("Início (YYYY-MM-DD):", format(subWeeks(new Date(), 4), 'yyyy-MM-dd'));
    if (!startDate) return;
    const endDate = prompt("Fim (YYYY-MM-DD):", format(new Date(), 'yyyy-MM-dd'));
    if (!endDate) return;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const reconTickets = tickets.filter(t => {
        const service = services.find(s => s.id === t.serviceId);
        return service?.name.toLowerCase().includes('reconstrução') && isWithinInterval(t.date, { start, end });
      });

      if (reconTickets.length === 0) {
        alert("Sem dados.");
        return;
      }

      const rows = reconTickets.map(t => {
        const visor = visores.find(v => v.id === t.visorId)?.name || 'N/A';
        const techs = t.technicianIds.map(id => technicians.find(tec => tec.id === id)?.name).join(';');
        return [format(t.date, 'yyyy-MM-dd'), t.ticketNumber, `"${t.customerName}"`, `"${t.address}"`, t.locality || '', visor, `"${techs}"`, t.status];
      });

      const csvContent = "\uFEFFData,Ticket,Cliente,Morada,Localidade,Visor,Tecnicos,Estado\n" + rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reconst_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { alert("Data inválida."); }
  };

  if (!user) return <LoginScreen onLogin={setUser} />;
  const isReadOnly = user.role === 'viewer';

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] overflow-hidden">
        <div className={`text-white p-1 text-center text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm z-50 ${fileHandle ? 'bg-emerald-600' : 'bg-orange-500'}`}>
            {fileHandle ? <HardDrive size={12} /> : <Save size={12} />} 
            {fileHandle ? `LIGADO: ${fileHandle.name}` : 'MODO LOCAL (STORAGE)'}
        </div>

        {fileSystemError && (
          <div className="bg-red-500 text-white p-2 text-[10px] uppercase flex items-center justify-center gap-2">
            <AlertCircle size={14} /> {fileSystemError}
            <button onClick={() => setFileSystemError(null)} className="ml-2 underline">OK</button>
          </div>
        )}

        <header className="bg-red-700 border-b border-red-900 shadow-xl shrink-0 z-40">
            <div className="px-6 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 border-2 border-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all shadow-lg" onClick={() => setCurrentDate(new Date())}>
                         <span className="text-white text-2xl tracking-tighter">Q</span>
                    </div>
                    <div>
                        <h1 className="text-xl text-white leading-none font-normal tracking-tighter">Qlinic Dispatch</h1>
                        <p className="text-[10px] text-red-200 uppercase tracking-[0.2em] mt-0.5">Gestão Técnica AI</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/30 rounded-xl p-1 border border-white/10">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-all"><ChevronLeft size={18} className="text-white" /></button>
                        <span className="px-5 text-white w-44 text-center text-xs uppercase tracking-widest font-normal">
                            {format(currentDate, 'MMMM yyyy', { locale: pt })}
                        </span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-all"><ChevronRight size={18} className="text-white" /></button>
                    </div>

                    <div className="flex bg-black/30 rounded-xl p-1 border border-white/10">
                         <button onClick={() => setViewMode('week')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-all font-normal ${viewMode === 'week' ? 'bg-white text-red-700 shadow-md' : 'text-white hover:bg-white/10'}`}><LayoutGrid size={14} /> Semana</button>
                         <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-all font-normal ${viewMode === 'month' ? 'bg-white text-red-700 shadow-md' : 'text-white hover:bg-white/10'}`}><Calendar size={14} /> Mês</button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImportDatabase} className="hidden" accept=".json" />
                    
                    {!isReadOnly && (
                        <div className="flex items-center bg-black/20 rounded-xl px-1 mr-2 border border-white/10">
                           <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-all" title="Importar JSON"><Upload size={20} /></button>
                           <button onClick={handleExportDatabase} className="p-2 text-white hover:bg-white/10 rounded-lg transition-all" title="Exportar JSON (Salvar no Computador)"><Download size={20} /></button>
                           <div className="w-px h-4 bg-white/10 mx-1"></div>
                           <button onClick={handleLinkFile} className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-[10px] uppercase tracking-tighter font-normal ${fileHandle ? 'text-emerald-300' : 'text-white hover:bg-white/10'}`} title="Ligação direta a ficheiro">
                              <Link size={18} /> {fileHandle ? 'Ligado' : 'Pasta'}
                           </button>
                        </div>
                    )}

                    <button onClick={handleExportReconstructions} className="p-2 text-white hover:bg-white/10 rounded-xl transition-all" title="Mapa Reconstruções"><FileText size={20} /></button>
                    <button onClick={() => setIsReportsModalOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-xl transition-all" title="Relatórios"><FileBarChart size={20} /></button>
                    
                    {!isReadOnly && (
                        <>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-xl transition-all" title="Configurações"><Settings size={20} /></button>
                            <button onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }} className="bg-white text-red-700 hover:bg-gray-100 px-5 py-2.5 rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-xs ml-3 uppercase tracking-widest border-b-2 border-red-200 font-normal"><Plus size={18} /> Novo Serviço</button>
                        </>
                    )}
                    <button onClick={() => setUser(null)} className="p-2.5 text-red-200 hover:bg-red-900/50 rounded-xl transition-all ml-3" title="Sair"><LogOut size={20} /></button>
                </div>
            </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-[5] overflow-hidden p-4 pb-0 flex flex-col">
               {viewMode === 'week' ? (
                   <WeeklyScheduleView 
                    currentDate={currentDate}
                    tickets={tickets}
                    dayStatuses={dayStatuses}
                    technicians={technicians}
                    services={services}
                    visores={visores}
                    onTicketUpdate={handleUpdateTicket}
                    onTicketMove={handleMoveTicket}
                    onTicketSwap={handleSwapTickets}
                    onEditTicket={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }}
                    onNewTicket={(date, techId) => { setNewTicketPreData({ date, techId }); setEditingTicket(null); setIsTicketModalOpen(true); }}
                    onToggleOvernight={handleToggleOvernight}
                    onSelectDate={setSelectedDate}
                    selectedDate={selectedDate}
                    isReadOnly={isReadOnly}
                  />
               ) : (
                   <div className="h-full overflow-y-auto bg-white rounded-t-2xl shadow-sm border border-gray-200 p-2">
                       <CalendarView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} tickets={tickets} technicians={technicians} selectedTechId={null} />
                   </div>
               )}
            </div>

            <div className="h-40 bg-white border-t border-gray-200 overflow-hidden flex flex-col shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-30 shrink-0">
               <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Route size={14} className="text-red-600" />
                        <h3 className="text-gray-800 text-[10px] uppercase tracking-widest font-normal">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}</h3>
                    </div>
               </div>
               
               <div className="flex-1 px-4 py-2 bg-white">
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
                    <div className="lg:col-span-1 border-r border-gray-100 pr-4 overflow-y-auto custom-scrollbar h-full">
                        <h4 className="text-[9px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 sticky top-0 bg-white py-1 z-10 font-normal"><Calendar size={10} /> Serviços do Dia</h4>
                        {tickets.filter(t => isSameDay(t.date, selectedDate)).length === 0 ? (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-50 rounded-lg">
                                <p className="text-gray-300 text-[10px] italic uppercase tracking-tighter font-normal">Agenda Livre</p>
                            </div>
                        ) : (
                            <div className="space-y-1 pb-2">
                                {tickets.filter(t => isSameDay(t.date, selectedDate)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(ticket => (
                                    <div key={ticket.id} onClick={() => { setEditingTicket(ticket); setIsTicketModalOpen(true); }} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-[10px] text-red-600 shrink-0 font-normal">{ticket.scheduledTime}</span>
                                            <p className="text-[10px] text-gray-800 truncate uppercase tracking-tight group-hover:text-red-800 font-normal">{ticket.customerName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-3 h-full">
                        <RouteAnalyzer tickets={tickets.filter(t => isSameDay(t.date, selectedDate))} technicians={technicians} dayStatuses={dayStatuses} />
                    </div>
                 </div>
               </div>
            </div>
        </div>

        <TicketFormModal 
            isOpen={isTicketModalOpen} 
            onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); setNewTicketPreData(null); }}
            onSave={handleSaveTicket}
            onDelete={handleDeleteTicket}
            technicians={technicians}
            services={services}
            visores={visores}
            initialDate={newTicketPreData ? newTicketPreData.date : selectedDate}
            selectedTechId={newTicketPreData ? newTicketPreData.techId : null}
            ticketToEdit={editingTicket}
            isReadOnly={isReadOnly}
        />

        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            technicians={technicians}
            services={services}
            visores={visores}
            onAddTechnician={(t) => setTechnicians(prev => [...prev, { ...t, id: `local-tech-${Date.now()}` }])}
            onRemoveTechnician={(id) => setTechnicians(prev => prev.filter(t => t.id !== id))}
            onAddService={(s) => setServices(prev => [...prev, { ...s, id: `local-svc-${Date.now()}` }])}
            onRemoveService={(id) => setServices(prev => prev.filter(s => s.id !== id))}
            onAddVisor={(v) => setVisores(prev => [...prev, { ...v, id: `local-visor-${Date.now()}` }])}
            onRemoveVisor={(id) => setVisores(prev => prev.filter(v => v.id !== id))}
        />

        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} />
    </div>
  );
}

export default App;