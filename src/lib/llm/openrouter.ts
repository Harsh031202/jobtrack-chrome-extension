import { RawPageData, ExtractedJobData } from '../../types/extractor';
import { AISettings } from '../../types/settings';
import { JOB_EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from './prompt';
import { cleanAndParseJson } from './json-cleaner';
import { cleanSalaryString } from '../normalizer';

export class OpenRouterProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(settings: AISettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model || 'openrouter/free';
    this.baseUrl = (settings.baseUrl || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
  }

  async extractJob(pageData: RawPageData): Promise<ExtractedJobData> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is missing. Please configure it in Settings.');
    }

    const endpoint = `${this.baseUrl}/chat/completions`;
    const userPrompt = buildExtractionUserPrompt(pageData);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://jobtrack.extension',
      'X-Title': 'JobTrack Extension',
    };

    const messages = [
      { role: 'system', content: JOB_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    // Helper to send request with or without response_format
    const sendRequest = async (useJsonFormat: boolean) => {
      const payload: any = {
        model: this.model,
        messages,
        temperature: 0.1,
      };
      if (useJsonFormat) {
        payload.response_format = { type: 'json_object' };
      }

      return fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    };

    // First attempt (with response_format)
    let res = await sendRequest(true);

    // If 400 error due to model not supporting response_format (common on openrouter/free)
    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('response_format') || errText.includes('json_object')) {
        // Retry without response_format
        res = await sendRequest(false);
      } else {
        let msg = `OpenRouter API error (${res.status})`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error?.message) msg = errJson.error.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
    }

    if (!res.ok) {
      const finalErr = await res.text();
      let msg = `OpenRouter API error (${res.status})`;
      try {
        const errJson = JSON.parse(finalErr);
        if (errJson.error?.message) msg = errJson.error.message;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenRouter returned an empty response.');
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
      summary:
        parsed.summary ||
        `${parsed.role || 'Role'} at ${parsed.company || 'Company'}.\nKey skills: ${(parsed.skills || []).slice(0, 4).join(', ') || 'N/A'}.`,
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
    if (!this.apiKey) {
      return { success: false, message: 'Please enter your OpenRouter API key.' };
    }

    try {
      const endpoint = `${this.baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://jobtrack.extension',
        'X-Title': 'JobTrack Extension',
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Respond with JSON: {"status": "ok"}' }],
          max_tokens: 30,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let msg = `HTTP ${res.status}: Failed to reach OpenRouter`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error?.message) msg = errJson.error.message;
        } catch {
          // ignore
        }
        return { success: false, message: msg };
      }

      return {
        success: true,
        message: `Connected to OpenRouter (${this.model}) successfully.`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed.' };
    }
  }
}
