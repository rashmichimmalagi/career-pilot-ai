import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Sparkles } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  isCustom?: boolean;
}

interface FloatingDropdownProps {
  id: string;
  label: string;
  value: string;
  options: (DropdownOption | string)[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  searchable = false,
  icon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if dropdown should open upward when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 280px below and more space above, open upward
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Normalize options into DropdownOption format
  const normalizedOptions: DropdownOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return {
        value: opt,
        label: opt,
        isCustom: opt === 'Custom Topic' || opt.startsWith('+ Custom'),
      };
    }
    return opt;
  });

  const selectedOption: DropdownOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value,
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={dropdownRef}>
      {/* Label */}
      <label
        htmlFor={id}
        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </span>
      </label>

      {/* Trigger Button - Fixed 40px height to guarantee zero layout shift */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer select-none text-left shadow-2xs ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100'
            : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption.icon}
          <span className="truncate">{selectedOption.label}</span>
        </span>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedOption.badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Overlay Menu - Strictly absolute positioned with high z-index */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
            openUpward ? 'bottom-[calc(100%+4px)] origin-bottom' : 'top-[calc(100%+4px)] origin-top'
          }`}
          style={{ minWidth: '100%' }}
        >
          {/* Optional Search Filter inside Dropdown */}
          {searchable && normalizedOptions.length > 6 && (
            <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-slate-800 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options Scrollable Container */}
          <div className="max-h-[240px] overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    } ${option.isCustom ? 'border-t border-slate-100 dark:border-slate-800 mt-1 pt-2 font-bold text-indigo-600 dark:text-indigo-400' : ''}`}
                  >
                    <span className="truncate flex items-center gap-2">
                      {option.isCustom && <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
