import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import fileService from '../../services/fileService';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Quote,
  Loader2
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Summarize this document',
  'What are the key points?',
  'Explain the main concepts',
  'What are the critical recommendations?'
];

const AskFileDialog = ({ isOpen, onClose, file }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus input and initialize welcome state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, file?._id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleSendQuestion = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fileService.askFile(file._id, q, history);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Ask File error:', err);
      setError(err.response?.data?.message || 'Failed to analyze document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendQuestion();
  };

  const toggleSources = (msgId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleClearHistory = () => {
    setMessages([]);
    setError(null);
  };

  return createPortal(
    <div
      id="ask-file-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ask-file-dialog-container"
        className="relative flex h-[85vh] max-h-[780px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="ask-file-title"
                  className="max-w-[320px] truncate text-base font-bold text-gray-900 sm:max-w-md dark:text-white"
                  title={file.fileName}
                >
                  {file.fileName}
                </h2>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {file.category || 'General'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Strictly Grounded Q&A
                </span>
                <span>•</span>
                <span>Single Document</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                id="btn-clear-chat"
                type="button"
                onClick={handleClearHistory}
                title="Reset conversation"
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <button
              id="btn-close-ask-file"
              onClick={onClose}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Welcome Card & Summary */}
          {messages.length === 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-950 dark:bg-slate-800/60">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Ask Your File with FILER AI
                  </h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    I answer questions strictly using the contents of{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {file.fileName}
                    </span>
                    . No external hallucinations allowed.
                  </p>

                  {file.summary && (
                    <div className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-gray-700 shadow-sm dark:bg-slate-900/80 dark:text-gray-300">
                      <span className="font-bold text-gray-900 dark:text-white">Summary: </span>
                      {file.summary}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold tracking-wider text-indigo-900 uppercase dark:text-indigo-300">
                      Suggested Questions:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SUGGESTED_QUESTIONS.map((qText, idx) => (
                        <button
                          key={idx}
                          id={`btn-suggestion-${idx}`}
                          type="button"
                          onClick={() => handleSendQuestion(qText)}
                          className="rounded-xl border border-indigo-200/80 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-xs transition hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                        >
                          {qText}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation History */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isExpanded = expandedSources[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 font-medium text-white'
                        : 'border border-gray-200/70 bg-white text-gray-800 dark:border-slate-800 dark:bg-slate-800/90 dark:text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {/* Message Timestamp */}
                  <span className="mt-1 px-1 text-[10px] text-gray-400">
                    {msg.timestamp}
                  </span>

                  {/* Expandable Source References (FR-38) */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 w-full">
                      <button
                        type="button"
                        onClick={() => toggleSources(msg.id)}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800"
                      >
                        <Quote className="h-3 w-3" />
                        <span>
                          {msg.sources.length} Source {msg.sources.length === 1 ? 'Chunk' : 'Chunks'} Referenced
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="rounded-lg border border-gray-200/60 bg-white p-2.5 text-[11px] dark:border-slate-800 dark:bg-slate-800"
                            >
                              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 font-semibold">
                                  <FileText className="h-3 w-3" />
                                  Chunk #{src.chunkIndex}
                                </span>
                                {src.score > 0 && (
                                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    {src.score}% Relevance
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-gray-700 italic dark:text-gray-300">
                                "{src.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs text-indigo-700 dark:border-indigo-950 dark:bg-slate-800/80 dark:text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reading document and generating grounded answer...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/80"
        >
          <div className="flex items-center gap-2">
            <input
              id="input-ask-question"
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this document..."
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-900 shadow-xs transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              id="btn-ask-submit"
              type="submit"
              disabled={!question.trim() || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-gray-400">
            Answers are strictly restricted to the content of this file (FR-37).
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AskFileDialog;
