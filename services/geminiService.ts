import { GoogleGenAI } from "@google/genai";
import { WorkSession } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkInsight = async (sessions: WorkSession[]): Promise<string> => {
  if (sessions.length === 0) return "No work sessions recorded yet.";

  // Filter for completed sessions only
  const completedSessions = sessions.filter(s => s.endTime !== null);
  
  // Create a lightweight summary to send to LLM
  const summaryData = completedSessions.map(s => ({
    date: new Date(s.startTime).toLocaleDateString(),
    start: new Date(s.startTime).toLocaleTimeString(),
    end: s.endTime ? new Date(s.endTime).toLocaleTimeString() : 'N/A',
    durationMinutes: Math.round((s.endTime! - s.startTime) / 60000)
  }));

  const prompt = `
    Analyze the following work log data for this month. 
    Data: ${JSON.stringify(summaryData)}
    
    Provide a friendly, 2-paragraph summary. 
    1. First paragraph: Total hours worked, average daily hours, and any patterns (e.g., late starts, long days).
    2. Second paragraph: A brief work-life balance tip based on the data.
    
    Keep the tone professional but encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights at this moment. Please check your connection.";
  }
};
