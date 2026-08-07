import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, MessageSquare, X, Volume2, VolumeX, Sparkles } from 'lucide-react';

function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hi! I am HappyScholar AI, your study assistant. Click the microphone and say commands like "Open Notes", "Open Planner", or "Solve Question".' }
  ]);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
      };

      rec.onresult = (event) => {
        const command = event.results[0][0].transcript;
        setTranscript(command);
        addMessage('user', command);
        processVoiceCommand(command);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setTranscript('Error listening. Try again.');
        speakText('Sorry, I did not catch that. Please try again.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const speakText = (text) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Find an English voice if possible
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  const processVoiceCommand = (rawCommand) => {
    const cmd = rawCommand.toLowerCase().trim();
    let responseText = "I heard you, but I don't know that command. Try saying 'Open Notes', 'Open Planner', or 'Solve Question'.";
    
    if (cmd.includes('open notes') || cmd.includes('show notes') || cmd.includes('go to notes')) {
      responseText = "Sure, opening your notes generator.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/notes');
        setIsOpen(false);
      }, 800);
      return;
    }
    
    if (cmd.includes('open planner') || cmd.includes('show schedule') || cmd.includes('go to planner') || cmd.includes('open calendar')) {
      responseText = "Opening your AI study planner.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/planner');
        setIsOpen(false);
      }, 800);
      return;
    }
    
    if (cmd.includes('generate notes') || cmd.includes('create notes') || cmd.includes('make notes')) {
      responseText = "Navigating to notes generator to create new notes.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/notes');
        setIsOpen(false);
      }, 800);
      return;
    }
    
    if (cmd.includes('solve question') || cmd.includes('open camera') || cmd.includes('go to camera') || cmd.includes('solver')) {
      responseText = "Opening the AI camera solver page.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/camera-solver');
        setIsOpen(false);
      }, 800);
      return;
    }
    
    if (cmd.includes('show progress') || cmd.includes('open habits') || cmd.includes('show stats') || cmd.includes('go to habits')) {
      responseText = "Opening your habits and statistics tracker.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/habits');
        setIsOpen(false);
      }, 800);
      return;
    }

    if (cmd.includes('dashboard') || cmd.includes('home') || cmd.includes('go home')) {
      responseText = "Heading back to the main dashboard.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/');
        setIsOpen(false);
      }, 800);
      return;
    }
    
    if (cmd.includes('pomodoro') || cmd.includes('open timer') || cmd.includes('focus')) {
      responseText = "Opening the focus pomodoro timer.";
      addMessage('assistant', responseText);
      speakText(responseText);
      setTimeout(() => {
        navigate('/pomodoro');
        setIsOpen(false);
      }, 800);
      return;
    }

    if (cmd.includes('hello') || cmd.includes('hi') || cmd.includes('hey')) {
      responseText = "Hello there! How can I help you study today?";
      addMessage('assistant', responseText);
      speakText(responseText);
      return;
    }

    // Default chat fallback using chatbot API (can just speak back simple notice)
    addMessage('assistant', responseText);
    speakText(responseText);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print">
      {/* Expanded chat logs panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 max-h-[480px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-250">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-white leading-none">HappyScholar Assistant</h4>
                <span className="text-[10px] text-slate-400">Voice command helper</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${ttsEnabled ? 'text-indigo-400' : 'text-slate-500'}`}
                title={ttsEnabled ? "Mute Output" : "Unmute Output"}
              >
                {ttsEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Conversation history area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px] max-h-[300px]">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs font-semibold leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isListening && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/60 rounded-xl rounded-bl-none px-3.5 py-2 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  <span className="text-[10px] text-slate-400 italic">HappyScholar is listening...</span>
                </div>
              </div>
            )}
          </div>

          {/* Micro Controller Bar */}
          <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">
              {transcript || 'Say a command...'}
            </span>
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                isListening 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            speakText("Voice Assistant active. Say a command like Open Notes.");
          }}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3 relative group"
        >
          <Mic className="h-6 w-6" />
          <span className="absolute right-16 px-2 py-1 rounded bg-slate-950 text-white text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md border border-slate-800">
            Voice Assistant
          </span>
          <span className="absolute -inset-0.5 rounded-full bg-indigo-500/20 animate-ping -z-10 pointer-events-none"></span>
        </button>
      )}
    </div>
  );
}

export default VoiceAssistant;
