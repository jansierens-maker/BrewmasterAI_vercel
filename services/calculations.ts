
import { Recipe } from "../types";

/**
 * Verbeterde brouwberekeningen.
 * Kleur: SRM naar Hex
 * ABV: Standaard formule (OG - FG) * 131.25
 */

export const getSRMColor = (srm: number): string => {
  if (srm < 2) return '#FFE699';
  if (srm < 4) return '#FFD878';
  if (srm < 6) return '#FFCA5A';
  if (srm < 8) return '#FFBF42';
  if (srm < 10) return '#FBB123';
  if (srm < 13) return '#F8A600';
  if (srm < 17) return '#F39C00';
  if (srm < 20) return '#EA8F00';
  if (srm < 24) return '#E58500';
  if (srm < 29) return '#D37200';
  if (srm < 35) return '#C16100';
  if (srm < 40) return '#AF5000';
  if (srm < 45) return '#9A4000';
  if (srm < 50) return '#823000';
  return '#241000';
};

/**
 * Berekent ABV met correctie voor bottelsuiker indien van toepassing.
 */
export const calculateABV = (og: number, fg: number, isBottled: boolean, sugarG: number = 0, volumeL: number = 1): number => {
  if (!og || !fg || og <= fg) return 0;
  
  // Standaard formule
  let abv = (og - fg) * 131.25;
  
  // Correctie voor hergisting op fles (~0.5% bij 8-9g/L)
  if (isBottled && sugarG > 0 && volumeL > 0) {
    const sugarPerLiter = sugarG / volumeL;
    abv += (sugarPerLiter * 0.05); // Benadering: 2g suiker/L = ~0.1% ABV
  }
  
  return parseFloat(abv.toFixed(1));
};

export const calculateRecipeStats = (recipe: Recipe, alphaOverrides?: Record<string, number>) => {
  const batchSizeL = recipe.batch_size.unit === 'liters' ? recipe.batch_size.value : recipe.batch_size.value * 3.78541;
  const efficiency = recipe.efficiency.brewhouse / 100;

  // 1. OG BEREKENING
  let totalPoints = 0;
  recipe.ingredients.fermentables.forEach(f => {
    const weightKg = f.amount.unit === 'kilograms' ? f.amount.value : f.amount.value * 0.453592;
    const ppg = ((f.yield?.potential?.value || 1.037) - 1) * 1000;
    const pkl = ppg * 8.3454;
    totalPoints += (weightKg * pkl * efficiency) / batchSizeL;
  });

  const og = 1 + (totalPoints / 1000);
  
  // 2. FG BEREKENING
  const avgAttenuation = recipe.ingredients.cultures.length > 0 
    ? recipe.ingredients.cultures.reduce((acc, c) => acc + (c.attenuation || 75), 0) / recipe.ingredients.cultures.length
    : 75;
  
  const fg = 1 + ((og - 1) * (1 - (avgAttenuation / 100)));
  
  // 3. ABV BEREKENING
  const abv = calculateABV(og, fg, false);

  // 4. COLOR BEREKENING (Morey)
  let mcu = 0;
  recipe.ingredients.fermentables.forEach(f => {
    const weightLbs = f.amount.unit === 'pounds' ? f.amount.value : f.amount.value * 2.20462;
    const colorSRM = f.color?.value || 2;
    const volumeGal = batchSizeL / 3.78541;
    mcu += (weightLbs * colorSRM) / volumeGal;
  });
  const colorSRM = mcu > 0 ? 1.4922 * Math.pow(mcu, 0.6859) : 0;

  // 5. IBU BEREKENING (Tinseth)
  let ibu = 0;
  recipe.ingredients.hops.forEach(h => {
    if (h.use === 'boil' || h.use === 'first_wort' || h.use === 'whirlpool') {
      const alpha = alphaOverrides?.[h.name] !== undefined ? alphaOverrides[h.name] : (h.alpha_acid?.value || 5);
      const weightG = h.amount.unit === 'grams' ? h.amount.value : h.amount.value * 28.3495;
      const time = h.time.value;
      
      const bignessFactor = 1.65 * Math.pow(0.000125, (og - 1));
      const timeFactor = (1 - Math.exp(-0.04 * time)) / 4.15;
      let utilization = bignessFactor * timeFactor;
      
      if (h.use === 'whirlpool') utilization = bignessFactor * ((1 - Math.exp(-0.04 * 10)) / 4.15) * 0.5;

      ibu += (alpha * weightG * utilization * 10) / batchSizeL;
    }
  });

  return {
    og: Number(og.toFixed(3)),
    fg: Number(fg.toFixed(3)),
    abv,
    color: Number(colorSRM.toFixed(1)),
    ibu: Math.round(ibu)
  };
};
