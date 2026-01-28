
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private static getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateKeyframe(prompt: string, styleSuffix: string) {
    const ai = this.getClient();
    const fullPrompt = `${prompt}. ${styleSuffix}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  }

  static async editImage(base64Image: string, editPrompt: string) {
    const ai = this.getClient();
    const base64Data = base64Image.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png'
            }
          },
          { text: editPrompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from image editing");
  }

  static async animateImage(base64Image: string, prompt: string, onProgress?: (msg: string) => void) {
    const ai = this.getClient();
    const base64Data = base64Image.split(',')[1];

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Bring this image to life: ${prompt}. Subtle cinematic motion.`,
      image: {
        imageBytes: base64Data,
        mimeType: 'image/png'
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      if (onProgress) {
        onProgress("Processing cinematic sequences...");
      }
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}
