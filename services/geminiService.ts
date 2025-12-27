
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

  // Initialize GenAI client. Maps grounding and thinking config require Gemini 2.5 or 3 series models.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Fix: use camelCase property names as defined in the updated types.ts
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [H: ${t.scheduledTime}] Cliente: ${t.customerName}, CP7: ${t.address}, Localidade: ${t.locality || 'N/A'}`
  ).join("\n");

  const headquarters = "4705-471, Braga, Portugal";

  let routingLogicDescription = "";
  if (context.yesterdayOvernight) {
      routingLogicDescription += "- INÍCIO: Técnico já no terreno (dormiu fora). Começar no 1º cliente.\n";
  } else {
      routingLogicDescription += `- INÍCIO: Partida da sede em Braga (${headquarters}).\n`;
  }

  if (context.todayOvernight) {
      routingLogicDescription += "- FIM: Técnico dorme fora. Rota termina no último cliente.\n";
  } else {
      routingLogicDescription += `- FIM: Regresso obrigatório à sede (${headquarters}).\n`;
  }

  const prompt = `
    Como especialista em logística em PORTUGAL, calcule a rota mais eficiente para o técnico ${technicianName}.
    
    DIRETRIZES:
    ${routingLogicDescription}
    
    PARAGENS:
    ${stops}

    REGRAS:
    1. PRIORIDADE AO CÓDIGO POSTAL (CP7).
    2. Calcule tempos de deslocação reais.
    3. Retorne APENAS um objeto JSON puro.

    ESTRUTURA:
    {
      "totalTime": "tempo total",
      "totalDistance": "km totais",
      "segments": [
        { "from": "A", "to": "B", "estimatedTime": "X min", "distance": "Y km" }
      ]
    }
  `;

  try {
    // Maps grounding is only supported in Gemini 2.5 series models. 
    // Thinking Config is available for Gemini 2.5 and 3 series.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        thinkingConfig: { thinkingBudget: 2000 },
        temperature: 0.1,
      },
    });

    // Access the text property directly on the response object.
    let jsonText = response.text || "";
    
    if (!jsonText) throw new Error("A IA não retornou dados de rota.");

    // Limpeza de markdown caso o modelo inclua
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) data = JSON.parse(jsonMatch[0]);
        else throw new Error("Erro ao interpretar dados da rota.");
    }
    
    const groundingUrls: string[] = [];
    // Extract Maps grounding URLs as required by the guidelines
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
        groundingUrls: Array.from(new Set(groundingUrls))
    };

  } catch (error: any) {
    console.error("Erro Logística Gemini:", error);
    throw new Error("Erro na comunicação com a IA. Verifique a ligação.");
  }
};
