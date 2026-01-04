
import { Recipe, Fermentable, Hop, Culture, Misc, Water } from "../types";

export interface BeerXmlImportResult {
  recipes: Recipe[];
  fermentables: any[];
  hops: any[];
  cultures: any[];
  miscs: any[];
  waters: any[];
  styles: any[];
  equipments: any[];
  mashes: any[];
}

export const parseBeerXml = (xmlString: string): BeerXmlImportResult => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  const result: BeerXmlImportResult = {
    recipes: [],
    fermentables: [],
    hops: [],
    cultures: [],
    miscs: [],
    waters: [],
    styles: [],
    equipments: [],
    mashes: []
  };

  const getVal = (el: Element | null, tag: string) => el?.getElementsByTagName(tag)[0]?.textContent || "";
  const getNum = (el: Element | null, tag: string) => parseFloat(el?.getElementsByTagName(tag)[0]?.textContent || "0");

  // 1. Recepten met diepgaande ingrediënt-parsing
  const recipes = xmlDoc.getElementsByTagName("RECIPE");
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    
    // Parse Fermentables in recipe
    const recipeFermentables: Fermentable[] = [];
    const fNodes = r.getElementsByTagName("FERMENTABLE");
    for (let j = 0; j < fNodes.length; j++) {
      const f = fNodes[j];
      const pot = getNum(f, "POTENTIAL");
      recipeFermentables.push({
        name: getVal(f, "NAME"),
        type: getVal(f, "TYPE").toLowerCase(),
        amount: { unit: "kilograms", value: getNum(f, "AMOUNT") },
        yield: { potential: { value: pot || 1.037 } },
        color: { value: getNum(f, "COLOR") }
      });
    }

    // Parse Hops in recipe
    const recipeHops: Hop[] = [];
    const hNodes = r.getElementsByTagName("HOP");
    for (let j = 0; j < hNodes.length; j++) {
      const h = hNodes[j];
      // BeerXML is in KG, we use Grams internally
      recipeHops.push({
        name: getVal(h, "NAME"),
        amount: { unit: "grams", value: getNum(h, "AMOUNT") * 1000 },
        alpha_acid: { value: getNum(h, "ALPHA") },
        use: (getVal(h, "USE").toLowerCase().replace(" ", "_") as any) || "boil",
        time: { unit: "minutes", value: getNum(h, "TIME") }
      });
    }

    // Parse Yeasts in recipe
    const recipeCultures: Culture[] = [];
    const yNodes = r.getElementsByTagName("YEAST");
    for (let j = 0; j < yNodes.length; j++) {
      const y = yNodes[j];
      recipeCultures.push({
        name: getVal(y, "NAME"),
        type: (getVal(y, "TYPE").toLowerCase() as any) || "ale",
        form: (getVal(y, "FORM").toLowerCase() as any) || "dry",
        attenuation: getNum(y, "ATTENUATION") || 75
      });
    }

    result.recipes.push({
      id: Math.random().toString(36).substr(2, 9),
      name: getVal(r, "NAME"),
      type: (getVal(r, "TYPE").toLowerCase().replace(" ", "_") as any) || "all_grain",
      author: getVal(r, "BREWER"),
      notes: getVal(r, "NOTES"),
      batch_size: { unit: "liters", value: getNum(r, "BATCH_SIZE") },
      efficiency: { brewhouse: getNum(r, "EFFICIENCY") },
      boil_time: { unit: "minutes", value: getNum(r, "BOIL_TIME") },
      ingredients: { 
        fermentables: recipeFermentables, 
        hops: recipeHops, 
        cultures: recipeCultures 
      },
      specifications: {
        og: { value: getNum(r, "EST_OG") },
        fg: { value: getNum(r, "EST_FG") },
        abv: { value: getNum(r, "EST_ABV") },
        ibu: { value: getNum(r, "IBU") },
        color: { value: getNum(r, "EST_COLOR") }
      }
    });
  }

  // 2. Losse ingrediënten voor de bibliotheek (indien aanwezig in XML root)
  const hops = xmlDoc.getElementsByTagName("HOP");
  for (let i = 0; i < hops.length; i++) {
    const h = hops[i];
    if (h.parentElement?.tagName === "HOPS" && h.parentElement?.parentElement?.tagName !== "RECIPE") {
      result.hops.push({
        name: getVal(h, "NAME"),
        alpha: getNum(h, "ALPHA"),
        type: "hop"
      });
    }
  }

  const grains = xmlDoc.getElementsByTagName("FERMENTABLE");
  for (let i = 0; i < grains.length; i++) {
    const g = grains[i];
    if (g.parentElement?.tagName === "FERMENTABLES" && g.parentElement?.parentElement?.tagName !== "RECIPE") {
      result.fermentables.push({
        name: getVal(g, "NAME"),
        yield: getNum(g, "YIELD"),
        color: getNum(g, "COLOR"),
        type: "fermentable"
      });
    }
  }

  const yeasts = xmlDoc.getElementsByTagName("YEAST");
  for (let i = 0; i < yeasts.length; i++) {
    const y = yeasts[i];
    if (y.parentElement?.tagName === "YEASTS" && y.parentElement?.parentElement?.tagName !== "RECIPE") {
      result.cultures.push({
        name: getVal(y, "NAME"),
        attenuation: getNum(y, "ATTENUATION"),
        form: getVal(y, "FORM").toLowerCase(),
        type: "culture"
      });
    }
  }

  return result;
};
