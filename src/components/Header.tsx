import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Button } from './ui/Button';
import {
  Plus,
  Sliders,
  Sun,
  Moon,
  ExternalLink,
  Sidebar,
  Command,
} from 'lucide-react';

interface HeaderProps {
  onAddApplication: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSidePanel?: boolean;
  isPopup?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAddApplication,
  onOpenSettings,
  onOpenCommandPalette,
  isDarkMode,
  onToggleDarkMode,
  isSidePanel = false,
  isPopup = false,
}) => {
  const handleOpenFullDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const url = chrome.runtime.getURL('dashboard.html');
      chrome.tabs.create({ url });
    } else {
      window.open('/dashboard.html', '_blank');
    }
  };

  const handleOpenSidePanel = async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'OPEN_SIDEPANEL' });
    }
  };

  return (
    <header className="border-b border-brand-border dark:border-darkBrand-border bg-white/95 dark:bg-darkBrand-surface/95 sticky top-0 z-30 px-4 py-3 sm:px-6 transition-colors backdrop-blur-xs">
      <div className="flex items-center justify-between">
        {/* Tabato-style geometric Brand Logo */}
        <div
          className="flex items-center gap-2 group cursor-pointer select-none"
          onClick={onOpenCommandPalette}
          title="Open Command Palette (⌘K / Ctrl+K)"
        >
          <BrandLogo size="md" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-brand-secondary dark:text-darkBrand-secondary bg-brand-pillBg dark:bg-darkBrand-pillBg border border-brand-border/60 dark:border-darkBrand-border/60 hover:text-brand-ink dark:hover:text-darkBrand-ink px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Command Palette (Cmd/Ctrl + K)"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">K</span>
          </button>

          <Button
            size="xs"
            variant="primary"
            onClick={onAddApplication}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add
          </Button>

          {/* Theme switcher */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isPopup && (
            <button
              onClick={handleOpenSidePanel}
              className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Open Side Panel"
              title="Open Side Panel"
            >
              <Sidebar className="w-4 h-4" />
            </button>
          )}

          {(isPopup || isSidePanel) && (
            <button
              onClick={handleOpenFullDashboard}
              className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Open full dashboard tab"
              title="Open Full Dashboard"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-brand-secondary hover:text-brand-ink dark:text-darkBrand-secondary dark:hover:text-darkBrand-ink rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Open settings"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
