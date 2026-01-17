
import { supabase } from './supabaseClient';
import { Ticket, Technician, ServiceDefinition, Vehicle, Visor, DayStatus } from '../types';

// Helpers para garantir que as datas são objetos Date
const parseDates = (item: any) => ({
  ...item,
  date: item.date ? new Date(item.date) : new Date()
});

export const dataService = {
  // --- LEITURA INICIAL ---
  async fetchAllData() {
    const [techs, services, vehicles, visores, tickets, dayStatuses] = await Promise.all([
      supabase.from('technicians').select('*'),
      supabase.from('services').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('visores').select('*'),
      supabase.from('tickets').select('*'),
      supabase.from('day_statuses').select('*')
    ]);

    return {
      technicians: (techs.data || []) as Technician[],
      services: (services.data || []) as ServiceDefinition[],
      vehicles: (vehicles.data || []) as Vehicle[],
      visores: (visores.data || []) as Visor[],
      tickets: (tickets.data || []).map(parseDates) as Ticket[],
      dayStatuses: (dayStatuses.data || []).map(parseDates) as DayStatus[]
    };
  },

  // --- TICKETS ---
  async createTicket(ticket: Ticket) {
    const { error } = await supabase.from('tickets').insert(ticket);
    if (error) throw error;
    return ticket;
  },

  async updateTicket(id: string, updates: Partial<Ticket>) {
    const { error } = await supabase.from('tickets').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteTicket(id: string) {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
  },

  async syncImportedTickets(tickets: Ticket[]) {
    if (tickets.length === 0) return;
    const { error } = await supabase.from('tickets').insert(tickets);
    if (error) throw error;
  },

  // --- TÉCNICOS ---
  async addTechnician(tech: Technician) {
    const { error } = await supabase.from('technicians').insert(tech);
    if (error) throw error;
  },

  async removeTechnician(id: string) {
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SERVIÇOS ---
  async addService(service: ServiceDefinition) {
    const { error } = await supabase.from('services').insert(service);
    if (error) throw error;
  },

  async removeService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // --- VEÍCULOS ---
  async addVehicle(vehicle: Vehicle) {
    const { error } = await supabase.from('vehicles').insert(vehicle);
    if (error) throw error;
  },

  async removeVehicle(id: string) {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
  },

  // --- VISORES ---
  async addVisor(visor: Visor) {
    const { error } = await supabase.from('visores').insert(visor);
    if (error) throw error;
  },

  async removeVisor(id: string) {
    const { error } = await supabase.from('visores').delete().eq('id', id);
    if (error) throw error;
  },

  // --- STATUS DIÁRIO (DORMIDAS) ---
  async toggleDayStatus(status: DayStatus) {
    // Verifica se já existe
    const { data } = await supabase
      .from('day_statuses')
      .select('*')
      .eq('technicianId', status.technicianId)
      .eq('date', status.date.toISOString()); // Comparação de data exata pode ser tricky, idealmente range ou YYYY-MM-DD

    // Estratégia simples: tenta apagar. Se apagou algo, é toggle OFF. Se não, insere (toggle ON).
    // Para simplificar a UI do App.tsx que gera IDs únicos, vamos assumir insert/delete explícito via App.tsx
    // Mas aqui vamos apenas inserir. A remoção será feita por ID.
  },

  async addDayStatus(status: DayStatus) {
    const { error } = await supabase.from('day_statuses').insert(status);
    if (error) throw error;
  },

  async removeDayStatus(id: string) {
    const { error } = await supabase.from('day_statuses').delete().eq('id', id);
    if (error) throw error;
  }
};
