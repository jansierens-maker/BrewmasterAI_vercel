
import { Recipe } from "../types";

export class GeminiService {
  async generateRecipe(prompt: string): Promise<Recipe> {
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate recipe');
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze tasting');
    }

    const data = await response.json();
    return data.text || "";
  }
}
