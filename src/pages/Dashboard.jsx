import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  Moon,
  Flame,
  Droplet,
  BookOpen,
  PlusCircle,
  AlertTriangle,
  Smile,
  Zap,
  Clock,
  Sparkles,
  TrendingUp,
  Brain,
  ShoppingBag,
  Coins,
  Bell,
  Check,
  Award,
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  Camera,
  MessageSquare,
  Calendar,
  HelpCircle,
  Layers
} from 'lucide-react';


function Dashboard() {
  const navigate = useNavigate();
  const user = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  })();
  const [entries, setEntries] = useState([]);
  const [aiData, setAiData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch last 14 days of entries for charts
      const dailyRes = await api.getDailyEntries();
      setEntries(dailyRes.entries || []);

      // Fetch AI insights & streaks & burnout flags
      const aiRes = await api.getAiAnalysis();
      setAiData(aiRes);

      // Fetch recommended products preview
      let recRes = [];
      try {
        recRes = await api.getProductRecommendations(false);
      } catch (e) {
        console.error("Dashboard recommendations fetching error", e);
      }
      setRecommendations(recRes || []);

      // Fetch Gamification status
      try {
        const gamRes = await api.getGamificationStatus();
        setGamification(gamRes);
      } catch (e) {
        console.error("Failed to load gamification status", e);
      }

      // Fetch Notifications
      try {
        const notifRes = await api.getNotifications();
        setNotifications(notifRes || []);
      } catch (e) {
        console.error("Failed to load notifications", e);
      }

    } catch (err) {
      console.error("Dashboard fetching error", err);
      setError('Could not sync with the backend database. Please log a daily entry to get started.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.markNotificationsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  // Formatting chart dates (e.g. 2026-08-06 -> "Aug 06")
  const chartData = entries.map(e => {
    try {
      const parts = e.date.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
        const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
        return {
          ...e,
          displayDate: `${month} ${day}`,
          totalStudy: (e.study_hours || 0.0) + (e.coding_hours || 0.0)
        };
      }
    } catch (e) {}
    return { ...e, displayDate: e.date, totalStudy: (e.study_hours || 0.0) + (e.coding_hours || 0.0) };
  });

  const streaks = aiData?.streaks || { sleep: 0, water: 0, study: 0, exercise: 0 };
  const burnoutDetected = aiData?.burnout_detected || false;
  const burnoutReason = aiData?.burnout_reason || '';
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Typewriter effect state
  const quoteText = "Small consistent efforts create extraordinary results.";
  const [typedQuote, setTypedQuote] = useState("");
  useEffect(() => {
    let i = 0;
    setTypedQuote("");
    const timer = setInterval(() => {
      setTypedQuote((prev) => prev + quoteText.charAt(i));
      i++;
      if (i >= quoteText.length) {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, []);

  // Lightweight Confetti Component with slow speed
  const Confetti = () => {
    const [particles, setParticles] = useState([]);
    useEffect(() => {
      const colors = ['#7C3AED', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      const shapes = ['circle', 'square', 'triangle'];
      const arr = Array.from({ length: 35 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 1.5,
        duration: 5 + Math.random() * 6 // Slowed down significantly for a premium float
      }));
      setParticles(arr);
    }, []);

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 rounded-[28px]">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute opacity-65"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
              borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : '',
              borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : '',
              borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : '',
              borderRadius: p.shape === 'circle' ? '50%' : '0px',
              transform: `rotate(${p.rotation}deg)`,
              animation: `confettiFall ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
        <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(0px) rotate(0deg); opacity: 0.8; }
            100% { transform: translateY(650px) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-300">
      
      {/* Top Header Row with centered alignment and notifications */}
      <div className="flex items-center justify-between gap-8 pb-6 border-b border-slate-200/50 dark:border-slate-800/40 relative">
        <div className="space-y-1">
          <h1 className="logo-font shrink-0">Happy Scholar</h1>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 no-print">
          
          {/* Notification Bell Panel */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[14px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm relative"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#EC4899] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown list */}
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl z-40 overflow-hidden backdrop-blur-md animate-in fade-in duration-200">
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E293B] dark:text-slate-200">Notifications Feed</span>
                  {unreadNotifications > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-[10px] text-primary-brand hover:underline font-extrabold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">No alerts logged yet.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleMarkOneRead(notif.id)}
                        className={`p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                          notif.read 
                            ? 'opacity-60 hover:opacity-100' 
                            : 'bg-primary-brand/5 dark:bg-primary-brand/10 border-l-2 border-primary-brand pl-2'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[8px] text-slate-400 block mt-1">{notif.created_at}</span>
                        </div>
                        {!notif.read && <Check className="h-3.5 w-3.5 text-primary-brand shrink-0 mt-0.5" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Log Daily Habit Premium Button */}
          <button
            onClick={() => navigate('/daily-entry')}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-brand to-secondary-brand hover:from-[#8B5CF6] hover:to-[#F472B6] text-white font-extrabold rounded-[16px] text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_25px_rgba(124,58,237,0.35),0_0_20px_rgba(59,130,246,0.25)] active:scale-95 shadow-md cursor-pointer relative overflow-hidden"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Log daily habit</span>
          </button>
        </div>
      </div>

      {/* Hero Header & Profile Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Welcome Hero Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white border border-indigo-900/40 rounded-[28px] p-8 md:p-10 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.15)] flex flex-col justify-between relative overflow-hidden group">
          <Confetti />
          {/* Subtle glowing circular accents */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-primary-brand/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-secondary-brand/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

          <div className="space-y-4 relative z-20">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#EC4899] px-3 py-1 bg-secondary-brand/15 border border-secondary-brand/30 rounded-full">
              Inspirational Hub
            </span>
            <h2 className="heading-font text-white font-black tracking-tight pt-4">
              Welcome Back, <br />
              <span className="bg-gradient-to-r from-[#EC4899] to-[#7C3AED] bg-clip-text text-transparent">
                {user ? user.name : 'Scholar'} 👋
              </span>
            </h2>
            <div className="h-10 flex items-center">
              <p className="text-slate-300 text-sm font-medium italic border-l-2 border-primary-brand/50 pl-4 py-1 leading-relaxed">
                "{typedQuote}"
              </p>
            </div>
          </div>

          <div className="pt-8 relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-800/60 mt-8">
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Level Performance</p>
              <h4 className="text-sm font-bold text-slate-200 mt-1">Ready for your daily quest?</h4>
            </div>
            <button
              onClick={() => navigate('/planner')}
              className="px-5 py-3 bg-gradient-to-r from-primary-brand to-secondary-brand hover:from-[#8B5CF6] hover:to-[#F472B6] text-white font-bold rounded-[16px] text-xs hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary-brand/20 cursor-pointer"
            >
              Start Studying
            </button>
          </div>
        </div>

        {/* Right Side: Student Profile & Gamification Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] p-8 shadow-premium flex flex-col justify-between transition-premium hover:-translate-y-1.5 hover:shadow-premium-card-hover">
          {loading ? (
            <div className="space-y-6 animate-pulse w-full">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800 skeleton-shimmer shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 skeleton-shimmer" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 skeleton-shimmer" />
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4 skeleton-shimmer" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full skeleton-shimmer" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl skeleton-shimmer" />
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl skeleton-shimmer" />
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl skeleton-shimmer" />
              </div>
            </div>
          ) : gamification ? (
            <div className="space-y-6 h-full flex flex-col justify-between animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {user?.profile_photo ? (
                      <img 
                        src={user.profile_photo} 
                        alt="Avatar" 
                        className="h-14 w-14 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-900"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary-brand to-secondary-brand flex items-center justify-center font-bold text-white text-lg shadow-md border-2 border-white dark:border-slate-900">
                        {user?.name ? user.name[0].toUpperCase() : 'S'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B] dark:text-white leading-none mb-1 flex items-center gap-2">
                      <span>{user ? user.name : 'Scholar'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary-brand/10 border border-primary-brand/20 text-primary-brand font-black text-[9px] uppercase tracking-wider">
                        Lvl {gamification.level}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">Focused & study-ready</p>
                  </div>
                </div>

                {/* Circular Progress Ring for Productivity Score */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle cx="28" cy="28" r="22" stroke="rgba(124, 58, 237, 0.08)" strokeWidth="3.5" fill="transparent" />
                      <circle cx="28" cy="28" r="22" stroke="#7C3AED" strokeWidth="3.5" fill="transparent" 
                              strokeDasharray={2 * Math.PI * 22} 
                              strokeDashoffset={2 * Math.PI * 22 * (1 - 0.85)} />
                    </svg>
                    <span className="absolute text-[10px] font-black text-[#1E293B] dark:text-white">85%</span>
                  </div>
                  <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider">Prod. Score</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-[#64748B] dark:text-slate-400 font-extrabold uppercase tracking-wider">
                  <span>XP: {gamification.current_level_xp} / {gamification.next_level_target_xp}</span>
                  <span>{Math.round((gamification.current_level_xp / gamification.next_level_target_xp) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200/50 dark:border-slate-800/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary-brand to-secondary-brand h-3 rounded-full transition-all duration-550"
                    style={{ width: `${Math.min(100, Math.round((gamification.current_level_xp / gamification.next_level_target_xp) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Gamification Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                <div 
                  onClick={() => navigate('/habits')}
                  className="p-3 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 dark:border-orange-500/20 rounded-2xl text-center cursor-pointer transition-all duration-200 hover:scale-105 flex flex-col justify-center items-center shadow-xs"
                >
                  <Flame className="h-5.5 w-5.5 text-orange-500 animate-flame mb-1 shrink-0" />
                  <span className="text-[9px] text-[#64748B] dark:text-slate-500 uppercase font-extrabold tracking-widest block leading-none">Streak</span>
                  <span className="text-xs font-black text-[#1E293B] dark:text-slate-100 mt-1">{gamification.streak} Days</span>
                </div>

                <div 
                  onClick={() => navigate('/habits')}
                  className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-2xl text-center cursor-pointer transition-all duration-200 hover:scale-105 flex flex-col justify-center items-center shadow-xs"
                >
                  <Coins className="h-5.5 w-5.5 text-amber-500 mb-1 shrink-0" />
                  <span className="text-[9px] text-[#64748B] dark:text-slate-500 uppercase font-extrabold tracking-widest block leading-none">Coins</span>
                  <span className="text-xs font-black text-[#1E293B] dark:text-slate-100 mt-1">{gamification.coins}</span>
                </div>

                <div 
                  onClick={() => navigate('/habits')}
                  className="p-3 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 dark:border-purple-500/20 rounded-2xl text-center cursor-pointer transition-all duration-200 hover:scale-105 flex flex-col justify-center items-center shadow-xs"
                >
                  <Award className="h-5.5 w-5.5 text-purple-400 mb-1 shrink-0" />
                  <span className="text-[9px] text-[#64748B] dark:text-slate-500 uppercase font-extrabold tracking-widest block leading-none">Badges</span>
                  <span className="text-xs font-black text-[#1E293B] dark:text-slate-100 mt-1">{gamification.badges.length}</span>
                </div>
              </div>

              {/* Extra Stats Row (Today's Goal, Study Time) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
                <span>📚 Today's Goal: <strong className="text-[#1E293B] dark:text-slate-100">4 Hours</strong></span>
                <span>⏱️ Study Time: <strong className="text-[#1E293B] dark:text-slate-100">{latestEntry ? `${latestEntry.study_hours}h` : '0h'}</strong></span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-6 text-slate-400 dark:text-slate-500 italic text-xs">
              Loading student profile system...
            </div>
          )}
        </div>

      </div>

      {/* Burnout Risk Notification Banner */}
      {burnoutDetected && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 rounded-[20px] flex items-start gap-4 shadow-sm animate-glow-pulse">
          <div className="h-10 w-10 shrink-0 bg-amber-500/15 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs md:text-sm text-amber-900 dark:text-amber-250">Academic Burnout Risk Warning</h3>
            <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{burnoutReason}</p>
          </div>
        </div>
      )}

      {/* AI Assistants Grid Section */}
      <div className="space-y-6">
        <h3 className="text-lg md:text-[22px] font-black text-[#1E293B] dark:text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="h-5.5 w-5.5 text-primary-brand animate-pulse" />
          <span>Launch AI Core Helpers</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: AI Notes (Blue Theme) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.12)] hover:border-blue-500/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs transition-transform duration-300 group-hover:rotate-12">
                <FileText className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-[#1E293B] dark:text-white">AI Notes Generator</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-405 leading-relaxed">
                  Generate detailed notes, bullet points, and clean study summaries from raw text or uploaded documents.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/notes')}
              className="mt-6 w-full py-2 bg-blue-50 hover:bg-blue-500 hover:text-white dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded-[16px] text-xs transition-all duration-200 cursor-pointer text-center"
            >
              Launch Notes App
            </button>
          </div>

          {/* Card 2: AI Doubt Chat (Purple Theme) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.12)] hover:border-primary-brand/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-primary-brand/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/15 flex items-center justify-center text-[#7C3AED] dark:text-purple-400 shadow-xs transition-transform duration-300 group-hover:rotate-12">
                <MessageSquare className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-[#1E293B] dark:text-white">AI Doubt Chat</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-405 leading-relaxed">
                  Got academic doubts? Chat with the AI tutor and receive detailed, step-by-step guidance on any topic.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/chatbot')}
              className="mt-6 w-full py-2 bg-purple-50 hover:bg-primary-brand hover:text-white dark:bg-primary-brand/10 dark:hover:bg-primary-brand/30 text-primary-brand dark:text-purple-400 font-bold rounded-[16px] text-xs transition-all duration-200 cursor-pointer text-center"
            >
              Start Chatting
            </button>
          </div>

          {/* Card 3: Camera Solver (Green Theme) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.12)] hover:border-emerald-500/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs transition-transform duration-300 group-hover:rotate-12">
                <Camera className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-[#1E293B] dark:text-white">AI Camera Solver</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-405 leading-relaxed">
                  Upload or snapshot a math formula, question, or text and let AI explain the solution step by step.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/camera-solver')}
              className="mt-6 w-full py-2 bg-emerald-50 hover:bg-emerald-500 hover:text-white dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-[16px] text-xs transition-all duration-200 cursor-pointer text-center"
            >
              Launch Camera
            </button>
          </div>

          {/* Card 4: Study Planner (Teal Theme) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(20,184,166,0.12)] hover:border-teal-500/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-teal-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-650 dark:text-teal-400 shadow-xs transition-transform duration-300 group-hover:rotate-12">
                <Calendar className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-[#1E293B] dark:text-white">AI Study Planner</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-405 leading-relaxed">
                  Input your exam dates and subjects, and let AI outline an adaptive schedule leading up to your test.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/planner')}
              className="mt-6 w-full py-2 bg-teal-50 hover:bg-teal-500 hover:text-white dark:bg-teal-950/30 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 font-bold rounded-[16px] text-xs transition-all duration-200 cursor-pointer text-center"
            >
              Open Planner
            </button>
          </div>

          {/* Card 5: Quiz Generator (Orange Theme) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(249,115,22,0.12)] hover:border-orange-500/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-orange-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center text-orange-655 dark:text-orange-400 shadow-xs transition-transform duration-300 group-hover:rotate-12">
                <HelpCircle className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-[#1E293B] dark:text-white">AI Quiz Generator</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-405 leading-relaxed">
                  Practice questions on customized topics, note material, or text to solidify your academic foundation.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/quizzes')}
              className="mt-6 w-full py-2 bg-orange-50 hover:bg-orange-500 hover:text-white dark:bg-orange-950/30 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold rounded-[16px] text-xs transition-all duration-200 cursor-pointer text-center"
            >
              Test Knowledge
            </button>
          </div>

          {/* Card 6: Smart Revision (Pink Theme) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(236,72,153,0.12)] hover:border-pink-500/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-pink-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-pink-500/10 dark:bg-pink-500/15 flex items-center justify-center text-pink-650 dark:text-pink-400 shadow-xs transition-transform duration-300 group-hover:rotate-12">
                <Layers className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-[#1E293B] dark:text-white">Smart Revision</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-405 leading-relaxed">
                  Utilize spaced repetition to check what you remember and set up active recall intervals for cards.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/revision')}
              className="mt-6 w-full py-2 bg-pink-50 hover:bg-pink-500 hover:text-white dark:bg-pink-950/30 dark:hover:bg-pink-900/40 text-pink-700 dark:text-pink-400 font-bold rounded-[16px] text-xs transition-all duration-200 cursor-pointer text-center"
            >
              Start Revision
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="h-32 bg-slate-100 dark:bg-slate-900 rounded-[20px] animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Row: Streak Badges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-7 shadow-premium">
            <h3 className="text-base md:text-lg font-black text-[#1E293B] dark:text-slate-100 tracking-tight mb-5 flex items-center gap-2">
              <Flame className="h-5.5 w-5.5 text-orange-500 animate-flame" /> 
              <span>Active Wellness Habit Streaks</span>
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3.5 p-3.5 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 dark:border-indigo-900/20 rounded-2xl transition-premium hover:-translate-y-0.5">
                <div className="h-10 w-10 bg-indigo-500/10 dark:bg-indigo-950 flex items-center justify-center rounded-xl text-indigo-650 dark:text-indigo-400 shadow-xs">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] text-[#64748B] dark:text-slate-500 font-extrabold uppercase tracking-wide leading-none">Sleep Streak</h5>
                  <p className="text-base font-black text-[#1E293B] dark:text-white mt-1.5">{streaks.sleep} days</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/10 dark:border-blue-900/20 rounded-2xl transition-premium hover:-translate-y-0.5">
                <div className="h-10 w-10 bg-blue-500/10 dark:bg-blue-950 flex items-center justify-center rounded-xl text-blue-650 dark:text-blue-400 shadow-xs">
                  <Droplet className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] text-[#64748B] dark:text-slate-500 font-extrabold uppercase tracking-wide leading-none">Water Streak</h5>
                  <p className="text-base font-black text-[#1E293B] dark:text-white mt-1.5">{streaks.water} days</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 bg-violet-500/5 dark:bg-violet-950/20 border border-violet-500/10 dark:border-violet-900/20 rounded-2xl transition-premium hover:-translate-y-0.5">
                <div className="h-10 w-10 bg-violet-500/10 dark:bg-violet-950 flex items-center justify-center rounded-xl text-violet-650 dark:text-violet-400 shadow-xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] text-[#64748B] dark:text-slate-500 font-extrabold uppercase tracking-wide leading-none">Study Streak</h5>
                  <p className="text-base font-black text-[#1E293B] dark:text-white mt-1.5">{streaks.study} days</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-900/20 rounded-2xl transition-premium hover:-translate-y-0.5">
                <div className="h-10 w-10 bg-emerald-500/10 dark:bg-emerald-950 flex items-center justify-center rounded-xl text-emerald-655 dark:text-emerald-400 shadow-xs">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] text-[#64748B] dark:text-slate-500 font-extrabold uppercase tracking-wide leading-none">Exercise Streak</h5>
                  <p className="text-base font-black text-[#1E293B] dark:text-white mt-1.5">{streaks.exercise} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Today's Snapshot Card Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-5 shadow-premium hover:-translate-y-1.5 hover:shadow-premium-card-hover transition-premium flex flex-col justify-between">
              <div>
                <div className="text-indigo-500 bg-indigo-500/10 h-9 w-9 rounded-xl flex items-center justify-center mb-4"><Moon className="h-5 w-5" /></div>
                <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-505 uppercase tracking-wide leading-none">Sleep Hours</h4>
              </div>
              <div className="mt-4">
                <p className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white leading-none">
                  {latestEntry ? `${latestEntry.sleep_hours}h` : 'N/A'}
                </p>
                <span className="text-[10px] text-[#64748B] dark:text-slate-500 mt-2 block font-medium truncate">
                  {latestEntry ? `${latestEntry.sleep_bedtime} - ${latestEntry.sleep_wakeup}` : 'Log bedtime'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-5 shadow-premium hover:-translate-y-1.5 hover:shadow-premium-card-hover transition-premium flex flex-col justify-between">
              <div>
                <div className="text-blue-500 bg-blue-500/10 h-9 w-9 rounded-xl flex items-center justify-center mb-4"><Droplet className="h-5 w-5" /></div>
                <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-wide leading-none">Water Intake</h4>
              </div>
              <div className="mt-4">
                <p className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white leading-none">
                  {latestEntry ? `${latestEntry.water_intake}L` : 'N/A'}
                </p>
                <span className="text-[10px] text-[#64748B] dark:text-slate-500 mt-2 block font-medium">Target: 2.5 Liters</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-5 shadow-premium hover:-translate-y-1.5 hover:shadow-premium-card-hover transition-premium flex flex-col justify-between col-span-2 lg:col-span-1">
              <div>
                <div className="text-violet-500 bg-violet-500/10 h-9 w-9 rounded-xl flex items-center justify-center mb-4"><BookOpen className="h-5 w-5" /></div>
                <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-wide leading-none">Study & Code</h4>
              </div>
              <div className="mt-4">
                <p className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white leading-none">
                  {latestEntry ? `${latestEntry.study_hours + latestEntry.coding_hours}h` : 'N/A'}
                </p>
                <span className="text-[10px] text-[#64748B] dark:text-slate-500 mt-2 block font-medium truncate">
                  {latestEntry ? `Study: ${latestEntry.study_hours}h | Code: ${latestEntry.coding_hours}h` : 'Log study time'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-5 shadow-premium hover:-translate-y-1.5 hover:shadow-premium-card-hover transition-premium flex flex-col justify-between">
              <div>
                <div className="text-emerald-500 bg-emerald-500/10 h-9 w-9 rounded-xl flex items-center justify-center mb-4"><Smile className="h-5 w-5" /></div>
                <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-wide leading-none">Daily Mood</h4>
              </div>
              <div className="mt-4">
                <p className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white leading-none">
                  {latestEntry ? latestEntry.mood : 'N/A'}
                </p>
                <span className="text-[10px] text-[#64748B] dark:text-slate-500 mt-2 block font-medium">Log daily feeling</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-5 shadow-premium hover:-translate-y-1.5 hover:shadow-premium-card-hover transition-premium flex flex-col justify-between">
              <div>
                <div className="text-rose-500 bg-rose-500/10 h-9 w-9 rounded-xl flex items-center justify-center mb-4"><Brain className="h-5 w-5" /></div>
                <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-wide leading-none">Stress Level</h4>
              </div>
              <div className="mt-4">
                <p className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white leading-none">
                  {latestEntry ? `${latestEntry.stress_level}/5` : 'N/A'}
                </p>
                <span className="text-[10px] text-[#64748B] dark:text-slate-500 mt-2 block font-medium">Keep stress low</span>
              </div>
            </div>

          </div>

          {/* Row: Interactive Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Sleep & Stress Trends */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-7 shadow-premium hover:-translate-y-1 transition-premium">
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-200 mb-6 flex items-center gap-2 tracking-tight uppercase">
                <Moon className="h-4.5 w-4.5 text-primary-brand" /> 
                <span>Sleep duration vs. Stress correlation</span>
              </h3>
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                      />
                      <Area type="monotone" dataKey="sleep_hours" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#sleepGrad)" name="Sleep (Hours)" />
                      <Line type="monotone" dataKey="stress_level" stroke="#EC4899" strokeWidth={2.5} dot={{ fill: '#EC4899', strokeWidth: 1 }} name="Stress Level" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs italic">
                    No sleep metrics logged.
                  </div>
                )}
              </div>
            </div>

            {/* Study Hours Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-7 shadow-premium hover:-translate-y-1 transition-premium">
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-200 mb-6 flex items-center gap-2 tracking-tight uppercase">
                <BookOpen className="h-4.5 w-4.5 text-primary-brand" /> 
                <span>Academic focus hours (Study vs Coding)</span>
              </h3>
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                      />
                      <Bar dataKey="study_hours" stackId="a" fill="#7C3AED" name="Study Hours" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="coding_hours" stackId="a" fill="#EC4899" name="Coding Hours" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs italic">
                    No academic focus logged.
                  </div>
                )}
              </div>
            </div>

            {/* Water Intake History */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-7 shadow-premium hover:-translate-y-1 transition-premium">
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-200 mb-6 flex items-center gap-2 tracking-tight uppercase">
                <Droplet className="h-4.5 w-4.5 text-[#3B82F6]" /> 
                <span>Hydration patterns history</span>
              </h3>
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                      />
                      <Area type="monotone" dataKey="water_intake" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#waterGrad)" name="Water (Liters)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs italic">
                    No hydration metrics logged.
                  </div>
                )}
              </div>
            </div>

            {/* Exercise & Screen Time */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-7 shadow-premium hover:-translate-y-1 transition-premium">
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-200 mb-6 flex items-center gap-2 tracking-tight uppercase">
                <Clock className="h-4.5 w-4.5 text-primary-brand" /> 
                <span>Screen time vs. active exercise</span>
              </h3>
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                      />
                      <Line type="monotone" dataKey="screen_time" stroke="#fbbf24" strokeWidth={3} name="Screen Time (h)" dot={{ fill: '#fbbf24', strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="exercise_mins" stroke="#10b981" strokeWidth={2.5} name="Exercise (mins)" dot={{ fill: '#10b981', strokeWidth: 1 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs italic">
                    No metrics logged.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ADDED WIDGETS SECTION (Dashboard Improvements - 8px Grid aligned) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* AI Focus & Suggestions */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-premium relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#1E293B] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary-brand" /> Today's Focus suggestion
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] uppercase font-bold tracking-wider">Active</span>
                </div>
                
                <div className="p-4 bg-primary-brand/5 border border-primary-brand/10 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-primary-brand">Gemini AI Tip:</p>
                  <p className="text-xs text-[#1E293B] dark:text-slate-350 leading-relaxed font-semibold">
                    "Your stress levels correlate closely with sleep debt. Consider study-interval blocks of 45 mins with 10 min hydration breaks today."
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-450 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                <span>⏱️ Recommended focus duration: <strong className="text-[#1E293B] dark:text-slate-100">45m</strong></span>
                <button onClick={() => navigate('/pomodoro')} className="text-primary-brand hover:underline font-bold">Start focus session →</button>
              </div>
            </div>

            {/* Upcoming Tasks & Quick Actions */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 shadow-premium flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-[#1E293B] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="h-4.5 w-4.5 text-primary-brand" /> Today's Focus Schedule
                </h4>
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850/30 rounded-xl">
                    <span className="text-xs text-[#1E293B] dark:text-slate-300 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary-brand" /> Log hydration targets
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">To-do</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850/30 rounded-xl">
                    <span className="text-xs text-[#1E293B] dark:text-slate-300 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-secondary-brand" /> Complete Daily study plan
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">To-do</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-450 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                <span>⚡ Quick Actions list</span>
                <button onClick={() => navigate('/daily-entry')} className="text-secondary-brand hover:underline font-bold">Add entry →</button>
              </div>
            </div>

          </div>

          {/* Row: AI Insights section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-8 shadow-premium space-y-6">
            <h3 className="text-lg md:text-[22px] font-black text-[#1E293B] dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Brain className="h-6 w-6 text-primary-brand animate-pulse" /> 
              <span>Personalized Gemini AI Lifestyle Insights</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiData?.insights?.map((insight, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50/50 dark:bg-slate-950/40 p-4.5 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl transition-premium hover:-translate-y-0.5 hover:shadow-xs flex items-start gap-4"
                >
                  <div className="h-8.5 w-8.5 rounded-xl bg-primary-brand/10 dark:bg-primary-brand/15 flex items-center justify-center text-primary-brand shrink-0">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-350 text-xs md:text-sm leading-relaxed font-semibold">
                    {insight}
                  </p>
                </div>
              )) || (
                <div className="col-span-2 text-slate-400 dark:text-slate-500 text-center text-xs py-4 italic">
                  Log wellness entries regularly for at least 3-4 days to let Gemini calculate lifestyle and productivity correlations.
                </div>
              )}
            </div>
          </div>

          {/* Row: AI Product Recommendations Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850/40 rounded-[20px] p-6 md:p-8 shadow-premium space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850/30 pb-4">
              <div>
                <h3 className="text-lg md:text-[22px] font-black text-[#1E293B] dark:text-slate-100 tracking-tight flex items-center gap-2.5">
                  <ShoppingBag className="h-6 w-6 text-primary-brand animate-pulse" /> 
                  <span>Tailored Productivity Items For You</span>
                </h3>
                <p className="text-slate-550 dark:text-slate-450 text-xs mt-1 font-medium">
                  Personalized product suggestions generated by Gemini AI matching your screen time and study trends.
                </p>
              </div>
              <button
                onClick={() => navigate('/recommendations')}
                className="self-start sm:self-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-primary-brand font-bold rounded-[16px] text-xs transition-all border border-indigo-100 dark:border-indigo-900/30 cursor-pointer shadow-xs"
              >
                View all recommendations
              </button>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center italic">
                Log wellness entries to generate product recommendations tailored to your screen time, sleep, and focus habits.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="p-5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/45 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                          {item.category}
                        </span>
                        <span className="text-[9px] font-extrabold text-primary-brand bg-primary-brand/10 px-2.5 py-0.5 rounded-full border border-primary-brand/20 uppercase tracking-wider">
                          {item.confidence}
                        </span>
                      </div>
                      <h4 className="text-xs md:text-sm font-black text-[#1E293B] dark:text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] md:text-xs text-[#64748B] dark:text-slate-405 mt-2 line-clamp-2 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-850/40">
                      <span className="text-xs md:text-sm font-black text-[#1E293B] dark:text-white">{item.estimated_price}</span>
                      <a 
                        href={item.amazon_search}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-primary-brand hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Shop Now
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
