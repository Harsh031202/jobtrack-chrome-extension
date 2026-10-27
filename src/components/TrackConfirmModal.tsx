import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, APPLICATION_STATUSES } from '../types/application';
import { ExtractedJobData } from '../types/extractor';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { STATUS_DOT_COLORS } from './StatusSelect';
import { checkDuplicateApplication, DuplicateCheckResult } from '../lib/duplicate';
import { Check, AlertCircle, RefreshCw, Calendar, Users, Cpu } from 'lucide-react';
import { formatDisplayDate } from '../lib/normalizer';

interface TrackConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: ExtractedJobData | null;
  pageUrl: string;
  existingApplications: JobApplication[];
  onConfirmTrack: (application: JobApplication) => Promise<void>;
  onOpenExisting: (appId: string) => void;
  isLoadingExtraction?: boolean;
  extractionWarning?: string;
  hasApiKey?: boolean;
  onOpenSettings?: () => void;
  onDecline?: () => void;
}

export const TrackConfirmModal: React.FC<TrackConfirmModalProps> = ({
  isOpen,
  onClose,
  extractedData,
  pageUrl,
  existingApplications,
  onConfirmTrack,
  onOpenExisting,
  isLoadingExtraction = false,
  extractionWarning,
  hasApiKey = false,
  onOpenSettings,
  onDecline,
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [vacancies, setVacancies] = useState('Not specified');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [companyDomain, setCompanyDomain] = useState<string | undefined>();
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | undefined>();

  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult>({ isDuplicate: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (extractedData) {
      setCompany(extractedData.company || '');
      setRole(extractedData.role || '');
      setLocation(extractedData.location || '');
      setSalary(extractedData.salary || 'Not specified');
      setAppliedDate(extractedData.appliedDate || new Date().toISOString().slice(0, 10));
      setEndDate(extractedData.endDate || '');
      setVacancies(extractedData.vacancies || 'Not specified');
      setStatus(extractedData.status || 'Applied');
      setSummary(extractedData.summary || '');
      setSkills(extractedData.skills || []);
      setCompanyDomain(extractedData.companyDomain);
      setCompanyLogoUrl(extractedData.companyLogoUrl);
      setSaveSuccess(false);

      // Check duplicates
      const dup = checkDuplicateApplication(
        { url: pageUrl, company: extractedData.company, role: extractedData.role },
        existingApplications
      );
      setDuplicateResult(dup);
    }
  }, [extractedData, pageUrl, existingApplications]);

  const handleSave = async (isUpdatingExisting = false) => {
    if (!company.trim() || !role.trim()) return;

    setIsSaving(true);
    try {
      const targetId =
        isUpdatingExisting && duplicateResult.existingApp
          ? duplicateResult.existingApp.id
          : 'job_' + Math.random().toString(36).substring(2, 9);

      const targetCreatedAt =
        isUpdatingExisting && duplicateResult.existingApp
          ? duplicateResult.existingApp.createdAt
          : new Date().toISOString();

      const newApp: JobApplication = {
        id: targetId,
        company: company.trim(),
        companyDomain,
        companyLogoUrl,
        role: role.trim(),
        location: location.trim() || 'Not specified',
        salary: salary.trim() || 'Not specified',
        appliedAt: appliedDate,
        endDate: endDate ? endDate : null,
        vacancies: vacancies.trim() || 'Not specified',
        status,
        source: extractedData?.source || 'Web Listing',
        jobUrl: pageUrl,
        description: extractedData?.description || '',
        summary: summary.trim(),
        skills,
        notes: notes.trim(),
        timeline: isUpdatingExisting && duplicateResult.existingApp?.timeline
          ? duplicateResult.existingApp.timeline
          : [
              {
                id: 'evt_init',
                type: 'Application Tracked',
                date: appliedDate,
                status,
              },
            ],
        createdAt: targetCreatedAt,
        updatedAt: new Date().toISOString(),
      };

      await onConfirmTrack(newApp);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 800);
    } catch (err) {
      console.error('Error saving application:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={saveSuccess ? 'Tracked' : 'Track This Application'}
      description={
        saveSuccess
          ? 'Application successfully saved to your dashboard.'
          : 'Review and confirm extracted details before tracking.'
      }
      maxWidth="md"
    >
      {isLoadingExtraction ? (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-brand-ink dark:text-darkBrand-ink">
              Analyzing job listing…
            </p>
            <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
              Reading page DOM, company, role, deadline and vacancies.
            </p>
          </div>
        </div>
      ) : saveSuccess ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-lime-400 flex items-center justify-center">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-xs font-semibold text-brand-ink dark:text-darkBrand-ink">
            Application Tracked
          </p>
          <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
            {company} — {role}
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Duplicate Detection Alert */}
          {duplicateResult.isDuplicate && duplicateResult.existingApp && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-950 dark:text-amber-100 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    This job application is already tracked
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium">
                    {duplicateResult.existingApp.company} — {duplicateResult.existingApp.role}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400/80 font-mono">
                    Tracked on {formatDisplayDate(duplicateResult.existingApp.appliedAt)} • Status:{' '}
                    {duplicateResult.existingApp.status}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1 border-t border-amber-200/60 dark:border-amber-500/20">
                <Button
                  size="xs"
                  variant="outline"
                  className="border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/20"
                  onClick={() => {
                    onClose();
                    if (duplicateResult.existingApp) {
                      onOpenExisting(duplicateResult.existingApp.id);
                    }
                  }}
                >
                  Open Existing
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => handleSave(true)}
                  isLoading={isSaving}
                >
                  Update Information
                </Button>
              </div>
            </div>
          )}

          {/* API Key Hint if not configured */}
          {!hasApiKey && (
            <div className="p-2.5 rounded-xl bg-brand-pillBg dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border flex items-center justify-between text-xs gap-2">
              <div>
                <p className="font-semibold text-brand-ink dark:text-darkBrand-ink flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Extraction Ready</span>
                </p>
                <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary mt-0.5">
                  Set OpenRouter or Gemini in Settings for automated summary extraction.
                </p>
              </div>
              {onOpenSettings && (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                >
                  Configure Key
                </Button>
              )}
            </div>
          )}

          {extractionWarning && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 text-[11px] border border-amber-200 dark:border-amber-500/30 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{extractionWarning}</span>
            </div>
          )}

          {/* Editable Fields Form */}
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Company *"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
              required
            />
            <Input
              label="Role / Title *"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India or Remote"
            />
            <Input
              label="Compensation / CTC"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. ₹18 LPA or Not specified"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Applied Date *"
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              required
            />
            <div>
              <Select<ApplicationStatus>
                label="Status"
                value={status}
                onChange={(val) => setStatus(val)}
                options={APPLICATION_STATUSES.map((st) => ({
                  value: st,
                  label: st,
                  dotColor: STATUS_DOT_COLORS[st] || 'bg-brand-secondary',
                }))}
                size="sm"
              />
            </div>
          </div>

          {/* End Date (Deadline) & Vacancies */}
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="End Date (Deadline)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              leftAddon={<Calendar className="w-3.5 h-3.5" />}
            />
            <Input
              label="Vacancies / Openings"
              value={vacancies}
              onChange={(e) => setVacancies(e.target.value)}
              placeholder="e.g. 5 openings or 1"
              leftAddon={<Users className="w-3.5 h-3.5" />}
            />
          </div>

          {summary && (
            <div>
              <label className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink mb-1">
                Role Overview
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface p-2.5 text-xs text-brand-ink dark:text-darkBrand-ink focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 shadow-subtle"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink mb-1">
              Personal Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Referred by Dave, prepare system design..."
              className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface px-3 py-2 text-xs text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 shadow-subtle"
            />
          </div>

          {/* Footer Controls — Structured 2-row layout to eliminate button overlap */}
          <div className="pt-3 border-t border-brand-border dark:border-darkBrand-border space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-brand-secondary dark:text-darkBrand-secondary font-mono truncate max-w-[180px]">
                Source: {extractedData?.source || 'Web'}
              </span>
              {onDecline && (
                <button
                  type="button"
                  onClick={onDecline}
                  disabled={isSaving}
                  className="text-coral-600 dark:text-coral-400 hover:text-coral-700 dark:hover:text-coral-300 font-semibold text-xs hover:underline cursor-pointer"
                >
                  Decline Application
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSave(false)}
                isLoading={isSaving}
                disabled={!company.trim() || !role.trim()}
              >
                Track Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
