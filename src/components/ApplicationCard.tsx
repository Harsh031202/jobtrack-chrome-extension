import React, { useState } from 'react';
import { JobApplication } from '../types/application';
import { StatusBadge } from './StatusBadge';
import { ApplicationDetail } from './ApplicationDetail';
import { CompanyLogo } from './CompanyLogo';
import { ChevronDown, MapPin, Clock, Users } from 'lucide-react';
import { formatDisplayDate, formatDateBlock, formatDueByDate, calculateDaysLeft } from '../lib/normalizer';

interface ApplicationCardProps {
  application: JobApplication;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onUpdate: (id: string, updates: Partial<JobApplication>) => void;
  onDelete: (id: string) => void;
  onOpenEditModal: (application: JobApplication) => void;
  isDashboard?: boolean;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isExpanded: controlledExpanded,
  onToggleExpand: controlledToggle,
  onUpdate,
  onDelete,
  onOpenEditModal,
  isDashboard = true,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = controlledToggle || (() => setInternalExpanded(!internalExpanded));

  // Determine urgency: Closing soon (within 7 days) or Interview scheduled
  const nowStr = new Date().toISOString().slice(0, 10);
  const isClosingSoon =
    application.endDate &&
    application.endDate >= nowStr &&
    new Date(application.endDate).getTime() - new Date(nowStr).getTime() <= 7 * 86400000;

  const isInterview =
    application.status === 'Interview' ||
    application.status === 'Technical Interview' ||
    application.status === 'HR Interview';

  const isUrgent = Boolean(isClosingSoon || isInterview || application.status === 'Assessment');

  const [isDateHovered, setIsDateHovered] = useState(false);

  // Default date shown is the date applied/tracked
  const { dayName: appliedDayName, dayNumber: appliedDayNumber } = formatDateBlock(application.appliedAt);
  const hasDueDate = Boolean(application.endDate);
  const daysLeftInfo = calculateDaysLeft(application.endDate);

  return (
    <div
      className={`rounded-2xl border transition-all duration-140 bg-white dark:bg-darkBrand-surface overflow-hidden ${
        isUrgent ? 'bg-stripes' : ''
      } ${
        isExpanded
          ? 'border-brand-borderStrong dark:border-darkBrand-borderStrong shadow-float ring-1 ring-black/[0.03] dark:ring-white/[0.05]'
          : 'border-brand-border dark:border-darkBrand-border hover:border-brand-borderStrong dark:hover:border-darkBrand-borderStrong hover:shadow-subtle'
      }`}
    >
      {/* Tabato Row Structure */}
      <div
        onClick={toggleExpand}
        className="px-4 py-3.5 select-none cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          {/* 1. Tabato Left Date Block with 0.3s Delayed Smooth Cross-fade Animation to Days Left */}
          <div
            className="flex items-center shrink-0 cursor-pointer"
            onMouseEnter={() => setIsDateHovered(true)}
            onMouseLeave={() => setIsDateHovered(false)}
            title={
              hasDueDate
                ? `${daysLeftInfo.label === 'OVERDUE' ? 'Overdue' : `${daysLeftInfo.days} days left`} • Due by ${formatDueByDate(application.endDate)}`
                : 'No deadline set'
            }
          >
            <div className="w-[54px] h-12 relative select-none flex items-center justify-center">
              {/* Default State: Applied Date (smooth fade out on hover) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity ease-in-out ${
                  isDateHovered
                    ? 'opacity-0 duration-300 delay-0 pointer-events-none'
                    : 'opacity-100 duration-400 delay-0'
                }`}
              >
                <span
                  className={`block text-[11px] font-semibold uppercase tracking-wider text-center leading-none ${
                    isUrgent
                      ? 'text-terracotta-500 font-bold'
                      : 'text-brand-secondary dark:text-darkBrand-secondary'
                  }`}
                >
                  {appliedDayName}
                </span>
                <span
                  className={`block text-2xl font-bold font-sans tracking-tight leading-none mt-1 text-center ${
                    isUrgent
                      ? 'text-terracotta-500'
                      : 'text-brand-ink dark:text-darkBrand-ink'
                  }`}
                >
                  {appliedDayNumber}
                </span>
              </div>

              {/* Hover State: "Days left XX" (neatly aligned in red, delayed by 0.3s) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity ease-in-out ${
                  isDateHovered
                    ? 'opacity-100 duration-400 delay-300'
                    : 'opacity-0 duration-300 delay-0 pointer-events-none'
                }`}
              >
                <span className="block text-[8px] font-bold uppercase tracking-tight text-red-500 dark:text-red-400 whitespace-nowrap leading-none text-center">
                  {daysLeftInfo.label}
                </span>
                <span className="block text-2xl font-bold font-sans tracking-tight leading-none text-red-500 dark:text-red-400 mt-1 text-center">
                  {daysLeftInfo.displayDays}
                </span>
              </div>
            </div>

            {/* Hairline Vertical Divider */}
            <div className="w-px h-9 bg-brand-border dark:bg-darkBrand-border mx-3.5 sm:mx-4 shrink-0" />
          </div>

          {/* 2. Middle Column: Time/Deadline & Location (Fixed width so long location truncates with '...' and does not shift layout) */}
          <div className="hidden sm:flex flex-col justify-center w-[135px] text-xs space-y-1 shrink-0">
            {/* Row 1: Time / Deadline */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-brand-muted dark:text-darkBrand-muted shrink-0" />
              <span
                className={`truncate font-mono text-[11px] ${
                  isClosingSoon
                    ? 'font-semibold text-terracotta-600 dark:text-terracotta-400'
                    : 'text-brand-secondary dark:text-darkBrand-secondary'
                }`}
              >
                {application.endDate
                  ? `Due ${formatDisplayDate(application.endDate)}`
                  : `Applied ${formatDisplayDate(application.appliedAt)}`}
              </span>
              {/* Urgency Alert Dot inspired by Tabato (e.g. Thu 29 orange dot) */}
              {isUrgent && (
                <span
                  className="w-3 h-3 rounded-full bg-terracotta-500 text-white text-[8px] font-bold inline-flex items-center justify-center shrink-0 shadow-xs"
                  title={isClosingSoon ? 'Closing soon' : 'Action needed'}
                >
                  !
                </span>
              )}
            </div>

            {/* Row 2: Location */}
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-brand-muted dark:text-darkBrand-muted shrink-0" />
              <span className="truncate text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
                {application.location && application.location !== 'Not specified'
                  ? application.location
                  : 'Remote / Online'}
              </span>
            </div>
          </div>

          {/* 3. Right Column: Role Title, Company, Monogram Stack, Status */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {/* Main Title: Role */}
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-brand-ink dark:text-darkBrand-ink truncate">
                  {application.role}
                </h3>
              </div>

              {/* Sub-line: Company + Meta tags */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
                <span className="font-medium text-brand-ink dark:text-darkBrand-ink">
                  {application.company}
                </span>

                {application.vacancies && application.vacancies !== 'Not specified' && (
                  <>
                    <span className="text-brand-muted text-[10px]">•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-secondary">
                      <Users className="w-3 h-3" />
                      <span>{application.vacancies}</span>
                    </span>
                  </>
                )}

                {application.salary && application.salary !== 'Not specified' && (
                  <>
                    <span className="text-brand-muted text-[10px] hidden md:inline">•</span>
                    <span className="hidden md:inline font-mono text-[11px] text-brand-ink dark:text-darkBrand-ink">
                      {application.salary}
                    </span>
                  </>
                )}

                {/* Mobile-only date info if middle column is hidden */}
                <span className="sm:hidden font-mono text-[10px] text-brand-muted">
                  • {formatDisplayDate(application.appliedAt)}
                </span>
              </div>
            </div>

            {/* Company Logo & Status Badge */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Full Professional Company Logo */}
              <CompanyLogo
                company={application.company}
                jobUrl={application.jobUrl}
                companyDomain={application.companyDomain}
                companyLogoUrl={application.companyLogoUrl}
                isDashboard={isDashboard}
              />

              {/* Status Badge */}
              <StatusBadge status={application.status} size="xs" />

              {/* Expand Indicator */}
              <ChevronDown
                className={`w-4 h-4 text-brand-muted transition-transform duration-140 ${
                  isExpanded ? 'rotate-180 text-brand-ink dark:text-darkBrand-ink' : ''
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details Surface */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-brand-surface dark:bg-darkBrand-surface">
          <ApplicationDetail
            application={application}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onOpenEditModal={onOpenEditModal}
          />
        </div>
      )}
    </div>
  );
};
