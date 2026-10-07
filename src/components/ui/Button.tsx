import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'sm',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-120 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500/30 focus-visible:border-terracotta-500 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-[11px] gap-1 tracking-tight',
    sm: 'px-3 py-1.5 text-xs gap-1.5 tracking-tight font-medium',
    md: 'px-4 py-2 text-xs gap-2 font-medium',
    lg: 'px-5 py-2.5 text-sm gap-2 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 border border-terracotta-600/40 shadow-sm dark:bg-terracotta-500 dark:hover:bg-terracotta-600 dark:active:bg-terracotta-700 dark:border-terracotta-400/30',
    secondary:
      'bg-white text-brand-ink border border-brand-border hover:bg-brand-hover hover:border-brand-borderStrong active:bg-[#E5E2DA] shadow-subtle dark:bg-darkBrand-surface dark:text-darkBrand-ink dark:border-darkBrand-border dark:hover:bg-darkBrand-hover dark:hover:border-darkBrand-borderStrong',
    outline:
      'bg-transparent text-brand-ink border border-brand-border hover:border-brand-borderStrong hover:bg-black/[0.02] active:bg-black/[0.05] dark:text-darkBrand-ink dark:border-darkBrand-border dark:hover:border-darkBrand-borderStrong dark:hover:bg-white/[0.04]',
    ghost:
      'bg-transparent text-brand-secondary hover:text-brand-ink hover:bg-black/[0.04] active:bg-black/[0.08] dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink dark:hover:bg-white/[0.06] border border-transparent',
    danger:
      'bg-coral-50 text-coral-700 border border-coral-200 hover:bg-coral-100 active:bg-coral-200/80 dark:bg-coral-500/10 dark:text-coral-400 dark:border-coral-500/30 dark:hover:bg-coral-500/20',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
