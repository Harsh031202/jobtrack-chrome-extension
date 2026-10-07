import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {leftAddon && (
            <div className="absolute left-3 text-brand-muted dark:text-darkBrand-muted group-focus-within:text-terracotta-500 dark:group-focus-within:text-terracotta-400 transition-colors pointer-events-none flex items-center">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface px-3 py-2 text-xs text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted transition-all duration-120 focus:border-terracotta-500 dark:focus:border-terracotta-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 disabled:opacity-50 disabled:bg-brand-hover dark:disabled:bg-darkBrand-bg shadow-subtle',
                leftAddon && 'pl-10',
                error && 'border-coral-500 dark:border-coral-400 focus:ring-coral-400/20 focus:border-coral-500',
                className
              )
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">{hint}</p>}
        {error && <p className="text-[11px] text-coral-600 dark:text-coral-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
