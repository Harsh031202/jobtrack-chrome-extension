import React, { useState } from 'react';
import { JobApplication, TimelineEvent } from '../types/application';
import { Button } from './ui/Button';
import { TimelineView } from './TimelineView';
import {
  ExternalLink,
  Calendar,
  Edit2,
  Trash2,
  Check,
  Copy,
} from 'lucide-react';
import { formatDisplayDate } from '../lib/normalizer';

interface ApplicationDetailProps {
  application: JobApplication;
  onUpdate: (id: string, updates: Partial<JobApplication>) => void;
  onDelete: (id: string) => void;
  onOpenEditModal: (application: JobApplication) => void;
}

export const ApplicationDetail: React.FC<ApplicationDetailProps> = ({
  application,
  onUpdate,
  onDelete,
  onOpenEditModal,
}) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(application.notes || '');

  const [editingDeadline, setEditingDeadline] = useState(false);
  const [endDateVal, setEndDateVal] = useState(application.endDate || application.deadline || '');
  const [vacanciesVal, setVacanciesVal] = useState(application.vacancies || '');

  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleSaveNotes = () => {
    onUpdate(application.id, { notes: notesVal });
    setEditingNotes(false);
  };

  const handleSaveDeadlineAndVacancies = () => {
    onUpdate(application.id, {
      endDate: endDateVal || null,
      deadline: endDateVal || '',
      vacancies: vacanciesVal || 'Not specified',
    });
    setEditingDeadline(false);
  };

  const handleCopyUrl = () => {
    if (application.jobUrl) {
      navigator.clipboard.writeText(application.jobUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    }
  };

  const handleAddTimeline = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvt: TimelineEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      ...event,
    };
    onUpdate(application.id, {
      timeline: [...(application.timeline || []), newEvt],
    });
  };

  const handleDeleteTimeline = (evtId: string) => {
    onUpdate(application.id, {
      timeline: (application.timeline || []).filter((e) => e.id !== evtId),
    });
  };

  // Deadline urgency check
  const nowStr = new Date().toISOString().slice(0, 10);
  const isClosingSoon =
    application.endDate &&
    application.endDate >= nowStr &&
    new Date(application.endDate).getTime() - new Date(nowStr).getTime() <= 7 * 86400000;

  return (
    <div className="pt-3 border-t border-brand-border/70 dark:border-darkBrand-border/70 space-y-3.5 text-xs">
      {/* Editorial 2-line AI Intelligence Summary */}
      {application.summary && (
        <div className="border-l-2 border-terracotta-500 dark:border-terracotta-400 pl-3 py-0.5 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary block">
            Role Overview
          </span>
          <p className="text-xs leading-relaxed text-brand-ink dark:text-darkBrand-ink font-normal whitespace-pre-line">
            {application.summary}
          </p>
        </div>
      )}

      {/* Structured Metadata - Clean hairline divider layout without boxed cards */}
      <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-brand-border/60 dark:border-darkBrand-border/60">
        <div>
          <span className="text-[10px] font-medium text-brand-secondary dark:text-darkBrand-secondary block">
            Location
          </span>
          <span className="text-xs font-medium text-brand-ink dark:text-darkBrand-ink truncate block mt-0.5" title={application.location}>
            {application.location || 'Not specified'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-medium text-brand-secondary dark:text-darkBrand-secondary block">
            Compensation
          </span>
          <span className="text-xs font-medium text-brand-ink dark:text-darkBrand-ink truncate block mt-0.5" title={application.salary}>
            {application.salary || 'Not specified'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-medium text-brand-secondary dark:text-darkBrand-secondary block">
            Source
          </span>
          <span className="text-xs font-medium text-brand-ink dark:text-darkBrand-ink truncate block mt-0.5" title={application.source}>
            {application.source || 'Direct'}
          </span>
        </div>
      </div>

      {/* End Date (Deadline) & Vacancies - Inline editable */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-brand-secondary dark:text-darkBrand-secondary">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium text-brand-ink dark:text-darkBrand-ink">
              Closing Date & Openings
            </span>
            {isClosingSoon && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-50 text-terracotta-700 dark:bg-terracotta-950/40 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/50">
                Closing Soon
              </span>
            )}
          </div>

          {!editingDeadline ? (
            <button
              onClick={() => setEditingDeadline(true)}
              className="text-[11px] text-brand-secondary hover:text-terracotta-600 dark:hover:text-terracotta-400 font-medium cursor-pointer"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingDeadline(false)}
                className="text-[11px] text-brand-secondary hover:text-brand-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeadlineAndVacancies}
                className="text-[11px] text-terracotta-600 dark:text-terracotta-400 font-medium cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {!editingDeadline ? (
          <div className="flex items-center gap-4 text-xs text-brand-ink dark:text-darkBrand-ink">
            <div>
              <span className="text-brand-secondary dark:text-darkBrand-secondary mr-1">Deadline:</span>
              <span className="font-mono text-xs">
                {application.endDate ? formatDisplayDate(application.endDate) : 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-brand-secondary dark:text-darkBrand-secondary mr-1">Vacancies:</span>
              <span>{application.vacancies || 'Not specified'}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] text-brand-secondary mb-0.5">End Date</label>
              <input
                type="date"
                value={endDateVal}
                onChange={(e) => setEndDateVal(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-elevated text-brand-ink dark:text-darkBrand-ink focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] text-brand-secondary mb-0.5">Vacancies</label>
              <input
                type="text"
                placeholder="e.g. 3 Openings"
                value={vacanciesVal}
                onChange={(e) => setVacanciesVal(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-elevated text-brand-ink dark:text-darkBrand-ink focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Skills Pill Tags */}
      {application.skills && application.skills.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider block">
            Skills
          </span>
          <div className="flex flex-wrap gap-1">
            {application.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/[0.03] text-brand-ink dark:bg-white/[0.05] dark:text-darkBrand-ink border border-brand-border/60 dark:border-darkBrand-border/60"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <TimelineView
        events={application.timeline || []}
        onAddEvent={handleAddTimeline}
        onDeleteEvent={handleDeleteTimeline}
      />

      {/* Notes */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-brand-secondary dark:text-darkBrand-secondary uppercase tracking-wider">
            Notes
          </span>
          {!editingNotes ? (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-[11px] text-brand-secondary hover:text-terracotta-600 dark:hover:text-terracotta-400 font-medium cursor-pointer"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleSaveNotes}
              className="text-[11px] text-terracotta-600 dark:text-terracotta-400 font-medium cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
        {!editingNotes ? (
          <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary leading-relaxed bg-brand-bg/50 dark:bg-darkBrand-elevated/40 p-2.5 rounded-xl border border-brand-border/60 dark:border-darkBrand-border/60">
            {application.notes || 'No notes added yet.'}
          </p>
        ) : (
          <textarea
            value={notesVal}
            onChange={(e) => setNotesVal(e.target.value)}
            rows={2}
            placeholder="Referred by..., recruiter email, interview prep notes..."
            className="w-full text-xs p-2 rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-elevated text-brand-ink dark:text-darkBrand-ink focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
          />
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-brand-border/70 dark:border-darkBrand-border/70">
        <div className="flex items-center gap-2">
          {application.jobUrl && (
            <>
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink font-medium transition-colors cursor-pointer"
              >
                <span>Original Listing</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 text-[11px] text-brand-secondary hover:text-brand-ink p-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Copy job URL"
              >
                {copiedUrl ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-lime-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onOpenEditModal(application)}
            leftIcon={<Edit2 className="w-3 h-3" />}
          >
            Edit All
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => onDelete(application.id)}
            leftIcon={<Trash2 className="w-3 h-3" />}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
