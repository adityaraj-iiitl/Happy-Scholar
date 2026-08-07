import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Camera, 
  Upload, 
  Copy, 
  Download, 
  Trash2, 
  Loader2, 
  BookOpen, 
  FileText,
  Video,
  VideoOff,
  History,
  Sparkles,
  ChevronRight,
  Clipboard,
  X
} from 'lucide-react';

function CameraSolver() {
  const [history, setHistory] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [image, setImage] = useState(null); // Base64 data URL
  const [isSolving, setIsSolving] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [extractedQuestion, setExtractedQuestion] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [tab, setTab] = useState('upload'); // 'upload' or 'webcam'
  const [currentUser, setCurrentUser] = useState(() => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getTodaySolvesCount = () => {
    if (!currentUser) return 0;
    if (currentUser.plan === 'premium') return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    if (currentUser.camera_solver_last_used_date === todayStr) {
      return currentUser.camera_solver_daily_count || 0;
    }
    return 0;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        return;
      }

      // Get Firebase ID Token if currentUser is logged in via Firebase
      let firebaseToken = null;
      if (auth.currentUser) {
        try {
          firebaseToken = await auth.currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.error("Failed to get Firebase token:", tokenErr);
        }
      }

      // Create order
      const order = await api.createPaymentOrder(firebaseToken);
      
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: "INR",
        name: "HappyScholar",
        description: "Premium Plan Upgrade",
        order_id: order.order_id,
        handler: async function (response) {
          try {
            const verification = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, firebaseToken);

            if (verification.success && verification.user) {
              localStorage.setItem('user', JSON.stringify(verification.user));
              setCurrentUser(verification.user);
              window.dispatchEvent(new Event('user-profile-updated'));
              alert("Premium activated successfully! ✨");
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            alert("Error verifying payment: " + err.message);
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: {
          color: "#8B5CF6",
        },
        modal: {
          ondismiss: function() {
            alert("Payment cancelled.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Failed to initiate payment: " + err.message);
    }
  };

  // Fetch solver history
  const fetchHistory = async () => {
    try {
      const data = await api.getSolvedQuestions();
      setHistory(data);
      if (data.length > 0 && !selectedSolution) {
        setSelectedSolution(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Native Webcam Controls
  const startWebcam = async () => {
    setTab('webcam');
    setImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setWebcamActive(true);
      }
    } catch (err) {
      alert("Unable to access camera: " + err.message + ". Please upload an image instead.");
      setTab('upload');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setImage(dataUrl);
    stopWebcam();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!image) return;
    setIsSolving(true);
    try {
      const res = await api.solveQuestion(image);
      setHistory((prev) => [res, ...prev]);
      setSelectedSolution(res);
      setImage(null);

      // Fetch latest user details to update daily limit count
      try {
        const meRes = await api.getMe();
        if (meRes && meRes.user) {
          localStorage.setItem('user', JSON.stringify(meRes.user));
          setCurrentUser(meRes.user);
          window.dispatchEvent(new Event('user-profile-updated'));
        }
      } catch (meErr) {
        console.error("Failed to sync user stats after solve:", meErr);
      }
    } catch (err) {
      alert("Failed to solve question: " + err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Solution copied to clipboard!");
  };

  const handleDownload = (solution) => {
    const element = document.createElement("a");
    const file = new Blob([
      `QUESTION:\n${solution.question_text}\n\n=========================================\n\nSOLUTION:\n${solution.solution_text}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `solution_${solution.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this saved solution?")) return;
    try {
      await api.deleteSolvedQuestion(id);
      const filtered = history.filter(q => q.id !== id);
      setHistory(filtered);
      if (selectedSolution && selectedSolution.id === id) {
        setSelectedSolution(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  const handleAddToRevision = async (sol) => {
    try {
      await api.addRevisionItem('question', sol.id, sol.question_text.slice(0, 50) + "...");
      alert("Added solution to Leitner Spaced Repetition deck!");
    } catch (e) {
      alert("Failed to add to revision: " + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <Camera className="h-8 w-8 text-indigo-500" />
            <span>AI Camera Solver</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Take a photo of a homework problem, math formula, or diagram to get instant explanations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image capture or upload panel */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-5">
            
            {/* View selectors */}
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  stopWebcam();
                  setTab('upload');
                  setImage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'upload' && !webcamActive
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100 font-extrabold'
                    : 'text-slate-450 hover:text-slate-600 dark:text-slate-500'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={startWebcam}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'webcam' || webcamActive
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100 font-extrabold'
                    : 'text-slate-450 hover:text-slate-600 dark:text-slate-500'
                }`}
              >
                Use Webcam
              </button>
            </div>

            {/* Plan indicator and solves count */}
            {currentUser && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-450">
                  Plan: <span className={currentUser.plan === 'premium' ? "text-amber-500 font-extrabold" : "text-slate-700 dark:text-slate-350"}>
                    {currentUser.plan === 'premium' ? 'Premium ✨' : 'Free Plan'}
                  </span>
                </span>
                {currentUser.plan !== 'premium' ? (
                  <span className="text-xs font-bold text-indigo-500">
                    {getTodaySolvesCount()}/3 daily solves used
                  </span>
                ) : (
                  <span className="text-xs font-bold text-indigo-500">
                    Unlimited solves
                  </span>
                )}
              </div>
            )}

            {/* Main view: either Webcam, Upload, Preview, or Upgrade Block */}
            {currentUser?.plan !== 'premium' && getTodaySolvesCount() >= 3 ? (
              <div className="border border-indigo-150 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
                <div className="h-12 w-12 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">Daily free limit reached.</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upgrade to Premium for unlimited AI solving.</p>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Upgrade to Premium</span>
                </button>
              </div>
            ) : (
              <>
                {/* Video Preview (Webcam) */}
                {tab === 'webcam' && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {webcamActive ? (
                      <button
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Capture Photo</span>
                      </button>
                    ) : (
                      <button
                        onClick={startWebcam}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold border border-slate-700 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Video className="h-4 w-4" />
                        <span>Start Video</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Image Upload Box */}
                {tab === 'upload' && !image && (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 relative transition-all min-h-[200px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mb-3" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-350 text-center">
                      Drag & drop image or browse
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, JPEG up to 5MB</span>
                  </div>
                )}

                {/* Capture/Upload Preview */}
                {image && (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img src={image} alt="Preview" className="w-full object-contain max-h-[300px]" />
                      <button
                        onClick={() => setImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleSolve}
                      disabled={isSolving}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
                    >
                      {isSolving ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          <span>HappyScholar Solving Step-by-Step...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5" />
                          <span>Solve with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>

          {/* History Logger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              <span>Solved Questions</span>
            </h3>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No solved questions yet.</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSolution(item)}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      selectedSolution && selectedSolution.id === item.id
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500'
                        : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="overflow-hidden mr-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.question_text}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.created_at}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Active solution rendering card */}
        <div className="lg:col-span-7">
          {selectedSolution ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-premium space-y-6">
              
              {/* Card Header Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                    <span>AI Step-by-Step Solution</span>
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Solved on: {selectedSolution.created_at}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleAddToRevision(selectedSolution)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    title="Add solution to spaced repetition card deck"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Revision</span>
                  </button>
                  <button
                    onClick={() => handleCopy(selectedSolution.solution_text)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 rounded-xl cursor-pointer"
                    title="Copy Solution Text"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(selectedSolution)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 rounded-xl cursor-pointer"
                    title="Download Solution"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSolution.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl cursor-pointer border border-rose-500/20"
                    title="Delete Saved Solution"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Solution display blocks */}
              <div className="space-y-5">
                
                {/* Solved Question Snippet */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
                  <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Question text extracted</h5>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{selectedSolution.question_text}"
                  </p>
                </div>

                {/* Explanation text */}
                <div>
                  <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">AI Solution Explanation</h5>
                  <div className="prose dark:prose-invert max-w-none text-xs md:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-medium space-y-4">
                    {/* Render raw solution lines cleanly */}
                    {selectedSolution.solution_text.split('\n').map((line, idx) => {
                      if (line.startsWith('##')) {
                        return <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{line.replace('##', '').trim()}</h3>;
                      }
                      if (line.startsWith('-') || line.startsWith('*')) {
                        return <li key={idx} className="ml-4 list-disc mb-1">{line.replace(/^[\-\*]\s+/, '')}</li>;
                      }
                      return <p key={idx} className="mb-2">{line}</p>;
                    })}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-12 text-center shadow-premium flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-850">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No question selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  Take a photo or upload an image of an academic problem on the left to solve it step-by-step.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default CameraSolver;
