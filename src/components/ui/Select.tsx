import React, { useState, useRef, useEffect, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  dotColor?: string;
  disabled?: boolean;
}

export interface SelectGroup<T = string> {
  groupLabel: string;
  options: SelectOption<T>[];
}

export type SelectItem<T = string> = SelectOption<T> | SelectGroup<T> | string;

export interface SelectProps<T = string> {
  options: SelectItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'pill' | 'subtle';
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
  placement?: 'auto' | 'bottom' | 'top';
  id?: string;
  name?: string;
  'aria-label'?: string;
  error?: string;
  hint?: string;
}

function isGroup<T>(item: SelectItem<T>): item is SelectGroup<T> {
  return typeof item === 'object' && item !== null && 'groupLabel' in item && Array.isArray((item as any).options);
}

function normalizeOptions<T>(items: SelectItem<T>[]): {
  groups: { label?: string; options: SelectOption<T>[] }[];
  flatOptions: SelectOption<T>[];
} {
  const groups: { label?: string; options: SelectOption<T>[] }[] = [];
  const flatOptions: SelectOption<T>[] = [];

  let currentUngrouped: SelectOption<T>[] = [];

  for (const item of items) {
    if (typeof item === 'string') {
      const opt: SelectOption<T> = { value: item as unknown as T, label: item };
      currentUngrouped.push(opt);
      flatOptions.push(opt);
    } else if (isGroup(item)) {
      if (currentUngrouped.length > 0) {
        groups.push({ options: currentUngrouped });
        currentUngrouped = [];
      }
      groups.push({ label: item.groupLabel, options: item.options });
      flatOptions.push(...item.options);
    } else {
      currentUngrouped.push(item);
      flatOptions.push(item);
    }
  }

  if (currentUngrouped.length > 0) {
    groups.push({ options: currentUngrouped });
  }

  return { groups, flatOptions };
}

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  size = 'sm',
  variant = 'default',
  disabled = false,
  className,
  buttonClassName,
  dropdownClassName,
  align = 'left',
  placement = 'auto',
  id,
  'aria-label': ariaLabel,
  error,
  hint,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPlacement, setDropdownPlacement] = useState<'bottom' | 'top'>('bottom');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const { groups, flatOptions } = normalizeOptions(options);

  const activeOption = flatOptions.find((opt) => opt.value === value);

  // Auto flip if near viewport bottom
  useEffect(() => {
    if (!isOpen) return;

    if (placement === 'top') {
      setDropdownPlacement('top');
      return;
    }
    if (placement === 'bottom') {
      setDropdownPlacement('bottom');
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 240px below and more space above, flip to top
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setDropdownPlacement('top');
      } else {
        setDropdownPlacement('bottom');
      }
    }
  }, [isOpen, placement]);

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Set initial highlight index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = flatOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, value, flatOptions]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown': {
        e.preventDefault();
        let next = highlightedIndex + 1;
        while (next < flatOptions.length && flatOptions[next]?.disabled) {
          next++;
        }
        if (next < flatOptions.length) {
          setHighlightedIndex(next);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        let prev = highlightedIndex - 1;
        while (prev >= 0 && flatOptions[prev]?.disabled) {
          prev--;
        }
        if (prev >= 0) {
          setHighlightedIndex(prev);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < flatOptions.length) {
          const selected = flatOptions[highlightedIndex];
          if (selected && !selected.disabled) {
            onChange(selected.value);
            setIsOpen(false);
            buttonRef.current?.focus();
          }
        }
        break;
      }
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectOption = (opt: SelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-[11px] min-h-[26px]',
    sm: 'px-3 py-2 text-xs min-h-[34px]',
    md: 'px-3.5 py-2.5 text-xs min-h-[38px]',
  };

  const variantStyles = {
    default:
      'rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface text-brand-ink dark:text-darkBrand-ink shadow-subtle hover:border-brand-borderStrong dark:hover:border-darkBrand-borderStrong focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 dark:focus:border-terracotta-400',
    pill:
      'rounded-lg border border-brand-border dark:border-darkBrand-border bg-brand-pillBg dark:bg-darkBrand-pillBg text-brand-secondary dark:text-darkBrand-secondary hover:text-brand-ink dark:hover:text-darkBrand-ink hover:border-brand-borderStrong dark:hover:border-darkBrand-borderStrong focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500',
    subtle:
      'rounded-xl border border-transparent bg-brand-hover dark:bg-darkBrand-elevated text-brand-ink dark:text-darkBrand-ink hover:bg-brand-pillBg dark:hover:bg-darkBrand-hover focus:ring-2 focus:ring-terracotta-500/20',
  };

  let globalIndexCounter = 0;

  return (
    <div className={twMerge('w-full space-y-1', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-brand-ink dark:text-darkBrand-ink"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || label || 'Select'}
          className={twMerge(
            clsx(
              'w-full flex items-center justify-between font-medium text-left transition-all duration-150 focus:outline-none select-none cursor-pointer',
              sizeStyles[size],
              variantStyles[variant],
              disabled && 'opacity-50 cursor-not-allowed bg-brand-hover dark:bg-darkBrand-bg pointer-events-none',
              error && 'border-coral-500 dark:border-coral-400 focus:ring-coral-400/20 focus:border-coral-500',
              isOpen && 'border-terracotta-500 dark:border-terracotta-400 ring-2 ring-terracotta-500/20 shadow-sm',
              buttonClassName
            )
          )}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {activeOption?.dotColor && (
              <span className={clsx('w-2 h-2 rounded-full shrink-0 shadow-xs', activeOption.dotColor)} />
            )}
            {activeOption?.icon && (
              <span className="shrink-0 text-brand-muted dark:text-darkBrand-muted">{activeOption.icon}</span>
            )}
            <span
              className={clsx(
                'truncate',
                !activeOption && 'text-brand-muted dark:text-darkBrand-muted font-normal'
              )}
            >
              {activeOption ? activeOption.label : placeholder}
            </span>
          </div>

          <ChevronDown
            className={clsx(
              'w-3.5 h-3.5 text-brand-secondary dark:text-darkBrand-secondary shrink-0 transition-transform duration-200',
              isOpen && 'transform rotate-180 text-terracotta-500 dark:text-terracotta-400'
            )}
          />
        </button>

        {isOpen && (
          <div
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={
              highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
            }
            className={twMerge(
              clsx(
                'absolute z-50 min-w-[180px] max-w-sm rounded-xl border border-brand-border dark:border-darkBrand-borderStrong bg-white dark:bg-darkBrand-surface shadow-2xl dark:shadow-dark-float p-1 max-h-64 overflow-y-auto overscroll-contain animate-in fade-in-0 zoom-in-95 duration-150 ease-out',
                dropdownPlacement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
                align === 'right' ? 'right-0' : 'left-0',
                dropdownClassName
              )
            )}
          >
            {groups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-0.5">
                {group.label && (
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-darkBrand-muted select-none">
                    {group.label}
                  </div>
                )}
                {group.options.map((opt) => {
                  const itemIndex = globalIndexCounter++;
                  const isSelected = opt.value === value;
                  const isHighlighted = itemIndex === highlightedIndex;

                  return (
                    <div
                      key={String(opt.value)}
                      id={`${selectId}-opt-${itemIndex}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(itemIndex)}
                      className={clsx(
                        'relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-100 select-none',
                        opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                        isSelected
                          ? 'bg-terracotta-50 dark:bg-terracotta-500/15 text-terracotta-600 dark:text-terracotta-400 font-semibold'
                          : isHighlighted
                          ? 'bg-brand-pillBg dark:bg-darkBrand-hover text-brand-ink dark:text-darkBrand-ink'
                          : 'text-brand-ink dark:text-darkBrand-ink hover:bg-brand-pillBg dark:hover:bg-darkBrand-hover'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {opt.dotColor && (
                          <span className={clsx('w-2 h-2 rounded-full shrink-0', opt.dotColor)} />
                        )}
                        {opt.icon && (
                          <span className="shrink-0 text-brand-muted dark:text-darkBrand-muted">
                            {opt.icon}
                          </span>
                        )}
                        <div className="truncate">
                          <span className="block truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="block text-[10px] font-normal text-brand-muted dark:text-darkBrand-muted truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-terracotta-500 dark:text-terracotta-400 ml-1.5" />
                      )}
                    </div>
                  );
                })}
                {groupIdx < groups.length - 1 && (
                  <div className="my-1 border-b border-brand-border/60 dark:border-darkBrand-border/60" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-coral-600 dark:text-coral-400 font-medium">{error}</p>
      )}
    </div>
  );
}
