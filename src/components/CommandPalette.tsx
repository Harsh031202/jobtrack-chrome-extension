import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Sliders,
  Download,
  CheckCircle,
  Briefcase,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCurrent: () => void;
  onAddManual: () => void;
  onOpenSettings: () => void;
  onFilterStatus: (status: any) => void;
  onExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onTrackCurrent,
  onAddManual,
  onOpenSettings,
  onFilterStatus,
  onExport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'track-current',
      title: 'Track this application (Current tab)',
      category: 'Actions',
      icon: <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
      action: () => {
        onClose();
        onTrackCurrent();
      },
    },
    {
      id: 'add-manual',
      title: 'Add application manually',
      category: 'Actions',
      icon: <Plus className="w-3.5 h-3.5" />,
      action: () => {
        onClose();
        onAddManual();
      },
    },
    {
      id: 'filter-interview',
      title: 'Filter: Interviews & Assessments',
      category: 'Filter',
      icon: <Search className="w-3.5 h-3.5" />,
      action: () => {
        onClose();
        onFilterStatus('Interview');
      },
    },
    {
      id: 'filter-offers',
      title: 'Filter: Job Offers',
      category: 'Filter',
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-lime-400" />,
      action: () => {
        onClose();
        onFilterStatus('Offer');
      },
    },
    {
      id: 'filter-applied',
      title: 'Filter: Applied jobs',
      category: 'Filter',
      icon: <Search className="w-3.5 h-3.5" />,
      action: () => {
        onClose();
        onFilterStatus('Applied');
      },
    },
    {
      id: 'export-data',
      title: 'Export applications (CSV / JSON)',
      category: 'Data',
      icon: <Download className="w-3.5 h-3.5" />,
      action: () => {
        onClose();
        onExport();
      },
    },
    {
      id: 'open-settings',
      title: 'Open Settings & API Keys',
      category: 'Settings',
      icon: <Sliders className="w-3.5 h-3.5" />,
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-[#15171C]/35 dark:bg-black/75 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-modal dark:shadow-dark-float overflow-hidden z-10 text-xs">
        <div className="flex items-center px-3.5 border-b border-brand-border dark:border-darkBrand-border">
          <Search className="w-3.5 h-3.5 text-brand-muted dark:text-darkBrand-muted shrink-0 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full py-2.5 bg-transparent text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted focus:outline-none text-xs"
            autoFocus
          />
          <kbd className="text-[10px] text-brand-secondary bg-brand-bg dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="p-3 text-center text-brand-secondary dark:text-darkBrand-secondary">No commands found.</p>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-brand-hover dark:bg-darkBrand-elevated text-brand-ink dark:text-darkBrand-ink font-medium'
                    : 'text-brand-secondary dark:text-darkBrand-secondary hover:bg-brand-hover/50 dark:hover:bg-darkBrand-elevated/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-brand-muted dark:text-darkBrand-muted">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <span className="text-[10px] text-brand-muted dark:text-darkBrand-muted font-mono">{item.category}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
