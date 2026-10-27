import React from 'react';
import { ApplicationStatus, APPLICATION_STATUSES } from '../types/application';
import { Select, SelectOption } from './ui/Select';

interface StatusSelectProps {
  value: ApplicationStatus;
  onChange: (newStatus: ApplicationStatus) => void;
  className?: string;
  size?: 'xs' | 'sm';
}

export const STATUS_DOT_COLORS: Record<ApplicationStatus, string> = {
  Applied: 'bg-indigo-500',
  Screening: 'bg-sky-500',
  Assessment: 'bg-amber-500',
  Interview: 'bg-purple-500',
  'Technical Interview': 'bg-purple-600',
  'HR Interview': 'bg-purple-400',
  Offer: 'bg-emerald-500',
  Rejected: 'bg-coral-500',
  Withdrawn: 'bg-slate-400',
  'On Hold': 'bg-amber-500',
};

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  className = '',
  size = 'sm',
}) => {
  const options: SelectOption<ApplicationStatus>[] = APPLICATION_STATUSES.map((status) => ({
    value: status,
    label: status,
    dotColor: STATUS_DOT_COLORS[status] || 'bg-brand-secondary',
  }));

  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <Select<ApplicationStatus>
        options={options}
        value={value}
        onChange={onChange}
        size={size}
        aria-label="Change application status"
      />
    </div>
  );
};
