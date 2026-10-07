import { ApplicationStatus } from './application';

export interface RawPageData {
  url: string;
  title: string;
  domain: string;
  metaTags: Record<string, string>;
  jsonLdList: any[];
  headings: string[];
  cleanTextSnippet: string;
  detectedSource: string;
}

export interface ExtractedJobData {
  company: string;
  companyDomain?: string;
  companyLogoUrl?: string;
  role: string;
  location?: string;
  salary?: string;
  appliedDate?: string;
  endDate?: string | null;
  vacancies?: string;
  status?: ApplicationStatus;
  description?: string;
  summary?: string;
  skills: string[];
  recruiter?: string;
  deadline?: string;
  source: string;
  confidence: {
    company: number;
    role: number;
    salary: number;
  };
  isJobPosting: boolean;
}
