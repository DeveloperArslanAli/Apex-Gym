'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

export default function MemberDashboard() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default Targets
  const targets = { calories: 2500, protein: 150, carbs: 250, fat: 75 };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const workoutsData = await fetchApi('member/workout/history');
        setWorkouts(workoutsData);

        const mealsData = await fetchApi('member/meals');
        setMeals(mealsData);

        const adviceData = await fetchApi('member/coach/advice');
        setAdvice(adviceData);
      } catch (err) {
        console.error('Failed to load member dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
        <span className="text-2xl animate-spin">⚡</span>
        <p className="text-[10px] tracking-widest uppercase">Loading Dashboard...</p>
      </div>
    );
  }

  // Calculate today's macros totals
  const today = new Date().toDateString();
  const totals = meals
    .filter((m) => new Date(m.timestamp).toDateString() === today)
    .reduce(
      (acc, meal) => {
        acc.calories += meal.estimatedCalories ?? 0;
        acc.protein += meal.estimatedProtein ?? 0;
        acc.carbs += meal.estimatedCarbs ?? 0;
        acc.fat += meal.estimatedFat ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const calPercent = Math.min(Math.round((totals.calories / targets.calories) * 100), 100);
  const pPercent = Math.min(Math.round((totals.protein / targets.protein) * 100), 100);
  const cPercent = Math.min(Math.round((totals.carbs / targets.carbs) * 100), 100);
  const fPercent = Math.min(Math.round((totals.fat / targets.fat) * 100), 100);

  const lastWorkout = workouts[0];

  return (
    <div className="space-y-6">
      {/* Welcome & Quick actions */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Ready to train?</h4>
          <h3 className="font-extrabold text-sm text-slate-200 mt-0.5">Let's check your form</h3>
        </div>
        <Link
          href="/member/workout"
          className="bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider transition hover:bg-emerald-300"
        >
          Check Posture
        </Link>
      </div>

      {/* Macros Tracker card */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850/60 pb-2">
          <h4 className="font-extrabold text-xs text-slate-200">Daily Nutrition Macros</h4>
          <span className="text-[9px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
            {totals.calories} / {targets.calories} kcal
          </span>
        </div>

        {/* Calories Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Calories</span>
            <span className="font-bold text-emerald-400">{calPercent}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
            <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${calPercent}%` }} />
          </div>
        </div>

        {/* Macros Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
            <p className="text-[8px] font-bold uppercase text-slate-500">Protein</p>
            <p className="font-black text-xs text-slate-300 mt-1">{totals.protein}g</p>
            <p className="text-[8px] text-slate-500">Goal: {targets.protein}g</p>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
            <p className="text-[8px] font-bold uppercase text-slate-500">Carbs</p>
            <p className="font-black text-xs text-slate-300 mt-1">{totals.carbs}g</p>
            <p className="text-[8px] text-slate-500">Goal: {targets.carbs}g</p>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
            <p className="text-[8px] font-bold uppercase text-slate-500">Fat</p>
            <p className="font-black text-xs text-slate-300 mt-1">{totals.fat}g</p>
            <p className="text-[8px] text-slate-500">Goal: {targets.fat}g</p>
          </div>
        </div>
      </div>

      {/* AI Coach recommendation card */}
      {advice && (
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-slate-800 text-6xl font-bold opacity-30 select-none">🤖</div>
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <h4 className="font-extrabold text-xs text-slate-200">Coach Arnold recommendation</h4>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/60">
            {advice.advice}
          </p>
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
            <span>Core Bracing: <strong>{advice.postureAudit.tips.split('.')[0]}</strong></span>
          </div>
        </div>
      )}

      {/* Recent workout card */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3">
        <h4 className="font-extrabold text-xs text-slate-200 border-b border-slate-850/60 pb-2">Last workout activity</h4>
        {lastWorkout ? (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Logged Session</span>
              <span className="text-slate-500">{new Date(lastWorkout.date).toLocaleDateString()}</span>
            </div>
            {lastWorkout.notes && <p className="text-[10px] text-slate-500 italic mb-2">Note: {lastWorkout.notes}</p>}
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {lastWorkout.sets?.map((set: any, idx: number) => (
                <div key={set.id || idx} className="flex justify-between items-center text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                  <span className="text-slate-300 font-medium">{set.exerciseName} (Set {set.setNumber})</span>
                  <span className="text-slate-400 font-bold">{set.weight}kg x {set.reps} reps</span>
                  {set.postureScore && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      set.postureScore >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {set.postureScore}% Pose
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic">No workouts logged yet. Tap Workout to begin!</p>
        )}
      </div>

    </div>
  );
}
