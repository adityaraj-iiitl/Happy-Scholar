import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Loader2, 
  AlertCircle, 
  BookOpen, 
  RefreshCw, 
  CheckCircle,
  Plus,
  X
} from 'lucide-react';

function Planner() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [examDate, setExamDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch planner tasks
  const fetchTasks = async () => {
    try {
      const data = await api.getStudyTasks();
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch planner tasks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!subjectInput.trim()) return;
    if (!subjects.includes(subjectInput.trim())) {
      setSubjects([...subjects, subjectInput.trim()]);
    }
    setSubjectInput('');
  };

  const handleRemoveSubject = (sub) => {
    setSubjects(subjects.filter(s => s !== sub));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (subjects.length === 0 || !examDate) {
      alert("Please add at least one subject and select an exam date.");
      return;
    }
    setIsGenerating(true);
    try {
      const updatedTasks = await api.generateStudyPlan(subjects, examDate);
      setTasks(updatedTasks);
      alert("AI study schedule generated successfully!");
    } catch (err) {
      alert("Failed to generate plan: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const updated = await api.toggleStudyTask(task.id, !task.completed);
      setTasks((prev) => prev.map(t => t.id === task.id ? updated : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplan = async () => {
    if (!window.confirm("Missed tasks will be rescheduled and redistributed up to the exam date. Proceed?")) return;
    setIsReplanning(true);
    try {
      // Find the last scheduled date as fallback exam date
      const lastTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;
      let targetExamDate = examDate;
      if (!targetExamDate && lastTask) {
        const lastDt = new Date(lastTask.scheduled_date);
        lastDt.setDate(lastDt.getDate() + 1);
        targetExamDate = lastDt.toISOString().split('T')[0];
      }
      
      const updatedTasks = await api.replanStudyPlan(targetExamDate);
      setTasks(updatedTasks);
      alert("Schedule updated! Missed tasks rescheduled.");
    } catch (err) {
      alert("Failed to reschedule: " + err.message);
    } finally {
      setIsReplanning(false);
    }
  };

  // Group tasks by date for the timeline calendar view
  const groupedTasks = tasks.reduce((groups, task) => {
    const date = task.scheduled_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedTasks).sort();
  
  // Count statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const missedTasks = tasks.filter(t => t.missed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-indigo-500" />
            <span>AI Study Planner</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Input exam dates and subjects, and let Gemini generate an adaptive day-by-day study schedule.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Planner Setup Form */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Schedule Setup</span>
            </h3>

            {/* Input subjects list */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Subjects to Study</label>
              
              <form onSubmit={handleAddSubject} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Physics, DBMS, Calculus"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-md"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </form>

              {/* Subject Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subjects.length === 0 ? (
                  <span className="text-[10px] text-slate-400 italic">No subjects added. Add some above.</span>
                ) : (
                  subjects.map((sub, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 rounded-lg text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"
                    >
                      <span>{sub}</span>
                      <button type="button" onClick={() => handleRemoveSubject(sub)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Exam Date Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Exams Start Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Generate Trigger Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || subjects.length === 0 || !examDate}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
            >
              {isGenerating ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <CalendarIcon className="h-4.5 w-4.5" />}
              <span>Generate study schedule</span>
            </button>

          </div>

          {/* Stats & Re-plan card */}
          {tasks.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Plan Performance</h3>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-indigo-500">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{totalTasks}</span>
                </div>
                <div className="p-2 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/20 dark:border-indigo-900/20">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Done</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{completedTasks}</span>
                </div>
                <div className="p-2 bg-rose-50/30 dark:bg-rose-950/20 rounded-xl border border-rose-200/20 dark:border-rose-900/20">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Missed</span>
                  <span className="text-sm font-bold text-rose-500">{missedTasks}</span>
                </div>
              </div>

              {missedTasks > 0 && (
                <div className="pt-2">
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/25 mb-3">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400">Missed studies detected</h5>
                      <p className="text-[10px] text-rose-600/90 dark:text-rose-300 mt-0.5 leading-relaxed">
                        You have {missedTasks} uncompleted study tasks in the past. Re-plan to distribute them.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReplan}
                    disabled={isReplanning}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isReplanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span>Re-plan schedule</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Timeline Study Calendar view */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-premium space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <CalendarIcon className="h-5.5 w-5.5 text-indigo-500" />
              <span>Study Timeline</span>
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
                  <CheckSquare className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">No scheduled study tasks</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Set up your subjects and exam date on the left to generate your custom study calendar!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {sortedDates.map((date) => (
                  <div key={date} className="relative pl-9 group">
                    
                    {/* Circle Dot Marker */}
                    <div className="absolute left-[10px] top-1.5 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900 z-10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></div>
                    </div>

                    <div className="space-y-3">
                      
                      {/* Date Heading */}
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pt-0.5">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>

                      {/* Daily task cards */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {groupedTasks[date].map((task) => (
                          <div 
                            key={task.id}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                              task.completed 
                                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' 
                                : task.missed
                                ? 'bg-rose-500/5 border-rose-500/20'
                                : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 overflow-hidden pr-2">
                              {/* Toggle Completion Checkbox */}
                              <button 
                                onClick={() => handleToggleTask(task)}
                                className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                {task.completed ? (
                                  <CheckCircle className="h-5.5 w-5.5 text-emerald-500" />
                                ) : (
                                  <div className={`h-5 w-5 rounded border-2 ${task.missed ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'}`}></div>
                                )}
                              </button>

                              <div className="overflow-hidden">
                                <h4 className={`text-xs md:text-sm font-bold truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {task.title}
                                </h4>
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider mt-1 ${
                                  task.completed 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : task.missed
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : 'bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30'
                                }`}>
                                  {task.subject} • {task.duration_mins} mins
                                </span>
                              </div>
                            </div>
                            
                            {task.completed && (
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0">
                                +10 XP
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
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

export default Planner;
