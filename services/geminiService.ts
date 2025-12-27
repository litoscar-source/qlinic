
import { GoogleGenAI } from "@google/genai";
import { Ticket, RouteAnalysis } from "../types";

declare var process: any;

/**
 * Serviço de análise de rotas otimizado para o território português
 * Utiliza o código postal base do técnico ou a sede 4705-471 como ponto de partida/chegada.
 */
export const analyzeRoute = async (
    tickets: Ticket[], 
    technicianName: string,
    context: {
        yesterdayOvernight: boolean;
        todayOvernight: boolean;
        basePostalCode?: string; // Código postal de base do técnico
        previousDayLastLocation?: string; // Endereço/CP7 do último cliente de ontem
        userLocation?: { latitude: number; longitude: number };
    }
): Promise<RouteAnalysis & { travelUpdates: { ticketId: string, travelTimeMinutes: number }[] }> => {
  if (tickets.length === 0) {
    throw new Error("São necessários serviços para calcular uma rota.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [ID: ${t.id}] [Hora: ${t.scheduledTime}] Cliente: ${t.customerName}, CP7: ${t.address}, Cidade: ${t.locality || 'N/A'}`
  ).join("\n");

  const DEFAULT_HEADQUARTERS = "4705-471, Braga, Portugal";
  const technicianBase = context.basePostalCode ? `${context.basePostalCode}, Portugal` : DEFAULT_HEADQUARTERS;

  let routingContext = `A base de operação para este técnico é: ${technicianBase}.\n`;
  
  // LÓGICA DE PARTIDA (INÍCIO DO DIA)
  if (context.yesterdayOvernight) {
      if (context.previousDayLastLocation) {
          routingContext += `- O técnico dormiu fora ontem. A jornada de hoje COMEÇA no local do último cliente de ontem: ${context.previousDayLastLocation}.\n`;
          routingContext += `- O tempo de viagem para o 1º cliente de hoje deve ser calculado a partir de ${context.previousDayLastLocation}.\n`;
      } else {
          routingContext += `- O técnico dormiu fora ontem. Inicie o cálculo diretamente no 1º cliente (tempo de viagem inicial = 0).\n`;
      }
  } else {
      routingContext += `- PARTIDA DA BASE: O técnico sai obrigatoriamente da sua base (${technicianBase}) em direção ao 1º cliente.\n`;
  }

  // LÓGICA DE CHEGADA (FIM DO DIA)
  if (context.todayOvernight) {
      routingContext += "- O técnico DORME FORA hoje. A jornada termina no local do último cliente. NÃO calcule o regresso à base.\n";
  } else {
      routingContext += `- REGRESSO À BASE: O técnico deve regressar à sua base (${technicianBase}) após o último cliente de hoje. Inclua este tempo no tempo total de condução.\n`;
  }

  const prompt = `
    Como especialista em logística em Portugal, analise o percurso do técnico ${technicianName}.
    
    LOGÍSTICA DE BASE E DORMIDAS:
    ${routingContext}
    
    LISTA DE CLIENTES DE HOJE:
    ${stops}

    TAREFAS:
    1. Calcule tempos e distâncias reais entre códigos postais (CP7).
    2. "travelTimeMinutes": Tempo de condução que antecede cada cliente. 
       - Se ontem houve dormida, o 1º cliente recebe o tempo desde o local de pernoita.
       - Se ontem NÃO houve dormida, o 1º cliente recebe o tempo desde a base (${technicianBase}).
    3. Calcule o tempo total de condução acumulado do dia.
    4. Forneça o resultado EXCLUSIVAMENTE em formato JSON limpo.

    ESTRUTURA DO JSON:
    {
      "totalTime": "string (ex: 3h 10m)",
      "totalDistance": "string (ex: 245 km)",
      "segments": [
        { "from": "Local A", "to": "Local B", "estimatedTime": "X min", "distance": "Y km" }
      ],
      "travelUpdates": [
        { "ticketId": "id_do_ticket", "travelTimeMinutes": 45 }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: context.userLocation ? {
          retrievalConfig: {
            latLng: { latitude: context.userLocation.latitude, longitude: context.userLocation.longitude }
          }
        } : undefined,
        systemInstruction: `Você é um motor de otimização logística para Portugal. Siga rigorosamente as instruções de dormida (overnight). Utilize a base de partida especificada (${technicianBase}) para todos os cálculos.`,
        temperature: 0
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("A IA não conseguiu processar a rota.");
    
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json|```/g, "").trim();
    
    let data;
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error("Erro na interpretação dos dados logísticos.");
    }

    const sanitizedData = {
        totalTime: data.totalTime || "Pendente",
        totalDistance: data.totalDistance || "Pendente",
        segments: Array.isArray(data.segments) ? data.segments : [],
        travelUpdates: Array.isArray(data.travelUpdates) ? data.travelUpdates : []
    };
    
    const groundingUrls: string[] = [];
    const chunks = candidate.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.maps?.uri) groundingUrls.push(chunk.maps.uri);
        });
    }

    return {
        ...sanitizedData,
        groundingUrls: Array.from(new Set(groundingUrls))
    };

  } catch (error: any) {
    console.error("Erro Rota:", error);
    throw new Error(error.message || "Falha na comunicação com o serviço de mapas.");
  }
};
