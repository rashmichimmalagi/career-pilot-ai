import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenSetupGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-indigo-500/15 py-2.5 shadow-lg dark:shadow-2xl shadow-slate-200/50 dark:shadow-indigo-950/40'
          : 'bg-white/70 dark:bg-slate-950/60 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo & Wordmark */}
        <div
          onClick={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[11px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
              <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                CareerPilot
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm">
                AI
              </span>
            </div>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
              Placement Copilot
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-900 dark:text-slate-200 font-semibold cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>

        {/* Desktop Auth UI Navigation & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          <button
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('auth')}
            className="relative group overflow-hidden rounded-xl p-[1px] font-semibold text-xs sm:text-sm cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-xl group-hover:opacity-100 transition-opacity" />
            <div className="relative px-4 py-2 rounded-[11px] bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:animate-pulse" />
              <span>Get Started</span>
            </div>
          </button>
        </div>

        {/* Mobile Hamburger & Theme Toggle Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left py-2 hover:text-indigo-600 dark:hover:text-indigo-400 border-b border-slate-100 dark:border-slate-900"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-2 hover:text-indigo-600 dark:hover:text-indigo-400 border-b border-slate-100 dark:border-slate-900"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 hover:text-indigo-600 dark:hover:text-indigo-400 border-b border-slate-100 dark:border-slate-900"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 hover:text-indigo-600 dark:hover:text-indigo-400 border-b border-slate-100 dark:border-slate-900"
            >
              About
            </button>
          </div>

          {/* Theme Switcher in Mobile Menu */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Appearance Theme</span>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium text-sm text-center"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-semibold text-sm text-center shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
