
import React, { useState } from 'react';
import { LibraryIngredient } from '../types';
import { useTranslation } from '../App';

interface LibraryProps {
  ingredients: LibraryIngredient[];
  onUpdate: (ingredients: LibraryIngredient[]) => void;
  onExport: () => void;
  onExportBeerXml: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlImport: () => void;
  xmlUrl: string;
  onXmlUrlChange: (url: string) => void;
  importStatus: string;
}

const IngredientLibrary: React.FC<LibraryProps> = ({ 
  ingredients, 
  onUpdate, 
  onExport, 
  onExportBeerXml,
  onRestore, 
  onFileImport, 
  onUrlImport, 
  xmlUrl, 
  onXmlUrlChange, 
  importStatus 
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'fermentable' | 'hop' | 'culture' | 'import' | 'data'>('fermentable');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LibraryIngredient>>({});

  const handleAddNew = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem: LibraryIngredient = {
      id: newId,
      name: t('new_btn') + ' ' + (filter === 'fermentable' ? t('malt') : filter === 'hop' ? t('hops') : t('yeast_lib')),
      type: filter as string,
      color: filter === 'fermentable' ? 2 : undefined,
      yield: filter === 'fermentable' ? 75 : undefined,
      alpha: filter === 'hop' ? 5 : undefined,
      attenuation: filter === 'culture' ? 75 : undefined,
      form: filter === 'culture' ? 'dry' : undefined
    };
    onUpdate([...ingredients, newItem]);
    startEditing(newItem);
  };

  const startEditing = (item: LibraryIngredient) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (!editForm.name) return;
    onUpdate(ingredients.map(i => i.id === editingId ? { ...i, ...editForm } as LibraryIngredient : i));
    setEditingId(null);
    setEditForm({});
  };

  const deleteItem = (id: string) => {
    if (window.confirm(t('confirm_delete'))) {
      onUpdate(ingredients.filter(i => i.id !== id));
      setEditingId(null);
      setEditForm({});
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Menu Sections */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
        <div className="space-y-3 w-full md:w-auto">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t('ingredients_header')}</p>
          <div className="flex flex-wrap gap-1">
            <button 
              onClick={() => { setFilter('fermentable'); cancelEditing(); }} 
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'fermentable' ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {t('malt')}
            </button>
            <button 
              onClick={() => { setFilter('hop'); cancelEditing(); }} 
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'hop' ? 'bg-green-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {t('hops')}
            </button>
            <button 
              onClick={() => { setFilter('culture'); cancelEditing(); }} 
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'culture' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {t('yeast_lib')}
            </button>
          </div>
        </div>

        <div className="space-y-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t('tools_header')}</p>
          <div className="flex flex-wrap gap-1">
            <button 
              onClick={() => { setFilter('import'); cancelEditing(); }} 
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'import' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {t('import_tab')}
            </button>
            <button 
              onClick={() => { setFilter('data'); cancelEditing(); }} 
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'data' ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {t('backup_tab')}
            </button>
          </div>
        </div>
      </div>

      {/* Category Header */}
      {['fermentable', 'hop', 'culture'].includes(filter) && (
        <div className="flex justify-between items-end px-2">
          <div>
            <h3 className="text-2xl font-black capitalize text-stone-900">{filter === 'fermentable' ? t('malt') : filter === 'hop' ? t('hops') : t('yeast_lib')}</h3>
            <p className="text-stone-400 text-xs font-bold">{ingredients.filter(i => i.type === filter).length} {t('items_in_collection')}</p>
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> {t('new_btn')}
          </button>
        </div>
      )}

      {/* Grid Display */}
      {['fermentable', 'hop', 'culture'].includes(filter) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ingredients.filter(i => i.type === filter).length === 0 ? (
            <div className="col-span-full py-20 text-center text-stone-300 font-medium bg-white rounded-3xl border-2 border-dashed border-stone-100">
              {t('no_brews')}
            </div>
          ) : (
            ingredients.filter(i => i.type === filter).map(item => (
              <div key={item.id} className={`bg-white p-8 rounded-3xl border shadow-sm relative transition-all ${editingId === item.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'}`}>
                {editingId === item.id ? (
                  <div className="space-y-4 animate-in zoom-in-95 duration-200">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase">{t('name_label')}</label>
                      <input className="w-full p-2 bg-stone-50 border rounded-lg text-sm font-bold" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {filter === 'fermentable' && (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-stone-400 uppercase">{t('color')} (SRM)</label>
                            <input type="number" step="0.1" className="w-full p-2 bg-stone-50 border rounded-lg text-sm font-bold" value={editForm.color || 0} onChange={e => setEditForm({...editForm, color: parseFloat(e.target.value) || 0})} />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-stone-400 uppercase">{t('efficiency')} (%)</label>
                            <input type="number" className="w-full p-2 bg-stone-50 border rounded-lg text-sm font-bold" value={editForm.yield || 0} onChange={e => setEditForm({...editForm, yield: parseFloat(e.target.value) || 0})} />
                          </div>
                        </>
                      )}
                      {filter === 'hop' && (
                        <div>
                          <label className="text-[10px] font-black text-stone-400 uppercase">{t('alpha_label')} (%)</label>
                          <input type="number" step="0.1" className="w-full p-2 bg-stone-50 border rounded-lg text-sm font-bold" value={editForm.alpha || 0} onChange={e => setEditForm({...editForm, alpha: parseFloat(e.target.value) || 0})} />
                        </div>
                      )}
                      {filter === 'culture' && (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-stone-400 uppercase">{t('attenuation_label')} (%)</label>
                            <input type="number" className="w-full p-2 bg-stone-50 border rounded-lg text-sm font-bold" value={editForm.attenuation || 0} onChange={e => setEditForm({...editForm, attenuation: parseFloat(e.target.value) || 0})} />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-stone-400 uppercase">{t('form_label')}</label>
                            <select className="w-full p-2 bg-stone-50 border rounded-lg text-xs font-bold" value={editForm.form || "dry"} onChange={e => setEditForm({...editForm, form: e.target.value as any})}>
                              <option value="dry">Dry</option>
                              <option value="liquid">Liquid</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <button onClick={saveEditing} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700">{t('save_btn')}</button>
                        <button onClick={cancelEditing} className="px-4 bg-stone-100 text-stone-400 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-200">{t('cancel_btn')}</button>
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="w-full mt-2 py-2 text-red-500 text-[10px] font-black uppercase hover:bg-red-50 rounded-xl transition-all">
                        <i className="fas fa-trash-alt mr-2"></i> {t('delete_btn')} {t('nav_library').toLowerCase()}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-lg text-stone-900 leading-tight">{item.name}</h4>
                      <button onClick={() => startEditing(item)} className="text-stone-300 hover:text-amber-500 transition-colors">
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      {item.type === 'fermentable' && (
                        <>
                          <div>{t('color')}: <span className="text-stone-900">{item.color} SRM</span></div>
                          <div>{t('efficiency')}: <span className="text-stone-900">{item.yield}%</span></div>
                        </>
                      )}
                      {item.type === 'hop' && (
                        <div>Alpha: <span className="text-stone-900">{item.alpha}%</span></div>
                      )}
                      {item.type === 'culture' && (
                        <>
                          <div>Atten: <span className="text-stone-900">{item.attenuation}%</span></div>
                          <div>{t('form_label')}: <span className="text-stone-900">{item.form}</span></div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tools Section */}
      {filter === 'import' && (
        <div className="bg-white p-10 md:p-16 rounded-3xl border border-stone-200 shadow-sm space-y-12 animate-in zoom-in-95 duration-300 text-center">
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-stone-900">{t('import_tool')}</h3>
            <p className="text-stone-500 font-medium max-w-xl mx-auto">{t('import_desc')}</p>
          </div>

          {/* Export Section for BeerXML */}
          <div className="max-w-5xl mx-auto p-8 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <h4 className="text-lg font-black text-amber-900">BeerXML Export</h4>
                  <p className="text-xs text-amber-700 font-medium">Download your entire ingredient library as a BeerXML file.</p>
                </div>
                <button onClick={onExportBeerXml} className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-amber-700 transition-all flex items-center gap-3">
                  <i className="fas fa-file-export"></i> {t('export_library_xml')}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
             <div className="space-y-4">
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t('via_file')}</p>
               <label className="group flex flex-col items-center justify-center w-full h-56 bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl cursor-pointer hover:bg-stone-100 transition-all">
                 <i className="fas fa-cloud-upload-alt text-4xl text-stone-300 group-hover:text-amber-500 mb-4"></i>
                 <p className="text-sm text-stone-500 font-bold">{t('dropzone_text')}</p>
                 <input type="file" className="hidden" accept=".xml,.beerxml" onChange={onFileImport} />
               </label>
             </div>
             <div className="space-y-4">
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t('via_url')}</p>
               <div className="h-56 bg-stone-50 border border-stone-100 rounded-3xl p-8 flex flex-col justify-center gap-5">
                 <input type="text" placeholder="https://..." className="w-full px-4 h-14 bg-white border border-stone-200 rounded-xl text-sm font-medium" value={xmlUrl} onChange={(e) => onXmlUrlChange(e.target.value)} />
                 <button onClick={onUrlImport} disabled={!xmlUrl} className="w-full h-14 bg-stone-900 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50">Import From URL</button>
               </div>
             </div>
          </div>
        </div>
      )}

      {filter === 'data' && (
        <div className="bg-white p-12 md:p-20 rounded-3xl border border-stone-200 shadow-sm text-center space-y-10 animate-in zoom-in-95 duration-300">
          <h3 className="text-3xl font-black text-stone-900">{t('backup_title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 space-y-4">
              <h4 className="font-bold text-stone-900">{t('export')} (Full JSON)</h4>
              <p className="text-xs text-stone-500">Backs up all data: recipes, logs, and library.</p>
              <button onClick={onExport} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg">{t('export')}</button>
            </div>
            <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 space-y-4">
              <h4 className="font-bold text-stone-900">{t('restore')} (JSON)</h4>
              <p className="text-xs text-stone-500">Restore from a previously exported JSON backup.</p>
              <label className="block w-full bg-white border border-stone-200 text-stone-900 py-4 rounded-xl font-bold cursor-pointer hover:bg-stone-100 transition-all shadow-sm">
                {t('restore')}
                <input type="file" className="hidden" accept=".json" onChange={onRestore} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientLibrary;
