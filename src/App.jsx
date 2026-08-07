import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import VoiceAssistant from './components/VoiceAssistant';
import { api } from './services/api';

// Existing Pages
import Dashboard from './pages/Dashboard';
import DailyEntry from './pages/DailyEntry';
import AiAnalysis from './pages/AiAnalysis';
import WeeklyReport from './pages/WeeklyReport';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Pomodoro from './pages/Pomodoro';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import Login from './pages/Login';
import Signup from './pages/Signup';

// New Pages
import NotesGenerator from './pages/NotesGenerator';
import CameraSolver from './pages/CameraSolver';
import Planner from './pages/Planner';
import QuizGenerator from './pages/QuizGenerator';
import SmartRevision from './pages/SmartRevision';
import HabitsTracker from './pages/HabitsTracker';
import Chatbot from './pages/Chatbot';

import { Menu, X } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user from localStorage and listen to updates
  useEffect(() => {
    const loadUser = () => {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          setUser(JSON.parse(userString));
        } catch (e) {
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    loadUser();

    const syncUser = async () => {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const res = await api.getMe();
          if (res && res.user) {
            localStorage.setItem('user', JSON.stringify(res.user));
            setUser(res.user);
          }
        } catch (e) {
          console.error("Failed to sync user session on mount:", e);
          if (e.message === 'Unauthorized' || e.message === 'User not found') {
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
    };
    syncUser();

    window.addEventListener('user-profile-updated', loadUser);
    window.addEventListener('storage', loadUser);
    return () => {
      window.removeEventListener('user-profile-updated', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  // Update theme class on document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#0b0f19'; // soft black
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc'; // slate-50
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const PrivateLayout = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-300">
        
        {/* Mobile Sidebar overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden no-print"
          />
        )}

        {/* Sidebar Component */}
        <Sidebar 
          user={user} 
          logout={logout} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          sidebarOpen={sidebarOpen} 
        />

        {/* Main Content Pane */}
        <div className="flex-1 min-h-screen flex flex-col overflow-x-hidden lg:pl-72">
          
          {/* Mobile header / toggle */}
          <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/40 lg:hidden no-print shadow-sm">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all duration-200 active:scale-90"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-[#EC4899] to-[#7C3AED] bg-clip-text text-transparent">HappyScholar AI</span>
            <div className="w-10"></div> {/* Spacer for symmetry */}
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Floating Voice Assistant (Available everywhere when logged in) */}
        <VoiceAssistant />
      </div>
    );
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/signup" element={<Signup />} />

      {/* Private Pages */}
      <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
      <Route path="/daily-entry" element={<PrivateLayout><DailyEntry /></PrivateLayout>} />
      
      {/* New Pages Routing */}
      <Route path="/notes" element={<PrivateLayout><NotesGenerator /></PrivateLayout>} />
      <Route path="/camera-solver" element={<PrivateLayout><CameraSolver /></PrivateLayout>} />
      <Route path="/planner" element={<PrivateLayout><Planner /></PrivateLayout>} />
      <Route path="/quizzes" element={<PrivateLayout><QuizGenerator /></PrivateLayout>} />
      <Route path="/revision" element={<PrivateLayout><SmartRevision /></PrivateLayout>} />
      <Route path="/habits" element={<PrivateLayout><HabitsTracker /></PrivateLayout>} />
      <Route path="/chatbot" element={<PrivateLayout><Chatbot /></PrivateLayout>} />
      
      {/* Existing Pages Routing */}
      <Route path="/ai-analysis" element={<PrivateLayout><AiAnalysis /></PrivateLayout>} />
      <Route path="/weekly-report" element={<PrivateLayout><WeeklyReport /></PrivateLayout>} />
      <Route path="/attendance" element={<PrivateLayout><Attendance /></PrivateLayout>} />
      <Route path="/assignments" element={<PrivateLayout><Assignments /></PrivateLayout>} />
      <Route path="/pomodoro" element={<PrivateLayout><Pomodoro /></PrivateLayout>} />
      <Route path="/profile" element={<PrivateLayout><Profile /></PrivateLayout>} />
      <Route path="/recommendations" element={<PrivateLayout><Recommendations /></PrivateLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
