
import { GoogleGenAI } from "@google/genai";
import { CameraState } from "../types";

// Helper to convert camera state to a descriptive prompt
export const generatePromptFromState = (state: CameraState): string => {
  const { azimuth, elevation, distance } = state;

  let view = "front view";
  if (azimuth >= 337.5 || azimuth < 22.5) view = "front view";
  else if (azimuth >= 22.5 && azimuth < 67.5) view = "front-right 3/4 view";
  else if (azimuth >= 67.5 && azimuth < 112.5) view = "right side profile view";
  else if (azimuth >= 112.5 && azimuth < 157.5) view = "back-right view";
  else if (azimuth >= 157.5 && azimuth < 202.5) view = "back view";
  else if (azimuth >= 202.5 && azimuth < 247.5) view = "back-left view";
  else if (azimuth >= 247.5 && azimuth < 292.5) view = "left side profile view";
  else if (azimuth >= 292.5 && azimuth < 337.5) view = "front-left 3/4 view";

  let angle = "eye-level shot";
  if (elevation > 40) angle = "high-angle shot";
  else if (elevation > 15) angle = "slightly elevated shot";
  else if (elevation < -15) angle = "low-angle shot";

  let shot = "medium shot";
  if (distance <= 0.7) shot = "close-up shot";
  else if (distance > 1.2) shot = "wide-angle shot";

  return `${view}, ${angle}, ${shot}, highly detailed, photorealistic, 4k`;
};

export const generateImage = async (
  inputImageBase64: string,
  cameraState: CameraState,
  apiKey?: string
): Promise<string> => {
  try {
    const promptDescription = generatePromptFromState(cameraState);
    const prompt = `Re-imagine the object in the input image with the following camera parameters: ${promptDescription}. 
    Maintain consistent identity, colors, and materials. Perspective should perfectly match the requested camera view. Output only the final re-rendered image.`;
    
    const base64Data = inputImageBase64.split(',')[1] || inputImageBase64;

    const finalApiKey = apiKey || process.env.API_KEY || '';
    if (!finalApiKey) {
      throw new Error("No Gemini API Key provided. Please enter one in the top left.");
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                 return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data found in response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
