
import { GoogleGenAI } from "@google/genai";
import { isRateLimited } from "./utils/rateLimit";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic IP-based rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  const rateLimit = isRateLimited(Array.isArray(ip) ? ip[0] : ip);

  if (rateLimit.limited) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
      reset: rateLimit.reset
    });
  }

  const { recipe, notes } = req.body;
  if (!recipe || !notes) {
    return res.status(400).json({ error: 'Recipe and notes are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL_ENV;
    const hint = isDev ? ' (Did you set it in .env.local and run via vercel dev?)' : ' (Check Vercel Environment Variables)';
    return res.status(500).json({ error: `GEMINI_API_KEY is not configured${hint}` });
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
