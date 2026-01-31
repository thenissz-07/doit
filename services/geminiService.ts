
import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getTutorResponse = async (history: {role: 'user' | 'model', parts: {text: string}[]}[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Tutor Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again!";
  }
};

export const getWritingFeedback = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Evaluate the following text for a B1 English student. Provide feedback on grammar, vocabulary, and structure. Suggest 3 improvements. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.STRING, description: "Estimated CEFR level" },
            corrections: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific grammatical corrections" },
            vocabularySuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Better word choices" },
            generalFeedback: { type: Type.STRING }
          },
          required: ["score", "corrections", "vocabularySuggestions", "generalFeedback"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Writing Lab Error:", error);
    return null;
  }
};
