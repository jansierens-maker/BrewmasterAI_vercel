
import { Recipe } from "../types";

export class GeminiService {
  async generateRecipe(prompt: string): Promise<Recipe> {
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipe');
      } else {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.slice(0, 100)}...`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response from server: Expected JSON");
    }

    return response.json();
  }

  async analyzeTasting(recipe: Recipe, notes: string): Promise<string> {
    const response = await fetch('/api/analyze-tasting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe, notes }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze tasting');
      } else {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.slice(0, 100)}...`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response from server: Expected JSON");
    }

    const data = await response.json();
    return data.text || "";
  }
}
