import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  Download, 
  Moon, 
  Heart, 
  Activity, 
  BookOpen, 
  Sparkles, 
  Loader2,
  Calendar,
  User
} from 'lucide-react';

function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await api.getAiAnalysis();
        setReport(data);

        const userString = localStorage.getItem('user');
        if (userString) {
          setCurrentUser(JSON.parse(userString));
        }
      } catch (err) {
        console.error("Weekly Report loading error", err);
        setError('Failed to fetch weekly scores. Ensure you have recorded daily entries.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getWeekRangeString = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // start on Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + startOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${formatDate(monday)} – ${formatDate(sunday)}`;
  };

  const scores = report?.weekly_scores || { sleep_score: 0, health_score: 0, productivity_score: 0, study_score: 0 };

  const scoreCategories = [
    { name: 'Sleep Score', score: scores.sleep_score, icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Health Score', score: scores.health_score, icon: Heart, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Productivity Score', score: scores.productivity_score, icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { name: 'Study Score', score: scores.study_score, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-10 print-container">
      {/* Header (No print button hidden in media query) */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/40 pb-5 no-print">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Weekly wellness report</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Review aggregated performance scores and export summaries.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-98 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 cursor-pointer shrink-0"
        >
          <Download className="h-5 w-5" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* PDF Header - Visible only when printing */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-5 space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">StudentSync AI Report</h1>
            <p className="text-sm text-slate-600">Personalized Health & Academic Performance Report</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
            <p>API Sync: Active</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-4 rounded-lg mt-4 text-sm text-slate-800">
          <div className="flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-slate-500" />
            <span><strong className="font-semibold">Student Name:</strong> {currentUser?.name || 'Academic Scholar'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-slate-500" />
            <span><strong className="font-semibold">Reporting Week:</strong> {getWeekRangeString()}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Generating weekly report card...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Week Date Display for dashboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between no-print shadow-premium">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-semibold">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span>Week Range:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{getWeekRangeString()}</span>
            </div>
            <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-full font-bold">
              Gemini Computed
            </span>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print-grid">
            {scoreCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 flex flex-col justify-between shadow-premium hover:-translate-y-1 hover:shadow-premium-hover transition-premium print-card"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{cat.name}</span>
                    <div className={`h-10 w-10 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color} shrink-0 shadow-xs`}>
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <span className="text-3xl md:text-4xl font-bold text-slate-950 dark:text-white">{cat.score}</span>
                    <span className="text-sm text-slate-400 mb-1 font-medium">/ 100</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-2 rounded-full mt-5 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-indigo-500 to-violet-500`}
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Coach Analysis suggestions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium space-y-6 print-card">
            <h3 className="text-xl md:text-[28px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <Sparkles className="h-5.5 w-5.5 text-indigo-500 animate-pulse" /> AI coach weekly synthesis
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Daily health & physical routine:</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{report?.health_analysis}</p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Study habit & focus recommendation:</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{report?.study_rec}</p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Stress control & sleep optimization:</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{report?.sleep_rec}</p>
              </div>
            </div>
          </div>

          {/* Verification / Signature Section visible only when printing */}
          <div className="hidden print:block pt-12">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <p>Sign: ________________________</p>
              <p>StudentSync Wellness AI verification index: OK-2026-X12</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default WeeklyReport;
