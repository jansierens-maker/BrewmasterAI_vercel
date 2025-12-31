
import React, { useState } from 'react';
import { LibraryIngredient } from '../types';

interface LibraryProps {
  ingredients: LibraryIngredient[];
  onUpdate: (ingredients: LibraryIngredient[]) => void;
  onBackupRestore?: (data: any) => void;
  // BeerXML Import Props
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlImport: () => void;
  xmlUrl: string;
  onXmlUrlChange: (url: string) => void;
  importStatus: string;
}

const IngredientLibrary: React.FC<LibraryProps> = ({ 
  ingredients, 
  onUpdate, 
  onBackupRestore,
  onFileImport,
  onUrlImport,
  xmlUrl,
  onXmlUrlChange,
  importStatus
}) => {
  const [filter, setFilter] = useState<'fermentable' | 'hop' | 'culture' | 'import' | 'data'>('fermentable');
  const [editing, setEditing] = useState<Partial<LibraryIngredient> | null>(null);

  const handleSave = () => {
    if (!editing?.name) return;
    const id = editing.id || Math.random().toString(36).substr(2, 9);
    const newItem = { ...editing, id, type: filter } as LibraryIngredient;
    
    if (editing.id) {
      onUpdate(ingredients.map(i => i.id === editing.id ? newItem : i));
    } else {
      onUpdate([...ingredients, newItem]);
    }
    setEditing(null);
  };

  const deleteItem = (id: string) => {
    onUpdate(ingredients.filter(i => i.id !== id));
  };

  const exportBackup = () => {
    const data = localStorage.getItem('brewmaster_data_v3');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brewmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (onBackupRestore) onBackupRestore(data);
        alert('Backup succesvol hersteld!');
      } catch (err) {
        alert('Ongeldig backup bestand.');
      }
    };
    reader.readAsText(file);
  };

  const filtered = ingredients.filter(i => i.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-stone-200">
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setFilter('fermentable')} className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${filter === 'fermentable' ? 'bg-amber-600 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>Mout</button>
          <button onClick={() => setFilter('hop')} className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${filter === 'hop' ? 'bg-green-600 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>Hop</button>
          <button onClick={() => setFilter('culture')} className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${filter === 'culture' ? 'bg-blue-600 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>Gist</button>
          <div className="w-px h-8 bg-stone-200 mx-2 hidden sm:block"></div>
          <button onClick={() => setFilter('import')} className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${filter === 'import' ? 'bg-amber-100 text-amber-700' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>
            <i className="fas fa-file-import mr-2"></i>BeerXML
          </button>
          <button onClick={() => setFilter('data')} className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${filter === 'data' ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>
            <i className="fas fa-database mr-2"></i>Backup
          </button>
        </div>
        {['fermentable', 'hop', 'culture'].includes(filter) && (
          <button onClick={() => setEditing({ type: filter })} className="ml-auto bg-stone-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-black text-xs transition-all">
            <i className="fas fa-plus mr-2"></i>Nieuw Item
          </button>
        )}
      </div>

      {filter === 'import' && (
        <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-sm space-y-10 animate-in slide-in-from-bottom-2">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-code text-amber-600 text-2xl"></i>
            </div>
            <h3 className="text-2xl font-black">BeerXML Importeer Tool</h3>
            <p className="text-stone-500 font-medium">Importeer recepten, hop, granen, gist en meer vanuit elke BeerXML bron.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Via Bestand</p>
              <label className="flex flex-col items-center justify-center w-full h-40 bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl cursor-pointer hover:bg-stone-100 group transition-all">
                <i className="fas fa-cloud-upload-alt text-3xl text-stone-300 group-hover:text-amber-500 mb-3 transition-colors"></i>
                <span className="text-sm font-bold text-stone-600 group-hover:text-amber-600">Sleep hierheen of klik</span>
                <span className="text-[10px] text-stone-400 mt-1">.xml of .beerxml</span>
                <input type="file" className="hidden" accept=".xml,.beerxml" onChange={onFileImport} />
              </label>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Via URL</p>
              <div className="h-40 bg-stone-50 border border-stone-100 rounded-3xl p-6 flex flex-col justify-center gap-4">
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full px-4 h-12 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                  value={xmlUrl} 
                  onChange={(e) => onXmlUrlChange(e.target.value)} 
                />
                <button 
                  onClick={onUrlImport} 
                  disabled={importStatus !== 'idle' || !xmlUrl} 
                  className="w-full h-12 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-link"></i> Link Importeren
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-stone-400 font-medium italic">Let op: Recepten die via deze weg worden geïmporteerd verschijnen automatisch in je Recepten overzicht.</p>
        </div>
      )}

      {filter === 'data' && (
        <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-sm text-center space-y-8 animate-in slide-in-from-bottom-2">
          <div>
            <h3 className="text-2xl font-black mb-2">JSON Backups</h3>
            <p className="text-stone-500">Exporteer je volledige database (recepten, logs, notes) naar een enkel bestand.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 text-left hover:shadow-md transition-all">
              <h4 className="font-bold mb-4 flex items-center gap-2"><i className="fas fa-download text-amber-600"></i> Export</h4>
              <p className="text-xs text-stone-500 mb-6">Sla al je brouwsels en instellingen veilig op buiten de browser.</p>
              <button onClick={exportBackup} className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">Sla op als JSON</button>
            </div>
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 text-left hover:shadow-md transition-all">
              <h4 className="font-bold mb-4 flex items-center gap-2"><i className="fas fa-upload text-blue-600"></i> Restore</h4>
              <p className="text-xs text-stone-500 mb-6">Herstel een eerder gemaakte backup van je BrewMaster database.</p>
              <label className="block w-full bg-white border border-stone-200 text-stone-900 py-3 rounded-xl font-bold text-center cursor-pointer hover:bg-stone-50 transition-all">
                Bestand Kiezen
                <input type="file" className="hidden" accept=".json" onChange={importBackup} />
              </label>
            </div>
          </div>
        </div>
      )}

      {['fermentable', 'hop', 'culture'].includes(filter) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-stone-400">
              <i className="fas fa-box-open text-4xl mb-4 opacity-20"></i>
              <p className="font-bold">Geen items in deze categorie.</p>
            </div>
          ) : filtered.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm relative group hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: item.type === 'fermentable' ? '#D97706' : item.type === 'hop' ? '#16A34A' : '#2563EB' }}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">{item.name}</h4>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(item)} className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100"><i className="fas fa-edit text-xs"></i></button>
                  <button onClick={() => deleteItem(item.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-100"><i className="fas fa-trash text-xs"></i></button>
                </div>
              </div>
              <div className="text-xs font-medium text-stone-500 space-y-1">
                {item.type === 'fermentable' && <p>Kleur: <span className="text-stone-900 font-bold">{item.color} SRM</span> | Rendement: <span className="text-stone-900 font-bold">{item.yield}%</span></p>}
                {item.type === 'hop' && <p>Alfazuur: <span className="text-stone-900 font-bold">{item.alpha}%</span></p>}
                {item.type === 'culture' && <p>Vergistingsgr: <span className="text-stone-900 font-bold">{item.attenuation}%</span> | Vorm: <span className="text-stone-900 font-bold">{item.form}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6">Item Aanpassen</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Naam</label>
                <input className="w-full p-4 bg-stone-50 border rounded-2xl text-stone-900 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
              </div>
              
              {filter === 'fermentable' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Kleur (SRM)</label><input type="number" className="w-full p-4 bg-stone-50 border rounded-2xl font-bold" value={editing.color || ''} onChange={e => setEditing({...editing, color: parseFloat(e.target.value)})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Rendement (%)</label><input type="number" className="w-full p-4 bg-stone-50 border rounded-2xl font-bold" value={editing.yield || ''} onChange={e => setEditing({...editing, yield: parseFloat(e.target.value)})} /></div>
                </div>
              )}

              {filter === 'hop' && (
                <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Alfazuur (%)</label><input type="number" step="0.1" className="w-full p-4 bg-stone-50 border rounded-2xl font-bold" value={editing.alpha || ''} onChange={e => setEditing({...editing, alpha: parseFloat(e.target.value)})} /></div>
              )}

              {filter === 'culture' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Vergisting (%)</label><input type="number" className="w-full p-4 bg-stone-50 border rounded-2xl font-bold" value={editing.attenuation || 75} onChange={e => setEditing({...editing, attenuation: parseFloat(e.target.value)})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Vorm</label><select className="w-full p-4 bg-stone-50 border rounded-2xl font-bold" value={editing.form || 'dry'} onChange={e => setEditing({...editing, form: e.target.value as any})}><option value="dry">Dry</option><option value="liquid">Liquid</option></select></div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditing(null)} className="flex-1 py-4 font-bold text-stone-400 hover:text-stone-600 transition-colors">Annuleren</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-black transition-all">Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientLibrary;
