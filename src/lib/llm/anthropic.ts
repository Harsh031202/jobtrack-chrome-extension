import { RawPageData, ExtractedJobData } from '../../types/extractor';
import { AISettings } from '../../types/settings';
import { JOB_EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from './prompt';
import { cleanAndParseJson } from './json-cleaner';
import { cleanSalaryString } from '../normalizer';

export class AnthropicProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(settings: AISettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model || 'claude-3-5-haiku-latest';
    this.baseUrl = (settings.baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
  }

  async extractJob(pageData: RawPageData): Promise<ExtractedJobData> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is missing. Please configure it in Settings.');
    }

    const endpoint = `${this.baseUrl}/messages`;
    const userPrompt = buildExtractionUserPrompt(pageData);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true',
    };

    const payload = {
      model: this.model,
      system: JOB_EXTRACTION_SYSTEM_PROMPT,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API error (${res.status})`);
    }

    const data = await res.json();
    const rawContent = data.content?.[0]?.text;
    if (!rawContent) {
      throw new Error('Anthropic returned an empty response.');
    }

    const parsed = cleanAndParseJson(rawContent);

    return {
      company: parsed.company || 'Unknown Company',
      companyDomain: parsed.company_domain || undefined,
      companyLogoUrl: parsed.company_logo_url || undefined,
      role: parsed.role || 'Job Position',
      location: parsed.location || 'Not specified',
      salary: cleanSalaryString(parsed.salary),
      appliedDate: new Date().toISOString().slice(0, 10),
      status: 'Applied',
      endDate: parsed.end_date || parsed.deadline || null,
      vacancies: parsed.vacancies || 'Not specified',
      description: parsed.description || pageData.cleanTextSnippet.slice(0, 1000),
      summary: parsed.summary || `${parsed.role || 'Role'} at ${parsed.company || 'Company'}.\nKey skills: ${(parsed.skills || []).slice(0, 4).join(', ') || 'N/A'}.`,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      recruiter: parsed.recruiter || '',
      source: parsed.source || pageData.detectedSource,
      confidence: {
        company: parsed.company ? 0.9 : 0.5,
        role: parsed.role ? 0.9 : 0.5,
        salary: parsed.salary && parsed.salary !== 'Not specified' ? 0.9 : 0.0,
      },
      isJobPosting: parsed.is_job_posting !== false,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = `${this.baseUrl}/messages`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `HTTP ${res.status}: Failed to reach Anthropic`,
        };
      }

      return { success: true, message: `Connected to Anthropic (${this.model}) successfully.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed.' };
    }
  }
}
