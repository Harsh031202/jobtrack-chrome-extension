import React, { useState, useEffect } from 'react';
import { JobApplication } from '../types/application';
import { UserSettings } from '../types/settings';
import { ExtractedJobData } from '../types/extractor';
import {
  getStoredApplications,
  saveApplication,
  getSettings,
  saveSettings,
  clearAllApplications,
} from '../lib/storage';
import { extractFromActiveTab } from '../lib/extraction/tab-runner';
import { performJobExtraction } from '../lib/llm/provider';
import { BrandLogo } from '../components/BrandLogo';
import { TrackConfirmModal } from '../components/TrackConfirmModal';
import { ApplicationFormModal } from '../components/ApplicationFormModal';
import { SettingsModal } from '../components/SettingsModal';
import { CompanyLogo } from '../components/CompanyLogo';
import { Button } from '../components/ui/Button';
import {
  ExternalLink,
  Sidebar,
  Sliders,
  Plus,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatDateBlock, formatDueByDate } from '../lib/normalizer';

interface MiniDateBlockProps {
  appliedAt?: string | null;
  endDate?: string | null;
  isUrgent?: boolean;
}

const MiniDateBlock: React.FC<MiniDateBlockProps> = ({ appliedAt, endDate, isUrgent }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { dayName: appliedDayName, dayNumber: appliedDayNumber, monthName: appliedMonthName, year: appliedYear } = formatDateBlock(appliedAt);
  const { dayNumber: dueDayNumber, monthName: dueMonthName, year: dueYear } = formatDateBlock(endDate);
  const hasDueDate = Boolean(endDate);
  const isDifferentMonth = Boolean(hasDueDate && (dueMonthName !== appliedMonthName || dueYear !== appliedYear));

  return (
    <div
      className="flex items-center shrink-0 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={hasDueDate ? `Due by ${formatDueByDate(endDate)}` : 'No deadline set'}
    >
      <div className="w-10 h-10 relative select-none flex items-center justify-center">
        {/* Default State: Applied Date (smooth fade out on hover) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity ease-in-out ${
            isHovered
              ? 'opacity-0 duration-300 delay-0 pointer-events-none'
              : 'opacity-100 duration-400 delay-0'
          }`}
        >
          <span
            className={`block text-[10px] font-semibold uppercase tracking-wider ${
              isUrgent ? 'text-terracotta-500 font-bold' : 'text-brand-secondary dark:text-darkBrand-secondary'
            }`}
          >
            {appliedDayName}
          </span>
          <span
            className={`block text-lg font-bold font-sans tracking-tight leading-none mt-0.5 ${
              isUrgent ? 'text-terracotta-500' : 'text-brand-ink dark:text-darkBrand-ink'
            }`}
          >
            {appliedDayNumber}
          </span>
        </div>

        {/* Hover State: "due by" + Due Date (fade in delayed by 0.3s, 3-lines if different month) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity ease-in-out ${
            isHovered
              ? 'opacity-100 duration-400 delay-300'
              : 'opacity-0 duration-300 delay-0 pointer-events-none'
          }`}
        >
          {isDifferentMonth ? (
            <>
              <span className="block text-[8px] font-semibold uppercase tracking-tight text-red-500 dark:text-red-400 whitespace-nowrap leading-none">
                due by
              </span>
              <span className="block text-sm font-bold font-sans tracking-tight leading-none text-red-500 dark:text-red-400 my-0.5">
                {dueDayNumber}
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 leading-none">
                {dueMonthName}
              </span>
            </>
          ) : (
            <>
              <span className="block text-[9px] font-semibold uppercase tracking-tight text-red-500 dark:text-red-400 whitespace-nowrap">
                due by
              </span>
              <span className="block text-lg font-bold font-sans tracking-tight leading-none mt-0.5 text-red-500 dark:text-red-400">
                {hasDueDate ? dueDayNumber : '—'}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="w-px h-7 bg-brand-border dark:bg-darkBrand-border mx-2.5 shrink-0" />
    </div>
  );
};

export const PopupApp: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Tab preview state
  const [tabTitle, setTabTitle] = useState('');
  const [tabUrl, setTabUrl] = useState('');
  const [isJobPageHint, setIsJobPageHint] = useState(false);
  const [sourceName, setSourceName] = useState('');

  // Tracking modal & button states
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedJobData, setExtractedJobData] = useState<ExtractedJobData | null>(null);
  const [extractionWarning, setExtractionWarning] = useState<string | undefined>();
  const [trackError, setTrackError] = useState<string | null>(null);
  const [justTracked, setJustTracked] = useState(false);

  // Form & Settings modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const refreshData = async () => {
    const list = await getStoredApplications();
    setApplications(list);
  };

  useEffect(() => {
    (async () => {
      const savedSettings = await getSettings();
      setSettings(savedSettings);

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

      // Read active tab info
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            setTabTitle(tab.title || '');
            setTabUrl(tab.url || '');
            const urlLow = (tab.url || '').toLowerCase();
            const isJob =
              urlLow.includes('job') ||
              urlLow.includes('career') ||
              urlLow.includes('lever.co') ||
              urlLow.includes('greenhouse.io') ||
              urlLow.includes('workday') ||
              urlLow.includes('naukri.com') ||
              urlLow.includes('indeed.com') ||
              urlLow.includes('wellfound.com') ||
              urlLow.includes('internshala.com') ||
              urlLow.includes('linkedin.com/jobs');
            setIsJobPageHint(isJob);

            // Extract source name
            if (urlLow.includes('linkedin')) setSourceName('LinkedIn');
            else if (urlLow.includes('greenhouse')) setSourceName('Greenhouse');
            else if (urlLow.includes('lever.co')) setSourceName('Lever');
            else if (urlLow.includes('indeed')) setSourceName('Indeed');
            else if (urlLow.includes('naukri')) setSourceName('Naukri');
            else if (urlLow.includes('wellfound')) setSourceName('Wellfound');
            else if (tab.url) {
              try {
                const domain = new URL(tab.url).hostname.replace(/^www\./, '');
                setSourceName(domain.split('.')[0]);
              } catch {
                setSourceName('Web');
              }
            }
          }
        } catch (e) {
          console.debug('Popup tab query error:', e);
        }
      } else {
        setTabTitle('Senior Software Engineer - Distributed Systems at Stripe');
        setTabUrl('https://www.linkedin.com/jobs/view/3948572019/');
        setIsJobPageHint(true);
        setSourceName('LinkedIn');
      }
    })();
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
      const updated = { ...settings, theme: next ? ('dark' as const) : ('light' as const) };
      setSettings(updated);
      saveSettings(updated);
    }
  };

  const handleTrackCurrent = async () => {
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

      const currentSettings = settings || (await getSettings());
      const extractionRes = await performJobExtraction(tabRes.pageData, currentSettings.ai);

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

  const handleOpenFullDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    } else {
      window.open('/dashboard.html', '_blank');
    }
  };

  const handleOpenSidePanel = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'OPEN_SIDEPANEL' });
    }
  };

  // Pipeline stats
  const total = applications.length;
  let interviewCount = 0;
  let closingSoonCount = 0;
  let offerCount = 0;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  applications.forEach((app) => {
    if (
      app.status === 'Interview' ||
      app.status === 'Technical Interview' ||
      app.status === 'HR Interview'
    ) {
      interviewCount++;
    } else if (app.status === 'Offer') {
      offerCount++;
    }
    if (app.endDate && app.endDate >= todayStr && app.endDate <= nextWeekStr) {
      closingSoonCount++;
    }
  });

  return (
    <div className="w-[390px] min-h-[490px] max-h-[620px] bg-brand-bg dark:bg-darkBrand-bg text-brand-ink dark:text-darkBrand-ink flex flex-col justify-between text-xs select-none">
      {/* 1. Tabato Header: 4-petal asterisk symbol + clean wordmark */}
      <div className="px-4 py-3 border-b border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface flex items-center justify-between">
        <BrandLogo size="md" />

        {/* Quiet utility icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleDarkMode}
            className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleOpenSidePanel}
            className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Open Side Panel (Alt+Shift+P)"
          >
            <Sidebar className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenFullDashboard}
            className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Open Full Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* HERO INTERACTION: Current Active Page & Primary CTA */}
        <div className="p-4 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle space-y-3">
          {/* Status strip */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isJobPageHint
                    ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-brand-muted dark:bg-darkBrand-muted'
                }`}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary">
                {isJobPageHint ? 'Active Job Listing' : 'Current Tab'}
              </span>
            </div>

            {sourceName && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-pillBg dark:bg-darkBrand-pillBg text-brand-secondary dark:text-darkBrand-secondary">
                {sourceName}
              </span>
            )}
          </div>

          {/* Job Page Title */}
          <div>
            <h2
              className="text-xs font-semibold text-brand-ink dark:text-darkBrand-ink line-clamp-2 leading-snug"
              title={tabTitle}
            >
              {tabTitle || 'Active Web Page'}
            </h2>
          </div>

          {/* Hero Action Button */}
          {isJobPageHint ? (
            <button
              onClick={handleTrackCurrent}
              disabled={isExtracting}
              className="w-full pressable flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white font-medium text-xs shadow-sm cursor-pointer disabled:opacity-75 disabled:pointer-events-none transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExtracting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : justTracked ? (
                  <span className="text-white font-bold">✓</span>
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white/90" />
                )}
                <span>
                  {isExtracting
                    ? 'Analyzing listing…'
                    : justTracked
                    ? 'Tracked Application'
                    : 'Track this application'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="font-mono text-[10px] opacity-80">Alt+Shift+J</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
                Doesn't look like a job listing.
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={handleTrackCurrent}
                isLoading={isExtracting}
              >
                Track anyway
              </Button>
            </div>
          )}

          {trackError && (
            <p className="text-[11px] text-terracotta-600 dark:text-terracotta-400 font-medium pt-1">
              {trackError}
            </p>
          )}
        </div>

        {/* 3. Tabato Metric Pill Strip */}
        <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1">
            <span className="font-mono font-bold text-sm text-brand-ink dark:text-darkBrand-ink">{total}</span>
            <span className="text-brand-secondary dark:text-darkBrand-secondary text-[11px]">Tracked</span>
          </div>

          <div className="flex items-center gap-2 pr-2">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="font-semibold text-brand-ink dark:text-darkBrand-ink">{interviewCount}</span>
              <span className="text-brand-secondary">Interviews</span>
            </div>

            {closingSoonCount > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500" />
                <span className="font-semibold text-terracotta-600 dark:text-terracotta-400">{closingSoonCount}</span>
                <span className="text-brand-secondary">Closing</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. RECENT APPLICATIONS: Tabato Date Block Mini Rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[11px] font-bold text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider">
              Recent Applications
            </span>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="text-[11px] text-terracotta-600 dark:text-terracotta-400 hover:text-terracotta-700 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Manual Add</span>
            </button>
          </div>

          <div className="space-y-2">
            {applications.slice(0, 3).map((app) => {
              const isUrgent = Boolean(
                app.status === 'Interview' ||
                app.status === 'Assessment' ||
                (app.endDate && app.endDate >= todayStr && app.endDate <= nextWeekStr)
              );

              return (
                <div
                  key={app.id}
                  onClick={handleOpenFullDashboard}
                  className={`p-3 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface hover:border-brand-borderStrong dark:hover:border-darkBrand-borderStrong cursor-pointer flex items-center justify-between gap-3 transition-all duration-140 group shadow-subtle ${
                    isUrgent ? 'bg-stripes' : ''
                  }`}
                >
                  {/* Tabato Mini Date Block with smooth 0.5s cross-fade to 'due by' in red */}
                  <MiniDateBlock
                    appliedAt={app.appliedAt}
                    endDate={app.endDate}
                    isUrgent={isUrgent}
                  />

                  {/* Role & Company */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink truncate group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors">
                      {app.role}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-secondary dark:text-darkBrand-secondary truncate mt-0.5">
                      <span className="truncate">{app.company}</span>
                      {app.vacancies && app.vacancies !== 'Not specified' && (
                        <>
                          <span className="text-[10px] opacity-60">•</span>
                          <span>{app.vacancies}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <CompanyLogo
                      company={app.company}
                      jobUrl={app.jobUrl}
                      companyDomain={app.companyDomain}
                      companyLogoUrl={app.companyLogoUrl}
                      isDashboard={false}
                    />
                    <ArrowRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-ink dark:group-hover:text-darkBrand-ink transition-colors" />
                  </div>
                </div>
              );
            })}

            {applications.length === 0 && (
              <div className="py-8 text-center rounded-2xl border border-dashed border-brand-border dark:border-darkBrand-border bg-white/40 dark:bg-darkBrand-surface/40 space-y-1.5">
                <p className="text-xs font-semibold text-brand-ink dark:text-darkBrand-ink">
                  No applications tracked yet.
                </p>
                <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary max-w-[240px] mx-auto leading-relaxed">
                  Track a job after you apply, and JobTrack keeps every deadline and opening organized.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Footer: Clean link to full dashboard */}
      <div className="p-3 border-t border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-center"
          onClick={handleOpenFullDashboard}
          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
        >
          Open Full Dashboard
        </Button>
      </div>

      {/* Track Confirmation Surface */}
      <TrackConfirmModal
        isOpen={isTrackModalOpen}
        onClose={() => {
          setIsTrackModalOpen(false);
          setIsExtracting(false);
        }}
        extractedData={extractedJobData}
        pageUrl={tabUrl}
        existingApplications={applications}
        onConfirmTrack={async (app) => {
          await saveApplication(app);
          await refreshData();
          setJustTracked(true);
          setTimeout(() => setJustTracked(false), 2000);
        }}
        onOpenExisting={() => handleOpenFullDashboard()}
        isLoadingExtraction={isExtracting}
        extractionWarning={extractionWarning}
        hasApiKey={!!settings?.ai?.apiKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Manual / Edit Modal */}
      <ApplicationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={async (app) => {
          await saveApplication(app);
          await refreshData();
        }}
      />

      {/* Settings Modal */}
      {settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
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
          onLoadDemoData={async () => {
            const { SAMPLE_APPLICATIONS } = await import('../lib/demo-data');
            for (const app of SAMPLE_APPLICATIONS) {
              await saveApplication(app);
            }
            await refreshData();
          }}
        />
      )}
    </div>
  );
};
