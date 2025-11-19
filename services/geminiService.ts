
import { GoogleGenAI, Modality } from "@google/genai";
import { MODEL_NAME } from "../constants";

export const generateSpeech = async (
  text: string,
  voiceName: string,
  languageCode: string
): Promise<string | undefined> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [{ text: text }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
      },
    });

    // The response structure for AUDIO modality returns the base64 data in inlineData
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
