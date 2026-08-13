import React, { useState } from 'react';
import { X, Copy, Check, Database, Globe, Key, ShieldCheck, ExternalLink, Terminal } from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../../lib/sqlScripts';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'oauth' | 'env'>('sql');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;
  const supabaseProjectUrl = 'https://liqaeoxwjhsalfdqdwcr.supabase.co';
  const supabaseCallbackUrl = `${supabaseProjectUrl}/auth/v1/callback`;
  const appAuthCallbackUrl = `${currentAppUrl}/auth`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">CareerPilot AI - Setup & Integration Guide</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Step-by-step instructions for Supabase & Google OAuth setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Supabase SQL Schema</span>
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'oauth'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>2. Google OAuth Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'env'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>3. Environment Variables</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs sm:text-sm text-indigo-200 leading-relaxed">
                <p className="font-semibold text-indigo-300 mb-1">Database Table Setup (`profiles` table)</p>
                <p>
                  Copy the SQL script below and execute it inside your Supabase project's SQL Editor to create the <code className="font-mono bg-indigo-950/80 px-1 py-0.5 rounded text-indigo-200">profiles</code> table, set up strict Row Level Security (RLS), and configure auto-updated timestamp triggers.
                </p>
                <a
                  href={`${supabaseProjectUrl}/sql/new`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs overflow-x-auto">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 text-slate-400">
                  <span className="flex items-center gap-1.5 text-xs font-sans">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    schema.sql
                  </span>
                  <button
                    onClick={() => copyToClipboard(SUPABASE_SETUP_SQL, 'sql')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-sans font-medium transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-slate-300 whitespace-pre leading-relaxed">{SUPABASE_SETUP_SQL}</pre>
              </div>
            </div>
          )}

          {activeTab === 'oauth' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Step 1: Configure Google Cloud OAuth Client
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Go to Google Cloud Console Credentials page: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Google Console</a></li>
                  <li>Create or select an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                  <li>
                    In <strong>Authorized redirect URIs</strong>, add this exact Supabase callback URL:
                    <div className="flex items-center gap-2 mt-1.5 font-mono bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-indigo-300">
                      <span className="truncate flex-1">{supabaseCallbackUrl}</span>
                      <button
                        onClick={() => copyToClipboard(supabaseCallbackUrl, 'supabase_cb')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                      >
                        {copiedUrl === 'supabase_cb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Step 2: Enable Google Provider in Supabase Auth
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Open Supabase Auth Providers setting: <a href={`${supabaseProjectUrl}/settings/auth/providers`} target="_blank" rel="noreferrer" className="text-indigo-400 underline">Supabase Auth Providers</a></li>
                  <li>Enable <strong>Google</strong> provider.</li>
                  <li>Paste your Google Client ID & Client Secret from Google Cloud Console.</li>
                  <li>
                    In <strong>URL Configuration & Redirect URLs</strong>, ensure this Application URL is whitelisted:
                    <div className="flex items-center gap-2 mt-1.5 font-mono bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-emerald-300">
                      <span className="truncate flex-1">{appAuthCallbackUrl}</span>
                      <button
                        onClick={() => copyToClipboard(appAuthCallbackUrl, 'app_cb')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                      >
                        {copiedUrl === 'app_cb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <p className="text-slate-300 leading-relaxed">
                Add these environment variables in your local <code className="font-mono text-indigo-300">.env</code> or AI Studio Secrets panel:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                <div>
                  <span className="text-slate-500"># Supabase Project Base URL</span>
                  <p className="text-emerald-400">VITE_SUPABASE_URL="{supabaseProjectUrl}"</p>
                </div>
                <div>
                  <span className="text-slate-500"># Supabase Project Anon Key (from Project Settings -&gt; API)</span>
                  <p className="text-emerald-400">VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-indigo-200">
                <p className="font-medium text-indigo-300 mb-1">Where to get your Anon Key?</p>
                <p className="text-xs text-indigo-300/80">
                  Go to <a href={`${supabaseProjectUrl}/settings/api`} target="_blank" rel="noreferrer" className="underline text-indigo-300 font-semibold">Supabase Settings -&gt; API</a>, and copy the <strong>`anon` `public`</strong> key value under Project API Keys.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
