
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Sort tickets by time
  const sortedTickets = [...tickets].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const stops = sortedTickets.map((t, index) => 
    `${index + 1}. [H: ${t.scheduledTime}] Cliente: ${t.customerName}, CP7/Morada: ${t.address}, Localidade: ${t.locality || 'N/A'}`
  ).join("\n");

  const headquarters = "4705-471, Braga, Portugal";

  let routingLogicDescription = "";
  if (context.yesterdayOvernight) {
      routingLogicDescription += "- PONTO INICIAL: O técnico já está no terreno (dormiu fora). Iniciar no 1º cliente.\n";
  } else {
      routingLogicDescription += `- PONTO INICIAL: Partida da sede em ${headquarters}.\n`;
  }

  if (context.todayOvernight) {
      routingLogicDescription += "- PONTO FINAL: O técnico dorme fora hoje. Rota encerra no último cliente.\n";
  } else {
      routingLogicDescription += `- PONTO FINAL: Regresso obrigatório à sede em ${headquarters}.\n`;
  }

  // Fix: Escape triple backticks inside the template literal to prevent syntax errors
  const prompt = `
    Como especialista em logística de transportes em PORTUGAL, calcule a rota mais eficiente para o técnico ${technicianName}.
    
    DIRETRIZES DE MOVIMENTAÇÃO:
    ${routingLogicDescription}
    
    LISTA DE PARAGENS (Utilize obrigatoriamente os CÓDIGOS POSTAIS para geolocalização exata):
    ${stops}

    REGRAS CRÍTICAS:
    1. PRIORIDADE TOTAL AO CÓDIGO POSTAL (CP7) fornecido em cada morada para evitar erros de localidade.
    2. Calcule os tempos de deslocação reais baseados na rede viária portuguesa.
    3. Retorne EXCLUSIVAMENTE um objeto JSON válido.
    4. Não inclua Markdown (\`\`\`json) ou qualquer texto explicativo fora do JSON.

    ESTRUTURA JSON OBRIGATÓRIA:
    {
      "totalTime": "tempo total condução + estimativa (ex: 7h 45m)",
      "totalDistance": "km totais (ex: 145 km)",
      "segments": [
        {
          "from": "Local de Partida",
          "to": "Local de Destino",
          "estimatedTime": "tempo trecho",
          "distance": "distância trecho"
        }
      ]
    }
  `;

  try {
    // Fix: Use a Gemini 2.5 series model as required for Maps Grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest", 
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        systemInstruction: "Você é um algoritmo de roteirização geográfica para Portugal. Sua saída deve ser puramente JSON, sem formatação markdown. Use sempre o Código Postal para precisão absoluta.",
        temperature: 0.1,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("A infraestrutura de IA não devolveu candidatos.");
    
    // Fix: Access text property directly (not a method) as per guidelines
    let jsonText = response.text || "";
    
    if (!jsonText && candidate.content?.parts) {
      jsonText = candidate.content.parts.map(p => p.text || "").join("").trim();
    }

    if (!jsonText) throw new Error("Resposta da IA vazia. Tente novamente.");

    // Clean up potential markdown formatting if model ignored system instruction
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) data = JSON.parse(jsonMatch[0]);
        else throw new Error("A IA gerou um formato de dados ilegível.");
    }
    
    const groundingUrls: string[] = [];
    const chunks = candidate.groundingMetadata?.groundingChunks;
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
    console.error("Erro Logística:", error);
    throw new Error(error.message || "Falha ao processar os dados geográficos.");
  }
};
