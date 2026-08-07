import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Coffee, 
  BookOpen, 
  Trophy, 
  Loader2,
  Calendar,
  Settings
} from 'lucide-react';

function Pomodoro() {
  const [workMins, setWorkMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [customMode, setCustomMode] = useState(false); // Settings toggler

  const MODES = {
    work: { label: 'Work Focus', mins: workMins, color: 'text-indigo-500', stroke: '#6366f1' },
    short: { label: 'Short Break', mins: breakMins, color: 'text-emerald-500', stroke: '#10b981' },
    long: { label: 'Long Break', mins: 15, color: 'text-blue-500', stroke: '#3b82f6' }
  };

  const [mode, setMode] = useState('work'); // work, short, long
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.mins * 60);
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState({ sessions: [], summary: { total_sessions: 0, total_minutes: 0 } });
  const [loading, setLoading] = useState(true);
  const [xpMessage, setXpMessage] = useState('');
  
  const timerRef = useRef(null);

  // Fetch session history
  const fetchStats = async () => {
    try {
      const data = await api.getPomodoroStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Update timer duration when mode or custom settings change
  useEffect(() => {
    setIsActive(false);
    setSecondsLeft(MODES[mode].mins * 60);
  }, [mode, workMins, breakMins]);

  // Clean timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleStart = () => {
    if (isActive) return;
    setIsActive(true);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    setIsActive(false);
    clearInterval(timerRef.current);
  };

  const handleReset = () => {
    setIsActive(false);
    clearInterval(timerRef.current);
    setSecondsLeft(MODES[mode].mins * 60);
  };

  const handleTimerComplete = async () => {
    // Play alert sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {}

    alert(`${MODES[mode].label} completed!`);

    if (mode === 'work') {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Log Pomodoro Session in DB
        await api.logPomodoroSession({
          date: today,
          duration_mins: MODES.work.mins
        });
        
        // 2. Reward 50 XP & 5 Coins
        const xpRes = await api.addXP(50);
        setXpMessage(`Focus Complete! +50 XP & +5 Coins earned!`);
        setTimeout(() => setXpMessage(''), 5000);

        fetchStats();
      } catch (err) {
        console.error("Failed to log pomodoro or reward XP", err);
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular SVG configurations
  const totalMins = MODES[mode].mins;
  const percentage = (secondsLeft / (totalMins * 60)) * 100;
  const radius = 90;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const currentModeDetails = MODES[mode];

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <Timer className="h-8 w-8 text-indigo-500" />
            <span>Pomodoro focus timer</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Stay productive by breaking study sessions into intervals with scheduled rests and custom durations.
          </p>
        </div>
      </div>

      {xpMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 animate-pulse shadow-xs font-bold text-sm">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span>{xpMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timer Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-8 shadow-premium flex flex-col items-center justify-center space-y-8 relative">
          
          {/* Custom Settings Gear */}
          <button 
            onClick={() => setCustomMode(!customMode)}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer border border-slate-200/30 dark:border-slate-800/30"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Custom Duration Panel */}
          {customMode && (
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-sm space-y-4 animate-in slide-in-from-top duration-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Custom Durations (Mins)</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500">Work Block</label>
                  <input
                    type="number"
                    value={workMins}
                    onChange={(e) => setWorkMins(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">Break Block</label>
                  <input
                    type="number"
                    value={breakMins}
                    onChange={(e) => setBreakMins(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode Selectors */}
          <div className="flex gap-2 bg-slate-50 dark:bg-slate-950/50 p-1.5 border border-slate-200/60 dark:border-slate-800/60 rounded-xl w-full max-w-sm">
            {Object.keys(MODES).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all hover:scale-[1.02] cursor-pointer ${
                  mode === m
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-850 dark:text-slate-100 font-extrabold'
                    : 'text-slate-555 hover:text-slate-700 dark:text-slate-500'
                }`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Visual Circle Clock */}
          <div className="relative h-64 w-64 flex items-center justify-center">
            
            {/* SVG Circle Timer */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800/40 fill-transparent"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="fill-transparent transition-all duration-100"
                stroke={currentModeDetails.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Time Texts */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight tabular-nums">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                {isActive ? 'Keep focusing' : 'Paused'}
              </span>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              title="Reset Timer"
              className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-xl transition-all hover:scale-[1.05] active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              <RotateCcw className="h-5.5 w-5.5" />
            </button>

            {isActive ? (
              <button
                onClick={handlePause}
                className="px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-98 shadow-md shadow-rose-500/15 flex items-center gap-2.5 cursor-pointer"
              >
                <Pause className="h-5 w-5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-98 shadow-md shadow-indigo-600/15 flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="h-5 w-5" />
                <span>Start session</span>
              </button>
            )}
          </div>

        </div>

        {/* Side Panel: Study Stats & Log */}
        <div className="space-y-6">
          
          {/* Summary Dashboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sessions Logged</span>
              <p className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                <Trophy className="h-5.5 w-5.5 text-amber-500 shrink-0" />
                {stats.summary.total_sessions}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Focus Time</span>
              <p className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                <BookOpen className="h-5.5 w-5.5 text-indigo-500 shrink-0" />
                {stats.summary.total_minutes}m
              </p>
            </div>
          </div>

          {/* History Logger list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
              <CheckCircle className="h-5.5 w-5.5 text-indigo-500" /> Focus history
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            ) : stats.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No study sessions completed today. Complete a Work block to start logging.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {stats.sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <Coffee className="h-4.5 w-4.5 text-indigo-400" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Focus block completed</h5>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {sess.date}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {sess.duration_mins} mins
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Pomodoro;
