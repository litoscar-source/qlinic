
import { Ticket, TicketStatus, ServiceDefinition, Technician } from "../types";
import { format, isValid } from "date-fns";
import * as XLSX from "xlsx";

/**
 * Mapeia colunas comuns do Dynamics para o formato da aplicação
 */
const DYNAMICS_MAP = {
  subject: ["subject", "assunto", "nome do ticket", "ticket", "activity subject"],
  customer: ["regarding", "account", "cliente", "referente a", "customer", "regarding object id"],
  date: ["scheduled start", "início agendado", "data", "start date", "scheduledstart"],
  address: ["address", "morada", "local da intervenção", "address 1: street 1", "location"],
  locality: ["city", "cidade", "localidade", "address 1: city"],
  description: ["description", "descrição", "notas", "description text"]
};

export const parseDynamicsFile = async (
    fileData: ArrayBuffer, 
    availableServices: ServiceDefinition[], 
    availableTechs: Technician[]
): Promise<Omit<Ticket, 'id'>[]> => {
  
  // Ler o workbook (funciona para XLSX, XLS e CSV)
  const workbook = XLSX.read(fileData, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Converter para JSON (matriz de objetos)
  const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
  
  if (rows.length === 0) return [];

  // Obter cabeçalhos reais das chaves do primeiro objeto
  const headers = Object.keys(rows[0]).map(h => h.trim().toLowerCase());

  const findKey = (row: any, keys: string[]) => {
      const foundKey = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
      return foundKey ? row[foundKey] : null;
  };

  return rows.map(row => {
    const subject = findKey(row, DYNAMICS_MAP.subject) || "";
    const customer = findKey(row, DYNAMICS_MAP.customer) || "Cliente Desconhecido";
    const rawDate = findKey(row, DYNAMICS_MAP.date);
    const address = findKey(row, DYNAMICS_MAP.address) || "Morada não especificada";
    const locality = findKey(row, DYNAMICS_MAP.locality) || "";
    const description = findKey(row, DYNAMICS_MAP.description) || "";

    let parsedDate = new Date();
    let scheduledTime = "09:00";

    // O SheetJS já tenta converter datas automaticamente se 'cellDates: true'
    if (rawDate instanceof Date && isValid(rawDate)) {
        parsedDate = rawDate;
        scheduledTime = format(rawDate, 'HH:mm');
    } else if (typeof rawDate === 'string') {
        const d = new Date(rawDate);
        if (isValid(d)) {
            parsedDate = d;
            scheduledTime = format(d, 'HH:mm');
        }
    }

    // Tentar encontrar o serviço mais parecido por nome
    const service = availableServices.find(s => 
        subject.toLowerCase().includes(s.name.toLowerCase())
    ) || availableServices[0];

    return {
      technicianIds: [availableTechs[0]?.id], 
      ticketNumber: subject.toString().substring(0, 15).toUpperCase(),
      customerName: customer.toString(),
      address: address.toString(),
      locality: locality.toString(),
      vehicleId: "", 
      serviceId: service.id,
      status: TicketStatus.NAO_CONFIRMADO,
      date: parsedDate,
      scheduledTime: scheduledTime,
      duration: service.defaultDuration,
      faultDescription: description.toString()
    };
  }).filter(t => t.customerName !== "undefined");
};
