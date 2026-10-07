import React, { useState, useMemo, useEffect, useRef } from 'react';
import { JobApplication } from '../types/application';
import { Button } from './ui/Button';
import { parseSalaryToAnnualValue } from '../lib/normalizer';
import { exportApplicationsToCsv, exportApplicationsToJson } from '../lib/export-import';
import {
  TrendingUp,
  Users,
  Download,
  FileSpreadsheet,
  Target,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';

interface AnalyticsViewProps {
  applications: JobApplication[];
  onNavigateToApplications?: () => void;
  onOpenApplicationDetail?: (app: JobApplication) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  applications,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSkillBarIndex, setActiveSkillBarIndex] = useState<number | null>(0);
  const heatmapCardRef = useRef<HTMLDivElement>(null);
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | '30days'>('all');
  const [hoveredSliceLabel, setHoveredSliceLabel] = useState<string | null>(null);

  const formatHeatmapTooltipDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Trigger smooth entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 1. Core High-Level Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const active = applications.filter(
      (a) => a.status !== 'Rejected' && a.status !== 'Withdrawn'
    ).length;
    const interviews = applications.filter((a) =>
      ['Interview', 'Technical Interview', 'HR Interview', 'Screening', 'Assessment', 'Offer'].includes(
        a.status
      )
    ).length;
    const offers = applications.filter((a) => a.status === 'Offer').length;

    const interviewRate = total > 0 ? Math.round((interviews / total) * 1000) / 10 : 0;
    const offerRate = total > 0 ? Math.round((offers / total) * 1000) / 10 : 0;

    // Calculate Average CTC for roles with salary
    const salaries = applications
      .map((a) => parseSalaryToAnnualValue(a.salary))
      .filter((v) => v > 0);
    const avgSalaryNum = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
    const avgSalaryLPA = Math.round(avgSalaryNum / 10000) / 10; // in Lakhs

    return {
      total,
      active,
      interviews,
      offers,
      interviewRate,
      offerRate,
      avgSalaryLPA,
      activeRate: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }, [applications]);

  // 2. LeetCode / GitHub Style Coder Contribution Calendar Heatmap Data (Last 22 Weeks)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const numWeeks = 22;

    // Align start to the beginning of the week (Sunday)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (numWeeks * 7 - (today.getDay() + 1)));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weeks: {
      days: {
        date: string;
        dayOfWeek: number;
        month: number;
        count: number;
        companies: string[];
        isFuture: boolean;
      }[];
      monthLabel?: string;
    }[] = [];

    let curr = new Date(startDate);
    let lastMonth = -1;

    for (let w = 0; w < numWeeks; w++) {
      const days = [];
      let weekMonthLabel: string | undefined;

      for (let d = 0; d < 7; d++) {
        const dateStr = curr.toISOString().slice(0, 10);
        const m = curr.getMonth();

        // If month changed, flag for header label on top of this week column
        if (m !== lastMonth && d === 0) {
          weekMonthLabel = monthNames[m];
          lastMonth = m;
        }

        // Match applications applied on this day
        const matched = applications.filter((app) => (app.appliedAt || '').slice(0, 10) === dateStr);
        const companies = matched.map((a) => a.company);

        days.push({
          date: dateStr,
          dayOfWeek: curr.getDay(),
          month: m,
          count: matched.length,
          companies,
          isFuture: curr > today,
        });

        curr.setDate(curr.getDate() + 1);
      }

      weeks.push({
        days,
        monthLabel: weekMonthLabel,
      });
    }

    // Compute activity stats
    const totalActivity = applications.length;
    let activeDays = 0;
    weeks.forEach((w) =>
      w.days.forEach((d) => {
        if (d.count > 0 && !d.isFuture) activeDays++;
      })
    );

    return {
      weeks,
      totalActivity,
      activeDays,
    };
  }, [applications]);

  // 3. Status Breakdown for Donut Chart
  const statusStats = useMemo(() => {
    const filteredApps =
      statusFilter === '30days'
        ? applications.filter((a) => {
            if (!a.appliedAt) return false;
            const diffDays = (Date.now() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
          })
        : applications;

    const counts: Record<string, number> = {
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Assessment: 0,
      Rejected: 0,
    };

    filteredApps.forEach((a) => {
      if (['Interview', 'Technical Interview', 'HR Interview'].includes(a.status)) {
        counts.Interview = (counts.Interview || 0) + 1;
      } else if (a.status === 'Offer') {
        counts.Offer = (counts.Offer || 0) + 1;
      } else if (a.status === 'Screening') {
        counts.Screening = (counts.Screening || 0) + 1;
      } else if (a.status === 'Assessment') {
        counts.Assessment = (counts.Assessment || 0) + 1;
      } else if (a.status === 'Rejected' || a.status === 'Withdrawn') {
        counts.Rejected = (counts.Rejected || 0) + 1;
      } else {
        counts.Applied = (counts.Applied || 0) + 1;
      }
    });

    const total = filteredApps.length || 1;
    const slices = [
      {
        label: 'Applied',
        count: counts.Applied,
        color: '#6366F1', // Indigo
        textColor: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-500',
        percent: filteredApps.length > 0 ? Math.round((counts.Applied / total) * 100) : 0,
      },
      {
        label: 'Screening',
        count: counts.Screening,
        color: '#0284C7', // Sky
        textColor: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-500',
        percent: filteredApps.length > 0 ? Math.round((counts.Screening / total) * 100) : 0,
      },
      {
        label: 'Interview',
        count: counts.Interview,
        color: '#8B5CF6', // Purple
        textColor: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-500',
        percent: filteredApps.length > 0 ? Math.round((counts.Interview / total) * 100) : 0,
      },
      {
        label: 'Offer',
        count: counts.Offer,
        color: '#10B981', // Emerald
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500',
        percent: filteredApps.length > 0 ? Math.round((counts.Offer / total) * 100) : 0,
      },
      {
        label: 'Assessment',
        count: counts.Assessment,
        color: '#F59E0B', // Amber
        textColor: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500',
        percent: filteredApps.length > 0 ? Math.round((counts.Assessment / total) * 100) : 0,
      },
      {
        label: 'Rejected',
        count: counts.Rejected,
        color: '#F43F5E', // Coral/Rose
        textColor: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500',
        percent: filteredApps.length > 0 ? Math.round((counts.Rejected / total) * 100) : 0,
      },
    ];

    return { total: filteredApps.length, slices };
  }, [applications, statusFilter]);

  // Donut SVG circumference math
  const donutMath = useMemo(() => {
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Filter to ONLY active slices that have count > 0 so empty categories never render artifacts
    const activeSlices = statusStats.slices.filter((s) => s.count > 0);
    const totalCount = activeSlices.reduce((sum, s) => sum + s.count, 0);

    if (totalCount === 0) {
      return { size, radius, strokeWidth, circumference, slices: [], totalCount: 0 };
    }

    let accumulatedLength = 0;
    const gap = activeSlices.length > 1 ? 2.5 : 0;

    const slicesWithOffset = activeSlices.map((slice) => {
      const fraction = slice.count / totalCount;
      const arcLength = fraction * circumference;
      const dashLength = Math.max(arcLength - gap, 0.5);

      const strokeDasharray = `${dashLength} ${circumference}`;
      const strokeDashoffset = -accumulatedLength;

      accumulatedLength += arcLength;

      return {
        ...slice,
        strokeDasharray,
        strokeDashoffset,
      };
    });

    return { size, radius, strokeWidth, circumference, slices: slicesWithOffset, totalCount };
  }, [statusStats]);

  const hoveredSliceData = useMemo(() => {
    if (!hoveredSliceLabel) return null;
    return statusStats.slices.find((s) => s.label === hoveredSliceLabel) || null;
  }, [hoveredSliceLabel, statusStats]);

  // 4. Full-Width Top In-Demand Skills Bar Chart Data
  const fullWidthSkillsData = useMemo(() => {
    const skillMap: Record<string, { count: number; salaries: number[] }> = {};

    applications.forEach((app) => {
      const sal = parseSalaryToAnnualValue(app.salary);
      (app.skills || []).forEach((s) => {
        const key = s.trim();
        if (key) {
          if (!skillMap[key]) {
            skillMap[key] = { count: 0, salaries: [] };
          }
          skillMap[key].count += 1;
          if (sal > 0) skillMap[key].salaries.push(sal);
        }
      });
    });

    const parsedSkills = Object.entries(skillMap).map(([name, data]) => {
      const avgSal =
        data.salaries.length > 0
          ? Math.round(data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length / 10000) / 10
          : metrics.avgSalaryLPA || 45;
      const percent = Math.round((data.count / (applications.length || 1)) * 100);
      return {
        name,
        count: data.count,
        percent,
        avgCTC: avgSal,
      };
    });

    // Default fallback skills if user has few entries
    const fallbackList = [
      { name: 'TypeScript', count: 6, percent: 83, avgCTC: 52.5 },
      { name: 'Go', count: 5, percent: 71, avgCTC: 58.0 },
      { name: 'Distributed Systems', count: 4, percent: 57, avgCTC: 65.0 },
      { name: 'React', count: 4, percent: 57, avgCTC: 42.0 },
      { name: 'PostgreSQL', count: 3, percent: 43, avgCTC: 48.0 },
      { name: 'AWS', count: 3, percent: 43, avgCTC: 50.0 },
      { name: 'Python', count: 3, percent: 43, avgCTC: 46.5 },
      { name: 'C++', count: 2, percent: 29, avgCTC: 55.0 },
      { name: 'Kafka', count: 2, percent: 29, avgCTC: 52.0 },
      { name: 'Docker', count: 2, percent: 29, avgCTC: 45.0 },
    ];

    const sortedList =
      parsedSkills.length >= 4
        ? parsedSkills.sort((a, b) => b.count - a.count).slice(0, 10)
        : fallbackList.slice(0, 10);

    const maxSkillCount = Math.max(...sortedList.map((s) => s.count), 1);
    const topSkill = sortedList[0] || fallbackList[0];

    return {
      skills: sortedList,
      maxSkillCount,
      topSkill,
    };
  }, [applications, metrics.avgSalaryLPA]);

  // Handle CSV Download
  const handleExportCsv = () => {
    const csvData = exportApplicationsToCsv(applications);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JobTrack_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle JSON Report Download
  const handleDownloadReport = () => {
    const jsonData = exportApplicationsToJson(applications);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JobTrack_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pt-2 pb-12 transition-colors duration-1000">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-ink dark:text-darkBrand-ink">
            Analytics & Pipeline Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary dark:text-darkBrand-secondary mt-1">
            An overview of application volume, interview response rates, and compensation benchmarks.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            className="rounded-xl shadow-xs"
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleDownloadReport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="rounded-xl shadow-xs"
          >
            Download Report
          </Button>
        </div>
      </div>

      {/* 1. Point 1: Blue Doodled Area -> Full-Width Horizontal Metric Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Metric 1: Total Tracked Roles */}
        <div
          className={`h-22 p-4 px-6 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle flex items-center justify-between transition-all duration-500 ease-productive hover:shadow-float ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary">
              Total Tracked Roles
            </span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-sans tracking-tight text-brand-ink dark:text-darkBrand-ink">
                {metrics.total}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-600 border border-terracotta-200/60 dark:bg-terracotta-500/10 dark:text-terracotta-400 dark:border-terracotta-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                +{metrics.activeRate}% Active
              </span>
              <span className="hidden sm:inline text-xs text-brand-muted dark:text-darkBrand-muted">
                in your active career search
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full border border-brand-border dark:border-darkBrand-border bg-brand-pillBg dark:bg-darkBrand-pillBg flex items-center justify-center text-terracotta-500 shrink-0 shadow-xs">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Interview Conversion Rate */}
        <div
          className={`h-22 p-4 px-6 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle flex items-center justify-between transition-all duration-500 delay-75 ease-productive hover:shadow-float ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary">
              Interview Conversion Rate
            </span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-sans tracking-tight text-brand-ink dark:text-darkBrand-ink">
                {metrics.interviewRate}%
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-lime-400 dark:border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                +{metrics.interviews} Active Leads
              </span>
              <span className="hidden sm:inline text-xs text-brand-muted dark:text-darkBrand-muted">
                advanced past screen
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full border border-brand-border dark:border-darkBrand-border bg-brand-pillBg dark:bg-darkBrand-pillBg flex items-center justify-center text-emerald-600 dark:text-lime-400 shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Point 2: Green Doodled Area -> Coder Heatmap Calendar + Status Statistics Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: LeetCode / GitHub Style Coder Calendar Activity Heatmap (lg:col-span-7) */}
        <div
          ref={heatmapCardRef}
          className={`relative lg:col-span-7 p-6 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle flex flex-col justify-between transition-all duration-500 delay-150 ease-productive hover:shadow-float ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary">
                Activity Grid
              </span>
              <p className="text-[11px] text-brand-muted dark:text-darkBrand-muted mt-0.5">
                Submission frequency over the last 22 weeks
              </p>
            </div>

            <div className="text-[11px] font-mono text-brand-secondary dark:text-darkBrand-secondary bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border dark:border-darkBrand-border px-2.5 py-1 rounded-lg">
              {heatmapData.totalActivity} total tracked
            </div>
          </div>

          {/* GitHub / LeetCode Contribution Calendar Heatmap Grid */}
          <div className="relative my-4 overflow-x-auto select-none pt-2 pb-1">
            <div className="min-w-[460px]">
              {/* Month Labels Row */}
              <div className="flex text-[10px] font-mono text-brand-muted dark:text-darkBrand-muted mb-1.5 pl-6">
                {heatmapData.weeks.map((w, idx) => (
                  <div key={idx} className="w-3.5 sm:w-4 text-center shrink-0">
                    {w.monthLabel && <span className="font-semibold">{w.monthLabel}</span>}
                  </div>
                ))}
              </div>

              {/* Grid: 7 Rows (Days) x 22 Columns (Weeks) */}
              <div className="flex gap-1.5 items-center">
                {/* Day of Week Labels (Mon, Wed, Fri) */}
                <div className="flex flex-col justify-between h-[106px] sm:h-[114px] text-[9px] font-mono text-brand-muted dark:text-darkBrand-muted pr-1.5 select-none">
                  <span>Sun</span>
                  <span>Tue</span>
                  <span>Thu</span>
                  <span>Sat</span>
                </div>

                {/* 22 Week Columns */}
                <div className="flex gap-1 sm:gap-1.5">
                  {heatmapData.weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1 sm:gap-1.5">
                      {week.days.map((day) => {
                        // Level colors
                        let bgClass = 'bg-brand-pillBg/70 dark:bg-darkBrand-pillBg/80 border-transparent';
                        if (day.count === 1) {
                          bgClass = 'bg-terracotta-200 dark:bg-terracotta-900/60 border-terracotta-300 dark:border-terracotta-800';
                        } else if (day.count === 2) {
                          bgClass = 'bg-terracotta-400 dark:bg-terracotta-700 border-terracotta-500 dark:border-terracotta-600';
                        } else if (day.count >= 3) {
                          bgClass = 'bg-terracotta-500 dark:bg-terracotta-500 border-terracotta-600 dark:border-terracotta-400 shadow-xs';
                        }

                        if (day.isFuture) {
                          bgClass = 'opacity-30 bg-brand-pillBg/40 dark:bg-darkBrand-pillBg/30';
                        }

                        return (
                          <div
                            key={day.date}
                            onMouseEnter={(e) => {
                              const card = heatmapCardRef.current;
                              if (card) {
                                const cardRect = card.getBoundingClientRect();
                                const dotRect = e.currentTarget.getBoundingClientRect();
                                setHoveredHeatmapDay({
                                  date: day.date,
                                  count: day.count,
                                  x: dotRect.left - cardRect.left + dotRect.width / 2,
                                  y: dotRect.top - cardRect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredHeatmapDay(null)}
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] border transition-transform duration-150 cursor-pointer hover:scale-125 hover:z-10 ${bgClass}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Small Floating Tooltip Text Box for Heatmap Day */}
          {hoveredHeatmapDay && (
            <div
              className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 bg-brand-ink dark:bg-darkBrand-elevated text-white dark:text-darkBrand-ink text-[11px] font-medium px-2.5 py-1 rounded-md shadow-float border border-white/10 dark:border-white/10 whitespace-nowrap transition-all duration-100 ease-out"
              style={{
                left: `${hoveredHeatmapDay.x}px`,
                top: `${hoveredHeatmapDay.y}px`,
              }}
            >
              <span>
                {hoveredHeatmapDay.count === 0
                  ? `No applications on ${formatHeatmapTooltipDate(hoveredHeatmapDay.date)}`
                  : `${hoveredHeatmapDay.count} application${hoveredHeatmapDay.count === 1 ? '' : 's'} on ${formatHeatmapTooltipDate(hoveredHeatmapDay.date)}`}
              </span>
              {/* Downward triangle arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-ink dark:bg-darkBrand-elevated rotate-45 border-r border-b border-white/10 dark:border-white/10" />
            </div>
          )}

          {/* Footer with Legend & Dynamic Hover Indicator */}
          <div className="pt-3 border-t border-brand-border/60 dark:border-darkBrand-border/60 flex items-center justify-between text-xs text-brand-secondary dark:text-darkBrand-secondary">
            <span className="text-[11px] font-mono">
              {hoveredHeatmapDay
                ? (hoveredHeatmapDay.count === 0
                    ? `No applications on ${formatHeatmapTooltipDate(hoveredHeatmapDay.date)}`
                    : `${hoveredHeatmapDay.count} application${hoveredHeatmapDay.count === 1 ? '' : 's'} on ${formatHeatmapTooltipDate(hoveredHeatmapDay.date)}`)
                : `${heatmapData.activeDays} active days in the last 22 weeks`}
            </span>

            {/* LeetCode/GitHub Style Less -> More Legend */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border dark:border-darkBrand-border" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-terracotta-200 dark:bg-terracotta-900/60" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-terracotta-400 dark:bg-terracotta-700" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-terracotta-500 dark:bg-terracotta-500" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Right: Status Statistics Circular Donut Chart (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 p-6 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle flex flex-col justify-between transition-all duration-500 delay-200 ease-productive hover:shadow-float ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Card Header & Filter */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary">
                Status Statistics
              </span>
              <p className="text-[11px] text-brand-muted dark:text-darkBrand-muted mt-0.5">
                Distribution across pipeline stages
              </p>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter status breakdown timeline"
                className="text-[11px] font-semibold text-brand-secondary dark:text-darkBrand-secondary bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border dark:border-darkBrand-border rounded-lg px-2.5 py-1 appearance-none pr-6 cursor-pointer focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-brand-secondary pointer-events-none" />
            </div>
          </div>

          {/* Spacious Donut Chart with Zero Overlapping Text */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-3">
            {/* SVG Donut Circle */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutMath.radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={donutMath.strokeWidth}
                  className="text-brand-pillBg dark:text-darkBrand-pillBg"
                />

                {/* Slices: Solid colors matching the legend identically, rendered only when count > 0 */}
                {donutMath.slices.map((slice) => {
                  const isHovered = hoveredSliceLabel === slice.label;
                  return (
                    <circle
                      key={slice.label}
                      cx="80"
                      cy="80"
                      r={donutMath.radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? donutMath.strokeWidth + 2.5 : donutMath.strokeWidth}
                      strokeDasharray={isLoaded ? slice.strokeDasharray : `0 ${donutMath.circumference}`}
                      strokeDashoffset={isLoaded ? slice.strokeDashoffset : 0}
                      strokeLinecap="butt"
                      className="transition-all duration-300 ease-productive cursor-pointer"
                      onMouseEnter={() => setHoveredSliceLabel(slice.label)}
                      onMouseLeave={() => setHoveredSliceLabel(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Content Inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className="text-2xl font-bold font-sans tracking-tight text-brand-ink dark:text-darkBrand-ink leading-tight">
                  {hoveredSliceData ? hoveredSliceData.count : donutMath.totalCount}
                </span>
                <span className="text-[10px] font-medium text-brand-secondary dark:text-darkBrand-secondary leading-none">
                  {hoveredSliceData ? hoveredSliceData.label : 'Total Roles'}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-lime-100 text-lime-800 dark:bg-lime-500/10 dark:text-lime-400 mt-1">
                  {hoveredSliceData ? `${hoveredSliceData.percent}% of pipeline` : `+${metrics.activeRate}% Active`}
                </span>
              </div>
            </div>

            {/* Right Legend List with Proper Spacing (NO TEXT OVERLAP) */}
            <div className="flex-1 w-full space-y-1.5">
              {statusStats.slices.map((s) => {
                const isHovered = hoveredSliceLabel === s.label;
                return (
                  <div
                    key={s.label}
                    onMouseEnter={() => setHoveredSliceLabel(s.label)}
                    onMouseLeave={() => setHoveredSliceLabel(null)}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                      isHovered
                        ? 'bg-brand-pillBg dark:bg-darkBrand-pillBg'
                        : 'hover:bg-brand-pillBg/70 dark:hover:bg-darkBrand-pillBg/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span
                        className={`text-xs truncate transition-colors ${
                          isHovered
                            ? 'font-bold text-brand-ink dark:text-darkBrand-ink'
                            : 'font-medium text-brand-secondary dark:text-darkBrand-secondary'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="text-xs font-bold font-mono text-brand-ink dark:text-darkBrand-ink">
                        {s.count}
                      </span>
                      <span className="text-[10px] font-mono text-brand-muted dark:text-darkBrand-muted w-10 text-right">
                        ({s.percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Card Summary */}
          <div className="pt-3 border-t border-brand-border/60 dark:border-darkBrand-border/60 flex items-center justify-between text-xs text-brand-secondary dark:text-darkBrand-secondary font-medium">
            <span>Active Pipeline: {metrics.active} in-flight</span>
            <span className="text-emerald-600 dark:text-lime-400 font-bold">
              {metrics.offers} Offer(s) Extended
            </span>
          </div>
        </div>
      </div>

      {/* 3. Point 3: Top Targeted Skills & Market Demand (Direct Dribbble Match) */}
      <div
        className={`w-full p-6 sm:p-8 rounded-3xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle flex flex-col justify-between transition-all duration-500 delay-300 ease-productive hover:shadow-float ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Card Header & Hero Stat (Matches Dribbble Shot's Total Profit Overview layout) */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-bold text-brand-ink dark:text-darkBrand-ink tracking-tight">
              Top Targeted Skills & Market Demand
            </span>
            <div className="text-brand-muted hover:text-brand-ink dark:hover:text-darkBrand-ink transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-darkBrand-pillBg">
              <MoreVertical className="w-4 h-4" />
            </div>
          </div>

          {/* Prominent Hero Stat with Pill Badge */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-ink dark:text-darkBrand-ink font-sans">
              {fullWidthSkillsData.topSkill.name}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAFBF0] text-[#1EAA57] dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              #1 Most in Demand
            </span>
          </div>
          <p className="text-xs sm:text-sm text-brand-secondary dark:text-darkBrand-secondary mt-1 font-medium">
            Required in {fullWidthSkillsData.topSkill.count} of your active roles ({fullWidthSkillsData.topSkill.percent}% match rate)
          </p>
        </div>

        {/* Slender Full-Height Slot Pillars with Vibrant Orange Bars (Dribbble Signature Design) */}
        <div className="relative mt-8 sm:mt-10 pt-8 pb-2">
          <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-4 md:gap-5 px-1 sm:px-4">
            {fullWidthSkillsData.skills.map((skill, idx) => {
              const heightPercent = Math.max(
                Math.round((skill.count / fullWidthSkillsData.maxSkillCount) * 82),
                18
              );
              const isHovered = activeSkillBarIndex === idx;
              // Clean name for x-axis wrapping: removes trailing parentheticals so 2 lines wrap cleanly
              const cleanName = skill.name.replace(/\s*\([^)]*\)$/, '');

              return (
                <div
                  key={skill.name}
                  className="relative flex-1 min-w-0 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setActiveSkillBarIndex(idx)}
                  onMouseLeave={() => setActiveSkillBarIndex(0)}
                >
                  {/* Floating Tooltip with Pointer (Anchored right above the orange bar's top) */}
                  <div
                    className={`absolute z-30 transition-all duration-200 ease-out pointer-events-none ${
                      isHovered
                        ? 'opacity-100 -translate-y-1 scale-100'
                        : 'opacity-0 translate-y-0 scale-95'
                    }`}
                    style={{
                      bottom: `calc(${heightPercent}% + 10px)`,
                    }}
                  >
                    <div className="bg-[#111827] dark:bg-black text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                      <span className="text-slate-300 font-medium">{cleanName}:</span>
                      <span className="text-terracotta-400 font-bold">{skill.count} roles</span>
                      <span className="text-emerald-400 font-mono text-[10px]">({skill.percent}%)</span>
                    </div>
                    <div className="w-2.5 h-2.5 bg-[#111827] dark:bg-black rotate-45 mx-auto -mt-1.5 border-r border-b border-white/10" />
                  </div>

                  {/* Rounded Rectangular Slot (Wider + Rounded Rectangle shape) */}
                  <div className="w-6 sm:w-8 md:w-10 lg:w-12 h-full rounded-xl sm:rounded-2xl bg-[#F1F3F6] dark:bg-white/[0.07] relative flex items-end justify-center overflow-hidden">
                    {/* Foreground Vibrant Terracotta Bar (Rounded Rectangle rising from bottom) */}
                    <div
                      className={`w-full rounded-t-xl sm:rounded-t-2xl transition-all duration-700 ease-out ${
                        isHovered ? 'bg-[#EA580C] shadow-md brightness-105' : 'bg-terracotta-500'
                      }`}
                      style={{
                        height: isLoaded ? `${heightPercent}%` : '0%',
                      }}
                    />
                  </div>

                  {/* 2-Line Fully Visible Centered Skill Label on X-Axis */}
                  <div className="h-10 sm:h-12 flex items-start justify-center pt-2.5 w-full">
                    <span
                      className={`text-[10px] sm:text-xs font-medium text-center line-clamp-2 leading-[1.25] break-words max-w-[80px] sm:max-w-[100px] transition-colors select-none ${
                        isHovered
                          ? 'text-brand-ink dark:text-darkBrand-ink font-bold'
                          : 'text-brand-secondary dark:text-darkBrand-secondary'
                      }`}
                      title={skill.name}
                    >
                      {cleanName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

