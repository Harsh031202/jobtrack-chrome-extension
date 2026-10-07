import React from 'react';
import { JobApplication } from '../types/application';
import { Clock } from 'lucide-react';

export type OverviewTabFilter = 'all' | 'applied' | 'in_this_month' | 'past_tracks';

interface StatsOverviewProps {
  applications: JobApplication[];
  selectedFilter: OverviewTabFilter;
  closingSoonOnly: boolean;
  onSelectFilter: (filter: OverviewTabFilter) => void;
  onToggleClosingSoon: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  applications,
  selectedFilter,
  closingSoonOnly,
  onSelectFilter,
  onToggleClosingSoon,
}) => {
  const total = applications.length;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // e.g. "2026-10"

  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  let appliedCount = 0;
  let thisMonthCount = 0;
  let pastTracksCount = 0;
  let closingSoonCount = 0;

  applications.forEach((app) => {
    // 1. Applied count
    if (app.status === 'Applied') {
      appliedCount++;
    }

    // 2. In this month count (applied during current month)
    if (app.appliedAt && app.appliedAt.startsWith(currentMonthStr)) {
      thisMonthCount++;
    }

    // 3. Past tracks count (terminal status or applied in previous months)
    const isTerminal = app.status === 'Rejected' || app.status === 'Withdrawn' || app.status === 'Offer';
    const isOlderMonth = Boolean(app.appliedAt && app.appliedAt.slice(0, 7) < currentMonthStr);
    if (isTerminal || isOlderMonth) {
      pastTracksCount++;
    }

    // Closing soon count
    if (app.endDate && app.endDate >= todayStr && app.endDate <= nextWeekStr) {
      closingSoonCount++;
    }
  });

  const filterTabs: { label: string; value: OverviewTabFilter; count: number }[] = [
    { label: 'All', value: 'all', count: total },
    { label: 'Applied', value: 'applied', count: appliedCount },
    { label: 'In this month', value: 'in_this_month', count: thisMonthCount },
    { label: 'Past tracks', value: 'past_tracks', count: pastTracksCount },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 select-none">
      {/* Tabato Segmented Filter Pill Bar */}
      <div className="inline-flex items-center p-1 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60">
        {filterTabs.map((tab) => {
          const isActive = selectedFilter === tab.value && !closingSoonOnly;
          return (
            <button
              key={tab.value}
              onClick={() => onSelectFilter(tab.value)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-140 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-darkBrand-surface text-brand-ink dark:text-darkBrand-ink font-semibold shadow-sm'
                  : 'text-brand-secondary dark:text-darkBrand-secondary hover:text-brand-ink dark:hover:text-darkBrand-ink hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`font-mono text-[10px] px-1 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-brand-pillBg dark:bg-darkBrand-elevated text-brand-ink dark:text-darkBrand-ink'
                      : 'opacity-70'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabato-style Urgency Pill: Closing Soon */}
      {closingSoonCount > 0 && (
        <button
          onClick={onToggleClosingSoon}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-140 cursor-pointer border ${
            closingSoonOnly
              ? 'bg-terracotta-50 dark:bg-terracotta-700/20 text-terracotta-600 dark:text-terracotta-400 border-terracotta-300 dark:border-terracotta-600 shadow-sm'
              : 'bg-white dark:bg-darkBrand-surface text-brand-secondary dark:text-darkBrand-secondary border-brand-border dark:border-darkBrand-border hover:border-terracotta-300 dark:hover:border-terracotta-500'
          }`}
          title="Filter applications with deadlines closing within 7 days"
        >
          <Clock className="w-3.5 h-3.5 text-terracotta-500" />
          <span className="font-semibold text-terracotta-600 dark:text-terracotta-400">Closing Soon</span>
          <span className="w-4 h-4 rounded-full bg-terracotta-500 text-white font-mono text-[9px] font-bold inline-flex items-center justify-center">
            {closingSoonCount}
          </span>
        </button>
      )}
    </div>
  );
};
