
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
  colorClass: string; // Tailwind bg class
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

export interface Ticket {
  id: string;
  technicianIds: string[];
  ticketNumber: string;
  customerName: string;
  address: string;
  vehicleType: VehicleType;
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
  updatedAt?: number; // Para controle de sincronização
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
  technicianId?: string;
}

export interface DayStatus {
  id: string;
  technicianId: string;
  date: Date;
  isOvernight: boolean;
}

export interface CloudData {
  technicians: Technician[];
  services: ServiceDefinition[];
  tickets: Ticket[];
  dayStatuses: DayStatus[];
  visores: Visor[];
  lastSync: number;
}
