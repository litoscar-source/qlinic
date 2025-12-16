
import { GoogleGenAI } from "@google/genai";
import { Ticket, RouteAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeRoute = async (
    tickets: Ticket[], 
    technicianName: string,
    context: {
        yesterdayOvernight: boolean;
        todayOvernight: boolean;
    }
): Promise<RouteAnalysis> => {
  if (tickets.length < 2) {
    throw new Error("São necessários pelo menos 2 tickets para calcular uma rota.");
  }

  // Sort tickets by time
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [${t.scheduledTime} - ${t.duration}h] Cliente: ${t.customerName}, Morada/CP: ${t.address}`
  ).join("\n");

  const headquarters = "Braga, Portugal";

  let routingLogicDescription = "";
  if (context.yesterdayOvernight) {
      routingLogicDescription += "- O técnico dormiu fora na noite anterior. O ponto de partida é o LOCAL DO PRIMEIRO CLIENTE (não sai de Braga).\n";
  } else {
      routingLogicDescription += `- O técnico sai da sede em ${headquarters}.\n`;
  }

  if (context.todayOvernight) {
      routingLogicDescription += "- O técnico dorme fora hoje. A rota TERMINA NO ÚLTIMO CLIENTE (não volta a Braga).\n";
  } else {
      routingLogicDescription += `- Após o último serviço, o técnico deve regressar à sede em ${headquarters}.\n`;
  }

  const prompt = `
    Atue como um gestor de logística e tráfego inteligente em Portugal.
    Estou a calcular a rota para o técnico ${technicianName}.
    
    CRITÉRIO PRINCIPAL DE LOCALIZAÇÃO: Use preferencialmente o CÓDIGO POSTAL indicado nas moradas para precisão.

    Regras de Deslocação (Baseado em estadias):
    ${routingLogicDescription}
    
    Lista de Serviços Agendados (Paragens):
    ${stops}

    Instruções:
    1. Calcule a rota seguindo estritamente as regras de início e fim acima.
    2. Considere a ordem cronológica dos serviços.
    3. Estime tempos de condução realistas para Portugal.
    
    IMPORTANTE: Retorne APENAS um JSON válido seguindo este esquema. Não inclua Markdown.
    {
      "totalTime": "tempo total de condução + tempos de serviço (ex: 8h 30m)",
      "totalDistance": "distância total percorrida (ex: 145 km)",
      "segments": [
        {
          "from": "Local Origem (Sede ou Cliente Anterior)",
          "to": "Local Destino (Cliente ou Sede)",
          "estimatedTime": "ex: 15 min",
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
        console.error("Falha ao processar JSON da resposta:", jsonText);
        throw new Error("Formato de resposta inválido da IA.");
    }
    
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.maps?.uri) {
                groundingUrls.push(chunk.maps.uri);
            }
        });
    }

    return {
        ...data,
        groundingUrls
    };

  } catch (error) {
    console.error("Erro ao analisar rota:", error);
    throw new Error("Não foi possível calcular a rota. Verifique a API Key.");
  }
};
