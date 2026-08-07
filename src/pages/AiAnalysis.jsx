import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Sparkles, 
  Heart, 
  Activity, 
  Brain, 
  Moon, 
  Utensils, 
  Loader2, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

function AiAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await api.getAiAnalysis();
        setAnalysis(data);
      } catch (err) {
        console.error("AI Analysis load error", err);
        setError('Failed to generate AI Coach report. Please make sure you have logged at least one daily entry.');
      } finally {
        setLoading(false);
      }
    };

    const fetchMeals = async () => {
      try {
        setMealsLoading(true);
        const data = await api.getMealSuggestions();
        setMeals(data.meals || []);
      } catch (err) {
        console.error("Meals recommendation error", err);
      } finally {
        setMealsLoading(false);
      }
    };

    fetchAnalysis();
    fetchMeals();
  }, []);

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-indigo-500 animate-pulse" /> 
            <span>Gemini AI wellness coach</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Receive custom lifestyle advice, study guidelines, and budget meal suggestions.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold animate-pulse">
            Gemini is analyzing your logs and preparing lifestyle recommendations...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Coaching Columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Health Analysis Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium hover:-translate-y-1 hover:shadow-premium-hover transition-premium space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Heart className="h-5 w-5 text-indigo-500" /> Physical health assessment
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {analysis?.health_analysis}
              </p>
            </div>

            {/* Productivity Analysis Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium hover:-translate-y-1 hover:shadow-premium-hover transition-premium space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Activity className="h-5 w-5 text-violet-500" /> Productivity & balance analysis
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {analysis?.productivity_analysis}
              </p>
            </div>

            {/* Recommendations Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-500" /> Study recommendations
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  {analysis?.study_rec}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Moon className="h-4.5 w-4.5 text-indigo-400" /> Sleep coaching
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  {analysis?.sleep_rec}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Utensils className="h-4.5 w-4.5 text-emerald-500" /> Diet & hydration coach
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  {analysis?.food_suggestions}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Brain className="h-4.5 w-4.5 text-rose-500" /> Stress management advice
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  {analysis?.stress_advice}
                </p>
              </div>

            </div>

          </div>

          {/* Right Sidebar: Meal Suggestions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
                <Utensils className="h-5 w-5 text-indigo-500" /> Student meal suggester
              </h3>
              
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
                Gemini recommended student-friendly, affordable Indian vegetarian meals based on your wellness state.
              </p>

              {mealsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs animate-pulse">Cooking suggestions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meals.map((meal, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/70 rounded-xl space-y-2 hover:scale-[1.01] transition-transform"
                    >
                      <h4 className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                        {meal.meal_name}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Ingredients:</span> {meal.ingredients}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Time: {meal.time_to_cook}</span>
                        <span className="text-slate-500 dark:text-slate-300 italic">{meal.why_it_helps}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default AiAnalysis;
