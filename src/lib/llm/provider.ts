import { RawPageData, ExtractedJobData } from '../../types/extractor';
import { AISettings } from '../../types/settings';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { extractWithHeuristics } from '../extraction/heuristics';

export interface ILLMProvider {
  extractJob(pageData: RawPageData): Promise<ExtractedJobData>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}

export class HeuristicFallbackProvider implements ILLMProvider {
  async extractJob(pageData: RawPageData): Promise<ExtractedJobData> {
    return extractWithHeuristics(pageData);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Offline Heuristic Engine is operational (no API key required).',
    };
  }
}

export function createLLMProvider(settings: AISettings): ILLMProvider {
  // If explicitly chosen heuristic, or no API key and provider isn't local custom
  if (settings.provider === 'heuristic' || (!settings.apiKey && settings.provider !== 'custom')) {
    return new HeuristicFallbackProvider();
  }

  switch (settings.provider) {
    case 'gemini':
      return new GeminiProvider(settings);
    case 'openrouter':
      return new OpenRouterProvider(settings);
    case 'openai':
    case 'custom':
      return new OpenAIProvider(settings);
    case 'anthropic':
      return new AnthropicProvider(settings);
    default:
      return new HeuristicFallbackProvider();
  }
}

/**
 * High-level extraction orchestrator:
 * Attempts LLM extraction first; if LLM fails, cleanly falls back to heuristic engine
 * while reporting what occurred.
 */
export async function performJobExtraction(
  pageData: RawPageData,
  settings: AISettings
): Promise<{ data: ExtractedJobData; usedFallback: boolean; warning?: string }> {
  const provider = createLLMProvider(settings);

  if (settings.provider === 'heuristic' || !settings.apiKey) {
    const data = await provider.extractJob(pageData);
    return {
      data,
      usedFallback: true,
      warning: settings.apiKey ? undefined : 'No API key configured: used local heuristic extraction.',
    };
  }

  try {
    const data = await provider.extractJob(pageData);
    return { data, usedFallback: false };
  } catch (err: any) {
    console.warn('AI extraction failed, falling back to local heuristic extraction:', err);
    const fallbackData = extractWithHeuristics(pageData);
    return {
      data: fallbackData,
      usedFallback: true,
      warning: `AI extraction temporarily unavailable (${err.message}). Recovered using local page heuristics.`,
    };
  }
}
