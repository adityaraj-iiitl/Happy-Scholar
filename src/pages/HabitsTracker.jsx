import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Flame, 
  Award, 
  Target, 
  TrendingUp, 
  Coins, 
  Droplet, 
  BookOpen, 
  Sparkles, 
  CheckCircle, 
  Loader2,
  Brain,
  Coffee,
  Code,
  Dumbbell
} from 'lucide-react';

const HABIT_TARGETS = {
  water: { label: 'Water Hydration', target: 2.5, unit: 'Liters', icon: Droplet, color: 'text-blue-500', stroke: '#3b82f6' },
  study: { label: 'Academic Study', target: 4.0, unit: 'Hours', icon: BookOpen, color: 'text-indigo-500', stroke: '#6366f1' },
  coding: { label: 'Software Coding', target: 1.5, unit: 'Hours', icon: Code, color: 'text-purple-500', stroke: '#a855f7' },
  exercise: { label: 'Physical Exercise', target: 30, unit: 'Minutes', icon: Dumbbell, color: 'text-emerald-500', stroke: '#10b981' },
  reading: { label: 'General Reading', target: 20, unit: 'Minutes', icon: BookOpen, color: 'text-amber-500', stroke: '#f59e0b' },
  meditation: { label: 'Mindful Meditation', target: 15, unit: 'Minutes', icon: Brain, color: 'text-cyan-500', stroke: '#06b6d4' }
};

function HabitsTracker() {
  const [gamification, setGamification] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingWater, setUpdatingWater] = useState(false);

  const fetchData = async () => {
    try {
      const gamData = await api.getGamificationStatus();
      setGamification(gamData);

      const todayStr = new Date().toISOString().split('T')[0];
      const logRes = await api.getDailyEntries({ date: todayStr });
      if (logRes.entry) {
        setTodayLog(logRes.entry);
      } else {
        // Fallback or empty log defaults
        setTodayLog({
          water_intake: 0.0,
          study_hours: 0.0,
          coding_hours: 0.0,
          exercise_mins: 0,
          reading_mins: 0,
          meditation_mins: 0
        });
      }
    } catch (e) {
      console.error("Failed to load habit tracker data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDrinkWater = async () => {
    if (updatingWater || !todayLog) return;
    setUpdatingWater(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const newWater = (todayLog.water_intake || 0.0) + 0.25;
      
      const payload = {
        ...todayLog,
        date: todayStr,
        water_intake: newWater
      };
      
      // Remove db specific fields not matching input payload schema
      delete payload.id;
      delete payload.user_id;
      delete payload.created_at;

      await api.saveDailyEntry(payload);
      setTodayLog((prev) => ({ ...prev, water_intake: newWater }));
      
      // Update XP for tracking water
      const xpRes = await api.addXP(5);
      // Trigger sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
        audio.volume = 0.2;
        audio.play();
      } catch (e) {}
      
      // Re-fetch gamification to show updated XP
      const gamData = await api.getGamificationStatus();
      setGamification(gamData);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingWater(false);
    }
  };

  // Helper to render circle habit ring
  const renderHabitRing = (habitKey, currentValue) => {
    const details = HABIT_TARGETS[habitKey];
    const target = details.target;
    const value = currentValue || 0;
    const percentage = Math.min(100, Math.round((value / target) * 100));
    
    const radius = 28;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const Icon = details.icon;

    return (
      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5 overflow-hidden mr-2">
          
          {/* SVG ring */}
          <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800/60 fill-transparent"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="fill-transparent transition-all duration-300"
                stroke={details.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex items-center justify-center">
              <Icon className={`h-5 w-5 ${details.color}`} />
            </div>
          </div>

          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{details.label}</h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Logged: {value} / {target} {details.unit}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`text-xs font-bold ${percentage === 100 ? 'text-emerald-500' : 'text-slate-500'}`}>
            {percentage}%
          </span>
          {habitKey === 'water' && (
            <button
              onClick={handleDrinkWater}
              disabled={updatingWater}
              className="mt-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-[9px] font-bold rounded-lg cursor-pointer block transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              + Glass
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading || !gamification) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 italic font-semibold">Loading your habit stats...</span>
      </div>
    );
  }

  // Calculate XP Progress width
  const xpPercent = Math.min(100, Math.round((gamification.current_level_xp / gamification.next_level_target_xp) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Gamification HUD Panel */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* User profile & level */}
        <div className="flex items-center gap-4.5">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-indigo-500/20 relative shrink-0">
            {gamification.level}
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
              Lvl
            </span>
          </div>
          
          <div className="space-y-1.5 w-full md:max-w-xs">
            <h3 className="text-lg font-bold text-white tracking-wide">Gamification Hub</h3>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>XP: {gamification.current_level_xp} / {gamification.next_level_target_xp}</span>
              <span>Level {gamification.level}</span>
            </div>
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Level metrics */}
        <div className="flex gap-4 sm:gap-8 items-center shrink-0">
          
          {/* Streak Flame */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-xs">
              <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Active Streak</span>
              <span className="text-xl font-bold text-slate-100">{gamification.streak} Days</span>
            </div>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <Coins className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Sync Coins</span>
              <span className="text-xl font-bold text-slate-100">{gamification.coins}</span>
            </div>
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Habits rings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Target className="h-5.5 w-5.5 text-indigo-500" />
              <span>Today's Habits Progress</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderHabitRing('water', todayLog?.water_intake)}
              {renderHabitRing('study', todayLog?.study_hours)}
              {renderHabitRing('coding', todayLog?.coding_hours)}
              {renderHabitRing('exercise', todayLog?.exercise_mins)}
              {renderHabitRing('reading', todayLog?.reading_mins)}
              {renderHabitRing('meditation', todayLog?.meditation_mins)}
            </div>
          </div>

          {/* Dynamic Badges Showcase */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Award className="h-5.5 w-5.5 text-indigo-500" />
              <span>Academic Badges Unlocked</span>
            </h3>

            {gamification.badges.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No badges unlocked yet. Keep studying, coding, and completing quizzes to unlock achievements!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {gamification.badges.map((badge, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${badge.color}`}>
                      <Award className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{badge.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily/Weekly Goals Checklist */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <CheckCircle className="h-5.5 w-5.5 text-indigo-500" />
              <span>Study Quests</span>
            </h3>

            {/* Daily quests */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Daily Quests</span>
              
              <div className="space-y-2">
                {gamification.daily_goals.map((goal, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      goal.completed 
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' 
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                      {goal.completed ? (
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="h-4.5 w-4.5 rounded border border-slate-300 dark:border-slate-700 shrink-0"></div>
                      )}
                      <span className={`font-semibold truncate ${goal.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {goal.title}
                      </span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      goal.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      +{goal.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly quests */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Weekly Quests</span>
              
              <div className="space-y-2">
                {gamification.weekly_goals.map((goal, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                      goal.completed 
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' 
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                        {goal.completed ? (
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="h-4.5 w-4.5 rounded border border-slate-300 dark:border-slate-700 shrink-0"></div>
                        )}
                        <span className={`font-semibold truncate ${goal.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {goal.title}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        goal.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        +{goal.xp} XP
                      </span>
                    </div>

                    {/* Weekly progress subbar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1">
                        <div 
                          className="bg-indigo-600 h-1 rounded-full transition-all"
                          style={{ width: `${(goal.current / goal.target) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {goal.current} / {goal.target} Completed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default HabitsTracker;
