import React, { useState, useEffect, useMemo } from 'react';
import { JobApplication } from '../types/application';
import { UserSettings } from '../types/settings';
import { ExtractedJobData } from '../types/extractor';
import {
  getStoredApplications,
  saveApplication,
  updateApplication,
  deleteApplication,
  getSettings,
  saveSettings,
  clearAllApplications,
} from '../lib/storage';
import { SAMPLE_APPLICATIONS } from '../lib/demo-data';
import { extractFromActiveTab } from '../lib/extraction/tab-runner';
import { performJobExtraction } from '../lib/llm/provider';
import { BrandLogo } from './BrandLogo';
import { Header } from './Header';
import { StatsOverview, OverviewTabFilter } from './StatsOverview';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationFormModal } from './ApplicationFormModal';
import { TrackConfirmModal } from './TrackConfirmModal';
import { SettingsModal } from './SettingsModal';
import { CommandPalette } from './CommandPalette';
import { Button } from './ui/Button';
import {
  Search,
  Sparkles,
  Briefcase,
  AlertCircle,
  Plus,
  BarChart2,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { formatDateBlock, parseVacancies, parseSalaryToAnnualValue } from '../lib/normalizer';

interface DashboardViewProps {
  mode: 'popup' | 'sidepanel' | 'dashboard';
}

export const DashboardView: React.FC<DashboardViewProps> = ({ mode }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Active navigation sidebar tab
  const [activeNav, setActiveNav] = useState<'applications' | 'analytics' | 'settings'>('applications');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [overviewFilter, setOverviewFilter] = useState<OverviewTabFilter>('all');
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<
    | 'appliedAt_desc'
    | 'appliedAt_asc'
    | 'endDate_asc'
    | 'company_asc'
    | 'company_desc'
    | 'vacancies_desc'
    | 'vacancies_asc'
    | 'salary_desc'
    | 'salary_asc'
  >('appliedAt_desc');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [extractedJobData, setExtractedJobData] = useState<ExtractedJobData | null>(null);
  const [currentPageUrl, setCurrentPageUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionWarning, setExtractionWarning] = useState<string | undefined>();
  const [trackError, setTrackError] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load data & settings on mount
  const refreshData = async () => {
    const list = await getStoredApplications();
    setApplications(list);
  };

  useEffect(() => {
    (async () => {
      const savedSettings = await getSettings();
      setSettings(savedSettings);

      // System / Saved theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark =
        savedSettings.theme === 'dark' || (savedSettings.theme === 'system' && prefersDark);
      setIsDarkMode(shouldUseDark);
      if (shouldUseDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      await refreshData();
    })();
  }, []);

  // Listen for background keyboard shortcut tracking triggers
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (msg: any) => {
        if (msg.action === 'TRIGGER_TRACK_CURRENT_PAGE') {
          handleTrackCurrentPage();
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [settings]);

  // Global Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (settings) {
      const updated: UserSettings = {
        ...settings,
        theme: next ? 'dark' : 'light',
      };
      setSettings(updated);
      saveSettings(updated);
    }
  };

  // Explicit Track Current Page Workflow
  const handleTrackCurrentPage = async () => {
    setTrackError(null);
    setExtractionWarning(undefined);
    setIsExtracting(true);
    setIsTrackModalOpen(true);

    try {
      const tabRes = await extractFromActiveTab();
      if (!tabRes.success || !tabRes.pageData) {
        setTrackError(tabRes.error || 'Failed to inspect current tab.');
        setIsExtracting(false);
        return;
      }

      setCurrentPageUrl(tabRes.pageData.url);

      const currentSettings = settings || (await getSettings());
      const extractionRes = await performJobExtraction(
        tabRes.pageData,
        currentSettings.ai
      );

      setExtractedJobData(extractionRes.data);
      if (extractionRes.warning) {
        setExtractionWarning(extractionRes.warning);
      }
    } catch (err: any) {
      setTrackError(err.message || 'Error extracting job details.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmTrack = async (newApp: JobApplication) => {
    await saveApplication(newApp);
    await refreshData();
  };

  const handleUpdateApplication = async (id: string, updates: Partial<JobApplication>) => {
    await updateApplication(id, updates);
    await refreshData();
  };

  const handleDeleteApplication = async (id: string) => {
    if (confirm('Delete this application record?')) {
      await deleteApplication(id);
      await refreshData();
    }
  };

  const handleLoadDemoData = async () => {
    for (const app of SAMPLE_APPLICATIONS) {
      await saveApplication(app);
    }
    await refreshData();
  };

  const handleOpenExistingApp = (appId: string) => {
    setExpandedId(appId);
    setOverviewFilter('all');
    setClosingSoonOnly(false);
    setSearchQuery('');
  };

  // Nav item handlers
  const handleNavClick = (nav: 'applications' | 'analytics' | 'settings') => {
    setActiveNav(nav);
    if (nav === 'settings') {
      setIsSettingsOpen(true);
    }
  };

  const NAV_ITEMS = [
    { id: 'applications', label: 'All applications', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ] as const;

  const activeNavIndex = useMemo(() => {
    if (activeNav === 'analytics') return 1;
    if (activeNav === 'settings') return 2;
    return 0;
  }, [activeNav]);

  // Filter & Sort Logic
  const filteredApplications = useMemo(() => {
    const nowStr = new Date().toISOString().slice(0, 10);
    const currentMonthStr = nowStr.slice(0, 7);
    const next14Days = new Date();
    next14Days.setDate(next14Days.getDate() + 14);
    const next14Str = next14Days.toISOString().slice(0, 10);

    return applications
      .filter((app) => {
        // Tab filter: 'all' | 'applied' | 'in_this_month' | 'past_tracks'
        if (overviewFilter === 'applied') {
          if (app.status !== 'Applied') return false;
        } else if (overviewFilter === 'in_this_month') {
          if (!app.appliedAt || !app.appliedAt.startsWith(currentMonthStr)) return false;
        } else if (overviewFilter === 'past_tracks') {
          const isTerminal = app.status === 'Rejected' || app.status === 'Withdrawn' || app.status === 'Offer';
          const isOlderMonth = Boolean(app.appliedAt && app.appliedAt.slice(0, 7) < currentMonthStr);
          if (!isTerminal && !isOlderMonth) return false;
        }

        // Closing Soon filter (active deadline within 14 days)
        if (closingSoonOnly) {
          if (!app.endDate || app.endDate < nowStr || app.endDate > next14Str) {
            return false;
          }
        }

        // Source filter
        if (sourceFilter !== 'All' && app.source !== sourceFilter) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = app.company.toLowerCase().includes(q);
          const matchRole = app.role.toLowerCase().includes(q);
          const matchNotes = (app.notes || '').toLowerCase().includes(q);
          const matchSkills = (app.skills || []).some((s) => s.toLowerCase().includes(q));
          if (!matchCompany && !matchRole && !matchNotes && !matchSkills) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'appliedAt_desc') {
          const dateA = a.appliedAt + (a.createdAt ? `T${a.createdAt.slice(11)}` : '');
          const dateB = b.appliedAt + (b.createdAt ? `T${b.createdAt.slice(11)}` : '');
          return dateB.localeCompare(dateA);
        }
        if (sortBy === 'appliedAt_asc') {
          const dateA = a.appliedAt + (a.createdAt ? `T${a.createdAt.slice(11)}` : '');
          const dateB = b.appliedAt + (b.createdAt ? `T${b.createdAt.slice(11)}` : '');
          return dateA.localeCompare(dateB);
        }
        if (sortBy === 'endDate_asc') {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return a.endDate.localeCompare(b.endDate);
        }
        if (sortBy === 'company_asc') {
          return a.company.localeCompare(b.company, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'company_desc') {
          return b.company.localeCompare(a.company, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'vacancies_desc') {
          const vacA = parseVacancies(a.vacancies);
          const vacB = parseVacancies(b.vacancies);
          if (vacB !== vacA) return vacB - vacA;
          return a.company.localeCompare(b.company);
        }
        if (sortBy === 'vacancies_asc') {
          const vacA = parseVacancies(a.vacancies);
          const vacB = parseVacancies(b.vacancies);
          if (vacA !== vacB) return vacA - vacB;
          return a.company.localeCompare(b.company);
        }
        if (sortBy === 'salary_desc') {
          const salA = parseSalaryToAnnualValue(a.salary);
          const salB = parseSalaryToAnnualValue(b.salary);
          if (salB !== salA) return salB - salA;
          return a.company.localeCompare(b.company);
        }
        if (sortBy === 'salary_asc') {
          const salA = parseSalaryToAnnualValue(a.salary);
          const salB = parseSalaryToAnnualValue(b.salary);
          if (salA !== salB) return salA - salB;
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [applications, overviewFilter, closingSoonOnly, sourceFilter, searchQuery, sortBy]);

  // Group applications: by Month when sorted by date, or unified collection with clear section title when sorted by company/vacancies/CTC
  const groupedSections = useMemo(() => {
    if (filteredApplications.length === 0) return [];

    if (sortBy === 'company_asc') {
      return [{ sectionLabel: 'All Applications (Company A → Z)', items: filteredApplications }];
    }
    if (sortBy === 'company_desc') {
      return [{ sectionLabel: 'All Applications (Company Z → A)', items: filteredApplications }];
    }
    if (sortBy === 'vacancies_desc') {
      return [{ sectionLabel: 'All Applications (Highest Vacancies First)', items: filteredApplications }];
    }
    if (sortBy === 'vacancies_asc') {
      return [{ sectionLabel: 'All Applications (Lowest Vacancies First)', items: filteredApplications }];
    }
    if (sortBy === 'salary_desc') {
      return [{ sectionLabel: 'All Applications (Highest CTC / Salary First)', items: filteredApplications }];
    }
    if (sortBy === 'salary_asc') {
      return [{ sectionLabel: 'All Applications (Lowest CTC / Salary First)', items: filteredApplications }];
    }
    if (sortBy === 'endDate_asc') {
      return [{ sectionLabel: 'All Applications (Closing Soonest)', items: filteredApplications }];
    }

    // Default: Group by Month of application/tracking for Date & Time sorting
    const groups: { sectionLabel: string; items: JobApplication[] }[] = [];
    const map = new Map<string, JobApplication[]>();

    filteredApplications.forEach((app) => {
      const dateStr = app.appliedAt;
      const { monthName, year } = formatDateBlock(dateStr);
      const key = monthName ? `${monthName} ${year}` : 'Other';

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(app);
    });

    map.forEach((items, sectionLabel) => {
      groups.push({ sectionLabel, items });
    });

    return groups;
  }, [filteredApplications, sortBy]);

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.source) set.add(a.source);
    });
    return Array.from(set);
  }, [applications]);

  const showSidebar = mode === 'dashboard';

  return (
    <div className="min-h-screen flex bg-brand-bg dark:bg-darkBrand-bg text-brand-ink dark:text-darkBrand-ink transition-colors duration-150">
      {/* 1. Tabato Left Navigation Sidebar (Desktop Dashboard Mode) */}
      {showSidebar && (
        <aside className="w-60 bg-white dark:bg-darkBrand-surface border-r border-brand-border dark:border-darkBrand-border p-6 flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-8">
            {/* Tabato Logo & Wordmark */}
            <div className="px-2">
              <BrandLogo size="md" />
            </div>

            {/* Navigation Items with Smooth Sliding Active Indicator */}
            <nav className="relative space-y-1 text-sm font-medium">
              {/* Smooth Gliding Active Pill */}
              <div
                className="absolute left-0 right-0 h-10 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xs"
                style={{
                  transform: `translateY(${activeNavIndex * 44}px)`,
                }}
              />

              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeNavIndex === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as any)}
                    className={`relative z-10 w-full h-10 flex items-center gap-3 px-3 rounded-xl select-none transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'text-brand-ink dark:text-darkBrand-ink font-semibold'
                        : 'text-brand-secondary dark:text-darkBrand-secondary hover:text-brand-ink dark:hover:text-darkBrand-ink'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-brand-ink dark:text-darkBrand-ink'
                          : 'text-brand-secondary dark:text-darkBrand-secondary'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Theme Toggle */}
          <div className="pt-6 border-t border-brand-border dark:border-darkBrand-border">
            <button
              onClick={handleToggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-brand-secondary dark:text-darkBrand-secondary hover:text-brand-ink dark:hover:text-darkBrand-ink hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!showSidebar && (
          <Header
            onAddApplication={() => {
              setEditingApplication(null);
              setIsFormModalOpen(true);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            isPopup={mode === 'popup'}
            isSidePanel={mode === 'sidepanel'}
          />
        )}

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Tabato Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-darkBrand-ink">
                {activeNav === 'analytics'
                  ? 'Analytics'
                  : activeNav === 'settings'
                  ? 'Settings'
                  : 'All Applications'}
              </h1>
              <p className="text-xs sm:text-sm text-brand-secondary dark:text-darkBrand-secondary mt-1">
                {activeNav === 'analytics'
                  ? 'Track your application search velocity, conversion rates, and response metrics.'
                  : 'See your scheduled events from your calendar and tracked job listings.'}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingApplication(null);
                  setIsFormModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Manually
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={handleTrackCurrentPage}
                isLoading={isExtracting}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Track Current Tab
              </Button>
            </div>
          </div>

          {trackError && (
            <div className="p-3.5 rounded-xl bg-terracotta-50 dark:bg-terracotta-900/30 border border-terracotta-200 dark:border-terracotta-800/40 text-terracotta-700 dark:text-terracotta-300 text-xs flex items-center justify-between gap-3 shadow-subtle">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-terracotta-500" />
                <span>{trackError}</span>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setTrackError(null);
                  setEditingApplication(null);
                  setIsFormModalOpen(true);
                }}
              >
                Add Manually
              </Button>
            </div>
          )}

          {activeNav === 'analytics' ? (
            /* Analytics Section */
            <div className="space-y-6 pt-2">
              <div className="p-6 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-brand-ink dark:text-darkBrand-ink">
                      Application Analytics
                    </h2>
                    <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary">
                      Comprehensive insights and performance metrics across your job search.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60 space-y-1">
                    <span className="block text-[11px] font-medium text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider">
                      Total Tracked
                    </span>
                    <span className="block text-2xl font-bold font-mono text-brand-ink dark:text-darkBrand-ink">
                      {applications.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60 space-y-1">
                    <span className="block text-[11px] font-medium text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider">
                      This Month
                    </span>
                    <span className="block text-2xl font-bold font-mono text-brand-ink dark:text-darkBrand-ink">
                      {applications.filter((a) => a.appliedAt && a.appliedAt.startsWith(new Date().toISOString().slice(0, 7))).length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60 space-y-1">
                    <span className="block text-[11px] font-medium text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider">
                      Active In Progress
                    </span>
                    <span className="block text-2xl font-bold font-mono text-brand-ink dark:text-darkBrand-ink">
                      {applications.filter((a) => a.status !== 'Rejected' && a.status !== 'Withdrawn').length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60 space-y-1">
                    <span className="block text-[11px] font-medium text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider">
                      Offers
                    </span>
                    <span className="block text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {applications.filter((a) => a.status === 'Offer').length}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-dashed border-brand-border dark:border-darkBrand-border text-center space-y-1.5 text-xs text-brand-secondary dark:text-darkBrand-secondary bg-black/[0.01] dark:bg-white/[0.01]">
                  <p className="font-semibold text-sm text-brand-ink dark:text-darkBrand-ink">
                    Advanced Analytics & Charts
                  </p>
                  <p className="max-w-md mx-auto text-brand-muted dark:text-darkBrand-muted">
                    Conversion funnel, interview response rates, and salary distribution graphs will be available in the upcoming analytics expansion.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tabato Segmented Filter Pill Bar (All, Applied, In this month, Past tracks) */}
              <StatsOverview
                applications={applications}
                selectedFilter={overviewFilter}
                closingSoonOnly={closingSoonOnly}
                onSelectFilter={(flt) => {
                  setOverviewFilter(flt);
                  setClosingSoonOnly(false);
                }}
                onToggleClosingSoon={() => setClosingSoonOnly(!closingSoonOnly)}
              />

          {/* Search & Secondary Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-brand-muted dark:text-darkBrand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, role, skill, or notes..."
                className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface pl-11 pr-8 py-2 text-xs text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors shadow-subtle"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-black/[0.04]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Source Filter & Sort By Dropdowns */}
            <div className="flex items-center gap-2">
              {uniqueSources.length > 0 && (
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface px-3 py-2 text-xs font-medium text-brand-secondary dark:text-darkBrand-secondary hover:text-brand-ink dark:hover:text-darkBrand-ink focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 cursor-pointer shadow-subtle"
                  aria-label="Filter by Source"
                >
                  <option value="All">All Sources</option>
                  {uniqueSources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface px-3 py-2 text-xs font-medium text-brand-secondary dark:text-darkBrand-secondary hover:text-brand-ink dark:hover:text-darkBrand-ink focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 cursor-pointer shadow-subtle"
                aria-label="Sort applications"
              >
                <optgroup label="Date & Time">
                  <option value="appliedAt_desc">Date & Time (Newest)</option>
                  <option value="appliedAt_asc">Date & Time (Oldest)</option>
                  <option value="endDate_asc">Deadline (Closing Soonest)</option>
                </optgroup>
                <optgroup label="Company Name">
                  <option value="company_asc">Company (A → Z)</option>
                  <option value="company_desc">Company (Z → A)</option>
                </optgroup>
                <optgroup label="Vacancies">
                  <option value="vacancies_desc">Vacancies (High → Low)</option>
                  <option value="vacancies_asc">Vacancies (Low → High)</option>
                </optgroup>
                <optgroup label="CTC / Salary">
                  <option value="salary_desc">CTC / Salary (High → Low)</option>
                  <option value="salary_asc">CTC / Salary (Low → High)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Tabato Card List (Grouped by Month for date sorts, or sorted collection for company/vacancies/CTC) */}
          <div className="space-y-6 pt-1">
            {groupedSections.length > 0 ? (
              groupedSections.map((group) => (
                <section key={group.sectionLabel} className="space-y-3">
                  <h2 className="text-xs sm:text-sm font-bold text-brand-ink dark:text-darkBrand-ink uppercase tracking-wider px-1">
                    {group.sectionLabel}
                  </h2>

                  <div className="space-y-2.5">
                    {group.items.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        isDashboard={mode === 'dashboard'}
                        isExpanded={expandedId === app.id}
                        onToggleExpand={() =>
                          setExpandedId((prev) => (prev === app.id ? null : app.id))
                        }
                        onUpdate={handleUpdateApplication}
                        onDelete={handleDeleteApplication}
                        onOpenEditModal={(target) => {
                          setEditingApplication(target);
                          setIsFormModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              /* Empty State */
              <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-brand-border dark:border-darkBrand-border bg-white/60 dark:bg-darkBrand-surface/40 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-brand-pillBg dark:bg-darkBrand-elevated flex items-center justify-center text-brand-secondary dark:text-darkBrand-secondary">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-ink dark:text-darkBrand-ink">
                    {searchQuery || overviewFilter !== 'all' || closingSoonOnly
                      ? 'No matching applications found'
                      : 'No applications tracked yet.'}
                  </p>
                  <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary max-w-sm mx-auto leading-relaxed mt-1">
                    {searchQuery || overviewFilter !== 'all' || closingSoonOnly
                      ? 'Try adjusting your filters or clearing search terms to see your tracked jobs.'
                      : 'Browse a job listing and instruct JobTrack to extract details and track your application.'}
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  {searchQuery || overviewFilter !== 'all' || closingSoonOnly ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setOverviewFilter('all');
                        setClosingSoonOnly(false);
                        setSourceFilter('All');
                      }}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => {
                          setEditingApplication(null);
                          setIsFormModalOpen(true);
                        }}
                        leftIcon={<Plus className="w-3 h-3" />}
                      >
                        Add Manually
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={handleLoadDemoData}
                      >
                        Load Sample Data
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </main>
      </div>

      {/* Manual / Edit Modal */}
      <ApplicationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={editingApplication}
        onSave={async (savedApp) => {
          await saveApplication(savedApp);
          await refreshData();
        }}
      />

      {/* Track Confirmation Surface */}
      <TrackConfirmModal
        isOpen={isTrackModalOpen}
        onClose={() => {
          setIsTrackModalOpen(false);
          setIsExtracting(false);
        }}
        extractedData={extractedJobData}
        pageUrl={currentPageUrl}
        existingApplications={applications}
        onConfirmTrack={handleConfirmTrack}
        onOpenExisting={handleOpenExistingApp}
        isLoadingExtraction={isExtracting}
        extractionWarning={extractionWarning}
        hasApiKey={!!settings?.ai?.apiKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      {settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            if (activeNav === 'settings') {
              setActiveNav('applications');
            }
          }}
          settings={settings}
          onSaveSettings={async (newSet) => {
            await saveSettings(newSet);
            setSettings(newSet);
          }}
          applications={applications}
          onRefreshApplications={refreshData}
          onClearAllData={async () => {
            await clearAllApplications();
            await refreshData();
          }}
          onLoadDemoData={handleLoadDemoData}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onTrackCurrent={handleTrackCurrentPage}
        onAddManual={() => {
          setEditingApplication(null);
          setIsFormModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onFilterStatus={(st) => {
          if (st === 'Applied') {
            setOverviewFilter('applied');
          } else {
            setSearchQuery(st);
          }
          setClosingSoonOnly(false);
        }}
        onExport={() => setIsSettingsOpen(true)}
      />
    </div>
  );
};
