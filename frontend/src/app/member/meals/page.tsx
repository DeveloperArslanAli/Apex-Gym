'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

export default function MemberMeals() {
  const [description, setDescription] = useState('');
  const [loggedMethod, setLoggedMethod] = useState<'TEXT' | 'BARCODE' | 'PHOTO'>('TEXT');
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadMeals = async () => {
    try {
      const data = await fetchApi('member/meals');
      setMeals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    setLoading(true);
    setResult(null);

    try {
      const saved = await fetchApi('member/meal', {
        method: 'POST',
        body: JSON.stringify({
          textDescription: description,
          loggedMethod: loggedMethod,
        }),
      });

      if (saved) {
        setResult(saved);
        setDescription('');
        loadMeals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
        <h4 className="font-extrabold text-sm text-slate-200">Nutrition Log</h4>
        <span className="text-[10px] font-bold text-slate-500 uppercase">Text Parsing API</span>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
        {/* Method Toggle */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
          {(['TEXT', 'BARCODE', 'PHOTO'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLoggedMethod(m)}
              className={`text-[8px] uppercase font-bold tracking-wider py-2 rounded-lg cursor-pointer transition ${
                loggedMethod === m ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-500'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogMeal} className="space-y-4">
          <div>
            <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
              {loggedMethod === 'TEXT' ? 'What did you eat?' : loggedMethod === 'BARCODE' ? 'Scan Product Barcode' : 'Take Meal Photo'}
            </label>
            
            {loggedMethod === 'TEXT' ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="e.g. 2 boiled eggs, 100g oatmeal, and a scoop of protein powder"
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition"
              />
            ) : (
              <div className="border border-dashed border-slate-800 rounded-xl py-6 text-center text-slate-500 text-xs">
                <span>{loggedMethod === 'BARCODE' ? '🔍 Barcode scanning simulated' : '📷 Camera snapping simulated'}</span>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={loggedMethod === 'BARCODE' ? 'Enter barcode digits manually' : 'Describe snapshot meal'}
                  className="mt-3 w-[80%] mx-auto bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-center text-[10px] text-slate-300 block focus:outline-none"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Analyzing Diet Macros...' : 'Log Nutrition Item'}
          </button>
        </form>
      </div>

      {/* Result Card Overlay */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2 text-xs">
          <h5 className="font-extrabold text-[10px] uppercase text-emerald-400 tracking-wider">AI Analysis Breakdown</h5>
          <p className="text-slate-300 italic">" {result.textDescription} "</p>
          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
              <p className="text-[7px] text-slate-500 font-bold">CALORIES</p>
              <p className="font-bold text-slate-200">{result.estimatedCalories}</p>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
              <p className="text-[7px] text-slate-500 font-bold">PROTEIN</p>
              <p className="font-bold text-slate-200">{result.estimatedProtein}g</p>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
              <p className="text-[7px] text-slate-500 font-bold">CARBS</p>
              <p className="font-bold text-slate-200">{result.estimatedCarbs}g</p>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
              <p className="text-[7px] text-slate-500 font-bold">FAT</p>
              <p className="font-bold text-slate-200">{result.estimatedFat}g</p>
            </div>
          </div>
        </div>
      )}

      {/* History logs */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3">
        <h4 className="font-extrabold text-xs text-slate-200 border-b border-slate-850/60 pb-2">Recent food log</h4>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {meals.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">No food logged today.</p>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-[10px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-350 truncate max-w-[65%]">{meal.textDescription}</span>
                  <span className="text-emerald-400">{meal.estimatedCalories} kcal</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>P: {meal.estimatedProtein}g | C: {meal.estimatedCarbs}g | F: {meal.estimatedFat}g</span>
                  <span>{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
