import React from 'react';
import { Compass, Github, Linkedin, ExternalLink, Heart, Sparkles, ArrowRight } from 'lucide-react';
import {
  DEVELOPER_CONFIG,
  DEVELOPER_GITHUB_URL,
  PROJECT_GITHUB_URL,
  LINKEDIN_URL,
} from '../../config/links';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

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
          <div className="md:col-span-5 space-y-3">
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
            
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              AI-powered career preparation for students.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Personalized diagnostics, multi-language coding arena, AI mock interviews, ATS resume analysis, and daily study planning designed for college placements.
            </p>

            {/* Quick Repository Link */}
            <div className="pt-1">
              <a
                href={PROJECT_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View CareerPilot AI repository on GitHub"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>View on GitHub →</span>
              </a>
            </div>
          </div>

          {/* Product & Exploration Navigation Links */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 tracking-wider uppercase">
              Platform & Resources
            </h4>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium">
              <li>
                <button
                  onClick={() => {
                    handleNavigate('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    handleNavigate('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer font-semibold"
                >
                  About CareerPilot AI
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
                  onClick={() => scrollToSection('features')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                {user ? (
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigate('auth?mode=signin')}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </li>
              <li>
                <button
                  onClick={() => handleNavigate(user ? 'dashboard' : 'home')}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  {user ? 'Study Planner' : 'Get Started'}
                </button>
              </li>
            </ul>
          </div>

          {/* Developer & Community Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 tracking-wider uppercase">
              Developer & Social
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <a
                  href={DEVELOPER_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={PROJECT_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="CareerPilot AI Repository"
                  className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>CareerPilot AI Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect on LinkedIn"
                  className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>About CareerPilot AI</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright & Developer Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© {DEVELOPER_CONFIG.projectYear} {DEVELOPER_CONFIG.projectName}</span>
            <span>•</span>
            <span>Built by {DEVELOPER_CONFIG.name}</span>
            <span>•</span>
            <button
              onClick={() => {
                handleNavigate('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              About CareerPilot AI
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Status: {DEVELOPER_CONFIG.status}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
