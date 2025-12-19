
import { GoogleGenAI } from "@google/genai";
import { Ticket, RouteAnalysis } from "../types";

declare var process: any;

export const analyzeRoute = async (
    tickets: Ticket[], 
    technicianName: string,
    context: {
        yesterdayOvernight: boolean;
        todayOvernight: boolean;
    }
): Promise<RouteAnalysis> => {
  if (tickets.length === 0) {
    throw new Error("São necessários serviços para calcular uma rota.");
  }

  // Always initialize GoogleGenAI inside the function to use the most current API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Sort tickets by time
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [${t.scheduledTime} - ${t.duration}h] Cliente: ${t.customerName}, Morada/CP: ${t.address}`
  ).join("\n");

  const headquarters = "4705-471, Braga, Portugal";

  let routingLogicDescription = "";
  if (context.yesterdayOvernight) {
      routingLogicDescription += "- O técnico dormiu fora na noite anterior. O ponto de partida é o LOCAL DO PRIMEIRO CLIENTE.\n";
  } else {
      routingLogicDescription += `- O técnico sai da sede no código postal ${headquarters}.\n`;
  }

  if (context.todayOvernight) {
      routingLogicDescription += "- O técnico dorme fora hoje. A rota TERMINA NO ÚLTIMO CLIENTE.\n";
  } else {
      routingLogicDescription += `- Após o último serviço, o técnico regressa à sede no código postal ${headquarters}.\n`;
  }

  const prompt = `
    Atue como um gestor de logística e tráfego inteligente em Portugal.
    Estou a calcular a rota para o técnico ${technicianName}.
    
    CRITÉRIO PRINCIPAL DE LOCALIZAÇÃO: Use o CÓDIGO POSTAL indicado nas moradas para precisão absoluta.

    Regras de Deslocação:
    ${routingLogicDescription}
    
    Serviço(s) Agendado(s):
    ${stops}

    Instruções:
    1. Calcule a rota seguindo estritamente as regras de início e fim acima.
    2. Se houver apenas um serviço, calcule IDA (Sede -> Cliente) e REGRESSO (Cliente -> Sede), a menos que as regras de dormida digam o contrário.
    3. Retorne APENAS um JSON válido seguindo este esquema. Não inclua Markdown.
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
    // Fix: Using 'gemini-2.5-flash' which is optimized for maps grounding tasks
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    // Directly access the text property as per the SDK rules (property, not method)
    let jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");

    // Remove markdown code blocks if present to ensure clean JSON parsing
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
            // Extract URL from maps object as required by Google Maps grounding guidelines
            if (chunk.maps?.uri) {
                groundingUrls.push(chunk.maps.uri);
            }
            // Extract URLs from review snippets if they exist
            if (chunk.maps?.placeAnswerSources?.reviewSnippets) {
                chunk.maps.placeAnswerSources.reviewSnippets.forEach((snippet: any) => {
                   if (snippet.uri) groundingUrls.push(snippet.uri);
                });
            }
        });
    }

    return {
        ...data,
        groundingUrls: Array.from(new Set(groundingUrls)) // Remove duplicates
    };

  } catch (error) {
    console.error("Erro ao analisar rota:", error);
    throw new Error("Não foi possível calcular a rota. Verifique a API Key.");
  }
};
