import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  Search, 
  Plus, 
  Loader2, 
  Trash2, 
  Download, 
  FileCode,
  Check, 
  Edit3, 
  Sparkles, 
  Upload,
  ChevronRight
} from 'lucide-react';

function NotesGenerator() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [topic, setTopic] = useState('');
  const [detailLevel, setDetailLevel] = useState('detailed'); // short, detailed, bullet
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // Fetch all saved notes
  const fetchNotes = async () => {
    try {
      const data = await api.getNotes();
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        handleSelectNote(data[0]);
      }
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSummary(note.summary || '');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    try {
      const newNote = await api.generateNote(topic, detailLevel);
      setNotes((prev) => [newNote, ...prev]);
      handleSelectNote(newNote);
      setTopic('');
    } catch (err) {
      alert("Failed to generate notes: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('detail_level', detailLevel);

    try {
      const newNote = await api.uploadNote(formData);
      setNotes((prev) => [newNote, ...prev]);
      handleSelectNote(newNote);
      setUploadFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      alert("Failed to extract notes: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent,
        summary: editSummary
      });
      setNotes((prev) => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
      alert("Note saved successfully!");
    } catch (e) {
      alert("Failed to update note: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.deleteNote(id);
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      if (selectedNote && selectedNote.id === id) {
        setSelectedNote(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (e) {
      alert("Failed to delete note: " + e.message);
    }
  };

  const handleExportPDF = (note) => {
    if (!note) return;
    
    // Create simple HTML template for browser-native printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${note.title} - HappyScholar AI Notes</title>
          <style>
            body { 
              font-family: 'Segoe UI', system-ui, sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              line-height: 1.7;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              color: #4f46e5; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 12px; 
              font-size: 28px;
              margin-bottom: 24px;
            }
            h2 { 
              color: #1e1b4b; 
              margin-top: 32px; 
              font-size: 20px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 6px;
            }
            p { margin-bottom: 16px; }
            ul, ol { margin-bottom: 20px; padding-left: 20px; }
            li { margin-bottom: 6px; }
            pre { 
              background: #f8fafc; 
              padding: 16px; 
              border-radius: 8px; 
              font-family: 'Courier New', Courier, monospace; 
              overflow-x: auto; 
              border: 1px solid #e2e8f0;
              margin-bottom: 20px;
            }
            code { 
              font-family: monospace; 
              background: #f1f5f9; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-size: 0.9em;
            }
            blockquote { 
              border-left: 4px solid #6366f1; 
              padding-left: 16px; 
              color: #475569; 
              font-style: italic; 
              margin: 20px 0;
            }
            .summary-box { 
              background: #eff6ff; 
              padding: 16px 20px; 
              border-radius: 8px; 
              margin-bottom: 28px; 
              border-left: 4px solid #3b82f6; 
            }
            .summary-box h3 { 
              margin-top: 0; 
              color: #1d4ed8; 
              font-size: 15px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              margin-bottom: 8px;
            }
            .footer {
              margin-top: 48px;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <h1>${note.title}</h1>
          ${note.summary ? `
            <div class="summary-box">
              <h3>Key Summary</h3>
              <p>${note.summary}</p>
            </div>
          ` : ''}
          <div>
            ${note.content.replace(/\n/g, '<br/>')}
          </div>
          <div class="footer">
            Generated using HappyScholar AI Dashboard on ${note.created_at || new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleAddToRevision = async (note) => {
    try {
      await api.addRevisionItem('note', note.id, note.title);
      alert("Added to Spaced Repetition Revision Queue!");
    } catch (e) {
      alert("Failed to add to revision: " + e.message);
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.summary && n.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[42px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-500" />
            <span>AI Notes Generator</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Create high-quality study summaries from scratch or document files (PDF/DOCX/PPT).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Generators & Saved List */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Creator Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <span>Create notes</span>
            </h3>

            {/* Note generation option selector */}
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              {['short', 'detailed', 'bullet'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDetailLevel(level)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    detailLevel === level
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400 font-extrabold'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Form 1: Topic Input */}
            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Study Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Binary Trees, Indian Constitution"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                {isGenerating ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Plus className="h-4.5 w-4.5" />}
                <span>Generate Notes</span>
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or upload files</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Form 2: File Upload */}
            <form onSubmit={handleFileUpload} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">PDF, DOCX, or PPTX File</label>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 relative transition-all">
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,.docx,.pptx,.ppt,.txt,.md"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center truncate max-w-full">
                    {uploadFile ? uploadFile.name : 'Click to select document'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX, PPTX up to 10MB</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isUploading || !uploadFile}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2 cursor-pointer border border-slate-700/60"
              >
                {isUploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Upload className="h-4.5 w-4.5" />}
                <span>Extract notes from file</span>
              </button>
            </form>
          </div>

          {/* Search and History list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-premium space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search saved notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No study notes found.</p>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      selectedNote && selectedNote.id === note.id
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500'
                        : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="overflow-hidden mr-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{note.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{note.summary || 'Click to view...'}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 ${selectedNote && selectedNote.id === note.id ? 'text-indigo-500' : ''}`} />
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Panel: Selected Note Editor & Details */}
        <div className="lg:col-span-8">
          {selectedNote ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-premium space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
                <div className="space-y-1 overflow-hidden w-full">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-full pb-1"
                  />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Created: {selectedNote.created_at || 'Just Now'}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleAddToRevision(selectedNote)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    title="Add to Leitner Revision Queue"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>Revision</span>
                  </button>
                  <button
                    onClick={() => handleExportPDF(selectedNote)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
                    title="Print / Save PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl cursor-pointer border border-rose-500/20"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Summary Block */}
              <div className="bg-indigo-50/20 dark:bg-slate-950/40 border border-indigo-200/20 dark:border-slate-800/80 rounded-xl p-4.5">
                <h4 className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">Note Summary</h4>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows="2"
                  className="w-full text-xs text-slate-600 dark:text-slate-200 bg-transparent border border-transparent focus:border-indigo-500/40 rounded p-1 focus:outline-none resize-none font-medium leading-relaxed"
                  placeholder="Summarize key ideas..."
                />
              </div>

              {/* Main Rich Content Area */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Notes Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="15"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                  placeholder="Notes content in Markdown format..."
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/15 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4.5 w-4.5" />}
                  <span>Save Changes</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-12 text-center shadow-premium flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No notes selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  Select a study note from history or generate a new note above using our AI generator.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default NotesGenerator;
