import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  HelpCircle, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  Trophy, 
  Loader2, 
  Clock, 
  BookOpen, 
  ChevronRight,
  RefreshCw,
  Award
} from 'lucide-react';

function QuizGenerator() {
  const [notes, setNotes] = useState([]);
  const [sourceType, setSourceType] = useState('topic'); // 'note', 'topic', 'text'
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [topic, setTopic] = useState('');
  const [rawText, setRawText] = useState('');
  const [quizType, setQuizType] = useState('mcq'); // 'mcq', 'tf', 'fill'
  const [numQuestions, setNumQuestions] = useState(5);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null); // Active Quiz data
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz Taking State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [answersLog, setAnswersLog] = useState([]); // user selections

  const fetchData = async () => {
    try {
      const notesData = await api.getNotes();
      setNotes(notesData);
      if (notesData.length > 0) setSelectedNoteId(notesData[0].id);

      const historyData = await api.getQuizHistory();
      setAttempts(historyData.attempts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setQuiz(null);
    setQuizComplete(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer('');
    setSubmittedAnswer(false);
    setAnswersLog([]);

    const payload = {
      source_type: sourceType,
      quiz_type: quizType,
      num_questions: numQuestions
    };

    if (sourceType === 'note') {
      payload.source_id = selectedNoteId;
    } else if (sourceType === 'text') {
      payload.raw_text = rawText;
    } else {
      payload.topic = topic;
    }

    try {
      const generated = await api.generateQuiz(payload);
      setQuiz(generated);
    } catch (err) {
      alert("Failed to generate quiz: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (option) => {
    if (submittedAnswer) return;
    setSelectedAnswer(option);
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || submittedAnswer) return;
    
    const q = quiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswersLog((prev) => [...prev, {
      question: q.question,
      selected: selectedAnswer,
      correct: q.correct_answer,
      isCorrect
    }]);

    setSubmittedAnswer(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setSubmittedAnswer(false);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    try {
      // Calculate final score
      const finalScore = score + (selectedAnswer.trim().toLowerCase() === quiz.questions[currentQuestionIndex].correct_answer.trim().toLowerCase() ? 1 : 0);
      
      const res = await api.submitQuizScore(quiz.id, finalScore, quiz.questions.length);
      setXpEarned(res.xp_earned);
      setScore(finalScore);
      setQuizComplete(true);
      
      // Refresh history
      const historyData = await api.getQuizHistory();
      setAttempts(historyData.attempts || []);
      
      // Trigger sound effects
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
        audio.volume = 0.4;
        audio.play();
      } catch (e) {}
    } catch (err) {
      alert("Failed to submit score: " + err.message);
    }
  };

  const currentQuestion = quiz && quiz.questions ? quiz.questions[currentQuestionIndex] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-indigo-500" />
            <span>AI Quiz Generator</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Create customized tests from study notes or topics to test your knowledge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Setup Forms or Active Quiz Interface */}
        <div className="lg:col-span-8">
          
          {/* Active Quiz Taking Interface */}
          {quiz && !quizComplete && currentQuestion && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-premium space-y-6">
              
              {/* Quiz status bar */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[280px]">{quiz.title}</h3>
                  <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-extrabold">{quizType.toUpperCase()} Quiz</span>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  Question <span className="text-indigo-500">{currentQuestionIndex + 1}</span> of {quiz.questions.length}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {currentQuestion.question}
                </p>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {quizType === 'mcq' || quizType === 'tf' ? (
                    currentQuestion.options.map((opt, i) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrectAnswer = opt.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase();
                      
                      let btnStyle = "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20";
                      
                      if (submittedAnswer) {
                        if (isCorrectAnswer) {
                          btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-300 font-bold";
                        } else {
                          btnStyle = "opacity-50 border-slate-200 dark:border-slate-800";
                        }
                      } else if (isSelected) {
                        btnStyle = "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswerSelect(opt)}
                          disabled={submittedAnswer}
                          className={`w-full p-4 rounded-xl border text-left text-xs md:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {submittedAnswer && isCorrectAnswer && <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />}
                          {submittedAnswer && isSelected && !isCorrectAnswer && <X className="h-4.5 w-4.5 text-rose-500 shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    // Fill in the blanks text input
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        value={selectedAnswer}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        disabled={submittedAnswer}
                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs md:text-sm focus:outline-none ${
                          submittedAnswer
                            ? selectedAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
                              ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500'
                              : 'border-rose-500 bg-rose-500/5 text-rose-500'
                            : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                        }`}
                      />
                      {submittedAnswer && (
                        <div className="text-xs">
                          Correct Answer: <span className="font-bold text-emerald-500">{currentQuestion.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Response & Explanation */}
              {submittedAnswer && (
                <div className="p-4 bg-indigo-50/30 dark:bg-slate-950/50 rounded-xl border border-indigo-200/20 dark:border-slate-800 animate-in fade-in duration-300">
                  <h5 className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Explanation</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                {!submittedAnswer ? (
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={!selectedAnswer.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs md:text-sm cursor-pointer shadow-md"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>{currentQuestionIndex + 1 === quiz.questions.length ? 'Finish Quiz' : 'Next Question'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Quiz Complete screen */}
          {quizComplete && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-8 shadow-premium text-center space-y-6 flex flex-col items-center justify-center">
              
              {/* Confetti styling and Trophy */}
              <div className="relative">
                <div className="h-20 w-20 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-full flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-amber-500 animate-bounce" />
                </div>
                <Award className="h-6 w-6 text-indigo-500 absolute -top-1 -right-1" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Quiz Completed!</h2>
                <p className="text-xs text-slate-400 mt-1">Outstanding job testing your focus knowledge.</p>
              </div>

              {/* Score HUD */}
              <div className="grid grid-cols-2 gap-4 max-w-sm w-full py-4 border-y border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Final Score</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{score} / {quiz.questions.length}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Reward Earned</span>
                  <span className="text-2xl font-bold text-emerald-500">+{xpEarned} XP</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setQuiz(null)}
                  className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs md:text-sm font-bold rounded-xl cursor-pointer"
                >
                  Create New Quiz
                </button>
              </div>

            </div>
          )}

          {/* Quiz Setup Generator (if no quiz active) */}
          {!quiz && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-premium space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Sparkles className="h-5.5 w-5.5 text-indigo-500 animate-pulse" />
                <span>Quiz Setup</span>
              </h3>

              <form onSubmit={handleGenerateQuiz} className="space-y-5">
                
                {/* Source selection tab */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/50 p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {['topic', 'note', 'text'].map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSourceType(src)}
                      className={`py-2 text-[10px] font-bold uppercase rounded-lg cursor-pointer tracking-wider ${
                        sourceType === src
                          ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400 font-extrabold'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {src === 'note' ? 'Study Note' : src === 'text' ? 'Paste Text' : 'Topic Input'}
                    </button>
                  ))}
                </div>

                {/* Input Fields based on source selection */}
                {sourceType === 'topic' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Data Structures, Photosynthesis, Thermodynamics"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm focus:outline-none"
                    />
                  </div>
                )}

                {sourceType === 'note' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Study Note</label>
                    <select
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm focus:outline-none"
                    >
                      {notes.length === 0 ? (
                        <option value="">No study notes available. Create some first!</option>
                      ) : (
                        notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)
                      )}
                    </select>
                  </div>
                )}

                {sourceType === 'text' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Paste Text Content</label>
                    <textarea
                      placeholder="Paste textbook page, lecture notes, or code to quiz yourself on..."
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      required
                      rows="6"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs md:text-sm focus:outline-none"
                    />
                  </div>
                )}

                {/* Configuration: Quiz type & Questions amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quiz Type</label>
                    <select
                      value={quizType}
                      onChange={(e) => setQuizType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm focus:outline-none"
                    >
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="tf">True / False</option>
                      <option value="fill">Fill in the Blanks</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">No. of Questions</label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm focus:outline-none"
                    >
                      <option value="3">3 Questions</option>
                      <option value="5">5 Questions</option>
                      <option value="7">7 Questions</option>
                      <option value="10">10 Questions</option>
                    </select>
                  </div>
                </div>

                {/* Submit Trigger */}
                <button
                  type="submit"
                  disabled={isGenerating || (sourceType === 'note' && notes.length === 0)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>HappyScholar Generating Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      <span>Generate Quiz</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

        </div>

        {/* Right Side: Quiz History Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Trophy className="h-5.5 w-5.5 text-indigo-500" />
              <span>Quiz Attempts</span>
            </h3>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            ) : attempts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No attempts logged yet. Complete your first quiz!</p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {attempts.map((att) => (
                  <div 
                    key={att.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl flex items-center justify-between"
                  >
                    <div className="overflow-hidden mr-2">
                      <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{att.quiz_title}</h4>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{att.completed_at}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                      att.score / att.total >= 0.8
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {att.score}/{att.total}
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

export default QuizGenerator;
