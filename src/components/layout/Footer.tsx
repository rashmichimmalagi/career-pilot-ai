import React from 'react';
import { Compass } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToSection = (id: string) => {
    if (onNavigate) onNavigate('home');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <footer className="relative z-10 bg-slate-100/90 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 py-12 text-sm backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
          
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px]">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  CareerPilot
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
                  AI
                </span>
              </div>
            </div>
            
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
              Your AI-Powered Placement Copilot
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Prepare smarter. Practice better. Get placement-ready with personalized AI guidance, coding environments, mock interview simulations, and analytics.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollToSection('home')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 tracking-wider uppercase">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400">
                  Terms
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} CareerPilot AI</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-600">AI-Powered Placement Preparation for Engineering Students</p>
        </div>

      </div>
    </footer>
  );
};

