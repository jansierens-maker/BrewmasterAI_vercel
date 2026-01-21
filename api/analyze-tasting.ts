
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipe, notes } = req.body;
  if (!recipe || !notes) {
    return res.status(400).json({ error: 'Recipe and notes are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `As a Master Cicerone, analyze this recipe and the following tasting notes:

      Recipe: ${JSON.stringify(recipe)}
      Tasting Notes: ${notes}

      Provide feedback on stylistic accuracy, possible brewing improvements, and suggestions for future iterations.`,
    });

    return res.status(200).json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Tasting analysis error:", error);
    return res.status(500).json({ error: error.message });
  }
}
