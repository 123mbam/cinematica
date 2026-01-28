import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { base64Image, prompt } = JSON.parse(event.body || "{}");

    if (!base64Image || !prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Image and prompt are required" }) };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64Image.split(",")[1] || base64Image;

    const operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: `Bring this image to life: ${prompt}. Subtle cinematic motion.`,
      image: {
        imageBytes: base64Data,
        mimeType: "image/png"
      },
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "16:9"
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ operationName: operation.name })
    };
  } catch (error) {
    console.error("Error starting animation:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to start animation" }) };
  }
};

export { handler };
