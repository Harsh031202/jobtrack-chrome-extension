import React, { useState, useRef } from 'react';
import { UserSettings, AIProviderType } from '../types/settings';
import { JobApplication } from '../types/application';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { createLLMProvider } from '../lib/llm/provider';
import {
  exportApplicationsToJson,
  exportApplicationsToCsv,
  downloadFile,
  analyzeImportData,
  executeImport,
  ImportAnalysis,
} from '../lib/export-import';
import {
  Key,
  Shield,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => Promise<void>;
  applications: JobApplication[];
  onRefreshApplications: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onLoadDemoData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  applications,
  onRefreshApplications,
  onClearAllData,
  onLoadDemoData,
}) => {
  const [provider, setProvider] = useState<AIProviderType>(settings.ai.provider);
  const [apiKey, setApiKey] = useState(settings.ai.apiKey);
  const [model, setModel] = useState(settings.ai.model);
  const [baseUrl, setBaseUrl] = useState(settings.ai.baseUrl);
  const [showApiKey, setShowApiKey] = useState(false);

  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Clear data confirm state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleProviderChange = (newP: AIProviderType) => {
    setProvider(newP);
    setTestResult(null);
    if (newP === 'gemini') {
      setModel('gemini-1.5-flash');
      setBaseUrl('');
    } else if (newP === 'openrouter') {
      setModel('openrouter/free');
      setBaseUrl('https://openrouter.ai/api/v1');
    } else if (newP === 'openai') {
      setModel('gpt-4o-mini');
      setBaseUrl('https://api.openai.com/v1');
    } else if (newP === 'anthropic') {
      setModel('claude-3-5-haiku-latest');
      setBaseUrl('https://api.anthropic.com/v1');
    } else if (newP === 'custom') {
      setModel('');
      setBaseUrl('http://localhost:11434/v1');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const tempProvider = createLLMProvider({
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
        baseUrl: baseUrl.trim(),
      });
      const res = await tempProvider.testConnection();
      setTestResult({ tested: true, success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ tested: true, success: false, message: err.message || 'Test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: UserSettings = {
        ...settings,
        ai: {
          provider,
          apiKey: apiKey.trim(),
          model: model.trim(),
          baseUrl: baseUrl.trim(),
        },
      };
      await onSaveSettings(updated);
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportApplicationsToJson(applications);
    downloadFile(
      jsonStr,
      `jobtrack-export-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };

  const handleExportCsv = () => {
    const csvStr = exportApplicationsToCsv(applications);
    downloadFile(
      csvStr,
      `jobtrack-export-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const analysis = analyzeImportData(content, applications);
      setImportAnalysis(analysis);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importAnalysis || !importAnalysis.applicationsToImport.length) return;
    setIsImporting(true);
    try {
      await executeImport(importAnalysis.applicationsToImport, true);
      await onRefreshApplications();
      setImportAnalysis(null);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & Data"
      description="Configure AI extraction provider, export backups, and data controls."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Section: AI Configuration */}
        <div className="p-3.5 rounded-xl border border-brand-border dark:border-darkBrand-border bg-brand-surface dark:bg-darkBrand-surface space-y-3 shadow-subtle">
          <div className="flex items-center gap-1.5 font-semibold text-brand-ink dark:text-darkBrand-ink">
            <Key className="w-3.5 h-3.5 text-terracotta-500" />
            <span>AI Extraction Provider</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as AIProviderType)}
                className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-elevated px-3 py-2 text-xs text-brand-ink dark:text-darkBrand-ink focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 cursor-pointer shadow-subtle"
              >
                <option value="openrouter">OpenRouter (openrouter/free, etc.)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="custom">Custom / Local Proxy</option>
                <option value="heuristic">Offline Heuristic Engine (No API key)</option>
              </select>
            </div>

            <Input
              label="Model Name"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. openrouter/free, gemini-1.5-flash"
              disabled={provider === 'heuristic'}
            />
          </div>

          {provider !== 'heuristic' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-brand-ink dark:text-darkBrand-ink mb-1">
                  API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      provider === 'openrouter'
                        ? 'sk-or-v1-...'
                        : 'Enter your API Key'
                    }
                    className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-elevated px-3 py-2 pr-8 text-xs text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 shadow-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 text-brand-muted hover:text-brand-ink dark:hover:text-darkBrand-ink"
                    aria-label={showApiKey ? 'Hide key' : 'Show key'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {(provider === 'openrouter' || provider === 'openai' || provider === 'custom') && (
                <Input
                  label="API Base URL"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://openrouter.ai/api/v1"
                />
              )}

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                >
                  Test Connection
                </Button>

                {apiKey && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setApiKey('');
                      setTestResult(null);
                    }}
                  >
                    Clear Key
                  </Button>
                )}
              </div>

              {testResult && (
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-lime-300 border border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-coral-50 dark:bg-coral-950/40 text-coral-800 dark:text-coral-300 border border-coral-200 dark:border-coral-800/50'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-coral-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Data Export & Import */}
        <div className="p-3.5 rounded-xl border border-brand-border dark:border-darkBrand-border bg-brand-surface dark:bg-darkBrand-surface space-y-2.5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-brand-ink dark:text-darkBrand-ink">
              Data Management & Backup
            </span>
            <span className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
              {applications.length} applications tracked
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="xs"
              variant="secondary"
              onClick={handleExportJson}
              leftIcon={<Download className="w-3 h-3" />}
            >
              Export JSON
            </Button>
            <Button
              size="xs"
              variant="secondary"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3 h-3" />}
            >
              Export CSV
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3 h-3" />}
            >
              Import JSON
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={async () => {
                await onLoadDemoData();
              }}
              title="Load sample applications"
            >
              Load Sample Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>

          {/* Import Preview Banner */}
          {importAnalysis && (
            <div className="p-2.5 rounded-lg border border-brand-border dark:border-darkBrand-border bg-brand-hover/50 dark:bg-darkBrand-elevated space-y-2 mt-2">
              <p className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink">
                Import Preview
              </p>
              {importAnalysis.isValid ? (
                <div>
                  <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary">
                    Found {importAnalysis.totalParsed} valid applications:
                  </p>
                  <div className="flex gap-3 text-[11px] mt-1 font-mono">
                    <span className="text-emerald-600 dark:text-lime-400 font-semibold">{importAnalysis.newCount} new</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{importAnalysis.updateCount} existing</span>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-2">
                    <Button size="xs" variant="ghost" onClick={() => setImportAnalysis(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={handleConfirmImport}
                      isLoading={isImporting}
                    >
                      Confirm Import
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-coral-600 dark:text-coral-400 text-[11px]">
                  {importAnalysis.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Privacy Notice */}
        <div className="p-3 rounded-lg border border-brand-border/60 dark:border-darkBrand-border/60 bg-brand-bg/50 dark:bg-darkBrand-elevated/30 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-brand-ink dark:text-darkBrand-ink">
            <Shield className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Local & Private Storage</span>
          </div>
          <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary leading-relaxed">
            All records are stored locally in Chrome storage. JobTrack never silently tracks browsing or sends data without explicit action.
          </p>
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="pt-2 flex items-center justify-between border-t border-brand-border dark:border-darkBrand-border">
          {!showClearConfirm ? (
            <Button
              size="xs"
              variant="danger"
              onClick={() => setShowClearConfirm(true)}
              leftIcon={<Trash2 className="w-3 h-3" />}
            >
              Clear All Data
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-coral-600 font-medium">Delete all records?</span>
              <Button
                size="xs"
                variant="danger"
                onClick={async () => {
                  await onClearAllData();
                  setShowClearConfirm(false);
                }}
              >
                Yes, Delete All
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
