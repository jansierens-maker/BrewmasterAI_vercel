
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Fix: Always use the named parameter `apiKey` and assume it is valid from process.env.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateRecipe(prompt: string): Promise<Recipe> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a detailed beer recipe in BeerJSON structure based on the following request: ${prompt}. 
      Ensure the output is strictly valid JSON and matches the BeerJSON schema. Include fermentables, hops, cultures, and specifications.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            author: { type: Type.STRING },
            batch_size: {
              type: Type.OBJECT,
              properties: {
                unit: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["unit", "value"]
            },
            style: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            },
            ingredients: {
              type: Type.OBJECT,
              properties: {
                fermentables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      amount: {
                        type: Type.OBJECT,
                        properties: { unit: { type: Type.STRING }, value: { type: Type.NUMBER } }
                      },
                      color: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER } } }
                    }
                  }
                },
                hops: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      use: { type: Type.STRING },
                      amount: {
                        type: Type.OBJECT,
                        properties: { unit: { type: Type.STRING }, value: { type: Type.NUMBER } }
                      },
                      time: {
                        type: Type.OBJECT,
                        properties: { unit: { type: Type.STRING }, value: { type: Type.NUMBER } }
                      }
                    }
                  }
                },
                cultures: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      form: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            efficiency: {
              type: Type.OBJECT,
              properties: { brewhouse: { type: Type.NUMBER } }
            },
            boil_time: {
              type: Type.OBJECT,
              properties: { unit: { type: Type.STRING }, value: { type: Type.NUMBER } }
            },
            specifications: {
              type: Type.OBJECT,
              properties: {
                og: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER } } },
                fg: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER } } },
                abv: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER } } },
                ibu: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER } } },
                color: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER } } }
              }
            }
          },
          required: ["name", "type", "author", "batch_size", "ingredients", "efficiency", "boil_time"]
        }
      }
    });

    // Fix: Access response text via the .text property (not a method).
    return JSON.parse(response.text || '{}');
  }

  async analyzeTasting(recipe: Recipe, notes: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As a Master Cicerone, analyze this recipe and the following tasting notes:
      
      Recipe: ${JSON.stringify(recipe)}
      Tasting Notes: ${notes}
      
      Provide feedback on stylistic accuracy, possible brewing improvements, and suggestions for future iterations.`,
    });
    // Fix: Access response text via the .text property (not a method).
    return response.text || "";
  }
}
