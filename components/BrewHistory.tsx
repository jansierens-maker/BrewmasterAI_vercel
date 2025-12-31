
import React, { useState } from 'react';
import { BrewLogEntry, Recipe, TastingNote } from '../types';
import { getSRMColor, calculateABV } from '../services/calculations';

interface BrewHistoryProps {
  logs: BrewLogEntry[];
  recipes: Recipe[];
  tastingNotes: TastingNote[];
  onEditLog: (logId: string) => void;
  onAddTasting: (logId: string) => void;
}

const BrewHistory: React.FC<BrewHistoryProps> = ({ logs, recipes, tastingNotes, onEditLog, onAddTasting }) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-20 text-center border border-stone-200 shadow-sm">
        <i className="fas fa-history text-6xl text-stone-100 mb-6"></i>
        <h3 className="text-2xl font-bold text-stone-800">Geen brouwsels gevonden</h3>
        <p className="text-stone-400 mt-2">Start een brouwsel vanuit een recept om je historie op te bouwen.</p>
      </div>
    );
  }

  const getStatusBadge = (status: BrewLogEntry['status']) => {
    switch(status) {
      case 'brewing': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Brouwen</span>;
      case 'fermenting': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Vergisten</span>;
      case 'bottled': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Gebotteld</span>;
      default: return null;
    }
  };

  const toggleReviews = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const renderRatingStars = (value: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <i key={star} className={`fas fa-star text-[8px] ${star <= value ? 'text-amber-500' : 'text-stone-200'}`}></i>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-4xl font-black text-stone-900">Brouwgeschiedenis</h2>
        <p className="text-stone-500 font-medium mt-1">Houd de voortgang en resultaten van al je brouwsels bij.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedLogs.map(log => {
          const recipe = recipes.find(r => r.id === log.recipeId);
          const notes = tastingNotes.filter(n => n.brewLogId === log.id);
          const isExpanded = expandedLogId === log.id;
          
          const abv = log.measurements.actual_og && log.measurements.actual_fg 
            ? calculateABV(
                log.measurements.actual_og, 
                log.measurements.actual_fg, 
                log.status === 'bottled', 
                log.bottling?.sugar_amount, 
                log.bottling?.bottling_volume || log.measurements.actual_volume
              ).toFixed(1)
            : '?';

          return (
            <div key={log.id} className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3 h-3 md:h-auto transition-all group-hover:w-4" style={{ backgroundColor: getSRMColor(recipe?.specifications?.color?.value || 0) }}></div>
                
                <div className="flex-1 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-stone-400 uppercase tracking-tighter">{log.brewDate || log.date}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 leading-tight group-hover:text-amber-800 transition-colors">{recipe?.name || 'Onbekend Recept'}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">OG: <span className="text-stone-900">{log.measurements.actual_og?.toFixed(3) || '-'}</span></span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase">FG: <span className="text-stone-900">{log.measurements.actual_fg?.toFixed(3) || '-'}</span></span>
                      {log.status === 'bottled' && (
                        <>
                          <span className="text-[10px] font-bold text-amber-600 uppercase">ABV: {abv}%</span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase">Bottel: {log.bottling?.date || '-'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => onEditLog(log.id)}
                      className="flex-1 md:flex-none px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <i className="fas fa-edit"></i> {log.status === 'bottled' ? 'LOG BEKIJKEN' : 'UPDATE STATUS'}
                    </button>
                    {log.status === 'bottled' && (
                      <button 
                        onClick={() => onAddTasting(log.id)}
                        className="flex-1 md:flex-none px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <i className="fas fa-glass-cheers"></i> PROEVEN
                      </button>
                    )}
                  </div>
                </div>

                {notes.length > 0 && (
                  <button 
                    onClick={() => toggleReviews(log.id)}
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black shadow-sm uppercase transition-all flex items-center gap-2 ${isExpanded ? 'bg-amber-600 text-white' : 'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100'}`}
                  >
                    <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-star'}`}></i>
                    {notes.length} review{notes.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {/* UITKLAPBAAR REVIEW GEDEELTE */}
              {isExpanded && (
                <div className="border-t border-stone-100 bg-stone-50/50 p-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Reviews & Proefnotities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notes.map(note => (
                      <div key={note.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-stone-400 uppercase">{note.date}</span>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-stone-400 uppercase leading-none mb-1">Totaal</p>
                            <p className="text-lg font-black text-amber-600 leading-none">{note.overall}/5</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-stone-50 py-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-stone-500">Uiterlijk</span>
                            {renderRatingStars(note.appearance)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-stone-500">Aroma</span>
                            {renderRatingStars(note.aroma)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-stone-500">Smaak</span>
                            {renderRatingStars(note.flavor)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-stone-500">Mondgevoel</span>
                            {renderRatingStars(note.mouthfeel)}
                          </div>
                        </div>

                        <div className="text-sm text-stone-600 italic leading-relaxed">
                          "{note.comments}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrewHistory;
