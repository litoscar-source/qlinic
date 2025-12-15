
import { GoogleGenAI } from "@google/genai";
import { Ticket, RouteAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeRoute = async (tickets: Ticket[], technicianName: string): Promise<RouteAnalysis> => {
  if (tickets.length < 2) {
    throw new Error("São necessários pelo menos 2 tickets para calcular uma rota.");
  }

  // Sort tickets by time
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [${t.scheduledTime} - ${t.duration}h] ${t.customerName} - ${t.address}`
  ).join("\n");

  const prompt = `
    Atue como um gestor de logística e tráfego. Eu tenho uma lista de paragens agendadas para: ${technicianName}.
    
    Lista de Paragens:
    ${stops}

    Por favor, calcule/estime o tempo de deslocação e a distância entre cada paragem consecutiva (1->2, 2->3, etc.) usando o Google Maps para verificar as localizações.
    Considere também a duração de cada serviço para ver se o horário é exequível, mas o foco principal é o tempo de viagem entre pontos.
    
    IMPORTANTE: Retorne APENAS um JSON válido seguindo este esquema. Não inclua Markdown (como \`\`\`json) ou texto adicional.
    {
      "totalTime": "tempo total de condução estimado (ex: 1h 30m)",
      "totalDistance": "distância total estimada (ex: 45 km)",
      "segments": [
        {
          "from": "Endereço ou nome de origem",
          "to": "Endereço ou nome de destino",
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
        // responseMimeType and responseSchema MUST NOT be set when using googleMaps
      },
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");

    // Clean markdown formatting if present
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        console.error("Falha ao processar JSON da resposta:", jsonText);
        throw new Error("Formato de resposta inválido da IA.");
    }
    
    // Extract grounding URLs if available
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
