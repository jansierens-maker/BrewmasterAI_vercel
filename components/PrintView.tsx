
import React from 'react';
import { Recipe, BrewLogEntry, TastingNote } from '../types';
import { useTranslation } from '../App';
import { calculateABV } from '../services/calculations';

interface PrintViewProps {
  recipe?: Recipe;
  log?: BrewLogEntry;
  tastingNote?: TastingNote;
}

const PrintView: React.FC<PrintViewProps> = ({ recipe, log, tastingNote }) => {
  const { t } = useTranslation();

  if (!recipe) return null;

  const abv = log 
    ? calculateABV(log.measurements.actual_og, log.measurements.actual_fg, log.status === 'bottled', log.bottling?.sugar_amount, log.bottling?.bottling_volume || log.measurements.actual_volume)
    : recipe.specifications?.abv?.value;

  return (
    <div className="hidden print:block bg-white p-8 text-stone-900 text-sm font-sans min-h-screen">
      <div className="border-b-2 border-stone-900 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold italic text-stone-900">{recipe.name}</h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mt-1">
            {log ? t('print_report') : t('print_recipe')} • {recipe.author || 'BrewMaster AI'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-stone-400">Date</p>
          <p className="font-bold">{log?.brewDate || new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="border border-stone-200 p-3 rounded">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-1">{t('og_label')}</p>
          <p className="text-xl font-black">{log?.measurements.actual_og?.toFixed(3) || recipe.specifications?.og?.value?.toFixed(3) || '-'}</p>
        </div>
        <div className="border border-stone-200 p-3 rounded">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-1">{t('fg_label')}</p>
          <p className="text-xl font-black">{log?.measurements.actual_fg?.toFixed(3) || recipe.specifications?.fg?.value?.toFixed(3) || '-'}</p>
        </div>
        <div className="border border-stone-200 p-3 rounded">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-1">{t('abv_label')}</p>
          <p className="text-xl font-black">{abv}%</p>
        </div>
        <div className="border border-stone-200 p-3 rounded">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-1">{t('target_ibu')}</p>
          <p className="text-xl font-black">{recipe.specifications?.ibu?.value || '-'}</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-black uppercase border-b border-stone-200 pb-2 mb-4">{t('ingredients_header')}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-stone-400 uppercase mb-2">{t('grains')}</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] uppercase text-stone-400">
                    <th className="py-2">Name</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Color</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.fermentables.map((f, i) => (
                    <tr key={i} className="border-b border-stone-50">
                      <td className="py-2 font-bold">{f.name}</td>
                      <td className="py-2">{f.amount.value} {f.amount.unit}</td>
                      <td className="py-2 text-right">{f.color?.value} SRM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-black text-stone-400 uppercase mb-2">{t('hops')}</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-100 text-[10px] uppercase text-stone-400">
                      <th className="py-2">Name</th>
                      <th className="py-2">Time</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.hops.map((h, i) => (
                      <tr key={i} className="border-b border-stone-50">
                        <td className="py-2 font-bold">{h.name} ({h.alpha_acid?.value}%)</td>
                        <td className="py-2">{h.time.value} {h.time.unit}</td>
                        <td className="py-2 text-right">{h.amount.value} {h.amount.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-xs font-black text-stone-400 uppercase mb-2">{t('yeast')}</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-100 text-[10px] uppercase text-stone-400">
                      <th className="py-2">Name</th>
                      <th className="py-2 text-right">Atten.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.cultures.map((c, i) => (
                      <tr key={i} className="border-b border-stone-50">
                        <td className="py-2 font-bold">{c.name}</td>
                        <td className="py-2 text-right">{c.attenuation}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {log && (
          <section className="bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h2 className="text-lg font-black uppercase border-b border-stone-200 pb-2 mb-4">{t('brew_summary')}</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase">{t('brew_notes')}</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{log.notes || 'No notes recorded.'}</p>
                </div>
              </div>
              <div className="space-y-4">
                 <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase">{t('bottling')}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      <p>Date: <span className="font-bold">{log.bottling?.date || '-'}</span></p>
                      <p>Volume: <span className="font-bold">{log.bottling?.bottling_volume} L</span></p>
                      <p>Sugar: <span className="font-bold">{log.bottling?.sugar_amount} g ({log.bottling?.sugar_type})</span></p>
                      <p>CO2: <span className="font-bold">{log.bottling?.target_co2} vol</span></p>
                    </div>
                 </div>
              </div>
            </div>
          </section>
        )}

        {tastingNote && (
          <section>
            <h2 className="text-lg font-black uppercase border-b border-stone-200 pb-2 mb-4">{t('tasting_notes')}</h2>
            <div className="grid grid-cols-5 gap-4 mb-4">
              {['appearance', 'aroma', 'flavor', 'mouthfeel', 'overall'].map(key => (
                <div key={key} className="text-center">
                  <p className="text-[8px] font-black text-stone-400 uppercase">{(t as any)(key)}</p>
                  <p className="text-xl font-black">{(tastingNote as any)[key]}/5</p>
                </div>
              ))}
            </div>
            <p className="italic text-stone-600 bg-stone-50 p-4 rounded-lg">"{tastingNote.comments}"</p>
          </section>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 flex justify-between text-[8px] font-black uppercase text-stone-300 border-t border-stone-100 pt-4">
        <span>Generated by BrewMaster AI</span>
        <span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
};

export default PrintView;
