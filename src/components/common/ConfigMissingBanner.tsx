import React from 'react';
import { AlertTriangle, Key, Terminal, ExternalLink } from 'lucide-react';

interface ConfigMissingBannerProps {
  onOpenSetupGuide: () => void;
}

export const ConfigMissingBanner: React.FC<ConfigMissingBannerProps> = ({ onOpenSetupGuide }) => {
  return (
    <div role="region" aria-label="Configuration setup alert" className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Supabase Auth Setup Required:</strong> To enable GitHub OAuth and Database operations, configure <code className="bg-amber-950/60 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium border border-amber-500/30 transition-all text-xs"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Setup & SQL Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
