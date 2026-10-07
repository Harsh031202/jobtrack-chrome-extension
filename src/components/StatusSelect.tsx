import React from 'react';
import { ApplicationStatus, APPLICATION_STATUSES } from '../types/application';

interface StatusSelectProps {
  value: ApplicationStatus;
  onChange: (newStatus: ApplicationStatus) => void;
  className?: string;
  size?: 'xs' | 'sm';
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  className = '',
  size = 'sm',
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-lg border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface font-medium text-brand-ink dark:text-darkBrand-ink transition-colors hover:border-brand-borderStrong dark:hover:border-darkBrand-borderStrong focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer shadow-subtle ${
        size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      aria-label="Change application status"
    >
      {APPLICATION_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
};
