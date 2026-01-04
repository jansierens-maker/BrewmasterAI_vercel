
import React, { useState, useMemo } from 'react';
import { Recipe, Fermentable, Hop, Culture, LibraryIngredient } from '../types';
import { GeminiService } from '../services/geminiService';
import { calculateRecipeStats, getSRMColor } from '../services/calculations';
import { useTranslation } from '../App';

interface RecipeCreatorProps {
  onSave: (recipe: Recipe) => void;
  initialRecipe?: Recipe;
  library: LibraryIngredient[];
}

const RecipeCreator: React.FC<RecipeCreatorProps> = ({ onSave, initialRecipe, library }) => {
  const { t } = useTranslation();
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
    setRecipe(prev => {
      const newIngredients = { ...prev.ingredients };
      if (type === 'fermentable') {
        newIngredients.fermentables = [...prev.ingredients.fermentables, { 
          name: '', 
          type: 'grain', 
          amount: { unit: 'kilograms', value: 0 }, 
          color: { value: 2 } 
        }];
      } else if (type === 'hop') {
        newIngredients.hops = [...prev.ingredients.hops, { 
          name: '', 
          amount: { unit: 'grams', value: 0 }, 
          use: 'boil', 
          time: { unit: 'minutes', value: 60 }, 
          alpha_acid: { value: 5 } 
        }];
      } else if (type === 'culture') {
        newIngredients.cultures = [...prev.ingredients.cultures, { 
          name: '', 
          type: 'ale', 
          form: 'dry', 
          attenuation: 75 
        }];
      }
      return { ...prev, ingredients: newIngredients };
    });
  };

  const removeIngredient = (type: 'fermentable' | 'hop' | 'culture', index: number) => {
    setRecipe(prev => {
      const newIngredients = { ...prev.ingredients };
      if (type === 'fermentable') {
        newIngredients.fermentables = prev.ingredients.fermentables.filter((_, i) => i !== index);
      } else if (type === 'hop') {
        newIngredients.hops = prev.ingredients.hops.filter((_, i) => i !== index);
      } else if (type === 'culture') {
        newIngredients.cultures = prev.ingredients.cultures.filter((_, i) => i !== index);
      }
      return { ...prev, ingredients: newIngredients };
    });
  };

  const handleLibrarySelect = (type: 'fermentable' | 'hop' | 'culture', idx: number, libId: string) => {
    const item = library.find(i => i.id === libId);
    if (!item) return;

    setRecipe(prev => {
      const newIngredients = { ...prev.ingredients };
      if (type === 'fermentable') {
        const list = [...prev.ingredients.fermentables];
        const potential = 1 + (item.yield || 75) / 100 * 0.046; 
        list[idx] = { ...list[idx], name: item.name, libraryId: item.id, color: { value: item.color || 2 }, yield: { potential: { value: potential } } };
        newIngredients.fermentables = list;
      } else if (type === 'hop') {
        const list = [...prev.ingredients.hops];
        list[idx] = { ...list[idx], name: item.name, libraryId: item.id, alpha_acid: { value: item.alpha || 5 } };
        newIngredients.hops = list;
      } else if (type === 'culture') {
        const list = [...prev.ingredients.cultures];
        list[idx] = { ...list[idx], name: item.name, libraryId: item.id, type: item.type as any, form: item.form as any, attenuation: item.attenuation || 75 };
        newIngredients.cultures = list;
      }
      return { ...prev, ingredients: newIngredients };
    });
  };

  const updateField = (type: 'fermentable' | 'hop' | 'culture', idx: number, field: string, val: any) => {
    setRecipe(prev => {
      const newIngredients = { ...prev.ingredients };
      if (type === 'fermentable') {
        const list = [...prev.ingredients.fermentables];
        if (field === 'amount') list[idx] = { ...list[idx], amount: { ...list[idx].amount, value: val } };
        else if (field === 'name') list[idx] = { ...list[idx], name: val };
        newIngredients.fermentables = list;
      } else if (type === 'hop') {
        const list = [...prev.ingredients.hops];
        if (field === 'amount') list[idx] = { ...list[idx], amount: { ...list[idx].amount, value: val } };
        else if (field === 'time') list[idx] = { ...list[idx], time: { ...list[idx].time, value: val } };
        else if (field === 'name') list[idx] = { ...list[idx], name: val };
        newIngredients.hops = list;
      } else if (type === 'culture') {
        const list = [...prev.ingredients.cultures];
        if (field === 'name') list[idx] = { ...list[idx], name: val };
        newIngredients.cultures = list;
      }
      return { ...prev, ingredients: newIngredients };
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-8 sticky top-24 z-40 border border-stone-800">
        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">{t('target_abv')}</p><p className="text-4xl font-black text-amber-500">{stats.abv}%</p></div>
        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">{t('target_ibu')}</p><p className="text-4xl font-black text-green-500">{stats.ibu}</p></div>
        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">{t('color')}</p><div className="flex items-center gap-3"><p className="text-4xl font-black">{stats.color}</p><div className="w-10 h-6 rounded border border-stone-700 shadow-inner" style={{ backgroundColor: getSRMColor(stats.color) }}></div></div></div>
        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">{t('est_og')}</p><p className="text-4xl font-black text-stone-200">{stats.og.toFixed(3)}</p></div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2"><label className="text-xs font-bold text-stone-400 uppercase">{t('recipe_name')}</label><input className="w-full p-3 bg-stone-50 border rounded-xl text-stone-900 font-bold" value={recipe.name} onChange={e => setRecipe({...recipe, name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-stone-400 uppercase">{t('batch_size')} (L)</label><input type="number" className="w-full p-3 bg-stone-50 border rounded-xl font-bold" value={recipe.batch_size.value} onChange={e => setRecipe({...recipe, batch_size: {...recipe.batch_size, value: parseFloat(e.target.value) || 0}})} /></div>
          <div><label className="text-xs font-bold text-stone-400 uppercase">{t('efficiency')} (%)</label><input type="number" className="w-full p-3 bg-stone-50 border rounded-xl font-bold" value={recipe.efficiency.brewhouse} onChange={e => setRecipe({...recipe, efficiency: {brewhouse: parseFloat(e.target.value) || 0}})} /></div>
        </div>

        {/* Fermentables */}
        <div>
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2 uppercase text-stone-900"><i className="fas fa-seedling text-amber-700"></i> {t('grains')}</h4><button onClick={() => addIngredient('fermentable')} className="text-amber-600 font-bold text-xs uppercase tracking-wider">+ {t('add_ingredient')}</button></div>
          <div className="space-y-3">
            {recipe.ingredients.fermentables.map((f, i) => (
              <div key={i} className="flex flex-wrap gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100 items-center">
                <div className="flex-1 min-w-[200px]">
                  <select className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 text-sm font-medium" value={f.libraryId || ""} onChange={e => handleLibrarySelect('fermentable', i, e.target.value)}>
                    <option value="">{f.name || '-- Select from Library --'}</option>
                    {library.filter(l => l.type === 'fermentable').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-20 p-2 bg-white border border-stone-200 rounded-xl text-right font-black" type="number" step="0.1" value={f.amount.value} onChange={e => updateField('fermentable', i, 'amount', parseFloat(e.target.value) || 0)} />
                  <span className="text-stone-400 font-black text-[10px] uppercase">kg</span>
                </div>
                <button className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-500 transition-colors" onClick={() => removeIngredient('fermentable', i)}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hops */}
        <div>
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2 uppercase text-stone-900"><i className="fas fa-leaf text-green-700"></i> {t('hops')}</h4><button onClick={() => addIngredient('hop')} className="text-amber-600 font-bold text-xs uppercase tracking-wider">+ {t('add_ingredient')}</button></div>
          <div className="space-y-3">
            {recipe.ingredients.hops.map((h, i) => (
              <div key={i} className="flex flex-wrap gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100 items-center">
                <div className="flex-1 min-w-[200px]">
                  <select className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 text-sm font-medium" value={h.libraryId || ""} onChange={e => handleLibrarySelect('hop', i, e.target.value)}>
                    <option value="">{h.name || '-- Select from Library --'}</option>
                    {library.filter(l => l.type === 'hop').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-16 p-2 bg-white border border-stone-200 rounded-xl text-right font-black" type="number" value={h.amount.value} onChange={e => updateField('hop', i, 'amount', parseFloat(e.target.value) || 0)} />
                  <span className="text-stone-400 font-black text-[10px] uppercase">g</span>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-16 p-2 bg-white border border-stone-200 rounded-xl text-right font-black" type="number" value={h.time.value} onChange={e => updateField('hop', i, 'time', parseFloat(e.target.value) || 0)} />
                  <span className="text-stone-400 font-black text-[10px] uppercase">min</span>
                </div>
                <button className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-500 transition-colors" onClick={() => removeIngredient('hop', i)}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Yeast */}
        <div>
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2 uppercase text-stone-900"><i className="fas fa-vial text-blue-700"></i> {t('yeast')}</h4><button onClick={() => addIngredient('culture')} className="text-amber-600 font-bold text-xs uppercase tracking-wider">+ {t('add_ingredient')}</button></div>
          <div className="space-y-3">
            {recipe.ingredients.cultures.map((c, i) => (
              <div key={i} className="flex flex-wrap gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100 items-center">
                <div className="flex-1 min-w-[200px]">
                  <select className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 text-sm font-medium" value={c.libraryId || ""} onChange={e => handleLibrarySelect('culture', i, e.target.value)}>
                    <option value="">{c.name || '-- Select from Library --'}</option>
                    {library.filter(l => l.type === 'culture').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <button className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-500 transition-colors" onClick={() => removeIngredient('culture', i)}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => onSave({...recipe, specifications: { og: {value: stats.og}, fg: {value: stats.fg}, abv: {value: stats.abv}, ibu: {value: stats.ibu}, color: {value: stats.color}}})} className="w-full bg-stone-900 text-white py-5 rounded-3xl font-black shadow-xl shadow-stone-200 hover:bg-black transition-all uppercase tracking-widest text-lg">{t('save_recipe')}</button>
      </section>

      {/* AI Assistant */}
      <section className="bg-stone-100 p-8 rounded-3xl border border-stone-200 space-y-4">
        <h3 className="text-xl font-black flex items-center gap-2"><i className="fas fa-robot text-amber-500"></i> BrewAI Generator</h3>
        <p className="text-stone-500 text-sm">Describe the beer you want to create and let BrewAI suggest a base recipe.</p>
        <div className="flex flex-col md:flex-row gap-4">
          <textarea className="flex-1 p-4 bg-white border border-stone-200 rounded-2xl font-medium" placeholder="E.g. A fruity Hazy IPA with Citra and Mosaic hops..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
          <button disabled={loading || !aiPrompt} onClick={handleAiGenerate} className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all disabled:opacity-50 h-fit self-end">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : t('nav_new')}
          </button>
        </div>
      </section>
    </div>
  );
};

export default RecipeCreator;
