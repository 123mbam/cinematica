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

    let operation = await ai.models.generateVideos({
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

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      return { statusCode: 500, body: JSON.stringify({ error: "Video generation failed" }) };
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64Video = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({ video: `data:video/mp4;base64,${base64Video}` })
    };
  } catch (error) {
    console.error("Error animating image:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to animate image" }) };
  }
};

export { handler };
