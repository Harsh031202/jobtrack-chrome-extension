import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#15171C]/35 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Surface */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-modal dark:shadow-dark-float overflow-hidden z-10`}
      >
        {(title || description) && (
          <div className="flex items-center justify-between border-b border-brand-border dark:border-darkBrand-border px-4 py-3 bg-brand-bg/50 dark:bg-darkBrand-elevated/40">
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-brand-ink dark:text-darkBrand-ink tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-ink dark:text-darkBrand-muted dark:hover:text-darkBrand-ink p-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-4 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
