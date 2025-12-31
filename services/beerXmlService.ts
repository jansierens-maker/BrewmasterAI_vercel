
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

  const getVal = (el: Element, tag: string) => el.getElementsByTagName(tag)[0]?.textContent || "";
  const getNum = (el: Element, tag: string) => parseFloat(el.getElementsByTagName(tag)[0]?.textContent || "0");

  // 1. Recepten
  const recipes = xmlDoc.getElementsByTagName("RECIPE");
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    result.recipes.push({
      id: Math.random().toString(36).substr(2, 9),
      name: getVal(r, "NAME"),
      type: (getVal(r, "TYPE").toLowerCase().replace(" ", "_") as any) || "all_grain",
      author: getVal(r, "BREWER"),
      batch_size: { unit: "liters", value: getNum(r, "BATCH_SIZE") },
      efficiency: { brewhouse: getNum(r, "EFFICIENCY") },
      boil_time: { unit: "minutes", value: getNum(r, "BOIL_TIME") },
      ingredients: { fermentables: [], hops: [], cultures: [] },
      specifications: {
        og: { value: getNum(r, "EST_OG") },
        fg: { value: getNum(r, "EST_FG") },
        abv: { value: getNum(r, "EST_ABV") },
        ibu: { value: getNum(r, "IBU") },
        color: { value: getNum(r, "EST_COLOR") }
      }
    });
    // In-recipe ingredients are usually handled by the app's linking logic, 
    // but we can parse them here if needed for direct import.
  }

  // 2. Hops
  const hops = xmlDoc.getElementsByTagName("HOP");
  for (let i = 0; i < hops.length; i++) {
    const h = hops[i];
    if (h.parentElement?.tagName === "RECIPE") continue; // Skip in-recipe hops
    result.hops.push({
      name: getVal(h, "NAME"),
      alpha: getNum(h, "ALPHA"),
      type: "hop",
      notes: getVal(h, "NOTES")
    });
  }

  // 3. Fermentables
  const grains = xmlDoc.getElementsByTagName("FERMENTABLE");
  for (let i = 0; i < grains.length; i++) {
    const g = grains[i];
    if (g.parentElement?.tagName === "RECIPE") continue;
    result.fermentables.push({
      name: getVal(g, "NAME"),
      yield: getNum(g, "YIELD"),
      color: getNum(g, "COLOR"),
      type: "fermentable"
    });
  }

  // 4. Yeasts
  const yeasts = xmlDoc.getElementsByTagName("YEAST");
  for (let i = 0; i < yeasts.length; i++) {
    const y = yeasts[i];
    if (y.parentElement?.tagName === "RECIPE") continue;
    result.cultures.push({
      name: getVal(y, "NAME"),
      attenuation: getNum(y, "ATTENUATION"),
      form: getVal(y, "FORM").toLowerCase(),
      type: "culture"
    });
  }

  // 5. Misc
  const miscs = xmlDoc.getElementsByTagName("MISC");
  for (let i = 0; i < miscs.length; i++) {
    const m = miscs[i];
    result.miscs.push({ name: getVal(m, "NAME"), type: getVal(m, "TYPE"), use: getVal(m, "USE") });
  }

  // 6. Water
  const waters = xmlDoc.getElementsByTagName("WATER");
  for (let i = 0; i < waters.length; i++) {
    const w = waters[i];
    result.waters.push({ 
      name: getVal(w, "NAME"), 
      calcium: getNum(w, "CALCIUM"),
      magnesium: getNum(w, "MAGNESIUM"),
      sodium: getNum(w, "SODIUM"),
      sulfate: getNum(w, "SULFATE"),
      chloride: getNum(w, "CHLORIDE"),
      bicarbonate: getNum(w, "BICARBONATE")
    });
  }

  // 7. Styles, Equipment, Mash (Stored as general library items or specific types)
  const styles = xmlDoc.getElementsByTagName("STYLE");
  for (let i = 0; i < styles.length; i++) {
    result.styles.push({ name: getVal(styles[i], "NAME"), category: getVal(styles[i], "CATEGORY") });
  }

  return result;
};
