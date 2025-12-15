import { GoogleGenAI } from "@google/genai";
import { GlobalSettings } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getWorkingClient = async (apiKeys: string[]): Promise<GoogleGenAI | null> => {
  if (!apiKeys || apiKeys.length === 0) return null;

  // Simple round-robin or try-first approach. 
  // In a real production app, we would track failed keys. 
  // Here we just pick the first one, if it fails, the caller handles retry with next.
  // For simplicity in this demo, we instantiate with the first available key.
  
  // Note: The GenAI SDK client itself doesn't validate the key until a request is made.
  return new GoogleGenAI({ apiKey: apiKeys[0] });
};

export const generateResponse = async (
  prompt: string,
  image: File | null,
  history: { role: string; parts: { text: string }[] }[],
  settings: GlobalSettings,
  systemInstruction: string
): Promise<string> => {
  
  const apiKeys = settings.apiKeys.filter(k => k && k.trim() !== "");
  
  if (apiKeys.length === 0) {
    throw new Error("SYSTEM ERROR: NO_API_KEYS_DETECTED. CONTACT ADMIN.");
  }

  // Recursive retry logic
  const attemptGeneration = async (keyIndex: number): Promise<string> => {
    if (keyIndex >= apiKeys.length) {
      throw new Error("SYSTEM FAILURE: ALL API KEYS EXHAUSTED.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKeys[keyIndex] });
      
      const parts: any[] = [];
      if (image) {
        const imagePart = await fileToGenerativePart(image);
        parts.push(imagePart);
      }
      parts.push({ text: prompt });

      // Build chat history for context (converting to SDK format if needed, but here we just use generateContent for single turn with context if needed, or chat)
      // For a "Terminal" feel, we often just want the latest response based on history.
      // We will use generateContent with system instruction.
      
      // Constructing a "Chat" manually to include system instruction effectively every time or use chat model
      
      const modelName = 'gemini-2.5-flash'; // High speed for terminal

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
            // Previous history could be injected here if not using chat session, 
            // but for simplicity and robustness with the specific 'persona' requirement:
            ...history.map(h => ({ role: h.role, parts: h.parts })), 
            { role: 'user', parts: parts }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      return response.text || "NO_DATA_RECEIVED";

    } catch (error) {
      console.error(`Key ${keyIndex} failed:`, error);
      // Rotate key
      return attemptGeneration(keyIndex + 1);
    }
  };

  return attemptGeneration(0);
};
