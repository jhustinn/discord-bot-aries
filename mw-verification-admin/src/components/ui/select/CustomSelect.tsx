import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export interface CustomSelectOption<T = string> {
  value: T;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode | string;
  color?: string;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  disabledReason?: string;
  tags?: string[];
  [key: string]: any;
}

export interface CustomSelectProps<T = string> {
  options: CustomSelectOption<T>[];
  value?: T | T[] | null;
  onChange: (value: any, option: any) => void;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  placement?: 'auto' | 'top' | 'bottom';
  maxTagsShown?: number;
  renderOption?: (option: CustomSelectOption<T>, isSelected: boolean) => React.ReactNode;
  renderValue?: (option: any) => React.ReactNode;
}

export function CustomSelect<T = string>({
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Select option...',
  label,
  helperText,
  error,
  disabled = false,
  searchable,
  searchPlaceholder = 'Search...',
  clearable = false,
  className = '',
  dropdownClassName = '',
  size = 'md',
  placement = 'auto',
  maxTagsShown = 4,
  renderOption,
  renderValue,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize selected values into array
  const selectedValues = useMemo<T[]>(() => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value === '') return [];
    return [value as T];
  }, [value]);

  // Selected option objects
  const selectedOptions = useMemo<CustomSelectOption<T>[]>(() => {
    return options.filter(opt => selectedValues.includes(opt.value));
  }, [options, selectedValues]);

  // Single mode selected option
  const singleSelectedOption = useMemo<CustomSelectOption<T> | null>(() => {
    if (multiple) return null;
    return options.find(opt => opt.value === value) || null;
  }, [options, value, multiple]);

  // Determine if search should be enabled (auto-enable if options > 6 and not explicitly false)
  const isSearchable = searchable !== undefined ? searchable : options.length > 6;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(opt => {
      const matchLabel = opt.label?.toLowerCase().includes(query);
      const matchSub = opt.subtitle ? opt.subtitle.toLowerCase().includes(query) : false;
      const matchBadge = opt.badge ? String(opt.badge).toLowerCase().includes(query) : false;
      const matchTags = opt.tags ? opt.tags.some(t => t.toLowerCase().includes(query)) : false;
      const matchValue = typeof opt.value === 'string' ? opt.value.toLowerCase().includes(query) : false;
      return matchLabel || matchSub || matchBadge || matchTags || matchValue;
    });
  }, [options, search]);

  // Calculate auto-placement (top vs bottom)
  const calculatePlacement = useCallback(() => {
    if (placement === 'top') {
      setOpenUpward(true);
      return;
    }
    if (placement === 'bottom') {
      setOpenUpward(false);
      return;
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 280px below and more room above, flip upward
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [placement]);

  // Handle open/close
  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        calculatePlacement();
        setSearch('');
        // Set highlighted to first selected or first item
        const idx = filteredOptions.findIndex(o => selectedValues.includes(o.value));
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return next;
    });
  }, [disabled, filteredOptions, selectedValues, calculatePlacement]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', calculatePlacement);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', calculatePlacement);
    };
  }, [isOpen, closeDropdown, calculatePlacement]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isSearchable]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-select-item]');
      const activeEl = items[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        toggleDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex(prev => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next].disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex(prev => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            handleSelectOption(opt);
          }
        }
        break;
      }
      case 'Escape':
      case 'Tab': {
        closeDropdown();
        break;
      }
    }
  };

  const handleSelectOption = (opt: CustomSelectOption<T>, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (opt.disabled) return;

    if (multiple) {
      const isAlready = selectedValues.includes(opt.value);
      let nextValues: T[];
      let nextOptions: CustomSelectOption<T>[];
      if (isAlready) {
        nextValues = selectedValues.filter(v => v !== opt.value);
        nextOptions = selectedOptions.filter(o => o.value !== opt.value);
      } else {
        nextValues = [...selectedValues, opt.value];
        nextOptions = [...selectedOptions, opt];
      }
      onChange(nextValues, nextOptions);
    } else {
      onChange(opt.value, opt);
      closeDropdown();
    }
  };

  const handleRemoveTag = (val: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextValues = selectedValues.filter(v => v !== val);
    const nextOptions = selectedOptions.filter(o => o.value !== val);
    onChange(nextValues, nextOptions);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (multiple) {
      onChange([], []);
    } else {
      onChange('' as unknown as T, { value: '' as unknown as T, label: '' });
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const available = filteredOptions.filter(o => !o.disabled && o.value !== '');
    const nextValues = Array.from(new Set([...selectedValues, ...available.map(o => o.value)]));
    const nextOptions = options.filter(o => nextValues.includes(o.value));
    onChange(nextValues, nextOptions);
  };

  const handleDeselectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const disabledSelected = selectedOptions.filter(o => o.disabled).map(o => o.value);
    const nextValues = selectedValues.filter(v => disabledSelected.includes(v));
    const nextOptions = options.filter(o => nextValues.includes(o.value));
    onChange(nextValues, nextOptions);
  };

  // Size styling variants
  const sizeStyles = {
    sm: 'min-h-[36px] py-1 px-2.5 text-xs',
    md: 'min-h-[46px] py-2 px-3 text-sm',
    lg: 'min-h-[52px] py-2.5 px-4 text-base',
  };

  const hasSelections = multiple ? selectedValues.length > 0 : !!singleSelectedOption;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Optional Label */}
      {label && (
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Main Trigger Field */}
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={toggleDropdown}
        className={`w-full ${sizeStyles[size]} rounded-xl border flex items-center justify-between gap-2.5 transition-all select-none cursor-pointer outline-none shadow-xs ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-gray-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md text-gray-900 dark:text-white'
            : error
            ? 'bg-white dark:bg-gray-900 border-red-500 ring-1 ring-red-500/20 text-gray-900 dark:text-white'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
        }`}
      >
        {/* Selected Value(s) or Custom Value Render */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          {renderValue ? (
            renderValue(multiple ? selectedOptions : singleSelectedOption)
          ) : multiple ? (
            selectedOptions.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 py-0.5">
                {selectedOptions.slice(0, maxTagsShown).map(opt => (
                  <span
                    key={String(opt.value)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-2xs transition-all animate-in fade-in"
                    style={{ backgroundColor: opt.color || '#3B82F6' }}
                  >
                    {opt.icon && <span className="text-xs leading-none">{opt.icon}</span>}
                    <span className="truncate max-w-[130px]">{opt.label}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={e => handleRemoveTag(opt.value, e)}
                        className="hover:bg-black/25 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none transition-colors cursor-pointer"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                {selectedOptions.length > maxTagsShown && (
                  <span className="px-2 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs">
                    +{selectedOptions.length - maxTagsShown} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 truncate font-normal">
                {placeholder}
              </span>
            )
          ) : singleSelectedOption ? (
            <div className="flex items-center gap-2.5 truncate">
              {/* Optional Color Indicator */}
              {singleSelectedOption.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs ring-1 ring-black/10 dark:ring-white/10"
                  style={{ backgroundColor: singleSelectedOption.color }}
                />
              )}

              {/* Optional Icon / Emoji */}
              {singleSelectedOption.icon && (
                <span className="shrink-0 text-base leading-none">
                  {singleSelectedOption.icon}
                </span>
              )}

              {/* Label */}
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {singleSelectedOption.label}
              </span>

              {/* Subtitle */}
              {singleSelectedOption.subtitle && (
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate hidden sm:inline">
                  {singleSelectedOption.subtitle}
                </span>
              )}

              {/* Badge */}
              {singleSelectedOption.badge !== undefined && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 ml-auto shadow-2xs"
                  style={{
                    backgroundColor: singleSelectedOption.badgeColor || singleSelectedOption.color || '#3B82F6'
                  }}
                >
                  {singleSelectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>

        {/* Action icons (Clear + Chevron) */}
        <div className="flex items-center gap-1.5 shrink-0 text-gray-400 dark:text-gray-400">
          {clearable && hasSelections && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-gray-700 dark:hover:text-white rounded-md transition-colors text-xs cursor-pointer"
              title="Clear all selections"
            >
              ✕
            </button>
          )}

          <span
            className={`transition-transform duration-200 text-xs text-gray-400 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-[999999] ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col ${dropdownClassName}`}
          style={{ minWidth: '100%' }}
        >
          {/* Optional Search Input */}
          {isSearchable && (
            <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-xs">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Multiple Selection Action Bar */}
          {multiple && (
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50/90 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span>
                {selectedValues.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto p-1.5 space-y-1 divide-y divide-gray-100/50 dark:divide-gray-800/50 custom-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-gray-400 dark:text-gray-500">
                <span className="text-xl block mb-1">🔍</span>
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = selectedValues.includes(opt.value);
                const isHighlighted = index === highlightedIndex;

                if (renderOption) {
                  return (
                    <div
                      key={String(opt.value)}
                      data-select-item
                      onClick={e => handleSelectOption(opt, e)}
                      onMouseEnter={() => !opt.disabled && setHighlightedIndex(index)}
                      className={`cursor-pointer transition-colors ${
                        opt.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                return (
                  <div
                    key={String(opt.value)}
                    data-select-item
                    onClick={e => handleSelectOption(opt, e)}
                    onMouseEnter={() => !opt.disabled && setHighlightedIndex(index)}
                    className={`p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                      opt.disabled
                        ? 'opacity-40 bg-gray-50/50 dark:bg-gray-800/20 cursor-not-allowed text-gray-400'
                        : isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold cursor-pointer'
                        : isHighlighted
                        ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white cursor-pointer'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                    }`}
                  >
                    {/* Left: Checkbox (if multi) + Color Dot + Icon + Label + Subtitle */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {multiple && (
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                          }`}
                        >
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                      )}

                      {opt.color && (
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/10 dark:ring-white/10"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}

                      {opt.icon && (
                        <span className="text-base shrink-0 leading-none">
                          {opt.icon}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">
                            {opt.label}
                          </p>
                          {opt.disabledReason && (
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 italic">
                              — {opt.disabledReason}
                            </span>
                          )}
                        </div>
                        {opt.subtitle && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">
                            {opt.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Badge, Perms Count, Checkmark (single mode) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge !== undefined && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs shrink-0"
                          style={{
                            backgroundColor: opt.badgeColor || opt.color || '#3B82F6'
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}

                      {!multiple && isSelected && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Helper text or Error message */}
      {error ? (
        <p className="text-[11px] text-red-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export default CustomSelect;
