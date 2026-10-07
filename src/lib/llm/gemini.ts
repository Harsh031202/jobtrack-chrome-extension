import { RawPageData, ExtractedJobData } from '../../types/extractor';
import { AISettings } from '../../types/settings';
import { JOB_EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from './prompt';
import { cleanAndParseJson } from './json-cleaner';
import { cleanSalaryString } from '../normalizer';

export class GeminiProvider {
  private apiKey: string;
  private model: string;

  constructor(settings: AISettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model || 'gemini-1.5-flash';
  }

  async extractJob(pageData: RawPageData): Promise<ExtractedJobData> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is missing. Please configure it in Settings.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const userPrompt = buildExtractionUserPrompt(pageData);

    const payload = {
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: JOB_EXTRACTION_SYSTEM_PROMPT }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini API error (Status ${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Gemini returned an empty response.');
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
    if (!this.apiKey) {
      return { success: false, message: 'Please provide an API key.' };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        this.model
      )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `HTTP ${res.status}: Failed to reach Gemini`,
        };
      }

      return { success: true, message: `Connected to Gemini (${this.model}) successfully.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed.' };
    }
  }
}
