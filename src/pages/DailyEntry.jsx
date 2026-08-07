import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Calendar, 
  Moon, 
  Utensils, 
  Droplet, 
  Activity, 
  Smile, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const MOODS = [
  { emoji: '😀', label: 'Very Happy' },
  { emoji: '😄', label: 'Happy' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😢', label: 'Very Sad' }
];

const STRESS_LEVELS = [
  { value: 1, label: 'Very Low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Extreme' }
];

function DailyEntry() {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(getTodayDate());
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepBedtime, setSleepBedtime] = useState('22:00');
  const [sleepWakeup, setSleepWakeup] = useState('06:00');
  const [meals, setMeals] = useState('');
  const [waterIntake, setWaterIntake] = useState(2);
  const [exerciseMins, setExerciseMins] = useState(30);
  const [mood, setMood] = useState('😐');
  const [stressLevel, setStressLevel] = useState(3);
  const [studyHours, setStudyHours] = useState(4);
  const [codingHours, setCodingHours] = useState(2);
  const [screenTime, setScreenTime] = useState(6);
  
  // New habits
  const [readingMins, setReadingMins] = useState(0);
  const [meditationMins, setMeditationMins] = useState(0);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch entry for date if it exists
  useEffect(() => {
    const fetchEntryForDate = async () => {
      try {
        setError('');
        const res = await api.getDailyEntries({ date });
        if (res.entry) {
          const e = res.entry;
          setSleepHours(e.sleep_hours);
          setSleepBedtime(e.sleep_bedtime);
          setSleepWakeup(e.sleep_wakeup);
          setMeals(e.meals);
          setWaterIntake(e.water_intake);
          setExerciseMins(e.exercise_mins);
          setMood(e.mood);
          setStressLevel(e.stress_level);
          setStudyHours(e.study_hours);
          setCodingHours(e.coding_hours);
          setScreenTime(e.screen_time);
          setReadingMins(e.reading_mins || 0);
          setMeditationMins(e.meditation_mins || 0);
        } else {
          // Reset to defaults for empty entry
          setSleepHours(7);
          setSleepBedtime('22:00');
          setSleepWakeup('06:00');
          setMeals('');
          setWaterIntake(2);
          setExerciseMins(30);
          setMood('😐');
          setStressLevel(3);
          setStudyHours(4);
          setCodingHours(2);
          setScreenTime(6);
          setReadingMins(0);
          setMeditationMins(0);
        }
      } catch (err) {
        console.error("Failed to load daily log for date", err);
      }
    };
    fetchEntryForDate();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validations
    if (sleepHours < 0 || sleepHours > 24) {
      setError('Sleep hours must be between 0 and 24.');
      return;
    }
    if (waterIntake < 0 || waterIntake > 10) {
      setError('Water intake must be a positive number up to 10 liters.');
      return;
    }
    if (exerciseMins < 0 || exerciseMins > 480 || readingMins < 0 || readingMins > 480 || meditationMins < 0 || meditationMins > 480) {
      setError('Exercise, reading, and meditation minutes must be between 0 and 480.');
      return;
    }
    if (studyHours < 0 || studyHours > 24 || codingHours < 0 || codingHours > 24 || screenTime < 0 || screenTime > 24) {
      setError('Time metrics must be between 0 and 24 hours.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        sleep_hours: parseFloat(sleepHours),
        sleep_bedtime: sleepBedtime,
        sleep_wakeup: sleepWakeup,
        meals,
        water_intake: parseFloat(waterIntake),
        exercise_mins: parseInt(exerciseMins),
        mood,
        stress_level: parseInt(stressLevel),
        study_hours: parseFloat(studyHours),
        coding_hours: parseFloat(codingHours),
        screen_time: parseFloat(screenTime),
        reading_mins: parseInt(readingMins),
        meditation_mins: parseInt(meditationMins)
      };

      await api.saveDailyEntry(payload);
      
      // Reward baseline XP for saving daily entry!
      await api.addXP(10);
      
      setMessage(`Daily metrics for ${date} logged successfully!`);
      // Scroll to top to see message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to save daily entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Daily habit entry</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Track your daily wellness and productivity metrics.</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-premium shrink-0 font-semibold cursor-pointer">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            max={getTodayDate()}
            className="bg-transparent border-none text-slate-800 dark:text-slate-100 focus:outline-none font-semibold text-sm cursor-pointer"
          />
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Row 1: Sleep Tracker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Moon className="h-5.5 w-5.5 text-indigo-500" /> Sleep log
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sleep duration (Hours)</label>
              <input 
                type="number" 
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                min="0"
                max="24"
                step="0.5"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Approx bedtime</label>
              <input 
                type="time" 
                value={sleepBedtime}
                onChange={(e) => setSleepBedtime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm cursor-pointer transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Approx wake-up time</label>
              <input 
                type="time" 
                value={sleepWakeup}
                onChange={(e) => setSleepWakeup(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm cursor-pointer transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Row 2: Diet & Hydration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Utensils className="h-5.5 w-5.5 text-indigo-500" /> Diet & hydration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meals consumed today</label>
              <textarea 
                value={meals}
                onChange={(e) => setMeals(e.target.value)}
                placeholder="E.g., Poha for breakfast, Roti-Sabzi for lunch, Rice & Dal for dinner"
                rows="2"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                <span>Water intake (Liters)</span>
                <span className="text-slate-400 text-xs font-normal">Target: 2.5L - 3.0L</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(e.target.value)}
                  min="0"
                  max="10"
                  step="0.25"
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                  Liters
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Physical & Mental */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Smile className="h-5.5 w-5.5 text-indigo-500" /> Physical & mental wellness
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Exercise (Minutes)</label>
              <input 
                type="number" 
                value={exerciseMins}
                onChange={(e) => setExerciseMins(e.target.value)}
                min="0"
                max="480"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
            
            {/* Mood Emojis */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">Today's mood</label>
              <div className="flex gap-2 justify-between bg-slate-50 dark:bg-slate-950/50 p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
                {MOODS.map((m) => (
                  <button
                    key={m.emoji}
                    type="button"
                    onClick={() => setMood(m.emoji)}
                    title={m.label}
                    className={`text-2xl p-1.5 rounded-lg transition-all scale-105 active:scale-95 cursor-pointer ${
                      mood === m.emoji 
                        ? 'bg-indigo-500/25 border border-indigo-500/50 shadow-xs' 
                        : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Stress Levels */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Stress level</label>
              <select
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm cursor-pointer transition-all"
              >
                {STRESS_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value} - {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 4: Productivity & Habits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <BookOpen className="h-5.5 w-5.5 text-indigo-500" /> Focus & habits study
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Academic study hours</label>
              <input 
                type="number" 
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                min="0"
                max="24"
                step="0.5"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Coding hours</label>
              <input 
                type="number" 
                value={codingHours}
                onChange={(e) => setCodingHours(e.target.value)}
                min="0"
                max="24"
                step="0.5"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Non-study screen time</label>
              <input 
                type="number" 
                value={screenTime}
                onChange={(e) => setScreenTime(e.target.value)}
                min="0"
                max="24"
                step="0.5"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">General Reading (Minutes)</label>
              <input 
                type="number" 
                value={readingMins}
                onChange={(e) => setReadingMins(e.target.value)}
                min="0"
                max="480"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mindful Meditation (Minutes)</label>
              <input 
                type="number" 
                value={meditationMins}
                onChange={(e) => setMeditationMins(e.target.value)}
                min="0"
                max="480"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-98 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            'Save daily logs'
          )}
        </button>

      </form>
    </div>
  );
}

export default DailyEntry;
