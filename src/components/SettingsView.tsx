import React, { useState, useRef, useEffect } from 'react';
import { UserSettings, AIProviderType } from '../types/settings';
import { JobApplication } from '../types/application';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
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
  Shield,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Cpu,
  Database,
  Save,
  RotateCcw,
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => Promise<void>;
  applications: JobApplication[];
  onRefreshApplications: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onLoadDemoData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Clear data confirm state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Update local state when parent settings prop updates
  useEffect(() => {
    setProvider(settings.ai.provider);
    setApiKey(settings.ai.apiKey);
    setModel(settings.ai.model);
    setBaseUrl(settings.ai.baseUrl);
  }, [settings]);

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProvider(settings.ai.provider);
    setApiKey(settings.ai.apiKey);
    setModel(settings.ai.model);
    setBaseUrl(settings.ai.baseUrl);
    setTestResult(null);
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

  const hasUnsavedChanges =
    provider !== settings.ai.provider ||
    apiKey !== settings.ai.apiKey ||
    model !== settings.ai.model ||
    baseUrl !== settings.ai.baseUrl;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. AI Extraction Provider Card */}
      <div className="p-6 sm:p-7 rounded-3xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-terracotta-50 dark:bg-terracotta-900/30 border border-terracotta-200/60 dark:border-terracotta-800/40 flex items-center justify-center text-terracotta-500 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-ink dark:text-darkBrand-ink tracking-tight">
                AI Extraction Provider
              </h2>
              <p className="text-xs sm:text-sm text-brand-secondary dark:text-darkBrand-secondary mt-0.5">
                Configure your preferred LLM engine for structured job detail extraction.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-pillBg dark:bg-darkBrand-pillBg text-brand-secondary dark:text-darkBrand-secondary border border-brand-border dark:border-darkBrand-border">
            Provider: {provider}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select<AIProviderType>
              label="Provider"
              value={provider}
              onChange={(val) => handleProviderChange(val)}
              options={[
                { value: 'gemini', label: 'Google Gemini (Recommended)', description: 'Fast, high-quality multimodal extraction' },
                { value: 'openrouter', label: 'OpenRouter (openrouter/free, etc.)', description: 'Wide model choice, free options available' },
                { value: 'openai', label: 'OpenAI (gpt-4o-mini, etc.)', description: 'Industry standard reasoning' },
                { value: 'anthropic', label: 'Anthropic (Claude 3.5 Haiku, etc.)', description: 'Accurate text processing' },
                { value: 'custom', label: 'Custom / Local Proxy', description: 'Ollama, vLLM, LM Studio, etc.' },
                { value: 'heuristic', label: 'Offline Heuristic Engine (No API key)', description: 'Rule-based DOM parser without API key' },
              ]}
              size="md"
            />
          </div>

          <Input
            label="Model Name"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gemini-1.5-flash, gpt-4o-mini"
            disabled={provider === 'heuristic'}
          />
        </div>

        {provider !== 'heuristic' && (
          <div className="space-y-4 pt-1 border-t border-brand-border/60 dark:border-darkBrand-border/60">
            <div>
              <label className="block text-xs font-semibold text-brand-ink dark:text-darkBrand-ink mb-1.5">
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
                      : provider === 'gemini'
                      ? 'AIzaSy...'
                      : 'Enter your API Key'
                  }
                  className="w-full rounded-xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-elevated px-3.5 py-2.5 pr-10 text-xs text-brand-ink dark:text-darkBrand-ink placeholder-brand-muted dark:placeholder-darkBrand-muted focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 shadow-subtle transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 text-brand-muted hover:text-brand-ink dark:hover:text-darkBrand-ink transition-colors cursor-pointer"
                  aria-label={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Test Connection
                </Button>

                {apiKey && (
                  <Button
                    size="sm"
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
                  className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-coral-50 dark:bg-coral-500/15 text-coral-800 dark:text-coral-300 border border-coral-300 dark:border-coral-500/30'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-coral-600 dark:text-coral-400" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Data Management & Backup Card */}
      <div className="p-6 sm:p-7 rounded-3xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-subtle space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-ink dark:text-darkBrand-ink tracking-tight">
                Data Management & Backup
              </h2>
              <p className="text-xs sm:text-sm text-brand-secondary dark:text-darkBrand-secondary mt-0.5">
                Export your applications to JSON/CSV, restore backups, or populate sample data.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-pillBg dark:bg-darkBrand-pillBg text-brand-secondary dark:text-darkBrand-secondary border border-brand-border dark:border-darkBrand-border">
            {applications.length} applications tracked
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportJson}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import JSON
          </Button>

          <Button
            size="sm"
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
          <div className="p-4 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-brand-hover/50 dark:bg-darkBrand-elevated space-y-3 mt-3">
            <p className="font-semibold text-xs sm:text-sm text-brand-ink dark:text-darkBrand-ink">
              Import Preview
            </p>
            {importAnalysis.isValid ? (
              <div className="space-y-3">
                <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary">
                  Found <span className="font-bold text-brand-ink dark:text-darkBrand-ink">{importAnalysis.totalParsed}</span> valid applications to process:
                </p>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-emerald-600 dark:text-lime-400 font-semibold">
                    +{importAnalysis.newCount} new
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    ~{importAnalysis.updateCount} existing to update
                  </span>
                </div>
                <div className="flex justify-end gap-2 pt-1">
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
              <div className="text-coral-600 dark:text-coral-400 text-xs">
                {importAnalysis.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Local & Private Storage Notice */}
      <div className="p-5 sm:p-6 rounded-3xl border border-brand-border/80 dark:border-darkBrand-border/80 bg-brand-bg/60 dark:bg-darkBrand-surface/50 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-white dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border text-brand-secondary dark:text-darkBrand-secondary shrink-0 shadow-2xs">
          <Shield className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xs sm:text-sm font-semibold text-brand-ink dark:text-darkBrand-ink">
            Local & Private Storage
          </h3>
          <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary leading-relaxed">
            All records and API credentials are kept strictly in Chrome storage on your machine. JobTrack never silently tracks your web browsing or transmits data to any third party without explicit action.
          </p>
        </div>
      </div>

      {/* 4. Danger Zone Card */}
      <div className="p-6 sm:p-7 rounded-3xl border border-coral-200 dark:border-coral-900/40 bg-coral-50/20 dark:bg-coral-950/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-coral-700 dark:text-coral-400">
              Clear All Data
            </h3>
            <p className="text-xs text-brand-secondary dark:text-darkBrand-secondary">
              Permanently remove all tracked applications and timeline records from this browser.
            </p>
          </div>

          {!showClearConfirm ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowClearConfirm(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear All Data
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-coral-600 font-semibold hidden sm:inline">Delete all records?</span>
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
        </div>
      </div>

      {/* 5. Sticky Bottom Action Save Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-brand-border dark:border-darkBrand-border bg-white dark:bg-darkBrand-surface shadow-float flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-lime-400 animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}
          {hasUnsavedChanges && !saveSuccess && (
            <span className="text-xs text-brand-secondary dark:text-darkBrand-secondary font-medium">
              You have unsaved changes.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {hasUnsavedChanges && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              disabled={isSaving}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
