import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  FileText,
  FileCode
} from 'lucide-react';

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am HappyScholar AI, your study assistant. Ask me questions about your course, equations to solve, or paste code snippets for debugging. You can also upload a PDF file to chat with its contents!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfContext, setPdfContext] = useState(null); // { filename, text }
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage;
    setInputMessage('');
    
    // Append user message
    const updatedMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await api.sendChatbotMessage(
        userText, 
        updatedMessages.slice(0, -1), // Send history excluding the new message
        pdfContext ? pdfContext.text : null
      );
      
      setMessages((prev) => [...prev, { sender: 'ai', text: res.message }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: `Failed to connect to AI server: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.parseChatbotPdf(formData);
      setPdfContext({
        filename: data.filename,
        text: data.text
      });
      alert(`Context loaded! You can now chat about "${data.filename}".`);
    } catch (err) {
      alert("Failed to parse PDF: " + err.message);
    } finally {
      setIsUploadingPdf(false);
      // Reset input
      e.target.value = '';
    }
  };

  const clearPdfContext = () => {
    setPdfContext(null);
  };

  // Helper to format text rendering with simple Markdown + LaTeX rules
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    let insideCodeBlock = false;
    let codeLines = [];
    let codeLanguage = '';

    return lines.map((line, idx) => {
      // Check for code blocks: ```python
      if (line.trim().startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          const codeString = codeLines.join('\n');
          codeLines = [];
          return (
            <pre key={idx} className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-850/80 my-3 relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(codeString);
                    alert("Code copied!");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer border border-slate-750"
                >
                  Copy
                </button>
              </div>
              <code className="block leading-relaxed">{codeString}</code>
            </pre>
          );
        } else {
          insideCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
          return null;
        }
      }

      if (insideCodeBlock) {
        codeLines.push(line);
        return null;
      }

      // Check for LaTeX block formulas: $$x = ...$$
      if (line.trim().startsWith('$$') && line.trim().endsWith('$$')) {
        const formula = line.replace(/\$\$/g, '').trim();
        return (
          <div key={idx} className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-center my-3 overflow-x-auto font-mono text-sm text-indigo-400 font-extrabold italic">
            {formula}
          </div>
        );
      }

      // Render headings
      if (line.startsWith('##')) {
        return <h4 key={idx} className="text-sm md:text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{line.replace('##', '').trim()}</h4>;
      }

      // Render bullet list
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return <li key={idx} className="ml-4 list-disc mb-1 leading-relaxed text-xs md:text-sm">{line.replace(/^[\-\*]\s+/, '').trim()}</li>;
      }

      // Regular text block
      if (line.trim() === '') return <div key={idx} className="h-2"></div>;
      
      // Inline LaTeX: $E=mc^2$
      const parts = line.split('$');
      if (parts.length > 2) {
        return (
          <p key={idx} className="mb-2 leading-relaxed text-xs md:text-sm">
            {parts.map((part, pIdx) => {
              if (pIdx % 2 === 1) {
                // Inside $ delimiters
                return <span key={pIdx} className="font-mono bg-indigo-500/10 text-indigo-400 px-1 py-0.5 rounded font-extrabold italic mx-0.5">{part}</span>;
              }
              return part;
            })}
          </p>
        );
      }

      return <p key={idx} className="mb-2 leading-relaxed text-xs md:text-sm">{line}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-indigo-500" />
            <span>AI Study Chatbot</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Get instant academic explanations, code reviews, and discuss study topics.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-premium flex flex-col h-[600px] overflow-hidden">
        
        {/* PDF Context bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-850 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl">
              <Bot className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">HappyScholar Chatbot</h4>
              <span className="text-[10px] text-slate-400 mt-1 block">Active Session</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pdfContext ? (
              <div className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center gap-2 max-w-[200px] sm:max-w-xs overflow-hidden shrink-0">
                <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-[10px] font-bold text-indigo-400 truncate">{pdfContext.filename}</span>
                <button 
                  onClick={clearPdfContext}
                  className="text-indigo-400 hover:text-rose-500 cursor-pointer shrink-0"
                  title="Remove context"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  disabled={isUploadingPdf}
                />
                <button
                  type="button"
                  disabled={isUploadingPdf}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-150 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                  <span>Attach PDF Context</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-indigo-400'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                </div>

                {/* Text Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-premium font-medium border ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {renderMessageContent(msg.text)}
                </div>

              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-indigo-400 shrink-0">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                  <span className="flex gap-1 shrink-0">
                    <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  <span className="text-xs text-slate-400 italic">HappyScholar is processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Panel */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-850 flex gap-2">
          <input
            type="text"
            placeholder={pdfContext ? `Ask about "${pdfContext.filename}"...` : "Ask a question about database, coding, math..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs md:text-sm text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/15"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
}

export default Chatbot;
