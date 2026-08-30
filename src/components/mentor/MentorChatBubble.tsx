import React, { useState } from 'react';
import {
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  Cpu,
  Brain,
  Building2,
  Map,
  Compass,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { MentorMessage, MentorActionLink } from '../../types/mentor';

interface MentorChatBubbleProps {
  message: MentorMessage;
  studentName?: string;
  avatarUrl?: string;
  onNavigate: (route: string) => void;
  onSelectFollowUp: (prompt: string) => void;
}

export const MentorChatBubble: React.FC<MentorChatBubbleProps> = ({
  message,
  studentName = 'You',
  avatarUrl,
  onNavigate,
  onSelectFollowUp,
}) => {
  const [copied, setCopied] = useState(false);
  const isMentor = message.sender === 'mentor';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'FileText':
        return <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case 'Cpu':
        return <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      case 'Brain':
        return <Brain className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'Building2':
        return <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'Map':
        return <Map className="w-3.5 h-3.5 text-pink-500 shrink-0" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      id={`mentor-msg-${message.id}`}
      className={`flex gap-3 sm:gap-4 group ${
        isMentor ? 'items-start' : 'items-start flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isMentor ? (
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center relative overflow-hidden">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
          </div>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={studentName}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold text-xs">
            {studentName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className={`space-y-2 max-w-[85%] sm:max-w-[78%] ${!isMentor ? 'text-right' : ''}`}>
        
        {/* Author Label & Time & Sync Status */}
        <div
          className={`flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium ${
            !isMentor ? 'justify-end' : ''
          }`}
        >
          <span>{isMentor ? 'AI Career Mentor' : studentName}</span>
          <span>•</span>
          <span>{formatTimestamp(message.timestamp)}</span>
          
          {/* Sync Status Badge */}
          {message.syncStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold" title="Message stored locally until reconnection">
              <Clock className="w-2.5 h-2.5 animate-pulse" />
              Offline — Sync Pending
            </span>
          )}
          {message.syncStatus === 'synced' && !isMentor && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 opacity-80" title="Saved & Synced to Supabase">
              <Check className="w-2.5 h-2.5" />
              Synced
            </span>
          )}

          {isMentor && (
            <button
              onClick={handleCopy}
              title="Copy message"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed transition-all shadow-xs ${
            isMentor
              ? 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-indigo-500/15 text-slate-800 dark:text-slate-100 rounded-tl-sm'
              : 'bg-indigo-600 dark:bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
          }`}
        >
          {isMentor ? (
            <div className="markdown-body space-y-3 prose dark:prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:leading-relaxed prose-li:my-0.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400">
              <Markdown>{message.text}</Markdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap font-medium">{message.text}</p>
          )}

          {/* Action Links rendered inside or below mentor reply */}
          {isMentor && message.actionLinks && message.actionLinks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                Recommended Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {message.actionLinks.map((link, idx) => (
                  <button
                    key={`action-link-${idx}`}
                    onClick={() => onNavigate(link.route)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 transition-all hover:scale-[1.02] cursor-pointer shadow-xs"
                  >
                    {getActionIcon(link.icon)}
                    <span>{link.label}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Follow-Ups Pills */}
        {isMentor && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
          <div className="pt-1 flex flex-wrap gap-1.5">
            {message.suggestedFollowUps.map((followUp, idx) => (
              <button
                key={`follow-up-${idx}`}
                onClick={() => onSelectFollowUp(followUp)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                <span>{followUp}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
