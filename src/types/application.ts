export type ApplicationStatus =
  | 'Applied'
  | 'Screening'
  | 'Assessment'
  | 'Interview'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn'
  | 'On Hold';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Screening',
  'Assessment',
  'Interview',
  'Technical Interview',
  'HR Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'On Hold',
];

export interface TimelineEvent {
  id: string;
  type: string;
  date: string; // ISO string YYYY-MM-DD
  note?: string;
  status?: ApplicationStatus;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location?: string;
  salary?: string; // e.g. "₹18 LPA", "$140k/yr", or "Not specified"
  appliedAt: string; // ISO string YYYY-MM-DD
  endDate?: string | null; // Application deadline or closing date (YYYY-MM-DD)
  vacancies?: string; // e.g. "5 Openings", "1 Position", "Multiple", "Not specified"
  status: ApplicationStatus;
  source: string; // e.g. "LinkedIn", "Naukri", "Indeed", "Greenhouse"
  jobUrl: string;
  description?: string;
  summary?: string; // Concise 2-line AI summary
  skills: string[];
  recruiter?: string;
  deadline?: string; // Kept as alias for endDate if present
  notes?: string;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  companyLogoUrl?: string; // Direct image URL of the company logo
  companyDomain?: string; // Official domain of the company (e.g. deloitte.com, stripe.com)
  metadata?: Record<string, unknown>;
}

export type ApplicationFilter = {
  search: string;
  status: ApplicationStatus | 'All';
  source: string | 'All';
  closingSoonOnly: boolean;
  sortBy: 'appliedAt_desc' | 'appliedAt_asc' | 'endDate_asc' | 'company_asc' | 'vacancies_desc';
};
