import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, APPLICATION_STATUSES } from '../types/application';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Calendar, Users } from 'lucide-react';

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: JobApplication) => Promise<void>;
  initialData?: JobApplication | null;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [source, setSource] = useState('Direct');
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [vacancies, setVacancies] = useState('Not specified');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [notes, setNotes] = useState('');
  const [skills, setSkills] = useState('');
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || '');
      setRole(initialData.role || '');
      setLocation(initialData.location || '');
      setSalary(initialData.salary || 'Not specified');
      setJobUrl(initialData.jobUrl || '');
      setSource(initialData.source || 'Direct');
      setAppliedAt(initialData.appliedAt ? initialData.appliedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setEndDate(initialData.endDate || '');
      setVacancies(initialData.vacancies || 'Not specified');
      setStatus(initialData.status || 'Applied');
      setNotes(initialData.notes || '');
      setSkills((initialData.skills || []).join(', '));
      setSummary(initialData.summary || '');
    } else {
      setCompany('');
      setRole('');
      setLocation('');
      setSalary('Not specified');
      setJobUrl('');
      setSource('Direct');
      setAppliedAt(new Date().toISOString().slice(0, 10));
      setEndDate('');
      setVacancies('Not specified');
      setStatus('Applied');
      setNotes('');
      setSkills('');
      setSummary('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setIsSaving(true);
    try {
      const skillsArr = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const targetApp: JobApplication = {
        id: initialData?.id || 'job_' + Math.random().toString(36).substring(2, 9),
        company: company.trim(),
        companyDomain: initialData?.companyDomain,
        companyLogoUrl: initialData?.companyLogoUrl,
        role: role.trim(),
        location: location.trim() || 'Not specified',
        salary: salary.trim() || 'Not specified',
        jobUrl: jobUrl.trim(),
        source: source.trim() || 'Direct',
        appliedAt,
        endDate: endDate ? endDate : null,
        vacancies: vacancies.trim() || 'Not specified',
        status,
        notes: notes.trim(),
        skills: skillsArr,
        summary: summary.trim(),
        timeline: initialData?.timeline || [
          {
            id: 'evt_init',
            type: 'Application Added',
            date: appliedAt,
            status,
          },
        ],
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(targetApp);
      onClose();
    } catch (err) {
      console.error('Failed to save application form:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Application' : 'Add Application Manually'}
      description={
        initialData
          ? 'Update details for this job application.'
          : 'Enter details for a job you applied to.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Company *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Stripe"
            required
            autoFocus
          />
          <Input
            label="Job Role / Title *"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Full Stack Engineer"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Remote or San Francisco"
          />
          <Input
            label="Compensation / CTC"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. ₹18 LPA or $140,000/yr"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Applied Date *"
            type="date"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface px-3 py-2 text-xs text-brand-ink dark:text-darkBrand-ink font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 shadow-subtle"
            >
              {APPLICATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
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

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Job Listing URL"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label="Source Platform"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. LinkedIn, Referral, Careers"
          />
        </div>

        <Input
          label="Skills (Comma-separated)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="React, TypeScript, Node.js, PostgreSQL"
        />

        <div>
          <label className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink mb-1">
            Notes / Contacts
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Referral contact, recruiter info, interview preparation points..."
            className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface p-2.5 text-xs text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 shadow-subtle"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-brand-border dark:border-darkBrand-border">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            disabled={!company.trim() || !role.trim()}
          >
            {initialData ? 'Save Changes' : 'Add Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
