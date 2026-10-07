import React from 'react';
import { ApplicationStatus } from '../types/application';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'xs' | 'sm';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const styles: Record<ApplicationStatus, { pill: string; dot: string }> = {
    Applied: {
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      dot: 'bg-indigo-600 dark:bg-indigo-400',
    },
    Screening: {
      pill: 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
      dot: 'bg-sky-600 dark:bg-sky-400',
    },
    Assessment: {
      pill: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      dot: 'bg-amber-600 dark:bg-amber-400',
    },
    Interview: {
      pill: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      dot: 'bg-purple-600 dark:bg-purple-400',
    },
    'Technical Interview': {
      pill: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      dot: 'bg-purple-600 dark:bg-purple-400',
    },
    'HR Interview': {
      pill: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      dot: 'bg-purple-600 dark:bg-purple-400',
    },
    Offer: {
      pill: 'bg-emerald-50 text-emerald-800 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-lime-400 dark:border-emerald-500/20',
      dot: 'bg-emerald-600 dark:bg-lime-400',
    },
    Rejected: {
      pill: 'bg-coral-50 text-coral-700 border-coral-200/60 dark:bg-coral-500/10 dark:text-coral-400 dark:border-coral-500/20',
      dot: 'bg-coral-600 dark:bg-coral-400',
    },
    Withdrawn: {
      pill: 'bg-black/[0.04] text-brand-secondary border-brand-border dark:bg-white/[0.04] dark:text-darkBrand-secondary dark:border-darkBrand-border',
      dot: 'bg-brand-secondary dark:bg-darkBrand-secondary',
    },
    'On Hold': {
      pill: 'bg-amber-50/70 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      dot: 'bg-amber-500',
    },
  };

  const current = styles[status] || styles.Applied;
  const sizeStyle = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeStyle} ${current.pill} select-none transition-colors duration-120`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${current.dot}`} />
      <span>{status}</span>
    </span>
  );
};
