import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  User, 
  Mail, 
  Trophy, 
  Award, 
  Flame, 
  ShieldAlert, 
  Calendar,
  Loader2,
  Lock,
  ChevronRight,
  TrendingUp,
  Camera,
  Trash2
} from 'lucide-react';

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pomodoroStats, setPomodoroStats] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Load User info
        const userString = localStorage.getItem('user');
        if (userString) {
          setCurrentUser(JSON.parse(userString));
        }

        // Get recent habit entries
        const habitRes = await api.getDailyEntries();
        setEntries(habitRes.entries || []);

        // Get pomodoro stats
        const pomodoroRes = await api.getPomodoroStats();
        setPomodoroStats(pomodoroRes);

        // Get AI analysis for streaks
        const aiRes = await api.getAiAnalysis();
        setAiAnalysis(aiRes);
      } catch (err) {
        console.error("Error loading profile stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        const updatedUser = { ...currentUser, profile_photo: base64Data };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-profile-updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    const updatedUser = { ...currentUser };
    delete updatedUser.profile_photo;
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('user-profile-updated'));
  };

  const handleSelectPreset = (url) => {
    const updatedUser = { ...currentUser, profile_photo: url };
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('user-profile-updated'));
  };

  const presetAvatars = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Sasha",
    "https://api.dicebear.com/7.x/pixel-art/svg?seed=Max",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Toby"
  ];

  const totalEntries = entries.length;
  const avgSleep = totalEntries > 0 
    ? (entries.reduce((acc, curr) => acc + curr.sleep_hours, 0) / totalEntries).toFixed(1)
    : 0;
  const avgStudy = totalEntries > 0 
    ? (entries.reduce((acc, curr) => acc + curr.study_hours, 0) / totalEntries).toFixed(1)
    : 0;
  const avgWater = totalEntries > 0 
    ? (entries.reduce((acc, curr) => acc + curr.water_intake, 0) / totalEntries).toFixed(1)
    : 0;

  const streaks = aiAnalysis?.streaks || { sleep: 0, water: 0, study: 0, exercise: 0 };
  const totalSessions = pomodoroStats?.summary?.total_sessions || 0;
  const totalFocusMins = pomodoroStats?.summary?.total_minutes || 0;

  // Badge configuration based on statistics
  const badges = [
    {
      id: 'early_adopter',
      title: 'First Step',
      desc: 'Logged your first wellness entry',
      unlocked: totalEntries > 0,
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'hydration_hero',
      title: 'Hydration Hero',
      desc: 'Achieved a 3-day water streak (2.5L+)',
      unlocked: streaks.water >= 3,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'focus_ninja',
      title: 'Focus Ninja',
      desc: 'Completed 5+ Pomodoro sessions',
      unlocked: totalSessions >= 5,
      color: 'from-purple-400 to-indigo-500'
    },
    {
      id: 'snooze_master',
      title: 'Snooze Master',
      desc: 'Maintained 4 days of 7h+ sleep',
      unlocked: streaks.sleep >= 4,
      color: 'from-violet-500 to-fuchsia-600'
    },
    {
      id: 'study_guru',
      title: 'Study Guru',
      desc: 'Averaged 4+ hours of academic study',
      unlocked: parseFloat(avgStudy) >= 4.0 && totalEntries >= 3,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'health_athlete',
      title: 'Fit Student',
      desc: 'Logged exercise sessions',
      unlocked: streaks.exercise >= 2,
      color: 'from-rose-400 to-red-500'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <User className="h-8 w-8 text-indigo-500" />
            <span>My profile & achievements</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Monitor cumulative statistics, view unlockable badges, and modify details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-xs mt-2">Loading profile details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User Details & Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* User Info Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium flex flex-col items-center text-center space-y-5">
              <div className="relative group/avatar cursor-pointer">
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                  {currentUser?.profile_photo ? (
                    <img 
                      src={currentUser.profile_photo} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover shadow-lg border-4 border-slate-100 dark:border-slate-800 transition-transform group-hover/avatar:scale-105 duration-300"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-3xl shadow-md border-4 border-slate-100 dark:border-slate-800 transition-transform group-hover/avatar:scale-105 duration-300">
                      {currentUser?.name ? currentUser.name[0].toUpperCase() : 'S'}
                    </div>
                  )}
                  {/* Camera overlay icon */}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </label>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-extrabold text-xl text-slate-850 dark:text-white leading-none">{currentUser?.name}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium pt-1">
                  <Mail className="h-3.5 w-3.5 text-indigo-500" /> {currentUser?.email}
                </span>
              </div>

              {/* Action buttons */}
              <div className="w-full pt-3 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800/40">
                <label 
                  htmlFor="avatar-upload"
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-[14px] border border-indigo-100 dark:border-indigo-900/30 cursor-pointer transition-all text-center block animate-pulse hover:animate-none"
                >
                  Upload custom photo
                </label>
                {currentUser?.profile_photo && (
                  <button 
                    onClick={handleResetPhoto}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-[14px] border border-red-100 dark:border-red-900/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove photo</span>
                  </button>
                )}
              </div>

              {/* Presets Selection */}
              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/40 space-y-2.5">
                <h5 className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider text-left">Or choose a preset avatar</h5>
                <div className="grid grid-cols-6 gap-2">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(url)}
                      className={`h-9 w-9 rounded-full overflow-hidden border-2 bg-slate-50 dark:bg-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                        currentUser?.profile_photo === url 
                          ? 'border-indigo-500 scale-105' 
                          : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-400'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Averages Stats */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Lifetime stats
              </h4>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-sm text-slate-650 dark:text-slate-400">
                  <span>Total Daily Entries Logged:</span>
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">{totalEntries}</strong>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-650 dark:text-slate-400">
                  <span>Average Sleep Duration:</span>
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">{avgSleep} hrs</strong>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-650 dark:text-slate-400">
                  <span>Average Study Hours:</span>
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">{avgStudy} hrs</strong>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-650 dark:text-slate-400">
                  <span>Average Water Hydration:</span>
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">{avgWater}L</strong>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-650 dark:text-slate-400">
                  <span>Pomodoro Sessions Completed:</span>
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">{totalSessions} ({totalFocusMins} m)</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Badges and Achievement Grid */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <Award className="h-5.5 w-5.5 text-indigo-500" /> Unlockable achievements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-5 rounded-xl border flex items-center gap-4 transition-premium hover:-translate-y-0.5 hover:shadow-xs ${
                    badge.unlocked 
                      ? 'bg-slate-50/40 dark:bg-slate-950/40 border-indigo-200 dark:border-indigo-900/40' 
                      : 'bg-slate-100/30 dark:bg-slate-950/20 border-slate-200/80 dark:border-slate-900/60 opacity-55'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl shrink-0 flex items-center justify-center text-white bg-gradient-to-tr ${
                    badge.unlocked ? badge.color : 'from-slate-400 to-slate-500 grayscale'
                  } shadow-md`}>
                    <Trophy className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-base font-bold ${badge.unlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                        {badge.title}
                      </h4>
                      {badge.unlocked && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded border border-indigo-500/20 uppercase tracking-wider">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 leading-relaxed">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default Profile;
