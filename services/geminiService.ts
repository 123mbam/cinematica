export class GeminiService {
  static async generateKeyframe(prompt: string, styleSuffix: string) {
    const response = await fetch("/.netlify/functions/generate-keyframe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, styleSuffix })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate keyframe");
    }

    const data = await response.json();
    return data.image;
  }

  static async editImage(base64Image: string, editPrompt: string) {
    const response = await fetch("/.netlify/functions/edit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, editPrompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to edit image");
    }

    const data = await response.json();
    return data.image;
  }

  static async animateImage(base64Image: string, prompt: string, onProgress?: (msg: string) => void) {
    if (onProgress) {
      onProgress("Starting video generation...");
    }

    // Start the animation
    const startResponse = await fetch("/.netlify/functions/animate-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, prompt })
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.error || "Failed to start animation");
    }

    const { operationName } = await startResponse.json();

    // Poll for completion
    while (true) {
      if (onProgress) {
        onProgress("Processing cinematic sequences...");
      }

      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch("/.netlify/functions/animate-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName })
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(error.error || "Failed to check animation status");
      }

      const statusData = await statusResponse.json();

      if (statusData.done) {
        // Convert base64 video to blob URL
        const byteCharacters = atob(statusData.video.split(",")[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "video/mp4" });

        return URL.createObjectURL(blob);
      }
    }
  }
}
