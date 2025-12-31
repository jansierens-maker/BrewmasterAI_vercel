
import React, { useState } from 'react';
import { Recipe, TastingNote } from '../types';
import { GeminiService } from '../services/geminiService';

interface TastingNotesProps {
  recipe: Recipe;
  brewLogId: string;
  onSave: (note: TastingNote) => void;
}

const RatingField: React.FC<{ label: string, value: number, onChange: (val: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex justify-between items-center">
    <span className="font-semibold text-stone-700">{label}</span>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button 
          key={n}
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${value >= n ? 'bg-amber-500 text-white shadow-md' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const TastingNotes: React.FC<TastingNotesProps> = ({ recipe, brewLogId, onSave }) => {
  const [note, setNote] = useState<TastingNote>({
    id: Math.random().toString(36).substr(2, 9),
    recipeId: recipe.id || '',
    brewLogId,
    date: new Date().toISOString().split('T')[0],
    appearance: 0,
    aroma: 0,
    flavor: 0,
    mouthfeel: 0,
    overall: 0,
    comments: ''
  });

  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const gemini = new GeminiService();

  const handleAnalyze = async () => {
    if (!note.comments) return;
    setAnalyzing(true);
    try {
      const feedback = await gemini.analyzeTasting(recipe, note.comments);
      setAiFeedback(feedback);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-3xl font-bold mb-6">Tasting Notes: <span className="text-amber-800">{recipe.name}</span></h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h4 className="text-lg font-bold border-b border-stone-100 pb-2">Sensory Evaluation</h4>
            <RatingField label="Appearance" value={note.appearance} onChange={(v) => setNote({...note, appearance: v})} />
            <RatingField label="Aroma" value={note.aroma} onChange={(v) => setNote({...note, aroma: v})} />
            <RatingField label="Flavor" value={note.flavor} onChange={(v) => setNote({...note, flavor: v})} />
            <RatingField label="Mouthfeel" value={note.mouthfeel} onChange={(v) => setNote({...note, mouthfeel: v})} />
            <RatingField label="Overall Impression" value={note.overall} onChange={(v) => setNote({...note, overall: v})} />
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold border-b border-stone-100 pb-2">Comments & Profiles</h4>
            <textarea 
              className="w-full p-4 bg-white text-stone-900 border border-stone-200 rounded-xl min-h-[200px] focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Describe what you're tasting... e.g., Heavy mango on the nose, clean bitter finish, slight diacetyl present."
              value={note.comments}
              onChange={(e) => setNote({...note, comments: e.target.value})}
            />
            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !note.comments}
              className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-brain"></i>}
              Analyze with BrewAI
            </button>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button 
            onClick={() => onSave(note)}
            className="bg-stone-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-black transition-all"
          >
            Save Evaluation
          </button>
        </div>
      </div>

      {aiFeedback && (
        <div className="bg-amber-50 p-8 rounded-2xl border border-amber-200 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-4 text-amber-800">
            <i className="fas fa-glass-cheers text-2xl"></i>
            <h3 className="text-xl font-bold">Cicerone Analysis</h3>
          </div>
          <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed whitespace-pre-wrap">
            {aiFeedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default TastingNotes;
