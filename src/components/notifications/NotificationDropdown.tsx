import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  X,
  Trash2,
  Check,
  Settings,
  ArrowRight,
  Code2,
  FileText,
  Briefcase,
  BookOpen,
  TrendingUp,
  Target,
  RotateCw,
  SlidersHorizontal,
} from 'lucide-react';
import { AppNotification, NotificationCategory, NotificationPreferences } from '../../types/notification';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';

interface NotificationDropdownProps {
  onNavigate: (route: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    refreshNotifications,
  } = useNotifications();

  // Reset dropdown open state on auth user change or logout
  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      setShowSettings(false);
      setShowClearConfirm(false);
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
        setShowClearConfirm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Strict conditional rendering: Never render notification bell for anonymous/unauthenticated visitors
  if (authLoading || !user) {
    return null;
  }

  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      setIsOpen(false);
      const cleanRoute = notification.action_url.replace(/^\//, '');
      onNavigate(cleanRoute);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'CAREER':
        return <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
      case 'CODING':
        return <Code2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
      case 'PLACEMENT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'INTERVIEW':
        return <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case 'RESUME':
        return <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'STUDY':
        return <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case 'COMPANY':
        return <Briefcase className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      case 'ACHIEVEMENT':
        return <Award className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
      case 'PROGRESS':
        return <TrendingUp className="w-4 h-4 text-teal-500 dark:text-teal-400" />;
      case 'SYSTEM':
      default:
        return <Sparkles className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case 'CAREER':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'CODING':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'PLACEMENT':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'INTERVIEW':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'RESUME':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'STUDY':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'COMPANY':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'ACHIEVEMENT':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'PROGRESS':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="notification-badge-count"
            className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-500" />
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                  className="p-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Mark all read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                title="Notification Settings"
                aria-label="Notification Settings"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showSettings
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Drawer / Preferences View */}
          {showSettings ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 space-y-3 overflow-y-auto max-h-72">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Notification Preferences
                </span>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Enable Notifications
                </span>
                <input
                  type="checkbox"
                  checked={preferences?.enabled ?? true}
                  onChange={(e) => updatePreferences({ enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* Category Toggles */}
              <div className="space-y-1.5 pt-1 text-xs">
                {[
                  { key: 'career_updates', label: '🎯 Career Updates & Benchmarks' },
                  { key: 'coding_reminders', label: '💻 Coding Practice & Streaks' },
                  { key: 'study_reminders', label: '📚 Study Planner Tasks' },
                  { key: 'interview_feedback', label: '🎤 Interview Feedback' },
                  { key: 'resume_updates', label: '📄 Resume Analysis Insights' },
                  { key: 'company_prep', label: '🏢 Target Company Preparation' },
                  { key: 'achievement_notifications', label: '🏆 Achievements & Badges' },
                  { key: 'progress_updates', label: '📈 Progress & Accuracy' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      disabled={!(preferences?.enabled ?? true)}
                      checked={(preferences as any)?.[key] ?? true}
                      onChange={(e) => updatePreferences({ [key]: e.target.checked })}
                      className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            /* Tabs: All / Unread */
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold px-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'unread'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Unread ({unreadCount})
              </button>

              {notifications.length > 0 && (
                <div className="ml-auto flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[11px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
                    title="Clear all notifications"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clear All Confirmation Modal */}
          {showClearConfirm && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs">
              <span className="text-rose-800 dark:text-rose-300 font-medium">
                Clear all notifications?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                    setShowClearConfirm(false);
                  }}
                  className="px-2 py-1 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700 cursor-pointer text-[11px]"
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-medium cursor-pointer text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notification List Body */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 min-h-[140px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <RotateCw className="w-5 h-5 mx-auto animate-spin text-indigo-500" />
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-amber-500" />
                <p className="text-slate-600 dark:text-slate-300">{error}</p>
                <button
                  type="button"
                  onClick={refreshNotifications}
                  className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold hover:bg-indigo-100 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-1" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px]">
                  {activeTab === 'unread'
                    ? 'You are all caught up with your latest updates!'
                    : 'Personalized practice milestones and updates will appear here.'}
                </p>
              </div>
            ) : (
            filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  id={`notification-item-${notif.id}`}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer relative group ${
                    !notif.is_read
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-l-3 border-indigo-500'
                      : 'opacity-85 border-l-3 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Category Icon */}
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0 shadow-2xs">
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-xs truncate ${
                              !notif.is_read
                                ? 'font-bold text-slate-900 dark:text-slate-100'
                                : 'font-medium text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {notif.title}
                          </span>
                          {!notif.is_read && (
                            <span
                              className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"
                              title="Unread"
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getCategoryBadgeClass(
                              notif.category
                            )}`}
                          >
                            {notif.category}
                          </span>

                          {notif.action_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 hover:underline cursor-pointer"
                            >
                              <span>{notif.action_label || 'View'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Individual Item Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {!notif.is_read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              title="Mark as read"
                              aria-label="Mark notification as read"
                            >
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">Mark read</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete notification"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              Personalized Placement & Career Intelligence
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
