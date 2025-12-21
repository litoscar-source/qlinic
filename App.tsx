
import React, { useState, useEffect, useRef } from 'react';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { TicketFormModal } from './components/TicketFormModal';
import { RouteAnalyzer } from './components/RouteAnalyzer';
import { SettingsModal } from './components/SettingsModal';
import { ReportsModal } from './components/ReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { MobileTechnicianView } from './components/MobileTechnicianView';
import { Technician, Ticket, ServiceDefinition, User, DayStatus, TicketStatus, Visor } from './types';
import { addWeeks, subWeeks, format, isSameDay, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, Route, FileBarChart, Download, Upload, LogOut, Calendar, LayoutGrid, List, Link, Maximize2, Minimize2 } from 'lucide-react';

const SEED_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'João Silva', avatarColor: 'bg-blue-600', password: '1234' },
  { id: 'tech-2', name: 'Maria Costa', avatarColor: 'bg-emerald-600', password: '1234' },
  { id: 'tech-3', name: 'Pedro Santos', avatarColor: 'bg-orange-600', password: '1234' },
  { id: 'tech-4', name: 'Ana Pereira', avatarColor: 'bg-purple-600', password: '1234' },
  { id: 'tech-5', name: 'Rui Ferreira', avatarColor: 'bg-rose-600', password: '1234' },
  { id: 'tech-6', name: 'Carlos Lima', avatarColor: 'bg-cyan-600', password: '1234' },
  { id: 'tech-7', name: 'Duarte Nuno', avatarColor: 'bg-indigo-600', password: '1234' },
  { id: 'tech-8', name: 'Ricardo Dias', avatarColor: 'bg-amber-600', password: '1234' },
  { id: 'tech-9', name: 'Sofia Mota', avatarColor: 'bg-teal-600', password: '1234' },
  { id: 'tech-10', name: 'Nuno Alves', avatarColor: 'bg-violet-600', password: '1234' },
];

const SEED_SERVICES: ServiceDefinition[] = [
  { id: 'svc-1', name: 'Assistência', defaultDuration: 1, colorClass: 'bg-slate-50' },
  { id: 'svc-2', name: 'Instalação', defaultDuration: 4, colorClass: 'bg-blue-100' },
  { id: 'svc-3', name: 'Calibração', defaultDuration: 1.5, colorClass: 'bg-emerald-100' },
  { id: 'svc-4', name: 'Acompanhamento', defaultDuration: 1, colorClass: 'bg-purple-100' },
  { id: 'svc-5', name: 'Verificação', defaultDuration: 1, colorClass: 'bg-indigo-100' },
  { id: 'svc-7', name: 'Reconstrução', defaultDuration: 6, colorClass: 'bg-orange-100' },
  { id: 'svc-6', name: 'Construção', defaultDuration: 8, colorClass: 'bg-amber-100' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [fileSystemError, setFileSystemError] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(true);
  
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
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [newTicketPreData, setNewTicketPreData] = useState<{date: Date, techId: string} | null>(null);

  const isRestrictedContext = window.self !== window.top;

  useEffect(() => {
    localStorage.setItem('local_technicians', JSON.stringify(technicians));
    localStorage.setItem('local_services', JSON.stringify(services));
    localStorage.setItem('local_visores', JSON.stringify(visores));
    localStorage.setItem('local_tickets', JSON.stringify(tickets));
    localStorage.setItem('local_day_statuses', JSON.stringify(dayStatuses));
    
    if (fileHandle) saveToLinkedFile();
  }, [technicians, services, visores, tickets, dayStatuses, fileHandle]);

  const saveToLinkedFile = async () => {
    try {
      const data = { technicians, services, tickets, dayStatuses, visores };
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (err) {
      setFileHandle(null);
      setFileSystemError("Acesso local interrompido.");
    }
  };

  const handleLinkFile = async () => {
    setFileSystemError(null);
    if (isRestrictedContext) return;
    try {
      const win = window as any;
      const [handle] = await win.showOpenFilePicker({
        types: [{ description: 'Qlinic Database (JSON)', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      const file = await handle.getFile();
      const data = JSON.parse(await file.text());
      if (data) {
        if (data.technicians) setTechnicians(data.technicians);
        if (data.services) setServices(data.services);
        if (data.visores) setVisores(data.visores);
        if (data.tickets) setTickets(data.tickets.map((t: any) => ({ ...t, date: new Date(t.date) })));
        if (data.dayStatuses) setDayStatuses(data.dayStatuses.map((d: any) => ({ ...d, date: new Date(d.date) })));
        setFileHandle(handle);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setFileSystemError("Erro ao vincular.");
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
          } catch (err) { alert("Ficheiro inválido."); }
      };
      reader.readAsText(file);
  };

  const handleSaveTicket = (ticketData: Omit<Ticket, 'id'>) => {
    if (editingTicket) {
      setTickets(prev => prev.map(t => t.id === editingTicket.id ? { ...ticketData, id: t.id } : t));
    } else {
      const newTicket: Ticket = { ...ticketData, id: `tk-${Date.now()}` };
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
  
  const handleUpdateTechnician = (techId: string, updates: Partial<Technician>) => {
      setTechnicians(prev => prev.map(t => t.id === techId ? { ...t, ...updates } : t));
  };

  const handleMoveTicket = (ticketId: string, newDate: Date, newTechId: string, sourceTechId?: string | null) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      
      let newTechList = [...t.technicianIds];
      
      if (sourceTechId && newTechList.includes(sourceTechId)) {
          const index = newTechList.indexOf(sourceTechId);
          if (!newTechList.includes(newTechId)) {
            newTechList[index] = newTechId;
          } else if (newTechList.length > 1) {
            newTechList.splice(index, 1);
          }
      } else if (!newTechList.includes(newTechId)) {
          newTechList = [newTechId];
      }
      
      return { ...t, date: startOfDay(newDate), technicianIds: newTechList };
    }));
  };

  const handleSwapTickets = (sourceId: string, targetId: string) => {
    const s = tickets.find(t => t.id === sourceId);
    const t = tickets.find(t => t.id === targetId);
    if (s && t) {
        setTickets(prev => prev.map(tick => {
            if (tick.id === sourceId) return { ...tick, date: t.date, technicianIds: t.technicianIds, scheduledTime: t.scheduledTime };
            if (tick.id === targetId) return { ...tick, date: s.date, technicianIds: s.technicianIds, scheduledTime: s.scheduledTime };
            return tick;
        }));
    }
  };

  const handleToggleOvernight = (date: Date, techId: string) => {
      const idx = dayStatuses.findIndex(ds => isSameDay(ds.date, date) && ds.technicianId === techId);
      if (idx >= 0) setDayStatuses(prev => prev.filter((_, i) => i !== idx));
      else setDayStatuses(prev => [...prev, { id: `status-${Date.now()}`, technicianId: techId, date: startOfDay(date), isOvernight: true }]);
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  if (user.role === 'technician' && user.technicianId) {
      const currentTech = technicians.find(t => t.id === user.technicianId);
      return (
          <>
            <MobileTechnicianView 
                tickets={tickets} 
                technicianId={user.technicianId} 
                technician={currentTech!}
                services={services} 
                onUpdateStatus={(id, status) => handleUpdateTicket(id, { status })}
                onViewDetails={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }}
                onUpdateProfile={(updates) => handleUpdateTechnician(user.technicianId!, updates)}
                onLogout={() => setUser(null)}
            />
            <TicketFormModal 
                isOpen={isTicketModalOpen} 
                onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); }}
                onSave={handleSaveTicket}
                onUpdate={handleUpdateTicket}
                technicians={technicians}
                services={services}
                visores={visores}
                initialDate={new Date()}
                selectedTechId={user.technicianId}
                ticketToEdit={editingTicket}
                isReadOnly={false}
            />
          </>
      );
  }

  const isReadOnly = user.role === 'viewer';

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans antialiased">
        <div className={`p-0.5 text-center text-[9px] font-bold uppercase tracking-widest text-white z-50 transition-colors ${fileHandle ? 'bg-emerald-600' : 'bg-orange-500'}`}>
            {fileHandle ? 'LIGADO: ' + fileHandle.name : 'MODO LOCAL'}
        </div>

        <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-40">
            <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-sm cursor-pointer" onClick={() => setCurrentDate(new Date())}>
                         <span className="text-white text-lg font-bold">Q</span>
                    </div>
                    <div>
                        <h1 className="text-base text-slate-900 leading-none font-bold tracking-tight">Dispatch Pro</h1>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Qlinic Logistics</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-white rounded-md text-slate-600"><ChevronLeft size={16}/></button>
                        <span className="px-2 text-slate-800 w-36 text-center text-[10px] uppercase tracking-widest font-bold">
                            {format(currentDate, 'MMMM yyyy', { locale: pt })}
                        </span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-white rounded-md text-slate-600"><ChevronRight size={16}/></button>
                    </div>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 ml-2">
                         <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-md text-[9px] uppercase tracking-widest transition-all font-bold flex items-center gap-1.5 ${viewMode === 'week' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={12}/> Semana</button>
                         <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-md text-[9px] uppercase tracking-widest transition-all font-bold flex items-center gap-1.5 ${viewMode === 'month' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}><Calendar size={12}/> Mês</button>
                         <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-[9px] uppercase tracking-widest transition-all font-bold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}><List size={12}/> Lista</button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <input type="file" ref={fileInputRef} onChange={handleImportDatabase} className="hidden" accept=".json" />
                    {!isReadOnly && (
                        <div className="hidden sm:flex items-center gap-0.5 mr-2">
                           <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Importar"><Upload size={16} /></button>
                           <button onClick={handleExportDatabase} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Exportar"><Download size={16} /></button>
                           {!isRestrictedContext && (
                             <button onClick={handleLinkFile} className={`p-1.5 transition-colors ${fileHandle ? 'text-emerald-500' : 'text-slate-400'}`} title="Pasta Local"><Link size={16} /></button>
                           )}
                        </div>
                    )}
                    <button onClick={() => setIsReportsModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><FileBarChart size={18} /></button>
                    {!isReadOnly && (
                        <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Settings size={18} /></button>
                    )}
                    <button onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }} className="bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 rounded shadow shadow-red-200 font-bold text-[10px] uppercase tracking-widest ml-2 transition-all active:scale-95">Novo</button>
                    <button onClick={() => setUser(null)} className="p-2 text-slate-400 hover:text-slate-600 ml-2"><LogOut size={18} /></button>
                </div>
            </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
            <div className="flex-1 overflow-hidden flex flex-col">
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
                    isCompact={isCompactView}
                  />
               ) : viewMode === 'month' ? (
                   <div className="h-full overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200">
                       <CalendarView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} tickets={tickets} technicians={technicians} selectedTechId={null} />
                   </div>
               ) : (
                   <ListView 
                    tickets={tickets} 
                    technicians={technicians} 
                    services={services} 
                    onEditTicket={(t) => { setEditingTicket(t); setIsTicketModalOpen(true); }} 
                    onUpdateTicket={handleUpdateTicket}
                    isReadOnly={isReadOnly}
                   />
               )}
            </div>

            {viewMode !== 'list' && (
                <footer className="h-64 bg-white border border-slate-200 rounded-xl shadow-sm z-30 shrink-0 flex flex-col overflow-hidden hidden md:flex">
                   <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Route size={14} className="text-red-600" />
                            <span className="text-slate-700 text-[10px] uppercase tracking-widest font-bold">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}</span>
                        </div>
                        <button 
                            onClick={() => setIsCompactView(!isCompactView)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[9px] uppercase tracking-widest font-bold transition-all border ${isCompactView ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-300'}`}
                        >
                            {isCompactView ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                            {isCompactView ? 'Vista Normal' : 'Compactar Linhas'}
                        </button>
                   </div>
                   
                   <div className="flex-1 px-4 py-1.5 bg-white overflow-hidden">
                     <div className="grid grid-cols-4 gap-4 h-full">
                        <div className="col-span-1 border-r border-slate-100 pr-2 overflow-y-auto custom-scrollbar">
                            <h4 className="text-[9px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Agenda do Dia</h4>
                            {tickets.filter(t => isSameDay(t.date, selectedDate)).length === 0 ? (
                                <p className="text-slate-300 text-[10px] italic font-medium">Sem serviços agendados.</p>
                            ) : (
                                <div className="space-y-0.5">
                                    {tickets.filter(t => isSameDay(t.date, selectedDate)).sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(tick => (
                                        <div key={tick.id} onClick={() => { setEditingTicket(tick); setIsTicketModalOpen(true); }} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] uppercase font-semibold hover:bg-red-50 hover:border-red-300 cursor-pointer truncate transition-all">
                                            <span className="text-red-600 mr-2">{tick.scheduledTime}</span> {tick.customerName}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="col-span-3 h-full overflow-hidden">
                            <RouteAnalyzer tickets={tickets.filter(t => isSameDay(t.date, selectedDate))} technicians={technicians} dayStatuses={dayStatuses} />
                        </div>
                     </div>
                   </div>
                </footer>
            )}
        </main>

        <TicketFormModal 
            isOpen={isTicketModalOpen} 
            onClose={() => { setIsTicketModalOpen(false); setEditingTicket(null); setNewTicketPreData(null); }}
            onSave={handleSaveTicket}
            onDelete={handleDeleteTicket}
            onUpdate={handleUpdateTicket}
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
            onAddTechnician={(t) => setTechnicians(prev => [...prev, t])}
            onRemoveTechnician={(id) => setTechnicians(prev => prev.filter(t => t.id !== id))}
            onAddService={(s) => setServices(prev => [...prev, s])}
            onRemoveService={(id) => setServices(prev => prev.filter(s => s.id !== id))}
            onAddVisor={(v) => setVisores(prev => [...prev, v])}
            onRemoveVisor={(id) => setVisores(prev => prev.filter(v => v.id !== id))}
            onUpdateTechnician={handleUpdateTechnician}
        />

        <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tickets={tickets} dayStatuses={dayStatuses} technicians={technicians} services={services} visores={visores} />
    </div>
  );
}

export default App;
