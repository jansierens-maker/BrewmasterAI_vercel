
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Fermentable, Hop, Culture, LibraryIngredient } from '../types';
import { GeminiService } from '../services/geminiService';
import { calculateRecipeStats, getSRMColor } from '../services/calculations';

interface RecipeCreatorProps {
  onSave: (recipe: Recipe) => void;
  initialRecipe?: Recipe;
  library: LibraryIngredient[];
}

const RecipeCreator: React.FC<RecipeCreatorProps> = ({ onSave, initialRecipe, library }) => {
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe || {
    name: '',
    type: 'all_grain',
    author: '',
    batch_size: { unit: 'liters', value: 20 },
    ingredients: {
      fermentables: [],
      hops: [],
      cultures: []
    },
    efficiency: { brewhouse: 75 },
    boil_time: { unit: 'minutes', value: 60 }
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const gemini = new GeminiService();

  const stats = useMemo(() => calculateRecipeStats(recipe), [recipe]);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    try {
      const generated = await gemini.generateRecipe(aiPrompt);
      setRecipe(generated);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = (type: 'fermentable' | 'hop' | 'culture') => {
    if (type === 'fermentable') {
      setRecipe(prev => ({
        ...prev,
        ingredients: { ...prev.ingredients, fermentables: [...prev.ingredients.fermentables, { name: '', type: 'grain', amount: { unit: 'kilograms', value: 0 }, color: { value: 2 } }] }
      }));
    } else if (type === 'hop') {
      setRecipe(prev => ({
        ...prev,
        ingredients: { ...prev.ingredients, hops: [...prev.ingredients.hops, { name: '', amount: { unit: 'grams', value: 0 }, use: 'boil', time: { unit: 'minutes', value: 60 }, alpha_acid: { value: 5 } }] }
      }));
    } else {
      setRecipe(prev => ({
        ...prev,
        ingredients: { ...prev.ingredients, cultures: [...prev.ingredients.cultures, { name: '', type: 'ale', form: 'dry', attenuation: 75 }] }
      }));
    }
  };

  const handleLibrarySelect = (type: string, idx: number, libId: string) => {
    const item = library.find(i => i.id === libId);
    if (!item) return;

    if (type === 'fermentable') {
      const newF = [...recipe.ingredients.fermentables];
      const potential = 1 + (item.yield || 75) / 100 * 0.046; 
      newF[idx] = { ...newF[idx], name: item.name, libraryId: item.id, color: { value: item.color || 2 }, yield: { potential: { value: potential } } };
      setRecipe({ ...recipe, ingredients: { ...recipe.ingredients, fermentables: newF } });
    } else if (type === 'hop') {
      const newH = [...recipe.ingredients.hops];
      newH[idx] = { ...newH[idx], name: item.name, libraryId: item.id, alpha_acid: { value: item.alpha || 5 } };
      setRecipe({ ...recipe, ingredients: { ...recipe.ingredients, hops: newH } });
    } else if (type === 'culture') {
      const newC = [...recipe.ingredients.cultures];
      newC[idx] = { ...newC[idx], name: item.name, libraryId: item.id, type: item.type as any, form: item.form as any, attenuation: item.attenuation || 75 };
      setRecipe({ ...recipe, ingredients: { ...recipe.ingredients, cultures: newC } });
    }
  };

  // Helper om te bepalen wat er geselecteerd moet zijn in de dropdown
  const getSelectedId = (type: 'fermentable' | 'hop' | 'culture', name: string, libraryId?: string) => {
    if (libraryId) return libraryId;
    const match = library.find(l => l.type === type && l.name.toLowerCase() === name.toLowerCase());
    return match ? match.id : '';
  };

  return (
    <div className="space-y-8">
      {/* Visual Stats Bar */}
      <section className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-8 sticky top-24 z-40 border border-stone-800">
        <div>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Target ABV</p>
          <p className="text-4xl font-black text-amber-500">{stats.abv}%</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Target IBU</p>
          <p className="text-4xl font-black text-green-500">{stats.ibu}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Color (SRM)</p>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-black">{stats.color}</p>
            <div className="w-10 h-6 rounded border border-stone-700 shadow-inner" style={{ backgroundColor: getSRMColor(stats.color) }}></div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Est. OG</p>
          <p className="text-4xl font-black text-stone-200">{stats.og.toFixed(3)}</p>
        </div>
      </section>

      {/* Main Form */}
      <section className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2"><label className="text-xs font-bold text-stone-400 uppercase">Recept Naam</label><input className="w-full p-3 bg-stone-50 border rounded-xl text-stone-900 font-bold" value={recipe.name} onChange={e => setRecipe({...recipe, name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-stone-400 uppercase">Volume (L)</label><input type="number" className="w-full p-3 bg-stone-50 border rounded-xl" value={recipe.batch_size.value} onChange={e => setRecipe({...recipe, batch_size: {...recipe.batch_size, value: parseFloat(e.target.value)}})} /></div>
          <div><label className="text-xs font-bold text-stone-400 uppercase">Rendement (%)</label><input type="number" className="w-full p-3 bg-stone-50 border rounded-xl" value={recipe.efficiency.brewhouse} onChange={e => setRecipe({...recipe, efficiency: {brewhouse: parseFloat(e.target.value)}})} /></div>
        </div>

        {/* Grains Section */}
        <div>
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2"><i className="fas fa-seedling text-amber-700"></i> Granen</h4><button onClick={() => addIngredient('fermentable')} className="text-amber-600 font-bold text-sm">+ Voeg toe</button></div>
          <div className="space-y-3">
            {recipe.ingredients.fermentables.map((f, i) => (
              <div key={i} className="flex flex-wrap gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex-1 min-w-[200px]">
                  <select 
                    className="w-full p-2.5 bg-white border rounded-xl text-stone-900 text-sm font-medium" 
                    value={getSelectedId('fermentable', f.name, f.libraryId)} 
                    onChange={e => handleLibrarySelect('fermentable', i, e.target.value)}
                  >
                    <option value="">{f.name || 'Kies uit bibliotheek...'}</option>
                    {library.filter(l => l.type === 'fermentable').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-20 p-2 bg-white border rounded-xl text-right font-bold" type="number" step="0.1" value={f.amount.value} onChange={e => {
                    const n = [...recipe.ingredients.fermentables];
                    n[i].amount.value = parseFloat(e.target.value);
                    setRecipe({...recipe, ingredients: {...recipe.ingredients, fermentables: n}});
                  }} />
                  <span className="text-stone-400 font-bold text-xs uppercase">kg</span>
                </div>
                <button className="text-stone-300 hover:text-red-500" onClick={() => {
                  const n = recipe.ingredients.fermentables.filter((_, idx) => idx !== i);
                  setRecipe({...recipe, ingredients: {...recipe.ingredients, fermentables: n}});
                }}><i className="fas fa-times-circle"></i></button>
              </div>
            ))}
          </div>
        </div>

        {/* Hops Section */}
        <div>
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2"><i className="fas fa-leaf text-green-700"></i> Hop</h4><button onClick={() => addIngredient('hop')} className="text-amber-600 font-bold text-sm">+ Voeg toe</button></div>
          <div className="space-y-3">
            {recipe.ingredients.hops.map((h, i) => (
              <div key={i} className="flex flex-wrap gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex-1 min-w-[200px]">
                  <select 
                    className="w-full p-2.5 bg-white border rounded-xl text-stone-900 text-sm font-medium" 
                    value={getSelectedId('hop', h.name, h.libraryId)} 
                    onChange={e => handleLibrarySelect('hop', i, e.target.value)}
                  >
                    <option value="">{h.name || 'Kies uit bibliotheek...'}</option>
                    {library.filter(l => l.type === 'hop').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-16 p-2 bg-white border rounded-xl text-right font-bold" type="number" value={h.amount.value} onChange={e => {
                    const n = [...recipe.ingredients.hops];
                    n[i].amount.value = parseFloat(e.target.value);
                    setRecipe({...recipe, ingredients: {...recipe.ingredients, hops: n}});
                  }} />
                  <span className="text-stone-400 font-bold text-xs uppercase">g</span>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-16 p-2 bg-white border rounded-xl text-right font-bold" type="number" value={h.time.value} onChange={e => {
                    const n = [...recipe.ingredients.hops];
                    n[i].time.value = parseFloat(e.target.value);
                    setRecipe({...recipe, ingredients: {...recipe.ingredients, hops: n}});
                  }} />
                  <span className="text-stone-400 font-bold text-xs uppercase">min</span>
                </div>
                <button className="text-stone-300 hover:text-red-500" onClick={() => {
                  const n = recipe.ingredients.hops.filter((_, idx) => idx !== i);
                  setRecipe({...recipe, ingredients: {...recipe.ingredients, hops: n}});
                }}><i className="fas fa-times-circle"></i></button>
              </div>
            ))}
          </div>
        </div>

        {/* Yeasts Section */}
        <div>
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2"><i className="fas fa-vial text-blue-700"></i> Gist</h4><button onClick={() => addIngredient('culture')} className="text-amber-600 font-bold text-sm">+ Voeg toe</button></div>
          <div className="space-y-3">
            {recipe.ingredients.cultures.map((c, i) => (
              <div key={i} className="flex flex-wrap gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex-1 min-w-[200px]">
                  <select 
                    className="w-full p-2.5 bg-white border rounded-xl text-stone-900 text-sm font-medium" 
                    value={getSelectedId('culture', c.name, c.libraryId)} 
                    onChange={e => handleLibrarySelect('culture', i, e.target.value)}
                  >
                    <option value="">{c.name || 'Kies uit bibliotheek...'}</option>
                    {library.filter(l => l.type === 'culture').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <button className="text-stone-300 hover:text-red-500" onClick={() => {
                  const n = recipe.ingredients.cultures.filter((_, idx) => idx !== i);
                  setRecipe({...recipe, ingredients: {...recipe.ingredients, cultures: n}});
                }}><i className="fas fa-times-circle"></i></button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => onSave({...recipe, specifications: { og: {value: stats.og}, fg: {value: stats.fg}, abv: {value: stats.abv}, ibu: {value: stats.ibu}, color: {value: stats.color}}})} className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-stone-200 hover:bg-black transition-all">OPSLAAN ALS RECEPT</button>
      </section>
    </div>
  );
};

export default RecipeCreator;
