import { RawPageData, ExtractedJobData } from '../../types/extractor';
import { detectPlatformSource, cleanSalaryString } from '../normalizer';

export const JOB_BOARD_OR_ATS_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'naukri.com',
  'glassdoor.com',
  'wellfound.com',
  'angel.co',
  'internshala.com',
  'monster.com',
  'ziprecruiter.com',
  'simplyhired.com',
  'dice.com',
  'hired.com',
  'greenhouse.io',
  'lever.co',
  'workday.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'bamboohr.com',
  'icims.com',
  'jobvite.com',
  'taleo.net',
  'workable.com',
  'breezy.hr',
  'recruitee.com',
  'pinpointhq.com',
  'rippling.com',
  'gusto.com',
  'otta.com',
  'instahyre.com',
  'hirist.com',
  'foundit.in',
  'cutshort.io',
];

export function isJobBoardOrAtsDomain(hostname: string): boolean {
  if (!hostname) return true;
  const lower = hostname.toLowerCase().replace(/^www\./, '');
  return JOB_BOARD_OR_ATS_DOMAINS.some(
    (d) => lower === d || lower.endsWith('.' + d)
  );
}

/**
 * Intelligent JSON-LD extractor for schema.org/JobPosting
 */
export function extractFromJsonLd(jsonLdList: any[]): Partial<ExtractedJobData> | null {
  for (const item of jsonLdList) {
    if (!item) continue;

    let jobPosting: any = null;
    if (item['@type'] === 'JobPosting') {
      jobPosting = item;
    } else if (Array.isArray(item['@graph'])) {
      jobPosting = item['@graph'].find((g: any) => g['@type'] === 'JobPosting');
    }

    if (jobPosting) {
      let company = '';
      let companyDomain: string | undefined;
      let companyLogoUrl: string | undefined;

      if (typeof jobPosting.hiringOrganization === 'string') {
        company = jobPosting.hiringOrganization;
      } else if (jobPosting.hiringOrganization && typeof jobPosting.hiringOrganization === 'object') {
        const org = jobPosting.hiringOrganization;
        if (org.name) company = org.name;

        // Extract logo image URL from JSON-LD
        if (org.logo) {
          const l = typeof org.logo === 'string' ? org.logo : org.logo.url;
          if (typeof l === 'string' && l.startsWith('http')) {
            companyLogoUrl = l;
          }
        }

        // Extract official domain from sameAs or url
        if (org.sameAs) {
          const sa = typeof org.sameAs === 'string' ? org.sameAs : Array.isArray(org.sameAs) ? org.sameAs[0] : '';
          if (sa) {
            try {
              const u = new URL(sa);
              const host = u.hostname.replace(/^www\./, '');
              if (!isJobBoardOrAtsDomain(host)) {
                companyDomain = host;
              }
            } catch {
              // ignore
            }
          }
        }

        if (!companyDomain && org.url) {
          try {
            const u = new URL(org.url);
            const host = u.hostname.replace(/^www\./, '');
            if (!isJobBoardOrAtsDomain(host)) {
              companyDomain = host;
            }
          } catch {
            // ignore
          }
        }
      }

      let role = jobPosting.title || jobPosting.name || '';
      let location = '';
      if (typeof jobPosting.jobLocation === 'string') {
        location = jobPosting.jobLocation;
      } else if (jobPosting.jobLocation?.address) {
        const addr = jobPosting.jobLocation.address;
        if (typeof addr === 'string') {
          location = addr;
        } else {
          location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
            .filter(Boolean)
            .join(', ');
        }
      }

      let salary = '';
      if (jobPosting.baseSalary) {
        const s = jobPosting.baseSalary;
        if (typeof s === 'string') {
          salary = s;
        } else if (s.value) {
          const val =
            typeof s.value === 'object'
              ? `${s.value.minValue || ''} - ${s.value.maxValue || s.value.value || ''}`
              : s.value;
          salary = `${s.currency ? s.currency + ' ' : ''}${val}`.trim();
        }
      }

      let description = jobPosting.description || '';
      if (description.includes('<')) {
        description = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }

      let endDate: string | null = null;
      if (jobPosting.validThrough) {
        try {
          const d = new Date(jobPosting.validThrough);
          if (!isNaN(d.getTime())) {
            endDate = d.toISOString().slice(0, 10);
          }
        } catch {
          // ignore
        }
      }

      let vacancies: string | undefined;
      if (jobPosting.totalJobOpenings) {
        vacancies = `${jobPosting.totalJobOpenings} Opening${Number(jobPosting.totalJobOpenings) > 1 ? 's' : ''}`;
      }

      return {
        company: company.trim(),
        companyDomain,
        companyLogoUrl,
        role: role.trim(),
        location: location.trim(),
        salary: salary ? cleanSalaryString(salary) : 'Not specified',
        description: description.slice(0, 1000),
        endDate,
        vacancies,
      };
    }
  }

  return null;
}

/**
 * Enhanced heuristic extractor that merges JSON-LD, in-page DOM selectors, meta tags, and smart title parsing.
 */
export function extractWithHeuristics(pageData: RawPageData): ExtractedJobData {
  // 1. JSON-LD structured data
  const fromLd = extractFromJsonLd(pageData.jsonLdList);

  // 2. Direct specialized DOM tags passed from in-context extractor
  const domCompany = pageData.metaTags['jobtrack:dom_company'] || '';
  const domRole = pageData.metaTags['jobtrack:dom_role'] || '';
  const domLocation = pageData.metaTags['jobtrack:dom_location'] || '';
  const domSalary = pageData.metaTags['jobtrack:dom_salary'] || '';

  let company = fromLd?.company || domCompany || '';
  let role = fromLd?.role || domRole || '';
  let location = fromLd?.location || domLocation || '';
  let salary = fromLd?.salary || (domSalary ? cleanSalaryString(domSalary) : 'Not specified');
  let description = fromLd?.description || '';

  const cleanNoise = (str: string) => {
    return str
      .replace(/\s*\|\s*(LinkedIn|Indeed|Naukri|Glassdoor|Wellfound|Internshala).*/i, '')
      .replace(/\s*-\s*(LinkedIn|Indeed|Naukri|Glassdoor|Wellfound|Internshala).*/i, '')
      .replace(/\s*–\s*(LinkedIn|Indeed|Naukri|Glassdoor|Wellfound|Internshala).*/i, '')
      .trim();
  };

  // 3. Smart title parsing if company or role is missing
  if (!company || !role) {
    const rawTitle = cleanNoise(pageData.title || '');

    // Pattern: "Role at Company" (e.g. "Software Engineer at Google")
    if (rawTitle.includes(' at ')) {
      const parts = rawTitle.split(' at ');
      if (!role) role = parts[0].trim();
      if (!company) {
        const compPart = parts[1].split(/[-–—|•]/)[0].trim();
        company = compPart;
      }
    }
    // Pattern: "Company hiring Role" (e.g. "Google hiring Software Engineer")
    else if (rawTitle.includes(' hiring ')) {
      const parts = rawTitle.split(' hiring ');
      if (!company) company = parts[0].trim();
      if (!role) {
        const rolePart = parts[1].split(/[-–—|•]/)[0].trim();
        role = rolePart;
      }
    }
    // Pattern: "Role - Company - Location" or "Company - Role"
    else if (rawTitle.includes('-') || rawTitle.includes('|') || rawTitle.includes('–')) {
      const parts = rawTitle.split(/[-–—|•]/).map((p) => p.trim());
      if (parts.length >= 2) {
        if (!role) role = parts[0];
        if (!company) company = parts[1];
        if (!location && parts.length >= 3) location = parts[2];
      }
    } else if (!role) {
      role = rawTitle;
    }
  }

  // 4. OpenGraph metadata fallback
  if (!company && pageData.metaTags['og:site_name']) {
    company = pageData.metaTags['og:site_name'];
  }
  if (!role && pageData.metaTags['og:title']) {
    role = cleanNoise(pageData.metaTags['og:title']);
  }

  // 5. Headings fallback
  if (!role && pageData.headings.length > 0) {
    role = pageData.headings[0];
  }

  // 6. Text hints for salary
  if (salary === 'Not specified') {
    const salaryMatch = pageData.cleanTextSnippet.match(
      /(₹|Rs\.?|\$|€|£)\s?[\d,.]+\s?(?:LPA|Lakhs|k|K|\/mo|\/month|\/yr|\/year|annum|- [\d,.]+\s?(?:LPA|Lakhs|k|K))?/i
    );
    if (salaryMatch) {
      salary = salaryMatch[0].trim();
    }
  }

  // 7. Text hints for location
  if (!location) {
    const locMatch = pageData.cleanTextSnippet.match(
      /(?:Location|Based in|Workplace|City):\s*([A-Za-z0-9\s,.-]+?)(?:\n|\.|\;)/i
    );
    if (locMatch && locMatch[1].trim().length < 50) {
      location = locMatch[1].trim();
    }
  }

  // 8. Text hints for vacancies / openings
  let vacancies = fromLd?.vacancies;
  if (!vacancies) {
    const vacMatch = pageData.cleanTextSnippet.match(
      /(\d+)\s*(?:openings?|vacanc(?:y|ies)|positions?|seats?)/i
    ) || pageData.cleanTextSnippet.match(/(?:Openings|Vacancies|Positions):\s*(\d+)/i);
    if (vacMatch) {
      const num = vacMatch[1];
      vacancies = `${num} Opening${Number(num) > 1 ? 's' : ''}`;
    }
  }

  // 9. Text hints for end date / deadline
  let endDate = fromLd?.endDate || null;
  if (!endDate) {
    const deadMatch = pageData.cleanTextSnippet.match(
      /(?:Apply by|Deadline|Closing date|Ends on|Last date):\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i
    );
    if (deadMatch) {
      try {
        const parsedD = new Date(deadMatch[1]);
        if (!isNaN(parsedD.getTime())) {
          endDate = parsedD.toISOString().slice(0, 10);
        }
      } catch {
        // ignore
      }
    }
  }

  // Fallback to domain for company if nothing else found
  if (!company && pageData.domain) {
    const brand = pageData.domain.replace(/^www\./, '').split('.')[0];
    if (brand && !['linkedin', 'indeed', 'naukri', 'greenhouse', 'lever'].includes(brand)) {
      company = brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  company = cleanNoise(company) || 'Unknown Company';
  role = cleanNoise(role) || 'Job Position';

  // Common technical skills detection
  const commonTech = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++',
    'SQL', 'AWS', 'Docker', 'Kubernetes', 'Go', 'Golang', 'Rust', 'GraphQL',
    'Next.js', 'PostgreSQL', 'MongoDB', 'Redis', 'GCP', 'Azure', 'Git', 'Linux'
  ];

  const matchedSkills: string[] = [];
  const textLower = pageData.cleanTextSnippet.toLowerCase();
  for (const tech of commonTech) {
    if (textLower.includes(tech.toLowerCase())) {
      matchedSkills.push(tech);
    }
  }

  // 2-line factual summary
  let summary = '';
  if (role && company && company !== 'Unknown Company') {
    summary = `${role} role at ${company}${location ? ` (${location})` : ''}.\nKey requirements include ${matchedSkills.length > 0 ? matchedSkills.slice(0, 4).join(', ') : 'core technical fundamentals'}.`;
  } else {
    summary = `${role} position.\nReview job description and requirements for full details.`;
  }

  // Extract company domain and logo URL if available
  const companyLogoUrl = fromLd?.companyLogoUrl || pageData.metaTags['jobtrack:dom_company_logo'] || undefined;
  let companyDomain = fromLd?.companyDomain;
  if (!companyDomain && pageData.metaTags['jobtrack:dom_company_website']) {
    try {
      const u = new URL(pageData.metaTags['jobtrack:dom_company_website']);
      const host = u.hostname.replace(/^www\./, '');
      if (!isJobBoardOrAtsDomain(host)) {
        companyDomain = host;
      }
    } catch {
      // ignore
    }
  }
  if (!companyDomain && pageData.domain && !isJobBoardOrAtsDomain(pageData.domain)) {
    companyDomain = pageData.domain.replace(/^www\./, '');
  }

  return {
    company,
    companyDomain,
    companyLogoUrl,
    role,
    location: location || 'Not specified',
    salary: cleanSalaryString(salary),
    appliedDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    endDate,
    vacancies: vacancies || 'Not specified',
    description: description || pageData.cleanTextSnippet.slice(0, 1000),
    summary,
    skills: matchedSkills.slice(0, 8),
    recruiter: '',
    source: detectPlatformSource(pageData.url),
    confidence: {
      company: fromLd?.company || domCompany ? 0.95 : 0.7,
      role: fromLd?.role || domRole ? 0.95 : 0.7,
      salary: salary !== 'Not specified' ? 0.85 : 0.0,
    },
    isJobPosting: true,
  };
}
