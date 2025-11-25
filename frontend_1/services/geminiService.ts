import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development environments where process.env might not be set.
  // In a real production environment, the key should always be available.
  console.warn("API_KEY environment variable is not set. The application may not function correctly.");
}

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const BASE_PROMPT = `Generate a 2D architectural floor plan with a clean, minimalist, modern aesthetic. The background should be pure white, and the lines should be crisp black, with walls having a thicker line weight than schematic furniture. Do not include any colors, textures, or excessive details. The output must be a professional, schematic-style layout focusing on walls, doors, windows, and clear room labels.`;

const extractImageFromResponse = (response: GenerateContentResponse): { imageUrl: string; mimeType: string } => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const { data, mimeType } = part.inlineData;
      return { imageUrl: `data:${mimeType};base64,${data}`, mimeType };
    }
  }
  throw new Error("No image data found in the API response.");
};

export const generateFloorplan = async (prompt: string): Promise<{ imageUrl: string; mimeType: string }> => {
  const ai = getAiClient();
  const fullPrompt = `${BASE_PROMPT}\n\nUser request: "${prompt}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: fullPrompt }] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  return extractImageFromResponse(response);
};

export const editFloorplan = async (base64Image: string, mimeType: string, prompt: string): Promise<{ imageUrl: string; mimeType: string }> => {
  const ai = getAiClient();
  const fullPrompt = `Edit the provided floorplan based on the following instruction: "${prompt}". Maintain the original minimalist, modern, black-and-white schematic style.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: fullPrompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  return extractImageFromResponse(response);
};