import React, { useState } from 'react';
import { TimelineEvent } from '../types/application';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Trash2 } from 'lucide-react';
import { formatDisplayDate } from '../lib/normalizer';

interface TimelineViewProps {
  events: TimelineEvent[];
  onAddEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  onDeleteEvent?: (id: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onAddEvent,
  onDeleteEvent,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventNote, setEventNote] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType.trim()) return;

    onAddEvent({
      type: eventType.trim(),
      date: eventDate,
      note: eventNote.trim() || undefined,
    });

    setEventType('');
    setEventNote('');
    setIsAdding(false);
  };

  const sortedEvents = [...(events || [])].sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-brand-secondary dark:text-darkBrand-secondary">
          Application Timeline
        </h4>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-[11px] text-brand-secondary hover:text-indigo-600 dark:hover:text-indigo-400 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add stage</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-2.5 rounded-lg border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface space-y-2 text-xs shadow-subtle"
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Stage / Milestone"
              placeholder="e.g. Technical Interview"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          <Input
            label="Notes (Optional)"
            placeholder="e.g. System design discussion on distributed storage"
            value={eventNote}
            onChange={(e) => setEventNote(e.target.value)}
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <Button size="xs" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="xs" variant="primary" type="submit">
              Save Stage
            </Button>
          </div>
        </form>
      )}

      {sortedEvents.length === 0 ? (
        <p className="text-[11px] text-brand-muted dark:text-darkBrand-muted py-0.5">
          No timeline stages recorded yet.
        </p>
      ) : (
        <div className="border-l border-brand-border dark:border-darkBrand-border ml-1.5 pl-3 py-0.5 space-y-2 text-xs">
          {sortedEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              <span className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-brand-secondary dark:text-darkBrand-secondary font-mono text-[11px] mr-2">
                    {formatDisplayDate(evt.date)}
                  </span>
                  <span className="font-medium text-brand-ink dark:text-darkBrand-ink">
                    {evt.type}
                  </span>
                  {evt.note && (
                    <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary mt-0.5">
                      {evt.note}
                    </p>
                  )}
                </div>
                {onDeleteEvent && (
                  <button
                    onClick={() => onDeleteEvent(evt.id)}
                    className="opacity-0 group-hover:opacity-100 text-brand-muted hover:text-coral-600 p-0.5 rounded transition-opacity"
                    title="Remove event"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
