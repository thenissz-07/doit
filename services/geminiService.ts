
import { GoogleGenAI, Type } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { Level } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTutorResponse = async (history: {role: 'user' | 'model', parts: {text: string}[]}[], level: Level = 'Intermediate') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        systemInstruction: getSystemInstruction(level),
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

export const getWritingFeedback = async (text: string, level: Level = 'Intermediate') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Evaluate the following text for an ${level} English student. Focus on Medical context. Provide feedback on grammar, vocabulary, and structure appropriate for ${level} level. Suggest 3 improvements. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.STRING, description: "Estimated proficiency level" },
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

export const getSpeakingFeedback = async (audioBase64: string, scenario: string, level: Level = 'Intermediate') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/wav',
                data: audioBase64,
              },
            },
            {
              text: `Analyze this audio response for the following medical English scenario: "${scenario}". 
              The student is at ${level} level. Evaluate their pronunciation, fluency, and medical accuracy.
              Provide feedback in a structured JSON format.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pronunciationScore: { type: Type.NUMBER, description: "Score out of 10" },
            fluencyScore: { type: Type.NUMBER, description: "Score out of 10" },
            accuracyScore: { type: Type.NUMBER, description: "Score out of 10" },
            transcription: { type: Type.STRING },
            phoneticFeedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific words mispronounced" },
            medicalTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Better medical terms or phrasing" },
            overallEvaluation: { type: Type.STRING }
          },
          required: ["pronunciationScore", "fluencyScore", "accuracyScore", "transcription", "phoneticFeedback", "medicalTips", "overallEvaluation"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Speaking Lab Error:", error);
    return null;
  }
};
