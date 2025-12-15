
export enum VehicleType {
  CARRO = 'Carro Ligeiro',
  CARRINHA = 'Carrinha Comercial',
  MOTO = 'Moto',
  CAMIAO = 'Camião'
}

export enum TicketStatus {
  PRE_AGENDADO = 'Pré-agendado',
  CONFIRMADO = 'Serviço Confirmado',
  EM_ANDAMENTO = 'Em Andamento',
  RESOLVIDO = 'Resolvido',
  NAO_RESOLVIDO = 'Não Resolvido',
  CANCELADO = 'Cancelado',
  NAO_REALIZADO = 'Não Realizado'
}

export interface ServiceDefinition {
  id: string;
  name: string;
  defaultDuration: number;
  colorClass: string; // e.g., 'bg-blue-100 text-blue-800 border-blue-200'
}

export interface Technician {
  id: string;
  name: string;
  avatarColor: string;
}

// Novo tipo para gerir estado do dia (ex: Noite Fora) independente dos tickets
export interface DayStatus {
  id: string;
  technicianId: string;
  date: Date; // A data refere-se à noite DO dia (dorme fora de X para Y)
  isOvernight: boolean;
}

export interface Ticket {
  id: string;
  technicianIds: string[];
  ticketNumber: string;
  processNumber?: string; // Novo campo: Nº Processo EPRC
  customerName: string;
  address: string;
  locality: string;
  faultDescription?: string;
  travelDuration?: number; 
  vehicleType: VehicleType;
  serviceId: string; // References ServiceDefinition.id
  status: TicketStatus;
  date: Date;
  scheduledTime: string; // HH:mm
  duration: number; // Duração em horas (SERVIÇO)
  notes?: string;
}

export interface RouteAnalysis {
  technicianId?: string;
  travelTime: string;
  serviceTime: string;
  totalTime: string;
  totalDistance: string;
  segments: {
    from: string;
    to: string;
    travelTime: string;
    distance: string;
  }[];
  groundingUrls: string[];
}

// Auth Types
export type UserRole = 'admin' | 'viewer';

export interface User {
  username: string;
  name: string;
  role: UserRole;
}
