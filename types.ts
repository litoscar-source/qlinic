
export enum VehicleType {
  CARRO = 'Carro Ligeiro',
  CARRINHA = 'Carrinha Comercial',
  MOTO = 'Moto',
  CAMIAO = 'Camião',
  CAMIAO_PEQUENO = 'Camião Pequeno',
  CAMIAO_GRANDE = 'Camião Grande',
  IVECO = 'Iveco'
}

export enum TicketStatus {
  PENDENTE = 'Pendente',
  EM_ANDAMENTO = 'Em Andamento',
  RESOLVIDO = 'Resolvido',
  NAO_RESOLVIDO = 'Não Resolvido',
  CONFIRMADO = 'Confirmado',
  PRE_AGENDADO = 'Pré-Agendado',
  NAO_REALIZADO = 'Não Realizado',
  PARCIALMENTE_RESOLVIDO = 'Parcialmente Resolvido'
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

export interface Ticket {
  id: string;
  technicianIds: string[];
  ticketNumber: string;
  customerName: string;
  address: string;
  vehicleType: VehicleType;
  serviceId: string; // References ServiceDefinition.id
  status: TicketStatus;
  date: Date;
  scheduledTime: string; // HH:mm
  duration: number; // Duração em horas
  notes?: string;
  locality?: string;
  processNumber?: string;
  faultDescription?: string;
}

export interface RouteAnalysis {
  totalTime: string;
  totalDistance: string;
  segments: {
    from: string;
    to: string;
    estimatedTime: string;
    distance: string;
  }[];
  groundingUrls: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'viewer';
}

export interface DayStatus {
  id: string;
  technicianId: string;
  date: Date;
  isOvernight: boolean;
}
