import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { operationName } = JSON.parse(event.body || "{}");

    if (!operationName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Operation name is required" }) };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const operation = await ai.operations.getVideosOperation({
      operation: { name: operationName }
    });

    if (!operation.done) {
      return {
        statusCode: 200,
        body: JSON.stringify({ done: false })
      };
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
      body: JSON.stringify({
        done: true,
        video: `data:video/mp4;base64,${base64Video}`
      })
    };
  } catch (error) {
    console.error("Error checking animation status:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to check animation status" }) };
  }
};

export { handler };
