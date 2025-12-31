
export interface BeerJSON {
  version: number;
  recipes: Recipe[];
}

export interface LibraryIngredient {
  id: string;
  name: string;
  type: string;
  color?: number;
  yield?: number;
  alpha?: number;
  attenuation?: number;
  form?: string;
}

export interface Recipe {
  id?: string;
  name: string;
  type: 'extract' | 'partial_mash' | 'all_grain';
  author: string;
  batch_size: {
    unit: 'liters' | 'gallons';
    value: number;
  };
  style?: {
    name: string;
    category?: string;
  };
  ingredients: {
    fermentables: Fermentable[];
    hops: Hop[];
    cultures: Culture[];
    miscellaneous?: Misc[];
    water?: Water[];
  };
  efficiency: {
    brewhouse: number;
  };
  boil_time: {
    unit: 'minutes';
    value: number;
  };
  specifications?: {
    og?: { value: number };
    fg?: { value: number };
    abv?: { value: number };
    ibu?: { value: number };
    color?: { value: number };
  };
}

export interface Fermentable {
  name: string;
  type: string;
  amount: { unit: 'kilograms' | 'pounds'; value: number };
  yield?: { potential: { value: number } };
  color?: { value: number };
  libraryId?: string;
}

export interface Hop {
  name: string;
  amount: { unit: 'grams' | 'ounces'; value: number };
  alpha_acid?: { value: number };
  use: 'boil' | 'dry_hop' | 'mash' | 'first_wort' | 'whirlpool';
  time: { unit: 'minutes' | 'days'; value: number };
  libraryId?: string;
}

export interface Culture {
  name: string;
  type: 'ale' | 'lager' | 'wheat' | 'wine' | 'champagne';
  form: 'liquid' | 'dry' | 'slant' | 'culture';
  amount?: { unit: 'units' | 'grams'; value: number };
  attenuation?: number;
  libraryId?: string;
}

export interface Misc {
  name: string;
  type: string;
  use: string;
  amount: { unit: string; value: number };
  time: { unit: string; value: number };
}

export interface Water {
  name: string;
  amount: { unit: 'liters' | 'gallons'; value: number };
}

export interface BrewLogEntry {
  id: string;
  recipeId: string;
  date: string; // Original start date
  brewDate?: string;
  fermentationDate?: string;
  status: 'brewing' | 'fermenting' | 'bottled';
  notes: string;
  measurements: {
    actual_og?: number;
    actual_fg?: number;
    actual_volume?: number;
    mash_temp?: number;
    boil_gravity?: number;
    measured_alpha?: Record<string, number>;
    fermentation_temp?: number;
  };
  bottling?: {
    date?: string;
    target_co2: number;
    sugar_type: 'table_sugar' | 'glucose' | 'dme';
    sugar_amount?: number;
    bottling_volume?: number;
  };
}

export interface TastingNote {
  id: string;
  recipeId: string;
  brewLogId: string;
  date: string;
  appearance: number;
  aroma: number;
  flavor: number;
  mouthfeel: number;
  overall: number;
  comments: string;
}
