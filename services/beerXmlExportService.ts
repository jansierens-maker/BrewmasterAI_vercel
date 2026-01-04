
import { Recipe, LibraryIngredient } from "../types";

const sanitize = (str: string) => str.replace(/[&<>"']/g, (m) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[m] || m));

export const exportToBeerXml = (recipe: Recipe): string => {
  const xmlParts: string[] = [];
  
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlParts.push('<RECIPES>');
  xmlParts.push('  <RECIPE>');
  xmlParts.push(`    <NAME>${sanitize(recipe.name)}</NAME>`);
  xmlParts.push('    <VERSION>1</VERSION>');
  xmlParts.push(`    <TYPE>${recipe.type === 'all_grain' ? 'All Grain' : recipe.type === 'extract' ? 'Extract' : 'Partial Mash'}</TYPE>`);
  xmlParts.push(`    <BREWER>${sanitize(recipe.author || 'BrewMaster AI')}</BREWER>`);
  xmlParts.push(`    <BATCH_SIZE>${recipe.batch_size.value}</BATCH_SIZE>`);
  xmlParts.push(`    <BOIL_SIZE>${recipe.batch_size.value + 5}</BOIL_SIZE>`); // Simple estimation
  xmlParts.push(`    <BOIL_TIME>${recipe.boil_time.value}</BOIL_TIME>`);
  xmlParts.push(`    <EFFICIENCY>${recipe.efficiency.brewhouse}</EFFICIENCY>`);
  
  if (recipe.style) {
    xmlParts.push('    <STYLE>');
    xmlParts.push(`      <NAME>${sanitize(recipe.style.name)}</NAME>`);
    xmlParts.push(`      <CATEGORY>${sanitize(recipe.style.category || '')}</CATEGORY>`);
    xmlParts.push('      <VERSION>1</VERSION>');
    xmlParts.push('    </STYLE>');
  }

  // Fermentables
  xmlParts.push('    <FERMENTABLES>');
  recipe.ingredients.fermentables.forEach(f => {
    xmlParts.push('      <FERMENTABLE>');
    xmlParts.push(`        <NAME>${sanitize(f.name)}</NAME>`);
    xmlParts.push(`        <VERSION>1</VERSION>`);
    xmlParts.push(`        <AMOUNT>${f.amount.value}</AMOUNT>`);
    xmlParts.push(`        <TYPE>${sanitize(f.type || 'Grain')}</TYPE>`);
    xmlParts.push(`        <YIELD>${f.yield?.potential?.value ? ((f.yield.potential.value - 1) * 100 / 0.046).toFixed(1) : 75}</YIELD>`);
    xmlParts.push(`        <COLOR>${f.color?.value || 0}</COLOR>`);
    xmlParts.push('      </FERMENTABLE>');
  });
  xmlParts.push('    </FERMENTABLES>');

  // Hops
  xmlParts.push('    <HOPS>');
  recipe.ingredients.hops.forEach(h => {
    xmlParts.push('      <HOP>');
    xmlParts.push(`        <NAME>${sanitize(h.name)}</NAME>`);
    xmlParts.push(`        <VERSION>1</VERSION>`);
    xmlParts.push(`        <ALPHA>${h.alpha_acid?.value || 0}</ALPHA>`);
    xmlParts.push(`        <AMOUNT>${h.amount.value / 1000}</AMOUNT>`); // BeerXML expects KG
    xmlParts.push(`        <USE>${h.use === 'boil' ? 'Boil' : h.use === 'dry_hop' ? 'Dry Hop' : h.use === 'first_wort' ? 'First Wort' : 'Aroma'}</USE>`);
    xmlParts.push(`        <TIME>${h.time.value}</TIME>`);
    xmlParts.push('      </HOP>');
  });
  xmlParts.push('    </HOPS>');

  // Yeasts
  xmlParts.push('    <YEASTS>');
  recipe.ingredients.cultures.forEach(y => {
    xmlParts.push('      <YEAST>');
    xmlParts.push(`        <NAME>${sanitize(y.name)}</NAME>`);
    xmlParts.push(`        <VERSION>1</VERSION>`);
    xmlParts.push(`        <TYPE>${y.type === 'ale' ? 'Ale' : y.type === 'lager' ? 'Lager' : 'Wheat'}</TYPE>`);
    xmlParts.push(`        <FORM>${y.form === 'dry' ? 'Dry' : 'Liquid'}</FORM>`);
    xmlParts.push(`        <ATTENUATION>${y.attenuation || 75}</ATTENUATION>`);
    xmlParts.push('      </YEAST>');
  });
  xmlParts.push('    </YEASTS>');

  xmlParts.push('  </RECIPE>');
  xmlParts.push('</RECIPES>');

  return xmlParts.join('\n');
};

export const exportLibraryToBeerXml = (ingredients: LibraryIngredient[]): string => {
  const xmlParts: string[] = [];
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  
  // We wrap everything in a root tag, or separate sections
  xmlParts.push('<BREW_LIBRARY>');
  
  // Fermentables section
  const fermentables = ingredients.filter(i => i.type === 'fermentable');
  if (fermentables.length > 0) {
    xmlParts.push('  <FERMENTABLES>');
    fermentables.forEach(f => {
      xmlParts.push('    <FERMENTABLE>');
      xmlParts.push(`      <NAME>${sanitize(f.name)}</NAME>`);
      xmlParts.push('      <VERSION>1</VERSION>');
      xmlParts.push(`      <TYPE>Grain</TYPE>`);
      xmlParts.push(`      <YIELD>${f.yield || 75}</YIELD>`);
      xmlParts.push(`      <COLOR>${f.color || 0}</COLOR>`);
      xmlParts.push('    </FERMENTABLE>');
    });
    xmlParts.push('  </FERMENTABLES>');
  }

  // Hops section
  const hops = ingredients.filter(i => i.type === 'hop');
  if (hops.length > 0) {
    xmlParts.push('  <HOPS>');
    hops.forEach(h => {
      xmlParts.push('    <HOP>');
      xmlParts.push(`      <NAME>${sanitize(h.name)}</NAME>`);
      xmlParts.push('      <VERSION>1</VERSION>');
      xmlParts.push(`      <ALPHA>${h.alpha || 0}</ALPHA>`);
      xmlParts.push('      <USE>Boil</USE>');
      xmlParts.push('    </HOP>');
    });
    xmlParts.push('  </HOPS>');
  }

  // Yeasts section
  const yeasts = ingredients.filter(i => i.type === 'culture');
  if (yeasts.length > 0) {
    xmlParts.push('  <YEASTS>');
    yeasts.forEach(y => {
      xmlParts.push('    <YEAST>');
      xmlParts.push(`      <NAME>${sanitize(y.name)}</NAME>`);
      xmlParts.push('      <VERSION>1</VERSION>');
      xmlParts.push(`      <TYPE>Ale</TYPE>`);
      xmlParts.push(`      <FORM>${y.form === 'liquid' ? 'Liquid' : 'Dry'}</FORM>`);
      xmlParts.push(`      <ATTENUATION>${y.attenuation || 75}</ATTENUATION>`);
      xmlParts.push('    </YEAST>');
    });
    xmlParts.push('  </YEASTS>');
  }

  xmlParts.push('</BREW_LIBRARY>');
  return xmlParts.join('\n');
};
