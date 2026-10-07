import { RawPageData, ExtractedJobData } from '../../types/extractor';
import { AISettings } from '../../types/settings';
import { JOB_EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from './prompt';
import { cleanAndParseJson } from './json-cleaner';
import { cleanSalaryString } from '../normalizer';

export class OpenAIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(settings: AISettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model || 'gpt-4o-mini';
    this.baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  async extractJob(pageData: RawPageData): Promise<ExtractedJobData> {
    if (!this.apiKey && !this.baseUrl.includes('localhost')) {
      throw new Error('API key is missing. Please configure it in Settings.');
    }

    const endpoint = `${this.baseUrl}/chat/completions`;
    const userPrompt = buildExtractionUserPrompt(pageData);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const payload = {
      model: this.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: JOB_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `OpenAI API error (${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) msg = errJson.error.message;
      } catch {
        // use default
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty response.');
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
      const endpoint = `${this.baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Respond with: {"status": "ok"}' }],
          response_format: { type: 'json_object' },
          max_tokens: 20,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `HTTP ${res.status}: Failed to reach API`,
        };
      }

      return { success: true, message: `Connected to API (${this.model}) successfully.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed.' };
    }
  }
}
