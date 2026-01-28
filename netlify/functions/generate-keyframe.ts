import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt, styleSuffix } = JSON.parse(event.body || "{}");

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required" }) };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `${prompt}. ${styleSuffix || ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
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
        return {
          statusCode: 200,
          body: JSON.stringify({ image: `data:image/png;base64,${part.inlineData.data}` })
        };
      }
    }

    return { statusCode: 500, body: JSON.stringify({ error: "No image data returned from Gemini" }) };
  } catch (error) {
    console.error("Error generating keyframe:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate image" }) };
  }
};

export { handler };
