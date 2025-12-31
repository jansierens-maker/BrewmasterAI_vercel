
import React, { useState, useEffect } from 'react';
import RecipeCreator from './components/RecipeCreator';
import BrewLog from './components/BrewLog';
import TastingNotes from './components/TastingNotes';
import IngredientLibrary from './components/IngredientLibrary';
import BrewHistory from './components/BrewHistory';
import { Recipe, BrewLogEntry, TastingNote, LibraryIngredient } from './types';
import { getSRMColor } from './services/calculations';
import { parseBeerXml, BeerXmlImportResult } from './services/beerXmlService';

type View = 'recipes' | 'create' | 'log' | 'tasting' | 'library' | 'brews';
type ImportStatus = 'idle' | 'fetching' | 'parsing' | 'resolving';

const EXAMPLES: LibraryIngredient[] = [
  { id: 'g1', name: 'Pilsner Malt', type: 'fermentable', color: 1.6, yield: 80 },
  { id: 'g2', name: 'Caramel 60L', type: 'fermentable', color: 60, yield: 74 },
  { id: 'g3', name: 'Chocolate Malt', type: 'fermentable', color: 350, yield: 70 },
  { id: 'h1', name: 'Cascade', type: 'hop', alpha: 5.5 },
  { id: 'h2', name: 'Magnum', type: 'hop', alpha: 12.0 },
  { id: 'h3', name: 'Citra', type: 'hop', alpha: 13.5 },
  { id: 'y1', name: 'US-05 SafAle', type: 'culture', form: 'dry', attenuation: 78 },
  { id: 'y2', name: 'WLP001 California Ale', type: 'culture', form: 'liquid', attenuation: 80 }
];

const App: React.FC = () => {
  const [view, setView] = useState<View>('recipes');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [brewLogs, setBrewLogs] = useState<BrewLogEntry[]>([]);
  const [tastingNotes, setTastingNotes] = useState<TastingNote[]>([]);
  const [library, setLibrary] = useState<LibraryIngredient[]>(EXAMPLES);
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedBrewLog, setSelectedBrewLog] = useState<BrewLogEntry | null>(null);
  
  // Advanced Import Logic
  const [xmlUrl, setXmlUrl] = useState('');
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importQueue, setImportQueue] = useState<{ type: 'recipe' | 'library', data: any }[]>([]);
  const [currentDuplicate, setCurrentDuplicate] = useState<{ type: 'recipe' | 'library', data: any } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('brewmaster_data_v3');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.recipes) setRecipes(data.recipes);
      if (data.brewLogs) setBrewLogs(data.brewLogs);
      if (data.tastingNotes) setTastingNotes(data.tastingNotes);
      if (data.library) setLibrary(data.library);
    }
  }, []);

  useEffect(() => {
    const data = { recipes, brewLogs, tastingNotes, library };
    localStorage.setItem('brewmaster_data_v3', JSON.stringify(data));
  }, [recipes, brewLogs, tastingNotes, library]);

  const handleSaveRecipe = (recipe: Recipe) => {
    if (selectedRecipe && selectedRecipe.id) {
      setRecipes(prev => prev.map(r => r.id === selectedRecipe.id ? { ...recipe, id: selectedRecipe.id } : r));
    } else {
      const newRecipe = { ...recipe, id: Math.random().toString(36).substr(2, 9) };
      setRecipes(prev => [...prev, newRecipe]);
    }
    setSelectedRecipe(null);
    setView('recipes');
  };

  const handleUpdateBrewLog = (entry: BrewLogEntry) => {
    setBrewLogs(prev => {
      const exists = prev.find(l => l.id === entry.id);
      if (exists) return prev.map(l => l.id === entry.id ? entry : l);
      return [entry, ...prev];
    });
    // We blijven in de huidige view (selectedBrewLog wordt niet gereset)
  };

  const handleSaveAndExitBrewLog = (entry: BrewLogEntry) => {
    handleUpdateBrewLog(entry);
    setSelectedBrewLog(null);
    setView('brews');
  };

  // --- Multi-Type Import Flow ---
  const startImportFlow = (result: BeerXmlImportResult) => {
    const queue: { type: 'recipe' | 'library', data: any }[] = [];
    
    result.recipes.forEach(r => queue.push({ type: 'recipe', data: r }));
    result.fermentables.forEach(f => queue.push({ type: 'library', data: f }));
    result.hops.forEach(h => queue.push({ type: 'library', data: h }));
    result.cultures.forEach(c => queue.push({ type: 'library', data: c }));
    
    if (queue.length === 0) {
      alert("Geen ondersteunde BeerXML data gevonden in dit bestand.");
      setImportStatus('idle');
      return;
    }

    setImportQueue(queue);
    setImportStatus('resolving');
    processQueue(queue, recipes, library);
  };

  const processQueue = (currentQueue: typeof importQueue, currentRecipes: Recipe[], currentLib: LibraryIngredient[]) => {
    if (currentQueue.length === 0) {
      setImportStatus('idle');
      return;
    }

    const next = currentQueue[0];
    let isDuplicate = false;

    if (next.type === 'recipe') {
      isDuplicate = currentRecipes.some(r => r.name.toLowerCase() === next.data.name.toLowerCase());
    } else {
      isDuplicate = currentLib.some(l => l.name.toLowerCase() === next.data.name.toLowerCase() && l.type === next.data.type);
    }

    if (isDuplicate) {
      if (next.type === 'recipe') {
        // AUTOMATIC SKIP for recipes as per user request
        const nextQ = currentQueue.slice(1);
        setImportQueue(nextQ);
        processQueue(nextQ, currentRecipes, currentLib);
      } else {
        // Still show dialog for library ingredients
        setCurrentDuplicate(next);
      }
    } else {
      // Auto-import non-duplicates
      let newRecipes = [...currentRecipes];
      let newLib = [...currentLib];
      
      if (next.type === 'recipe') {
        const linked = linkIngredientsToLibrary(next.data, newLib);
        newRecipes.push(linked);
        setRecipes(newRecipes);
        setLibrary(newLib);
      } else {
        const newItem = { ...next.data, id: Math.random().toString(36).substr(2, 9) };
        newLib.push(newItem);
        setLibrary(newLib);
      }

      const nextQ = currentQueue.slice(1);
      setImportQueue(nextQ);
      processQueue(nextQ, newRecipes, newLib);
    }
  };

  const linkIngredientsToLibrary = (recipe: Recipe, tempLib: LibraryIngredient[]) => {
    const getLibId = (name: string, type: string, props: Partial<LibraryIngredient>): string => {
      const existing = tempLib.find(i => i.type === type && i.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing.id;
      const newId = Math.random().toString(36).substr(2, 9);
      tempLib.push({ id: newId, name, type, ...props } as LibraryIngredient);
      return newId;
    };
    return {
      ...recipe,
      ingredients: {
        fermentables: recipe.ingredients.fermentables.map(f => ({ ...f, libraryId: getLibId(f.name, 'fermentable', { color: f.color?.value || 2, yield: f.yield?.potential?.value ? Math.round((f.yield.potential.value - 1) / 0.046 * 100) : 75 }) })),
        hops: recipe.ingredients.hops.map(h => ({ ...h, libraryId: getLibId(h.name, 'hop', { alpha: h.alpha_acid?.value || 5 }) })),
        cultures: recipe.ingredients.cultures.map(c => ({ ...c, libraryId: getLibId(c.name, 'culture', { attenuation: c.attenuation || 75, form: c.form || 'dry' }) }))
      }
    };
  };

  const resolveConflict = (action: 'cancel' | 'skip' | 'overwrite' | 'copy') => {
    if (!currentDuplicate) return;
    if (action === 'cancel') { setImportQueue([]); setCurrentDuplicate(null); setImportStatus('idle'); return; }

    let updatedRecipes = [...recipes];
    let updatedLib = [...library];
    const nextQueue = importQueue.slice(1);

    if (action === 'overwrite') {
      if (currentDuplicate.type === 'recipe') {
        const linked = linkIngredientsToLibrary(currentDuplicate.data, updatedLib);
        updatedRecipes = recipes.map(r => r.name.toLowerCase() === linked.name.toLowerCase() ? { ...linked, id: r.id } : r);
        setRecipes(updatedRecipes);
        setLibrary(updatedLib);
      } else {
        updatedLib = library.map(l => (l.name.toLowerCase() === currentDuplicate.data.name.toLowerCase() && l.type === currentDuplicate.data.type) ? { ...currentDuplicate.data, id: l.id } : l);
        setLibrary(updatedLib);
      }
    } else if (action === 'copy') {
      if (currentDuplicate.type === 'recipe') {
        const linked = linkIngredientsToLibrary({ ...currentDuplicate.data, name: `${currentDuplicate.data.name} (Kopie)` }, updatedLib);
        linked.id = Math.random().toString(36).substr(2, 9);
        updatedRecipes = [...recipes, linked];
        setRecipes(updatedRecipes);
        setLibrary(updatedLib);
      } else {
        const newItem = { ...currentDuplicate.data, name: `${currentDuplicate.data.name} (Kopie)`, id: Math.random().toString(36).substr(2, 9) };
        updatedLib = [...library, newItem];
        setLibrary(updatedLib);
      }
    }

    setImportQueue(nextQueue);
    setCurrentDuplicate(null);
    processQueue(nextQueue, updatedRecipes, updatedLib);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('parsing');
    const reader = new FileReader();
    reader.onload = (event) => startImportFlow(parseBeerXml(event.target?.result as string));
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
    if (!xmlUrl) return;
    setImportStatus('fetching');
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(xmlUrl)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      if (data.contents) {
        setImportStatus('parsing');
        startImportFlow(parseBeerXml(data.contents));
      }
      setXmlUrl('');
    } catch (err) {
      alert("Import mislukt. Controleer de link of gebruik een bestand.");
      setImportStatus('idle');
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-stone-50 text-stone-900">
      {/* GLOBAL IMPORT OVERLAY */}
      {importStatus !== 'idle' && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            {importStatus !== 'resolving' ? (
              <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-stone-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold">
                  {importStatus === 'fetching' ? 'Ophalen...' : 'Verwerken...'}
                </h3>
                <p className="text-stone-500 text-sm">Bestand wordt geanalyseerd</p>
              </div>
            ) : currentDuplicate ? (
              <div className="space-y-6">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle text-amber-600 text-xl"></i>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-amber-900 text-sm">Conflict gevonden</h4>
                    <p className="text-[10px] text-amber-700 font-bold truncate">"{currentDuplicate.data.name}"</p>
                    <p className="text-[8px] uppercase tracking-widest text-amber-600/60">{currentDuplicate.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => resolveConflict('overwrite')} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm">Overschrijven</button>
                  <button onClick={() => resolveConflict('copy')} className="w-full py-3 bg-white border border-stone-200 text-stone-900 rounded-xl font-bold text-sm">Als kopie opslaan</button>
                  <button onClick={() => resolveConflict('skip')} className="w-full py-3 bg-white border border-stone-200 text-stone-400 rounded-xl font-bold text-sm">Overslaan</button>
                  <button onClick={() => resolveConflict('cancel')} className="w-full py-2 text-red-500 font-bold text-xs hover:underline mt-2">Alles annuleren</button>
                </div>
                <p className="text-center text-[10px] text-stone-400 font-medium">Items in wachtrij: {importQueue.length}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('recipes')}>
            <div className="bg-amber-500 p-2 rounded-xl text-white shadow-lg"><i className="fas fa-beer-mug-empty text-2xl"></i></div>
            <h1 className="text-2xl font-black font-serif italic">BREWMASTER <span className="text-amber-600">AI</span></h1>
          </div>
          <nav className="flex gap-4 sm:gap-8">
            <button onClick={() => setView('recipes')} className={`font-bold transition-all text-sm ${view === 'recipes' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Recepten</button>
            <button onClick={() => setView('brews')} className={`font-bold transition-all text-sm ${view === 'brews' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Brouwsels</button>
            <button onClick={() => setView('library')} className={`font-bold transition-all text-sm ${view === 'library' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Bibliotheek</button>
          </nav>
          <button onClick={() => { setSelectedRecipe(null); setView('create'); }} className="bg-stone-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-md">
            <i className="fas fa-plus mr-2"></i>Nieuw
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {view === 'recipes' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h2 className="text-4xl font-black text-stone-900">Mijn Recepten</h2>
              <p className="text-stone-500 font-medium mt-1">Hier vind je jouw biercreaties en geïmporteerde recepten.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                  <i className="fas fa-beer text-4xl text-stone-200 mb-4"></i>
                  <p className="text-stone-400 font-bold">Nog geen recepten. Ga naar de <button onClick={() => setView('library')} className="text-amber-600 underline hover:text-amber-700">Bibliotheek</button> om BeerXML te importeren.</p>
                </div>
              ) : recipes.map(r => (
                <div key={r.id} className="bg-white rounded-3xl border border-stone-200 p-6 hover:shadow-xl transition-all border-b-4 group" style={{ borderBottomColor: getSRMColor(r.specifications?.color?.value || 0) }}>
                  <h3 className="text-xl font-bold mb-4 truncate group-hover:text-amber-800 transition-colors">{r.name}</h3>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-stone-50 rounded-xl p-2 text-center"><p className="text-[8px] font-black text-stone-400 uppercase">ABV</p><p className="font-bold text-xs">{r.specifications?.abv?.value}%</p></div>
                    <div className="bg-stone-50 rounded-xl p-2 text-center"><p className="text-[8px] font-black text-stone-400 uppercase">IBU</p><p className="font-bold text-xs">{r.specifications?.ibu?.value}</p></div>
                    <div className="bg-stone-50 rounded-xl p-2 text-center"><p className="text-[8px] font-black text-stone-400 uppercase">OG</p><p className="font-bold text-xs">{r.specifications?.og?.value?.toFixed(3)}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedRecipe(r); setSelectedBrewLog(null); setView('log'); }} className="flex-1 bg-amber-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-100">Brouwen</button>
                    <button onClick={() => { setSelectedRecipe(r); setView('create'); }} className="flex-1 bg-stone-100 text-stone-900 text-xs font-bold py-3 rounded-xl hover:bg-stone-200 transition-all">Bewerken</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'brews' && (
          <BrewHistory 
            logs={brewLogs} 
            recipes={recipes} 
            tastingNotes={tastingNotes}
            onEditLog={(logId) => {
              const log = brewLogs.find(l => l.id === logId);
              const recipe = recipes.find(r => r.id === log?.recipeId);
              if (log && recipe) { setSelectedBrewLog(log); setSelectedRecipe(recipe); setView('log'); }
            }}
            onAddTasting={(logId) => {
              const log = brewLogs.find(l => l.id === logId);
              const recipe = recipes.find(r => r.id === log?.recipeId);
              if (log && recipe) { setSelectedBrewLog(log); setSelectedRecipe(recipe); setView('tasting'); }
            }}
          />
        )}

        {view === 'log' && selectedRecipe && (
          <BrewLog 
            recipe={selectedRecipe} 
            initialLog={selectedBrewLog || undefined} 
            onUpdate={handleUpdateBrewLog}
            onSaveAndExit={handleSaveAndExitBrewLog}
          />
        )}
        {view === 'create' && <RecipeCreator initialRecipe={selectedRecipe || undefined} onSave={handleSaveRecipe} library={library} />}
        {view === 'library' && (
          <IngredientLibrary 
            ingredients={library} 
            onUpdate={setLibrary} 
            onBackupRestore={(d) => { if(d.recipes) setRecipes(d.recipes); setView('recipes'); }}
            onFileImport={handleFileImport}
            onUrlImport={handleUrlImport}
            xmlUrl={xmlUrl}
            onXmlUrlChange={setXmlUrl}
            importStatus={importStatus}
          />
        )}
        {view === 'tasting' && selectedRecipe && selectedBrewLog && (
          <TastingNotes recipe={selectedRecipe} brewLogId={selectedBrewLog.id} onSave={(note) => { setTastingNotes([note, ...tastingNotes]); setView('brews'); }} />
        )}
      </main>
    </div>
  );
};

export default App;
