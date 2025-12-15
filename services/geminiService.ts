
import { GoogleGenAI } from "@google/genai";
import { Ticket, RouteAnalysis } from "../types";

// Safety check for browser environments where process might not be defined
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return ''; // Return empty string if process is not defined to avoid crash
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const analyzeRoute = async (tickets: Ticket[], technicianName: string, isOvernight: boolean): Promise<RouteAnalysis> => {
  if (tickets.length < 1) {
    throw new Error("É necessário pelo menos 1 serviço para calcular uma rota.");
  }

  // Sort tickets by time
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // Calculate known service duration (reparação)
  const totalServiceHours = sortedTickets.reduce((acc, t) => acc + t.duration, 0);

  // Define Base Location explicitly
  const BASE_LOCATION = "Celeiros, Braga, Portugal";

  let stopsList = sortedTickets.map((t, index) => 
    `   - Paragem ${index + 1} [${t.scheduledTime}]: Cliente ${t.customerName} @ ${t.address}`
  ).join("\n");

  let instruction = "";

  if (!isOvernight) {
      // CENÁRIO: NÃO DORME FORA (Rotina Padrão)
      // Sai de Celeiros -> Clientes -> Volta a Celeiros
      instruction = `
      CONFIGURAÇÃO DA ROTA (SEM PERNOITA):
      1. PONTO DE PARTIDA: O técnico sai obrigatoriamente da base em "${BASE_LOCATION}".
      2. PERCURSO: Visita os clientes listados acima na ordem horária indicada.
      3. PONTO FINAL: O técnico DEVE REGRESSAR obrigatoriamente à base em "${BASE_LOCATION}".
      
      A sua resposta deve incluir o segmento inicial (Base -> 1º Cliente) e o segmento final (Último Cliente -> Base).
      `;
  } else {
      // CENÁRIO: DORME FORA
      // Sai de Celeiros -> Clientes -> Fica no último
      instruction = `
      CONFIGURAÇÃO DA ROTA (COM PERNOITA):
      1. PONTO DE PARTIDA: O técnico sai da base em "${BASE_LOCATION}".
      2. PERCURSO: Visita os clientes listados acima na ordem horária indicada.
      3. PONTO FINAL: A rota termina na localização do último cliente (O técnico dorme fora). NÃO adicione regresso à base.
      
      A sua resposta deve incluir o segmento inicial (Base -> 1º Cliente).
      `;
  }

  const prompt = `
    Atue como um gestor de frota e logística inteligente. 
    Técnico: ${technicianName}.
    
    LISTA DE PARAGENS AGENDADAS:
    ${stopsList}

    ${instruction}

    TAREFA:
    1. Calcule o tempo de viagem (condução) e a distância entre cada ponto usando o Google Maps.
    2. O tempo de reparação/serviço já é conhecido (${totalServiceHours} horas), NÃO o inclua nos cálculos de "travelTime" dos segmentos, foque apenas na condução.
    
    IMPORTANTE: Retorne APENAS um JSON válido.
    Formato esperado:
    {
      "travelTime": "tempo total APENAS de condução somado (ex: 2h 15m)",
      "totalDistance": "distância total acumulada (ex: 145 km)",
      "segments": [
        {
          "from": "Nome do local de origem (Ex: Celeiros, Braga)",
          "to": "Nome do local de destino",
          "travelTime": "ex: 15 min",
          "distance": "ex: 12 km"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");

    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        console.error("JSON Parse Error:", jsonText);
        throw new Error("Erro ao processar resposta da IA.");
    }
    
    // Extract grounding URLs
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.maps?.uri) {
                groundingUrls.push(chunk.maps.uri);
            }
        });
    }

    // Calculate total formatted string
    const serviceTimeStr = `${totalServiceHours}h`;
    
    // Helper to sum times loosely (just for display purposes in this demo)
    const totalTimeDisplay = `${data.travelTime} (Viagem) + ${serviceTimeStr} (Serviço)`;

    return {
        ...data,
        serviceTime: serviceTimeStr,
        totalTime: totalTimeDisplay,
        groundingUrls
    };

  } catch (error) {
    console.error("Erro na análise de rota:", error);
    throw new Error("Não foi possível calcular a rota. Verifique a API Key.");
  }
};
