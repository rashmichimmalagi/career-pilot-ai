import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Download,
  Sidebar as SidebarIcon,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Zap,
  Info,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Flame,
  MessageSquare,
  BarChart3,
  Target,
  FileText,
  Building2,
  Calendar,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  MentorMessage,
  MentorStudentContext,
  MentorQuickAction,
} from '../types/mentor';
import {
  getAggregatedStudentContext,
  getMentorChatHistory,
  saveMentorChatHistory,
  clearMentorChatHistory,
  sendMentorMessage,
  MENTOR_QUICK_ACTIONS,
} from '../services/mentorService';
import { MentorChatBubble } from '../components/mentor/MentorChatBubble';
import { MentorQuickActions } from '../components/mentor/MentorQuickActions';
import { MentorContextSidebar } from '../components/mentor/MentorContextSidebar';

interface CareerMentorPageProps {
  onNavigate: (route: string) => void;
}

export const CareerMentorPage: React.FC<CareerMentorPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || 'guest';

  // State
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studentContext, setStudentContext] = useState<MentorStudentContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [thinkingStep, setThinkingStep] = useState('Consulting CareerPilot Intelligence...');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // View state: 'home' (landing/empty state) vs 'conversation' (active chat view)
  const [viewMode, setViewMode] = useState<'home' | 'conversation'>('home');

  // Confirmation modal for Clear Conversation
  const [showClearModal, setShowClearModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const homeInputRef = useRef<HTMLInputElement | null>(null);

  // Load chat history and context on mount or studentId change
  useEffect(() => {
    loadContextAndHistory();
  }, [studentId, profile]);

  const loadContextAndHistory = async () => {
    setIsLoadingContext(true);
    try {
      const [ctx, hist] = await Promise.all([
        getAggregatedStudentContext(studentId, profile),
        Promise.resolve(getMentorChatHistory(studentId)),
      ]);
      setStudentContext(ctx);
      setMessages(hist);
      // If there are existing messages, we still keep viewMode as 'home' by default on fresh visit,
      // but student can resume with 1 click or directly start a new prompt.
    } catch (err) {
      console.error('[CareerMentorPage] Failed to load data:', err);
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Browser back navigation support between 'conversation' and 'home'
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.mentorView === 'home' || !e.state?.mentorView) {
        setViewMode('home');
      } else if (e.state?.mentorView === 'conversation') {
        setViewMode('conversation');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-scroll on new messages when in conversation view
  useEffect(() => {
    if (viewMode === 'conversation') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, viewMode]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  // Thinking step simulator for immersive UX
  useEffect(() => {
    if (!isGenerating) return;
    const steps = [
      'Grounding advice in your ATS resume and coding accuracy...',
      'Synthesizing placement readiness formula across 4 pillars...',
      'Formulating actionable recruiter-grade next steps...',
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setThinkingStep(steps[stepIdx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Transition to Conversation view cleanly
  const enterConversationView = () => {
    setViewMode('conversation');
    try {
      window.history.pushState({ mentorView: 'conversation' }, '');
    } catch {
      // Ignored if pushState restricted
    }
  };

  // Back to Mentor Home navigation
  const handleBackToMentor = () => {
    setViewMode('home');
    try {
      if (window.history.state?.mentorView === 'conversation') {
        window.history.replaceState({ mentorView: 'home' }, '');
      }
    } catch {
      // Ignored if replaceState restricted
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string, quickActionId?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isGenerating) return;

    // Immediately switch to conversation view if on home view
    if (viewMode !== 'conversation') {
      enterConversationView();
    }

    setErrorBanner(null);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: MentorMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
      quickActionUsed: quickActionId,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMentorChatHistory(studentId, updatedMessages);
    setIsGenerating(true);

    try {
      // Ensure freshest context
      const currentCtx = studentContext || (await getAggregatedStudentContext(studentId, profile));
      
      const payloadMessages = updatedMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const result = await sendMentorMessage(currentCtx, payloadMessages, quickActionId);

      const mentorMessage: MentorMessage = {
        id: `mntr_${Date.now()}`,
        sender: 'mentor',
        text: result.reply,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: result.suggestedFollowUps,
        actionLinks: result.actionLinks,
      };

      const finalMessages = [...updatedMessages, mentorMessage];
      setMessages(finalMessages);
      saveMentorChatHistory(studentId, finalMessages);
    } catch (err: any) {
      console.error('[CareerMentorPage] Message processing failed:', err);
      setErrorBanner('AI service experienced a temporary delay. A local contextual response has been generated.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick Action Click
  const handleSelectQuickAction = (action: MentorQuickAction) => {
    handleSendMessage(action.prompt, action.id);
  };

  // Follow-up click
  const handleSelectFollowUp = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Request Clear Conversation (opens custom confirmation dialog)
  const handleRequestClear = () => {
    setShowClearModal(true);
  };

  // Confirmed Clear Conversation
  const handleConfirmClear = () => {
    // Only removes current chat messages from active mentor conversation.
    // Does NOT delete any student profile, resume, coding history, etc.
    clearMentorChatHistory(studentId);
    setMessages([]);
    setInputText('');
    setErrorBanner(null);
    setShowClearModal(false);
    setViewMode('home');
  };

  // Export Chat
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const studentName = studentContext?.studentName || 'Student';
    const lines = [
      `# CareerPilot AI Career Mentor - Session Transcript`,
      `Student: ${studentName}`,
      `Target Role: ${studentContext?.targetRole || 'Software Developer'}`,
      `Target Company: ${studentContext?.targetCompany || 'Top Tech'}`,
      `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      `==================================================\n`,
    ];

    messages.forEach((m) => {
      lines.push(`### ${m.sender === 'user' ? studentName : 'AI Career Mentor'} (${new Date(m.timestamp).toLocaleTimeString()})`);
      lines.push(`${m.text}\n`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CareerPilot_Mentor_Notes_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studentName = studentContext?.studentName || profile?.full_name || 'Student';

  return (
    <div id="ai-career-mentor-module" className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      
      {/* Top Header Banner */}
      <header className="sticky top-16 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Navigation and Branding */}
          <div className="flex items-center gap-3">
            {/* Back to Mentor button shown when in conversation mode */}
            {viewMode === 'conversation' && (
              <button
                id="btn-back-to-mentor-home"
                onClick={handleBackToMentor}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer shadow-2xs group"
                title="Return to AI Career Mentor Home"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Mentor</span>
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  🤖 AI Career Mentor
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real Data Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                Your personalized AI mentor for placement preparation, career decisions, and skill improvement.
              </p>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Export button */}
            {messages.length > 0 && (
              <button
                id="btn-mentor-export-transcript"
                onClick={handleExportChat}
                title="Export Conversation Transcript"
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Export</span>
              </button>
            )}

            {/* Functional Clear button with confirmation */}
            {messages.length > 0 && (
              <button
                id="btn-mentor-clear-conversation"
                onClick={handleRequestClear}
                title="Clear current conversation"
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-800/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear</span>
              </button>
            )}

            {/* Profile Context Toggle Button */}
            <button
              id="btn-mentor-toggle-context"
              onClick={() => setShowSidebar(!showSidebar)}
              title={showSidebar ? 'Hide Grounded Profile Context' : 'Show Grounded Profile Context'}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showSidebar
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <SidebarIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Profile Context</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Content Column (8 or 12 cols based on sidebar toggle) */}
        <div className={`${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col transition-all duration-200`}>
          
          {/* ========================================================================= */}
          {/* MODE A: MAIN MENTOR LANDING / HOME STATE                                */}
          {/* ========================================================================= */}
          {viewMode === 'home' && (
            <div className="space-y-6">
              
              {/* Hero Banner Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white dark:to-slate-900 border border-indigo-500/20 text-slate-800 dark:text-slate-100 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Welcome, {studentName}!
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Your personalized AI mentor for placement preparation, career decisions, and skill improvement.
                      </p>
                    </div>
                  </div>

                  {messages.length > 0 && (
                    <button
                      id="btn-resume-mentor-conversation"
                      onClick={enterConversationView}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Resume Chat ({messages.length})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 4-Pillar Student Grounded Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Goal</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm mt-0.5">
                      {studentContext?.targetRole || 'Software Dev'}
                    </p>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate block mt-0.5">
                      @{studentContext?.targetCompany || 'Top Tech'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Placement Score</p>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                      {studentContext?.placementReadiness.overallScore !== null && studentContext?.placementReadiness.overallScore !== undefined
                        ? `${studentContext.placementReadiness.overallScore}%`
                        : '--'}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Status: {studentContext?.placementReadiness.statusCategory || 'Getting Started'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resume ATS</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                      {studentContext?.resumeData.isAnalyzed ? `${studentContext.resumeData.atsScore}/100` : 'Not Scanned'}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {studentContext?.resumeData.isAnalyzed ? 'ATS Optimized' : 'Upload Resume'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coding Arena</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                      {studentContext?.codingData.totalSolved ?? 0} Solved
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {studentContext?.codingData.overallAccuracy ?? 0}% Accuracy
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Conversation Quick Resume Bar (if messages exist) */}
              {messages.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Active Conversation ({messages.length} messages)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        Last message: {messages[messages.length - 1].text.slice(0, 90)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleRequestClear}
                      className="px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={enterConversationView}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span>Continue Chat</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Strategic Quick Action Cards Grid */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Instant Strategic Actions
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select any question to analyze your real performance and get custom recruiter-grade strategies.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60">
                    One-Click
                  </span>
                </div>

                <MentorQuickActions
                  onSelectAction={handleSelectQuickAction}
                  isLoading={isGenerating}
                />
              </div>

              {/* Direct Query Starter Box */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ask a Custom Question</span>
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputText.trim()) {
                      handleSendMessage();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={homeInputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about your coding weak spots, resume fixes, company rounds, or study plan..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isGenerating}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ask Mentor</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE B: ACTIVE CONVERSATION VIEW                                          */}
          {/* ========================================================================= */}
          {viewMode === 'conversation' && (
            <div className="flex flex-col h-[calc(100vh-11.5rem)] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
              
              {/* Top Chat Subheader with Quick Back to Mentor Link */}
              <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={handleBackToMentor}
                  className="font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>AI Career Mentor Home</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'} in session
                </span>
              </div>

              {/* Error Banner */}
              {errorBanner && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errorBanner}
                  </span>
                  <button onClick={() => setErrorBanner(null)} className="text-xs font-bold hover:underline">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Empty State Guard if user cleared inside conversation view */}
                {messages.length === 0 && (
                  <div className="space-y-6 my-auto py-8 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Conversation cleared
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ask your AI Career Mentor anything below or return to the Mentor Home to browse strategic queries.
                      </p>
                    </div>
                    <button
                      onClick={handleBackToMentor}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors cursor-pointer group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span>Back to Mentor Home</span>
                    </button>
                  </div>
                )}

                {/* Render Message Feed */}
                {messages.map((message) => (
                  <MentorChatBubble
                    key={message.id}
                    message={message}
                    studentName={studentName}
                    avatarUrl={profile?.avatar_url}
                    onNavigate={onNavigate}
                    onSelectFollowUp={handleSelectFollowUp}
                  />
                ))}

                {/* Thinking / Generation Animation */}
                {isGenerating && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-sm shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs space-y-2 max-w-[80%] rounded-tl-sm">
                      <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span>{thinkingStep}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Sticky Bottom Input Bar */}
              <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-2">
                
                {/* Context Shortcut Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                  <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Quick Queries:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('What should I practice today?', 'today_practice')}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    What to Practice Today?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Identify my biggest weak areas and how to fix them.', 'weak_areas')}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Improve Weak Areas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('How can I improve my resume ATS score?', 'resume_advice')}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Review Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Am I ready for my target company?', 'company_readiness')}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Prepare for Target Company
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Generate a customized 7-day study plan for me.', 'study_plan_7d')}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Create Study Plan
                  </button>
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative flex items-end gap-2"
                >
                  <div className="relative flex-1">
                    <textarea
                      id="mentor-chat-input"
                      ref={textareaRef}
                      value={inputText}
                      onChange={handleTextareaChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isGenerating}
                      placeholder={`Ask AI Career Mentor about your placement readiness, coding gaps, resume, or interview prep...`}
                      rows={1}
                      className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none transition-all disabled:opacity-60 shadow-inner"
                    />
                  </div>

                  <button
                    id="mentor-send-button"
                    type="submit"
                    disabled={!inputText.trim() || isGenerating}
                    className="h-11 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Ask</span>
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
                  <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
                  <span>AI grounded in authenticated student performance</span>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Profile Context Sidebar (4 cols on lg) */}
        {showSidebar && (
          <aside className="lg:col-span-4 space-y-4">
            <MentorContextSidebar
              context={studentContext}
              isLoadingContext={isLoadingContext}
              onRefreshContext={loadContextAndHistory}
              onNavigate={onNavigate}
            />
          </aside>
        )}

      </main>

      {/* ========================================================================= */}
      {/* CLEAR CONVERSATION CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {showClearModal && (
        <div
          id="clear-conversation-modal-overlay"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowClearModal(false)}
        >
          <div
            id="clear-conversation-modal-card"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Icon + Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Clear conversation?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  This will remove the current AI Career Mentor conversation. Your saved CareerPilot data, progress, resume, roadmap, scores, and achievements will NOT be deleted.
                </p>
              </div>
            </div>

            {/* Note badge */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>All student records, mock interviews, tests & roadmap progress remain safe.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                id="btn-cancel-clear-conversation"
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear-conversation"
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Conversation</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
