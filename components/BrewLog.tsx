
import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, BrewLogEntry } from '../types';
import { calculateABV } from '../services/calculations';

interface BrewLogProps {
  recipe: Recipe;
  initialLog?: BrewLogEntry;
  onUpdate: (entry: BrewLogEntry) => void;
  onSaveAndExit: (entry: BrewLogEntry) => void;
}

const BrewLog: React.FC<BrewLogProps> = ({ recipe, initialLog, onUpdate, onSaveAndExit }) => {
  const [activeTab, setActiveTab] = useState<'brew' | 'ferment' | 'bottle'>('brew');
  const [saveIndicator, setSaveIndicator] = useState<boolean>(false);
  
  const [entry, setEntry] = useState<BrewLogEntry>(initialLog || {
    id: Math.random().toString(36).substr(2, 9),
    recipeId: recipe.id || 'unassigned',
    date: new Date().toISOString().split('T')[0],
    brewDate: new Date().toISOString().split('T')[0],
    status: 'brewing',
    notes: '',
    measurements: {
      actual_og: recipe.specifications?.og?.value,
      actual_fg: undefined,
      actual_volume: recipe.batch_size.value,
      fermentation_temp: 20,
      measured_alpha: recipe.ingredients.hops.reduce((acc, h) => ({...acc, [h.name]: h.alpha_acid?.value || 5}), {})
    },
    bottling: {
      date: undefined,
      target_co2: 2.4,
      sugar_type: 'table_sugar',
      sugar_amount: 0,
      bottling_volume: recipe.batch_size.value
    }
  });

  // Automatically open the correct tab based on status when the component mounts
  useEffect(() => {
    if (entry.status === 'fermenting') {
      setActiveTab('ferment');
    } else if (entry.status === 'bottled') {
      setActiveTab('bottle');
    } else {
      setActiveTab('brew');
    }
  }, []);

  // Sync bottling volume with actual volume from fermenter
  useEffect(() => {
    if (entry.status !== 'bottled') {
      setEntry(prev => ({
        ...prev,
        bottling: {
          ...prev.bottling!,
          bottling_volume: prev.measurements.actual_volume
        }
      }));
    }
  }, [entry.measurements.actual_volume, entry.status]);

  const actualAbv = useMemo(() => {
    const og = entry.measurements.actual_og;
    const fg = entry.measurements.actual_fg;
    const displayOg = og || recipe.specifications?.og?.value || 1.050;
    const displayFg = fg || recipe.specifications?.fg?.value || 1.010;

    return calculateABV(
      displayOg, 
      displayFg, 
      entry.status === 'bottled', 
      entry.bottling?.sugar_amount, 
      entry.bottling?.bottling_volume
    );
  }, [entry.measurements.actual_og, entry.measurements.actual_fg, entry.status, entry.bottling, recipe]);

  // Calculate priming sugar
  useEffect(() => {
    if (activeTab === 'bottle' || entry.status === 'bottled') {
      const volume = entry.bottling?.bottling_volume || entry.measurements.actual_volume || 20;
      const targetCo2 = entry.bottling?.target_co2 || 2.4;
      const temp = entry.measurements.fermentation_temp || 20;
      const residualCo2 = 1.6 * (1 - (0.0125 * temp)); 
      const neededCo2 = Math.max(0, targetCo2 - residualCo2);
      let sugarFactor = 4.0; 
      if (entry.bottling?.sugar_type === 'glucose') sugarFactor = 4.6;
      if (entry.bottling?.sugar_type === 'dme') sugarFactor = 5.6;
      const totalSugar = neededCo2 * sugarFactor * volume;
      setEntry(prev => ({
        ...prev,
        bottling: { ...prev.bottling!, sugar_amount: Math.round(totalSugar) }
      }));
    }
  }, [entry.bottling?.target_co2, entry.bottling?.sugar_type, entry.bottling?.bottling_volume, entry.measurements.fermentation_temp, activeTab, entry.status]);

  const triggerAutoSave = (updatedEntry: BrewLogEntry) => {
    onUpdate(updatedEntry);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const handleStatusChange = (newStatus: BrewLogEntry['status']) => {
    const today = new Date().toISOString().split('T')[0];
    let updatedEntry: BrewLogEntry;
    
    setEntry(prev => {
      const update: Partial<BrewLogEntry> = { status: newStatus };
      if (newStatus === 'fermenting' && !prev.fermentationDate) {
        update.fermentationDate = today;
      }
      if (newStatus === 'bottled' && !prev.bottling?.date) {
        update.bottling = { ...prev.bottling!, date: today };
      }
      updatedEntry = { ...prev, ...update };
      triggerAutoSave(updatedEntry);
      return updatedEntry;
    });
    
    if (newStatus === 'fermenting') setActiveTab('ferment');
    if (newStatus === 'bottled') setActiveTab('bottle');
  };

  const navigateToTab = (tab: 'brew' | 'ferment' | 'bottle') => {
    setActiveTab(tab);
    triggerAutoSave(entry);
  };

  const getStepIcon = (tabName: 'brew' | 'ferment' | 'bottle') => {
    const statusOrder = ['brewing', 'fermenting', 'bottled'];
    const tabOrder = ['brew', 'ferment', 'bottle'];
    const currentStatusIdx = statusOrder.indexOf(entry.status);
    const tabIdx = tabOrder.indexOf(tabName);

    if (entry.status === 'bottled') {
      return <i className="fas fa-check-circle text-green-500 mr-2"></i>;
    }

    if (currentStatusIdx > tabIdx) return <i className="fas fa-check-circle text-green-500 mr-2"></i>;
    if (currentStatusIdx === tabIdx) return <i className="fas fa-dot-circle text-amber-500 mr-2"></i>;
    return <i className="far fa-circle text-stone-300 mr-2"></i>;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative">
      {/* Auto-save indicator popup */}
      {saveIndicator && (
        <div className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-[100] flex items-center gap-2">
          <i className="fas fa-cloud-upload-alt"></i> Automatisch opgeslagen
        </div>
      )}

      <div className="bg-stone-900 text-white p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 shadow-xl border border-stone-800">
        <div>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Status</p>
          <p className="text-2xl font-black text-amber-500 uppercase flex items-center gap-2">
            {entry.status === 'brewing' && <i className="fas fa-fire-burner"></i>}
            {entry.status === 'fermenting' && <i className="fas fa-temperature-low"></i>}
            {entry.status === 'bottled' && <i className="fas fa-box-open"></i>}
            {entry.status === 'brewing' ? 'Brouwen' : entry.status === 'fermenting' ? 'Vergisten' : 'Gebotteld'}
          </p>
        </div>
        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Actueel ABV</p>
          <p className="text-4xl font-black text-white">{actualAbv.toFixed(1)}%</p>
        </div>
        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Startdatum</p>
          <p className="text-2xl font-black text-stone-200">{entry.date}</p>
        </div>
      </div>

      {/* Status Progress Bar / Tabs */}
      <div className="flex bg-white rounded-2xl p-1 border border-stone-200 shadow-sm overflow-hidden">
        <button onClick={() => setActiveTab('brew')} className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${activeTab === 'brew' ? 'bg-stone-900 text-white shadow-lg scale-[1.02] z-10' : 'text-stone-400 hover:text-stone-600'}`}>
          {getStepIcon('brew')} 1. Brouwdag
        </button>
        <button onClick={() => setActiveTab('ferment')} className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${activeTab === 'ferment' ? 'bg-stone-900 text-white shadow-lg scale-[1.02] z-10' : 'text-stone-400 hover:text-stone-600'}`}>
          {getStepIcon('ferment')} 2. Vergisting
        </button>
        <button onClick={() => setActiveTab('bottle')} className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${activeTab === 'bottle' ? 'bg-stone-900 text-white shadow-lg scale-[1.02] z-10' : 'text-stone-400 hover:text-stone-600'}`}>
          {getStepIcon('bottle')} 3. Bottelen
        </button>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8 min-h-[400px]">
        {activeTab === 'brew' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Brouwdag Metingen</h3>
              <div className="flex items-center gap-2">
                 <label className="text-[10px] font-black text-stone-400 uppercase">Datum</label>
                 <input type="date" className="p-2 bg-stone-50 border rounded-lg text-xs font-bold" value={entry.brewDate || ''} onChange={e => setEntry({...entry, brewDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Start Densiteit (OG)</label>
                <input type="number" step="0.001" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-lg" value={entry.measurements.actual_og || ''} onChange={e => setEntry({...entry, measurements: {...entry.measurements, actual_og: parseFloat(e.target.value)}})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Volume in Gistvat (L)</label>
                <input type="number" step="0.1" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-lg" value={entry.measurements.actual_volume || ''} onChange={e => setEntry({...entry, measurements: {...entry.measurements, actual_volume: parseFloat(e.target.value)}})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase">Brouw Nota's</label>
              <textarea className="w-full p-4 bg-stone-50 border rounded-xl min-h-[120px]" placeholder="Hoe verliep het filteren? Waren er bijzonderheden?" value={entry.notes} onChange={e => setEntry({...entry, notes: e.target.value})} />
            </div>
            {entry.status === 'brewing' && (
              <button onClick={() => handleStatusChange('fermenting')} className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all">
                NAAR VERGISTING <i className="fas fa-arrow-right ml-2"></i>
              </button>
            )}
          </div>
        )}

        {activeTab === 'ferment' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Vergisting Opvolging</h3>
              <div className="flex items-center gap-2">
                 <label className="text-[10px] font-black text-stone-400 uppercase">Start Datum</label>
                 <input type="date" className="p-2 bg-stone-50 border rounded-lg text-xs font-bold" value={entry.fermentationDate || ''} onChange={e => setEntry({...entry, fermentationDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Eind Densiteit (FG)</label>
                <input type="number" step="0.001" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-lg" value={entry.measurements.actual_fg || ''} onChange={e => setEntry({...entry, measurements: {...entry.measurements, actual_fg: parseFloat(e.target.value)}})} />
                <p className="text-[10px] text-stone-400 font-medium italic">Meet dit pas als de activiteit in het waterslot gestopt is.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Vergistingstemp. (°C)</label>
                <input type="number" step="0.5" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-lg" value={entry.measurements.fermentation_temp || ''} onChange={e => setEntry({...entry, measurements: {...entry.measurements, fermentation_temp: parseFloat(e.target.value)}})} />
              </div>
            </div>
            {entry.status === 'fermenting' && (
              <button onClick={() => navigateToTab('bottle')} className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">
                VOORBEREIDEN BOTTELEN <i className="fas fa-flask ml-2"></i>
              </button>
            )}
          </div>
        )}

        {activeTab === 'bottle' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Hergisting & Bottelen</h3>
              <div className="flex items-center gap-2">
                 <label className="text-[10px] font-black text-stone-400 uppercase">Bottel Datum</label>
                 <input type="date" className="p-2 bg-stone-50 border rounded-lg text-xs font-bold" value={entry.bottling?.date || ''} onChange={e => setEntry({...entry, bottling: {...entry.bottling!, date: e.target.value}})} />
              </div>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Berekende Suiker</p>
                <p className="text-3xl font-black text-amber-900">{entry.bottling?.sugar_amount} gram</p>
              </div>
              <i className="fas fa-calculator text-amber-200 text-4xl"></i>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Gewenste CO2 Volume</label>
                <select className="w-full p-4 bg-stone-50 border rounded-xl font-bold" value={entry.bottling?.target_co2} onChange={e => setEntry({...entry, bottling: {...entry.bottling!, target_co2: parseFloat(e.target.value)}})}>
                  <option value="1.8">1.8 (Engelse Ales / Stout)</option>
                  <option value="2.2">2.2 (Standaard Ales)</option>
                  <option value="2.4">2.4 (Lagers / Pilsner)</option>
                  <option value="2.8">2.8 (Tripels / Blond)</option>
                  <option value="3.5">3.5 (Weizen)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Type Suiker</label>
                <select className="w-full p-4 bg-stone-50 border rounded-xl font-bold" value={entry.bottling?.sugar_type} onChange={e => setEntry({...entry, bottling: {...entry.bottling!, sugar_type: e.target.value as any}})}>
                  <option value="table_sugar">Kristalsuiker (100%)</option>
                  <option value="glucose">Glucose/Dextrose (75%)</option>
                  <option value="dme">Moutextract (DME) (60%)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Volume te bottelen (L)</label>
                <input type="number" step="0.1" className="w-full p-4 bg-stone-50 border rounded-xl font-bold" value={entry.bottling?.bottling_volume || ''} onChange={e => setEntry({...entry, bottling: {...entry.bottling!, bottling_volume: parseFloat(e.target.value)}})} />
              </div>
            </div>
            
            {entry.status !== 'bottled' && (
              <button 
                onClick={() => handleStatusChange('bottled')} 
                disabled={!entry.measurements.actual_fg}
                className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {entry.measurements.actual_fg ? 'VOLTOOI & BOTTEL' : 'VUL EERST FG IN'} <i className="fas fa-check-double ml-2"></i>
              </button>
            )}
          </div>
        )}

        <div className="pt-8 border-t border-stone-100 flex flex-wrap gap-4">
           <button 
              onClick={() => triggerAutoSave(entry)} 
              className="flex-1 bg-stone-100 text-stone-900 py-4 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
           >
             <i className="fas fa-save"></i> TUSSENTIJDS OPSLAAN
           </button>
           <button 
              onClick={() => onSaveAndExit(entry)} 
              className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
           >
             <i className="fas fa-sign-out-alt"></i> OPSLAAN & SLUITEN
           </button>
        </div>
      </section>
    </div>
  );
};

export default BrewLog;
