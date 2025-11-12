import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PlanningReport } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generatePlan(
  prompt: string,
  file: { mimeType: string; data: string }
): Promise<PlanningReport> {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.data } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    strategyTitle: { type: Type.STRING },
                    kpiTiers: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                tierTitle: { type: Type.STRING },
                                kpis: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            kpi: { type: Type.STRING },
                                            rationale: { type: Type.STRING },
                                            location: { type: Type.STRING }
                                        },
                                        required: ["kpi", "rationale", "location"]
                                    }
                                }
                            },
                            required: ["tierTitle", "kpis"]
                        }
                    }
                },
                required: ["strategyTitle", "kpiTiers"]
            },
        },
    });
    
    // The response text should be a JSON string that we can parse directly
    return JSON.parse(response.text) as PlanningReport;
}

export async function generateReport(
  prompt: string,
  file: { mimeType: string; data: string }
): Promise<string> {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { 
      parts: [
        { inlineData: { mimeType: file.mimeType, data: file.data } },
        { text: prompt }
      ]
    },
  });

  return response.text;
}
