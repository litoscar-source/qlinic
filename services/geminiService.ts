
import { GoogleGenAI } from "@google/genai";
import { Ticket, RouteAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeRoute = async (tickets: Ticket[], technicianName: string): Promise<RouteAnalysis> => {
  if (tickets.length < 2) {
    throw new Error("São necessários pelo menos 2 serviços para calcular uma rota.");
  }

  // Sort tickets by time
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // Calculate known service duration (reparação)
  const totalServiceHours = sortedTickets.reduce((acc, t) => acc + t.duration, 0);

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [Hora: ${t.scheduledTime}] Cliente: ${t.customerName} - Morada: ${t.address}`
  ).join("\n");

  const prompt = `
    Atue como um gestor de frota e logística. 
    Técnico: ${technicianName}.
    
    Lista de paragens sequenciais:
    ${stops}

    TAREFA:
    1. Calcule o tempo de viagem (condução) e a distância entre cada paragem usando o Google Maps.
    2. O tempo de reparação/serviço já é conhecido (${totalServiceHours} horas no total), NÃO o inclua nos cálculos de "travelTime" dos segmentos, apenas foque no deslocamento.
    
    IMPORTANTE: Retorne APENAS um JSON válido.
    Formato esperado:
    {
      "travelTime": "tempo total APENAS de condução (ex: 1h 15m)",
      "totalDistance": "distância total acumulada (ex: 45 km)",
      "segments": [
        {
          "from": "Origem",
          "to": "Destino",
          "travelTime": "ex: 15 min",
          "distance": "ex: 5 km"
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
    // In a real app, use a library like duration-fns
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
