import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BookOpen, 
  HelpCircle, 
  RotateCw, 
  Check, 
  X, 
  Loader2, 
  Calendar as CalendarIcon, 
  Layers, 
  TrendingUp, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

function SmartRevision() {
  const [dueItems, setDueItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [boxStats, setBoxStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);

  // Flashcard Deck State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailedContent, setDetailedContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.getRevisionStatus();
      setDueItems(data.due_items || []);
      setAllItems(data.all_items || []);
      setBoxStats(data.box_stats || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const currentItem = dueItems.length > 0 && currentIndex < dueItems.length ? dueItems[currentIndex] : null;

  // Fetch the detailed content of the active card (Note content or Solved Question solution) when flipped
  useEffect(() => {
    if (!currentItem || !isFlipped) return;

    const fetchDetailedContent = async () => {
      setContentLoading(true);
      try {
        if (currentItem.item_type === 'note') {
          // Fetch notes
          const notesList = await api.getNotes();
          const match = notesList.find(n => n.id === currentItem.item_id);
          setDetailedContent(match ? match.content : "Note content not found.");
        } else {
          // Fetch solved questions
          const questionsList = await api.getSolvedQuestions();
          const match = questionsList.find(q => q.id === currentItem.item_id);
          setDetailedContent(match ? match.solution_text : "Solution content not found.");
        }
      } catch (err) {
        setDetailedContent("Failed to load details: " + err.message);
      } finally {
        setContentLoading(false);
      }
    };

    fetchDetailedContent();
  }, [currentItem, isFlipped]);

  const handleReviewAction = async (remembered) => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await api.recordRevisionReview(currentItem.id, remembered);
      
      // Animate progress: remove card, reset flip
      setIsFlipped(false);
      setDetailedContent('');
      
      // Update local states
      const updatedDue = dueItems.filter(item => item.id !== currentItem.id);
      setDueItems(updatedDue);
      
      // Reset index if we reached the end of remaining list
      if (currentIndex >= updatedDue.length && updatedDue.length > 0) {
        setCurrentIndex(0);
      }
      
      // Re-fetch statistics
      fetchStatus();
      
      // Play a small sound effect
      try {
        const audio = new Audio(remembered 
          ? 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav' 
          : 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav'
        );
        audio.volume = 0.3;
        audio.play();
      } catch (e) {}
    } catch (e) {
      alert("Failed to record review: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBoxName = (boxNum) => {
    const names = {
      1: "Box 1: Every Day",
      2: "Box 2: Every 3 Days",
      3: "Box 3: Every 7 Days",
      4: "Box 4: Every 14 Days",
      5: "Box 5: Every 30 Days"
    };
    return names[boxNum] || `Box ${boxNum}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <Layers className="h-8 w-8 text-indigo-500" />
            <span>Smart Revision</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Optimize your memory retention using Spaced Repetition (Leitner flashcards).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Active Study Flashcards */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-12 flex justify-center shadow-premium">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : dueItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-12 text-center shadow-premium flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">All revised for today!</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  Excellent work keeping your memory deck clear. Add new notes or solved questions to this deck to revise later!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Flashcard container */}
              <div className="relative min-h-[380px] w-full bg-slate-950 dark:bg-slate-950 rounded-3xl p-6 md:p-8 flex flex-col justify-between border border-slate-800 shadow-2xl overflow-hidden group">
                
                {/* Header tags */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                    currentItem.item_type === 'note' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {currentItem.item_type === 'note' ? 'Study Note' : 'Solved Problem'}
                  </span>
                  
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {activeBoxName(currentItem.box)}
                  </span>
                </div>

                {/* Card Center Content */}
                <div className="my-8 flex flex-col items-center justify-center text-center px-4 max-h-[220px] overflow-y-auto min-h-[140px]">
                  {!isFlipped ? (
                    // Front side: Title of Note / Question
                    <div className="space-y-4">
                      <h2 className="text-xl md:text-2xl font-extrabold text-white leading-normal tracking-tight">
                        {currentItem.title}
                      </h2>
                      <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest flex items-center justify-center gap-1.5">
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Click flip card to review details</span>
                      </p>
                    </div>
                  ) : (
                    // Back side: Detailed content
                    <div className="w-full text-left font-semibold text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap max-w-full">
                      {contentLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                        </div>
                      ) : (
                        detailedContent.slice(0, 1000) + (detailedContent.length > 1000 ? "..." : "")
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6">
                  
                  {/* Flip button */}
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
                  </button>

                  {/* Leitner scoring buttons (visible only when flipped) */}
                  <div className={`flex gap-2.5 transition-all duration-200 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-30 pointer-events-none'}`}>
                    <button
                      onClick={() => handleReviewAction(false)}
                      disabled={!isFlipped || isSubmitting}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      <span>Forgot</span>
                    </button>
                    <button
                      onClick={() => handleReviewAction(true)}
                      disabled={!isFlipped || isSubmitting}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Remembered</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {currentIndex + 1} / {dueItems.length} Due Today
                  </span>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Right Panel: Spaced Repetition Stats & Revision Schedule Calendar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Deck Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <TrendingUp className="h-5.5 w-5.5 text-indigo-500" />
              <span>Revision Statistics</span>
            </h3>

            <div className="space-y-3">
              {Object.keys(boxStats).map((boxNum) => {
                const count = boxStats[boxNum] || 0;
                const total = allItems.length || 1;
                const percent = Math.round((count / total) * 100);
                
                return (
                  <div key={boxNum} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">{activeBoxName(Number(boxNum))}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{count} items</span>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          boxNum === '5' 
                            ? 'bg-emerald-500' 
                            : boxNum === '4' 
                            ? 'bg-blue-500' 
                            : boxNum === '3' 
                            ? 'bg-indigo-500' 
                            : boxNum === '2' 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                        }`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revision Schedule logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <CalendarIcon className="h-5.5 w-5.5 text-indigo-500" />
              <span>Revision Calendar</span>
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {allItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Revision calendar is empty.</p>
              ) : (
                allItems.slice(0, 10).map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="overflow-hidden mr-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Due: {item.next_revision_date}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default SmartRevision;
