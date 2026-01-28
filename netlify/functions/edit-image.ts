import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { base64Image, editPrompt } = JSON.parse(event.body || "{}");

    if (!base64Image || !editPrompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Image and edit prompt are required" }) };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64Image.split(",")[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/png"
            }
          },
          { text: editPrompt }
        ]
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

    return { statusCode: 500, body: JSON.stringify({ error: "No image data returned from image editing" }) };
  } catch (error) {
    console.error("Error editing image:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to edit image" }) };
  }
};

export { handler };
