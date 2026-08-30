import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SmartAlertItem } from '../../types/intelligence';
import { markAlertAsRead, dismissAlert } from '../../services/smartAlertService';
import { fetchCareerIntelligence } from '../../services/careerIntelligenceService';

interface SmartAlertsDropdownProps {
  alerts?: SmartAlertItem[];
  studentId?: string;
  onNavigate: (route: string) => void;
  onAlertsChange?: () => void;
}

export const SmartAlertsDropdown: React.FC<SmartAlertsDropdownProps> = ({
  alerts,
  studentId = 'guest',
  onNavigate,
  onAlertsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertList, setAlertList] = useState<SmartAlertItem[]>(alerts || []);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alerts !== undefined) {
      setAlertList(alerts);
    } else {
      fetchCareerIntelligence(studentId).then((data) => {
        if (data && Array.isArray(data.smartAlerts)) {
          setAlertList(data.smartAlerts);
        }
      });
    }
  }, [alerts, studentId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alertList.filter((a) => !a.isRead && !a.isDismissed).length;

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissAlert(studentId, alertId);
    setAlertList((prev) => prev.filter((a) => a.id !== alertId));
    if (onAlertsChange) onAlertsChange();
  };

  const handleAction = (alert: SmartAlertItem) => {
    markAlertAsRead(studentId, alert.id);
    setAlertList((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a))
    );
    setIsOpen(false);
    onNavigate(alert.actionRoute);
    if (onAlertsChange) onAlertsChange();
  };

  const getAlertIcon = (type: SmartAlertItem['type']) => {
    switch (type) {
      case 'action_needed':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'improvement_opportunity':
        return <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'milestone':
        return <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'recommendation':
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getAlertBadge = (type: SmartAlertItem['type']) => {
    switch (type) {
      case 'action_needed':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'improvement_opportunity':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'milestone':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'recommendation':
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="smart-alerts-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Smart Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Smart Career Alerts
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {unreadCount} New
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Data Grounded</span>
          </div>

          {/* Alert List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {alertList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p>No active placement alerts at this time.</p>
              </div>
            ) : (
              alertList.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAction(alert)}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer space-y-1.5 ${
                    !alert.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getAlertIcon(alert.type)}
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {alert.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDismiss(alert.id, e)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                      title="Dismiss Alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getAlertBadge(alert.type)}`}>
                      {alert.type.replace('_', ' ')}
                    </span>

                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <span>{alert.actionText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
