export type AIProviderType =
  | 'gemini'
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'custom'
  | 'heuristic';

export interface AISettings {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface UserSettings {
  ai: AISettings;
  theme: 'system' | 'light' | 'dark';
  defaultStatus: string;
  enableKeyboardShortcuts: boolean;
  duplicateAction: 'ask' | 'update' | 'ignore';
}

// Check for environment variables (Vite build or dev)
const envBaseUrl = (import.meta as any).env?.LLM_BASE_URL || (import.meta as any).env?.VITE_LLM_BASE_URL || '';
const envApiKey = (import.meta as any).env?.LLM_API_KEY || (import.meta as any).env?.VITE_LLM_API_KEY || '';
const envModel = (import.meta as any).env?.LLM_MODEL || (import.meta as any).env?.VITE_LLM_MODEL || '';

function determineDefaultAISettings(): AISettings {
  if (envBaseUrl.includes('openrouter.ai') || envModel.includes('openrouter')) {
    return {
      provider: 'openrouter',
      apiKey: envApiKey,
      model: envModel || 'openrouter/free',
      baseUrl: envBaseUrl || 'https://openrouter.ai/api/v1',
    };
  }

  if (envBaseUrl) {
    return {
      provider: 'custom',
      apiKey: envApiKey,
      model: envModel || 'gpt-4o-mini',
      baseUrl: envBaseUrl,
    };
  }

  return {
    provider: 'gemini',
    apiKey: envApiKey,
    model: envModel || 'gemini-1.5-flash',
    baseUrl: '',
  };
}

export const DEFAULT_AI_SETTINGS: AISettings = determineDefaultAISettings();

export const DEFAULT_USER_SETTINGS: UserSettings = {
  ai: DEFAULT_AI_SETTINGS,
  theme: 'system',
  defaultStatus: 'Applied',
  enableKeyboardShortcuts: true,
  duplicateAction: 'ask',
};
