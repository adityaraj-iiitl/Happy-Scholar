import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  // Search and Filter states
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All, Pending, Completed
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await api.getAssignments();
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !dueDate) {
      setError('Please fill in both the title and the due date.');
      return;
    }

    setSubmitting(true);
    try {
      await api.addAssignment({
        title: title.trim(),
        due_date: dueDate,
        priority
      });
      setSuccess(`Assignment "${title}" added successfully.`);
      setTitle('');
      setDueDate('');
      setPriority('Medium');
      fetchAssignments();
    } catch (err) {
      setError(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      await api.updateAssignment(id, { completed: !currentStatus });
      setAssignments(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, completed: !currentStatus };
        }
        return item;
      }));
    } catch (err) {
      console.error("Assignment toggle error", err);
      setError('Could not update assignment status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await api.deleteAssignment(id);
      setAssignments(prev => prev.filter(item => item.id !== id));
      setSuccess('Assignment deleted successfully.');
    } catch (err) {
      setError('Failed to delete assignment.');
    }
  };

  const isOverdue = (dueDateStr, isCompleted) => {
    if (isCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDateStr < today;
  };

  // Filter & Search Logic
  const filteredAssignments = assignments
    .filter(item => {
      const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter = 
        filter === 'All' ? true :
        filter === 'Completed' ? item.completed :
        !item.completed; // Pending
      return matchSearch && matchFilter;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date)); // Sort ascending by due date

  const getPriorityBadgeColor = (p) => {
    switch (p) {
      case 'High': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            <span>Assignment manager</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Keep track of college projects, tests, and homework deadlines.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Assignment Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium h-fit space-y-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Plus className="h-5.5 w-5.5 text-indigo-500" /> New assignment
          </h3>
          
          <form onSubmit={handleAddAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Assignment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., DBMS Lab Assignment 4"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-98 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex justify-center items-center cursor-pointer"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add Assignment'}
            </button>
          </form>
        </div>

        {/* Assignments Panel List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4 shadow-premium">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 self-center">
              {['All', 'Pending', 'Completed'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-98 cursor-pointer ${
                    filter === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

          </div>

          {/* Core List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-xs mt-2">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-premium">
              No matching assignments found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((item) => {
                const overdue = isOverdue(item.due_date, item.completed);
                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-premium hover:-translate-y-0.5 hover:shadow-premium-hover transition-premium ${
                      item.completed 
                        ? 'border-slate-100 dark:border-slate-850 opacity-70' 
                        : overdue 
                        ? 'border-rose-300 dark:border-rose-900/40 bg-rose-500/2' 
                        : 'border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Title with checkbox */}
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleComplete(item.id, item.completed)}
                        className={`h-5.5 w-5.5 rounded-md border flex items-center justify-center transition-all hover:scale-[1.02] active:scale-98 cursor-pointer mt-0.5 ${
                          item.completed
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : overdue
                            ? 'border-rose-450 dark:border-rose-700 hover:bg-rose-500/5'
                            : 'border-slate-350 dark:border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="h-4.5 w-4.5" />}
                      </button>
                      
                      <div className="space-y-1">
                        <h4 className={`text-base font-bold text-slate-800 dark:text-slate-100 ${
                          item.completed ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : ''
                        }`}>
                          {item.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-4 w-4" /> Due: {item.due_date}
                          </span>
                          {overdue && (
                            <span className="flex items-center gap-1 text-rose-500 font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wider text-[10px]">
                              <Clock className="h-3 w-3" /> Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Priority badge & Delete */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getPriorityBadgeColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Assignments;
