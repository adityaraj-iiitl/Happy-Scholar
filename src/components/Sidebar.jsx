import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Sparkles, 
  FileText, 
  ClipboardCheck, 
  BookOpen, 
  Timer, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  GraduationCap,
  ShoppingBag,
  Calendar,
  HelpCircle,
  Camera,
  MessageSquare,
  Layers,
  Target,
  ChevronRight
} from 'lucide-react';

function Sidebar({ user, logout, theme, toggleTheme, sidebarOpen }) {
  const navigate = useNavigate();

  const coreGroup = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  const aiGroup = [
    { name: 'AI Chat', path: '/chatbot', icon: MessageSquare },
    { name: 'AI Notes', path: '/notes', icon: FileText },
    { name: 'Camera Solver', path: '/camera-solver', icon: Camera },
    { name: 'Study Planner', path: '/planner', icon: Calendar },
    { name: 'Quiz Generator', path: '/quizzes', icon: HelpCircle },
    { name: 'Smart Revision', path: '/revision', icon: Layers },
  ];

  const toolsGroup = [
    { name: 'Habit Tracker', path: '/habits', icon: Target },
    { name: 'Daily Entry', path: '/daily-entry', icon: PlusCircle },
    { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
    { name: 'Assignments', path: '/assignments', icon: BookOpen },
    { name: 'Pomodoro Timer', path: '/pomodoro', icon: Timer },
  ];

  const insightsGroup = [
    { name: 'AI Insights', path: '/ai-analysis', icon: Sparkles },
    { name: 'Weekly Report', path: '/weekly-report', icon: FileText },
    { name: 'Recommendations', path: '/recommendations', icon: ShoppingBag },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        style={{ textDecoration: 'none' }}
        className={({ isActive }) => 
          `flex items-center justify-between pl-4 pr-3.5 py-3 rounded-[16px] text-[15px] font-medium no-underline transition-all duration-200 group relative ${
            isActive 
              ? 'bg-gradient-to-r from-[#8B5CF6]/15 to-transparent text-white border-l-4 border-[#8B5CF6] border-r-0 border-t-0 border-b-0 shadow-[0_0_15px_rgba(139,92,246,0.15)] font-bold' 
              : 'text-[#E5E7EB] hover:text-white hover:bg-white/5 hover:translate-x-1'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-[14px]">
              <Icon 
                className={`h-[21px] w-[21px] shrink-0 transition-all duration-200 ${
                  isActive 
                    ? 'text-[#8B5CF6]' 
                    : 'text-[#94A3B8] group-hover:text-[#8B5CF6] group-hover:scale-110'
                }`}
                strokeWidth={1.8} 
              />
              <span>{item.name}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-60 group-hover:translate-x-0 text-slate-300" />
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside 
      style={{
        background: 'linear-gradient(180deg, #3F3F46 0%, #44444F 50%, #3B3B45 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      className={`w-64 fixed lg:left-4 lg:top-4 lg:bottom-4 left-0 inset-y-0 text-slate-100 flex flex-col justify-between border border-white/5 z-30 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-r-[28px] lg:rounded-[28px] transition-all duration-300 no-print ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* Logo and App Title */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-white/5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-[17px] tracking-tight bg-gradient-to-r from-white to-[#E5E7EB] bg-clip-text text-transparent">
            HappyScholar
          </span>
        </div>

        {/* User Profile Card (Discord/Notion style) */}
        {user && (
          <div className="p-5 mx-4 my-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-3 shrink-0 cursor-pointer hover:bg-white/10 transition-all duration-300 shadow-sm relative group/profile">
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 min-w-0 flex-1"
            >
              <div className="relative shrink-0">
                {user.profile_photo ? (
                  <img 
                    src={user.profile_photo} 
                    alt="Avatar" 
                    className="h-14 w-14 rounded-full object-cover shadow-md border-2 border-slate-600"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center font-black text-white text-xl shadow-md border-2 border-slate-600">
                    {user.name ? user.name[0].toUpperCase() : 'S'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-[#3F3F46] animate-pulse" />
              </div>
              <div className="overflow-hidden min-w-0">
                <h4 className="text-[28px] font-bold truncate text-white leading-none tracking-tight mb-1.5 flex items-center gap-1.5">
                  <span>{user.name}</span>
                  {user.plan === 'premium' && (
                    <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none shadow-sm scale-90">
                      PRO ✨
                    </span>
                  )}
                </h4>
                <p className="text-[14px] truncate text-slate-300 opacity-80 font-medium leading-none">{user.email}</p>
              </div>
            </div>
            {/* Three-dot menu */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/profile');
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 shrink-0 cursor-pointer transition-colors"
              aria-label="Profile actions"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Menu Items with scrolling & spacing */}
        <nav className="px-4 space-y-6 flex-1 overflow-y-auto pr-1 py-2">
          
          <div className="space-y-[18px]">
            {coreGroup.map(renderLink)}
          </div>

          <div className="space-y-[18px]">
            <span className="px-4 text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[1.5px] block mb-2">AI Assistants</span>
            <div className="space-y-[18px]">
              {aiGroup.map(renderLink)}
            </div>
          </div>

          <div className="space-y-[18px]">
            <span className="px-4 text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[1.5px] block mb-2">Study Trackers</span>
            <div className="space-y-[18px]">
              {toolsGroup.map(renderLink)}
            </div>
          </div>

          <div className="space-y-[18px]">
            <span className="px-4 text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[1.5px] block mb-2">Performance</span>
            <div className="space-y-[18px]">
              {insightsGroup.map(renderLink)}
            </div>
          </div>

        </nav>
      </div>

      {/* Footer / Theme Toggle Switch & Logout */}
      <div className="p-4 border-t border-white/5 bg-white/5 lg:rounded-b-[28px] shrink-0">
        
        {/* Toggle Switch design ☀️ Light Theme ◉──── */}
        <div className="flex items-center justify-between px-3.5 py-3 mb-2.5 rounded-xl text-slate-300 hover:text-white transition-all">
          <span className="flex items-center gap-[14px] text-[15px] font-medium">
            {theme === 'dark' ? <Moon className="h-[21px] w-[21px] text-[#8B5CF6]" strokeWidth={1.8} /> : <Sun className="h-[21px] w-[21px] text-amber-400" strokeWidth={1.8} />}
            <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
          </span>
          <button 
            onClick={toggleTheme}
            className="w-11 h-6 rounded-full bg-zinc-600/60 p-0.5 transition-all duration-300 cursor-pointer outline-none border-none relative flex items-center"
            aria-label="Toggle theme switch"
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          style={{ textDecoration: 'none' }}
          className="w-full flex items-center gap-[14px] px-4 py-3 rounded-xl text-[15px] font-bold text-white hover:bg-red-500/12 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-[21px] w-[21px] text-red-500 shrink-0" strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
