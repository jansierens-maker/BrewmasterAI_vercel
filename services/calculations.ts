
import { Recipe } from "../types";

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
 * Normalizes common unit strings to standard internal keys
 */
const normalizeUnit = (unit: string | undefined): string => {
  if (!unit) return '';
  const u = unit.toLowerCase().trim();
  if (u.startsWith('kg') || u.startsWith('kilo')) return 'kilograms';
  if (u.startsWith('lb') || u.startsWith('pound')) return 'pounds';
  if (u.startsWith('g') && !u.startsWith('gal')) return 'grams';
  if (u.startsWith('oz') || u.startsWith('ounce')) return 'ounces';
  if (u.startsWith('l') && !u.startsWith('lb')) return 'liters';
  if (u.startsWith('gal')) return 'gallons';
  if (u.startsWith('min')) return 'minutes';
  return u;
};

export const calculateABV = (og: number | undefined, fg: number | undefined, isBottled: boolean, sugarG: number = 0, volumeL: number = 1): number => {
  if (!og || !fg || og <= fg) return 0;
  
  // Standard ABV formula
  let abv = (og - fg) * 131.25;
  
  // Extra alcohol from priming sugar
  if (isBottled && sugarG > 0 && volumeL > 0) {
    const sugarPerLiter = sugarG / volumeL;
    abv += (sugarPerLiter * 0.05); // Approx: 1g sugar/L adds ~0.05% ABV
  }
  
  return parseFloat(abv.toFixed(1));
};

export const calculatePrimingSugar = (targetCO2: number, liters: number, tempC: number, sugarType: string): number => {
  if (!liters || liters <= 0) return 0;

  // Residual CO2 based on fermentation temp
  const residualCO2 = 1.57 * Math.pow(0.97, tempC);
  const neededCO2 = Math.max(0, targetCO2 - residualCO2);
  
  // Table sugar (sucrose) yields ~1 volume CO2 per 4g/L
  let sugarG = neededCO2 * 4 * liters;

  if (sugarType === 'glucose') sugarG *= 1.15;
  if (sugarType === 'dme') sugarG *= 1.4;

  return Math.round(sugarG);
};

export const calculateRecipeStats = (recipe: Recipe, alphaOverrides?: Record<string, number>) => {
  const batchUnit = normalizeUnit(recipe.batch_size.unit);
  const batchSizeL = batchUnit === 'liters' ? recipe.batch_size.value : recipe.batch_size.value * 3.78541;
  const efficiency = (recipe.efficiency?.brewhouse || 75) / 100;

  let totalPoints = 0;
  recipe.ingredients.fermentables.forEach(f => {
    if (!f.amount) return;
    const unit = normalizeUnit(f.amount.unit);
    const weightKg = unit === 'kilograms' ? f.amount.value : f.amount.value * 0.453592;
    // Fallback to 1.037 if potential is missing
    const potential = f.yield?.potential?.value || 1.037;
    const ppg = (potential - 1) * 1000;
    const pkl = ppg * 8.3454; // Convert points/gal/lb to points/L/kg
    totalPoints += (weightKg * pkl * efficiency) / (batchSizeL || 1);
  });

  const og = 1 + (totalPoints / 1000);
  
  // Use specific attenuation or average if multiple yeasts exist, default to 75
  const avgAttenuation = recipe.ingredients.cultures.length > 0 
    ? recipe.ingredients.cultures.reduce((acc, c) => acc + (c.attenuation || 75), 0) / recipe.ingredients.cultures.length
    : 75;
    
  const fg = 1 + ((og - 1) * (1 - (avgAttenuation / 100)));
  const abv = calculateABV(og, fg, false);

  let mcu = 0;
  recipe.ingredients.fermentables.forEach(f => {
    if (!f.amount) return;
    const unit = normalizeUnit(f.amount.unit);
    const weightLbs = unit === 'pounds' ? f.amount.value : f.amount.value * 2.20462;
    const colorSRM = f.color?.value || 2;
    const volumeGal = batchSizeL / 3.78541;
    mcu += (weightLbs * colorSRM) / (volumeGal || 1);
  });
  const colorSRM = mcu > 0 ? 1.4922 * Math.pow(mcu, 0.6859) : 0;

  let ibu = 0;
  recipe.ingredients.hops.forEach(h => {
    if (!h.amount || !h.time) return;
    if (h.use === 'boil' || h.use === 'first_wort' || h.use === 'whirlpool') {
      const alpha = alphaOverrides?.[h.name] !== undefined ? alphaOverrides[h.name] : (h.alpha_acid?.value || 5);
      const unit = normalizeUnit(h.amount.unit);
      const weightG = unit === 'grams' ? h.amount.value : h.amount.value * 28.3495;
      const time = h.time.value;
      
      // Tinseth Utilization Formula
      const bignessFactor = 1.65 * Math.pow(0.000125, (og - 1));
      const timeFactor = (1 - Math.exp(-0.04 * time)) / 4.15;
      let utilization = bignessFactor * timeFactor;
      
      if (h.use === 'whirlpool') utilization = bignessFactor * ((1 - Math.exp(-0.04 * 10)) / 4.15) * 0.5;
      
      ibu += (alpha * weightG * utilization * 10) / (batchSizeL || 1);
    }
  });

  return {
    og: Number(og.toFixed(3)),
    fg: Number(fg.toFixed(3)),
    abv: Number(abv.toFixed(1)),
    color: Number(colorSRM.toFixed(1)),
    ibu: Math.round(ibu)
  };
};
