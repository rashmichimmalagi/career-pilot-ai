import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  Pencil,
} from 'lucide-react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { useAuth } from '../../context/AuthContext';
import {
  MentorStudentContext,
  MentorMessage,
} from '../../types/mentor';
import {
  getAggregatedStudentContext,
  fetchAssistantMessages,
  saveAssistantMessage,
  editAssistantUserMessage,
} from '../../services/mentorService';
import { sendAssistantMessage } from '../../services/assistantService';

interface FloatingAskAIProps {
  onNavigate: (route: string) => void;
  currentPage: string;
}

export const FloatingAskAI: React.FC<FloatingAskAIProps> = ({
  onNavigate,
  currentPage,
}) => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentContext, setStudentContext] = useState<MentorStudentContext | null>(null);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If user is on full career mentor page or resume print, hide floating button to prevent redundancy
  const shouldHide =
    !user ||
    user.id === 'guest' ||
    currentPage === 'career-mentor' ||
    currentPage === 'mentor' ||
    currentPage === 'resume-print';

  // Format timestamp safely
  const formatTime = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  // Load assistant conversation from Supabase & live student context when user changes
  useEffect(() => {
    if (!user?.id || user.id === 'guest') {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      try {
        const [ctx, savedMsgs] = await Promise.all([
          getAggregatedStudentContext(user.id, profile),
          fetchAssistantMessages(user.id),
        ]);

        if (!isMounted) return;
        setStudentContext(ctx);

        if (savedMsgs && savedMsgs.length > 0) {
          setMessages(savedMsgs);
        } else {
          // Construct initial contextual greeting
          const role = ctx.targetRole || 'Software Engineering';
          const company = ctx.targetCompany || 'Top Tech';
          const readiness =
            ctx.placementReadiness?.overallScore !== null &&
            ctx.placementReadiness?.overallScore !== undefined
              ? `${ctx.placementReadiness.overallScore}%`
              : 'in progress';

          const welcomeMsg: MentorMessage = {
            id: `welcome-${Date.now()}`,
            conversationId: `assistant_${user.id}`,
            sender: 'assistant',
            text: `Hello ${ctx.studentName || 'there'}! 👋 I'm your CareerPilot AI Assistant.\n\nI can answer any technical concepts, explain algorithms, provide project ideas, or assist with your placement preparation. How can I help you today?`,
            timestamp: new Date().toISOString(),
            suggestedFollowUps: [
              'Give me Full Stack Development project ideas',
              'What is a process in Linux?',
              'Analyze my preparation',
              'What are my weak areas?',
            ],
            syncStatus: 'synced',
          };
          setMessages([welcomeMsg]);
          saveAssistantMessage(user.id, welcomeMsg).catch((err) =>
            console.warn('[FloatingAskAI] Notice saving initial greeting:', err)
          );
        }
      } catch (err) {
        console.error('[FloatingAskAI] Error loading assistant data:', err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, profile]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close drawer or collapse view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExpanded]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: MentorMessage = {
      id: `user-${Date.now()}`,
      conversationId: `assistant_${user?.id || 'guest'}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      syncStatus: 'pending',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // 1. SAVE USER MESSAGE TO SUPABASE (Persist immediately and await)
    if (user?.id && user.id !== 'guest') {
      try {
        await saveAssistantMessage(user.id, userMsg);
        userMsg.syncStatus = 'synced';
      } catch (err) {
        console.warn('[FloatingAskAI] Notice saving user message to Supabase:', err);
      }
    }

    try {
      // Ensure context is available
      const ctx =
        studentContext ||
        (await getAggregatedStudentContext(user?.id || 'guest', profile));

      // Build history for API
      const historyPayload = messages.concat(userMsg).map((m) => ({
        sender: m.sender === 'user' ? ('user' as const) : ('mentor' as const),
        text: m.text,
      }));

      // 2. CALL INTENT-AWARE CAREERPILOT AI ASSISTANT ENDPOINT
      const res = await sendAssistantMessage(text, historyPayload, ctx);

      // 3. RECEIVE ASSISTANT RESPONSE
      const aiMsg: MentorMessage = {
        id: `ai-${Date.now()}`,
        conversationId: `assistant_${user?.id || 'guest'}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toISOString(),
        actionLinks: res.actionLinks,
        suggestedFollowUps: res.suggestedFollowUps,
        syncStatus: 'pending',
      };

      // 4. SAVE ASSISTANT RESPONSE TO SUPABASE (Persist and await)
      if (user?.id && user.id !== 'guest') {
        try {
          await saveAssistantMessage(user.id, aiMsg);
          aiMsg.syncStatus = 'synced';
        } catch (err) {
          console.warn('[FloatingAskAI] Notice saving AI message to Supabase:', err);
        }
      }

      // 5. RENDER SAVED RESPONSE WITH MARKDOWN
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('[FloatingAskAI] Send error:', err);
      const errMsg: MentorMessage = {
        id: `ai-err-${Date.now()}`,
        conversationId: `assistant_${user?.id || 'guest'}`,
        sender: 'assistant',
        text: 'I encountered an issue connecting to the AI service. Please try asking again or check your target role in your profile.',
        timestamp: new Date().toISOString(),
        syncStatus: 'synced',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (msg: MentorMessage) => {
    // Only allow editing own user messages when not currently loading
    if (msg.sender !== 'user' || loading || savingEdit) return;
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed || savingEdit) return;

    const targetIndex = messages.findIndex((m) => m.id === messageId);
    if (targetIndex === -1) {
      handleCancelEdit();
      return;
    }

    const targetMsg = messages[targetIndex];
    if (targetMsg.sender !== 'user') {
      handleCancelEdit();
      return;
    }

    // If text unchanged, exit edit mode without triggering unnecessary re-queries
    if (trimmed === targetMsg.text) {
      handleCancelEdit();
      return;
    }

    setSavingEdit(true);

    // Collect all downstream messages that came AFTER the edited user message
    // To maintain strict chronological conversation consistency, downstream responses are invalidated
    const downstreamMessages = messages.slice(targetIndex + 1);
    const downstreamIds = downstreamMessages.map((m) => m.id);
    const precedingMessages = messages.slice(0, targetIndex);

    const updatedUserMsg: MentorMessage = {
      ...targetMsg,
      text: trimmed,
      syncStatus: 'synced',
    };

    // 1. Update UI immediately to reflect edited message and drop stale downstream
    setMessages([...precedingMessages, updatedUserMsg]);
    setEditingMessageId(null);
    setEditingText('');
    setLoading(true);

    // 2. Persist edited message in Supabase and purge downstream messages
    if (user?.id && user.id !== 'guest') {
      try {
        await editAssistantUserMessage(user.id, messageId, trimmed, downstreamIds);
      } catch (err) {
        console.warn('[FloatingAskAI] Notice updating edited message in Supabase:', err);
      }
    }

    // 3. Generate NEW AI response based on the edited message and valid preceding history
    try {
      const ctx =
        studentContext ||
        (await getAggregatedStudentContext(user?.id || 'guest', profile));

      const historyPayload = [...precedingMessages, updatedUserMsg].map((m) => ({
        sender: m.sender === 'user' ? ('user' as const) : ('mentor' as const),
        text: m.text,
      }));

      const res = await sendAssistantMessage(trimmed, historyPayload, ctx);

      const aiMsg: MentorMessage = {
        id: `ai-${Date.now()}`,
        conversationId: `assistant_${user?.id || 'guest'}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toISOString(),
        actionLinks: res.actionLinks,
        suggestedFollowUps: res.suggestedFollowUps,
        syncStatus: 'pending',
      };

      // 4. Save new AI response in Supabase
      if (user?.id && user.id !== 'guest') {
        try {
          await saveAssistantMessage(user.id, aiMsg);
          aiMsg.syncStatus = 'synced';
        } catch (err) {
          console.warn('[FloatingAskAI] Notice saving AI message to Supabase:', err);
        }
      }

      setMessages([...precedingMessages, updatedUserMsg, aiMsg]);
    } catch (err) {
      console.error('[FloatingAskAI] Error generating AI response for edited message:', err);
      const errMsg: MentorMessage = {
        id: `ai-err-${Date.now()}`,
        conversationId: `assistant_${user?.id || 'guest'}`,
        sender: 'assistant',
        text: 'I encountered an issue generating a response for your edited message. Please try asking again or refresh.',
        timestamp: new Date().toISOString(),
        syncStatus: 'synced',
      };
      setMessages([...precedingMessages, updatedUserMsg, errMsg]);
    } finally {
      setSavingEdit(false);
      setLoading(false);
    }
  };

  if (shouldHide) return null;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            id="floating-ask-ai-btn"
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ask CareerPilot AI"
            className="group flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-200" />
            </span>
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
            <span className="tracking-tight">Ask CareerPilot AI</span>
          </button>
        </div>
      )}

      {/* Slide-Over Drawer / Expanded Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200 flex items-center justify-center p-0 sm:p-4"
          onClick={() => {
            setIsOpen(false);
            setIsExpanded(false);
          }}
        >
          {/* Assistant Container (Switches between sidebar drawer and expanded modal) */}
          <div
            id="floating-ai-drawer"
            className={
              isExpanded
                ? 'fixed inset-2 sm:inset-4 md:inset-6 lg:inset-8 max-w-5xl mx-auto my-auto h-[92vh] max-h-[920px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col z-50 animate-in zoom-in-95 duration-200 overflow-hidden'
                : 'fixed inset-y-0 right-0 w-full sm:w-[440px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300'
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="truncate">CareerPilot AI</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                      Live Grounded
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {studentContext?.targetRole
                      ? `Target: ${studentContext.targetRole}`
                      : 'Personalized Placement Assistant'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Expand / Minimize Toggle - Stays strictly inside the same CareerPilot AI Assistant */}
                <button
                  id="assistant-expand-toggle-btn"
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? 'Collapse to sidebar' : 'Expand Assistant'}
                  aria-label={isExpanded ? 'Collapse to sidebar' : 'Expand Assistant'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                {/* Close Button */}
                <button
                  id="assistant-close-btn"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsExpanded(false);
                  }}
                  aria-label="Close Assistant"
                  title="Close Assistant"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans text-xs sm:text-sm">
              <div className={isExpanded ? 'max-w-3xl mx-auto w-full space-y-4' : 'space-y-4'}>
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isEditing = editingMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      id={`assistant-msg-${msg.id}`}
                      className={`group/msg flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`rounded-2xl p-3.5 sm:p-4 leading-relaxed shadow-2xs transition-all ${
                          isExpanded ? 'max-w-[80%]' : 'max-w-[88%]'
                        } ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/60 rounded-bl-xs'
                        }`}
                      >
                        {isUser && isEditing ? (
                          <div className="space-y-2.5 min-w-[220px] sm:min-w-[280px]">
                            <textarea
                              id={`assistant-edit-textarea-${msg.id}`}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              disabled={savingEdit}
                              rows={Math.min(6, Math.max(2, editingText.split('\n').length))}
                              aria-label="Edit message"
                              className="w-full px-3 py-2 text-xs sm:text-sm bg-indigo-700/90 text-white placeholder-indigo-200 border border-indigo-400/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 resize-none font-medium"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(msg.id);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                id={`assistant-cancel-edit-btn-${msg.id}`}
                                onClick={handleCancelEdit}
                                disabled={savingEdit}
                                aria-label="Cancel editing"
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                id={`assistant-save-edit-btn-${msg.id}`}
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={!editingText.trim() || savingEdit}
                                aria-label="Save edited message"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xs transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                              >
                                {savingEdit ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-indigo-700" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <span>Save</span>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.sender === 'assistant' ? (
                              <MarkdownRenderer content={msg.text} />
                            ) : (
                              <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                            )}

                            {/* Action Links */}
                            {msg.actionLinks && msg.actionLinks.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  Recommended Action:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.actionLinks.map((link, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setIsOpen(false);
                                        setIsExpanded(false);
                                        onNavigate(link.route);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                                    >
                                      <span>{link.label}</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Suggested Followups */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                          {msg.suggestedFollowUps.slice(0, 4).map((fu, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(fu)}
                              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-left"
                            >
                              💬 {fu}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message Footer: Timestamp and User Edit Icon */}
                      <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-slate-400">
                          {formatTime(msg.timestamp)}
                        </span>

                        {/* Edit Icon: ONLY for current authenticated user's messages */}
                        {isUser && !isEditing && (
                          <button
                            type="button"
                            id={`assistant-edit-btn-${msg.id}`}
                            onClick={() => handleStartEdit(msg)}
                            disabled={loading || savingEdit}
                            title="Edit message"
                            aria-label="Edit message"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                          >
                            <Pencil className="w-3 h-3" />
                            <span className="text-[10px] font-medium hidden sm:inline">Edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>CareerPilot AI is analyzing your metrics...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
              <div className={isExpanded ? 'max-w-3xl mx-auto w-full' : ''}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything about your placement prep..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    aria-label="Send message"
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
