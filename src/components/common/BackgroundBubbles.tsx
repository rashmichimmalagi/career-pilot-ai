import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const BackgroundBubbles: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none transition-colors duration-500">
      {/* Background base */}
      <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-[#030712]' : 'bg-slate-50'}`} />

      {/* Grid texture overlay */}
      <div className={`absolute inset-0 bg-grid-pattern transition-opacity duration-500 ${isDark ? 'opacity-40' : 'opacity-60'}`} />

      {/* Top Left Indigo Orb */}
      <div className={`absolute -top-20 -left-20 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] rounded-full blur-[120px] animate-float-slow transition-all duration-500 ${
        isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/35'
      }`} />

      {/* Top Right Cyan/Teal Orb */}
      <div className={`absolute top-1/4 -right-20 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[110px] animate-float-reverse transition-all duration-500 ${
        isDark ? 'bg-cyan-500/10' : 'bg-cyan-300/30'
      }`} />

      {/* Middle Left Purple Orb */}
      <div className={`absolute top-1/2 -left-32 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] rounded-full blur-[130px] animate-float-slow transition-all duration-500 ${
        isDark ? 'bg-purple-600/10' : 'bg-purple-300/30'
      }`} />

      {/* Lower Right Emerald Orb */}
      <div className={`absolute top-[75%] -right-24 w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] rounded-full blur-[120px] animate-float-reverse transition-all duration-500 ${
        isDark ? 'bg-emerald-500/10' : 'bg-emerald-300/30'
      }`} />

      {/* Bottom Center Violet Glow */}
      <div className={`absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[350px] rounded-full blur-[140px] animate-pulse-glow transition-all duration-500 ${
        isDark ? 'bg-indigo-500/10' : 'bg-indigo-300/25'
      }`} />
    </div>
  );
};
