import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  PlusCircle, 
  XCircle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';

function Attendance() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [subject, setSubject] = useState('');
  const [total, setTotal] = useState(10);
  const [attended, setAttended] = useState(8);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.getAttendance();
      setAttendanceList(data.attendance || []);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subject.trim()) {
      setError('Please enter a subject name.');
      return;
    }
    if (attended < 0 || total < 0) {
      setError('Class counts must be positive numbers.');
      return;
    }
    if (attended > total) {
      setError('Attended classes cannot exceed total classes.');
      return;
    }

    setSubmitting(true);
    try {
      await api.addAttendance({
        subject: subject.trim(),
        total_classes: parseInt(total),
        attended_classes: parseInt(attended)
      });
      setSuccess(`Subject "${subject}" added successfully.`);
      setSubject('');
      setTotal(10);
      setAttended(8);
      fetchAttendance();
    } catch (err) {
      setError(err.message || 'Failed to add subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAction = async (id, action) => {
    try {
      await api.updateAttendance(id, { action });
      // Update local state without full reload for instant visual updates
      setAttendanceList(prev => prev.map(item => {
        if (item.id === id) {
          const newTotal = item.total_classes + 1;
          const newAttended = action === 'attend' ? item.attended_classes + 1 : item.attended_classes;
          const newPercentage = newTotal > 0 ? (newAttended / newTotal) * 100 : 0.0;
          return {
            ...item,
            total_classes: newTotal,
            attended_classes: newAttended,
            percentage: parseFloat(newPercentage.toFixed(2))
          };
        }
        return item;
      }));
    } catch (err) {
      console.error("Attendance change failed", err);
      setError('Failed to update class entry.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await api.deleteAttendance(id);
      setAttendanceList(prev => prev.filter(item => item.id !== id));
      setSuccess('Subject deleted successfully.');
    } catch (err) {
      setError('Failed to delete subject.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-indigo-500" />
            <span>Attendance tracker</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Monitor your class counts. Ensure you stay above the 75% mandate.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <XCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Subject Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-premium h-fit space-y-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Plus className="h-5.5 w-5.5 text-indigo-500" /> Add subject
          </h3>
          
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Subject Name
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g., Operating Systems"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Classes Attended
                </label>
                <input
                  type="number"
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Total Classes
                </label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-98 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex justify-center items-center cursor-pointer"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Course'}
            </button>
          </form>
        </div>

        {/* Subjects List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-xs mt-2">Loading courses...</p>
            </div>
          ) : attendanceList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-premium">
              No subjects logged yet. Add your academic courses above to start tracking attendance.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {attendanceList.map((item) => {
                const isBelowThreshold = item.percentage < 75.0;
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-premium hover:-translate-y-0.5 hover:shadow-premium-hover transition-premium ${
                      isBelowThreshold 
                        ? 'border-amber-300 dark:border-amber-900/40 bg-amber-500/2' 
                        : 'border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Course Title and details */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{item.subject}</h4>
                        {isBelowThreshold && (
                          <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20 uppercase tracking-wider">
                            <AlertTriangle className="h-3 w-3" /> Below 75%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>Attended: <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.attended_classes}</strong></span>
                        <span>Total: <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.total_classes}</strong></span>
                        <span className="italic font-medium">{item.percentage >= 75 ? 'Safe status' : 'Needs attention'}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
                      
                      {/* Percent Wheel representation */}
                      <div className="flex flex-col items-center shrink-0">
                        <span className={`text-2xl font-extrabold ${isBelowThreshold ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {item.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Attendance</span>
                      </div>

                      {/* Log Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickAction(item.id, 'attend')}
                          title="Logged Attendance"
                          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                        >
                          Attended
                        </button>
                        <button
                          onClick={() => handleQuickAction(item.id, 'miss')}
                          title="Logged Miss"
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                        >
                          Missed
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Delete Subject"
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

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

export default Attendance;
