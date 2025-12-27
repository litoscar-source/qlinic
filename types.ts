
export interface Vehicle {
  id: string;
  name: string;
}

export enum TicketStatus {
  NAO_CONFIRMADO = 'Não Confirmado',
  CONFIRMADO = 'Confirmado',
  PARCIALMENTE_RESOLVIDO = 'Parcialmente Resolvido',
  RESOLVIDO = 'Resolvido',
  EM_ANDAMENTO = 'Em Andamento',
  NAO_REALIZADO = 'Não Realizado'
}

export interface ServiceDefinition {
  id: string;
  name: string;
  defaultDuration: number;
  colorClass: string; 
}

export interface Visor {
  id: string;
  name: string;
}

export interface Technician {
  id: string;
  name: string;
  avatarColor: string;
  password?: string;
}

/**
 * Estrutura de Linha PostgreSQL (Relacional)
 */
export interface PostgresRow {
  id: string; // UUID ou Serial
  created_at: string;
  updated_at: string;
  version: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'technician';
  technicianId?: string;
}

export interface Ticket extends PostgresRow {
  technicianIds: string[]; // Mapeado da tabela de junção tickets_technicians
  ticketNumber: string;
  customerName: string;
  address: string;
  vehicleId: string;
  serviceId: string;
  visorId?: string;
  status: TicketStatus;
  date: Date;
  scheduledTime: string;
  duration: number;
  travelTimeMinutes?: number;
  notes?: string;
  locality?: string;
  processNumber?: string;
  faultDescription?: string;
  // Aliases for persistence mapping
  scheduled_date?: string;
  scheduled_time?: string;
}

export interface DayStatus extends PostgresRow {
  technicianId: string;
  date: Date;
  isOvernight: boolean;
  // Aliases for persistence mapping
  technician_id?: string;
  is_overnight?: boolean;
}

export interface RouteSegment {
  from: string;
  to: string;
  estimatedTime: string;
  distance: string;
}

export interface RouteAnalysis {
  totalTime: string;
  totalDistance: string;
  segments: RouteSegment[];
  groundingUrls: string[];
}

export interface CloudData {
  technicians: Technician[];
  services: ServiceDefinition[];
  vehicles: Vehicle[];
  tickets: Ticket[];
  day_statuses: any[]; 
  visores: Visor[];
  last_sync: number;
}
