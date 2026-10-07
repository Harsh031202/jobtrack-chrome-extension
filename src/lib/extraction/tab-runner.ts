import { RawPageData } from '../../types/extractor';

export interface TabExtractionResult {
  success: boolean;
  pageData?: RawPageData;
  error?: string;
  isRestrictedUrl?: boolean;
}

/**
 * Pure function that executes directly in the target web page context via chrome.scripting.executeScript.
 * Extracts title, meta tags, JSON-LD, headings, specialized job selectors, and clean text.
 */
function extractPageInContext(): RawPageData {
  const url = window.location.href;
  const title = document.title || '';
  const domain = window.location.hostname;

  // 1. JSON-LD extraction
  const jsonLdList: any[] = [];
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((s) => {
      try {
        const text = s.textContent?.trim();
        if (text) jsonLdList.push(JSON.parse(text));
      } catch {
        // ignore malformed json-ld
      }
    });
  } catch {
    // ignore
  }

  // 2. Meta tags
  const metaTags: Record<string, string> = {};
  try {
    document.querySelectorAll('meta').forEach((m) => {
      const prop = m.getAttribute('property') || m.getAttribute('name');
      const content = m.getAttribute('content');
      if (prop && content) metaTags[prop] = content;
    });
  } catch {
    // ignore
  }

  // 3. Headings
  const headings: string[] = [];
  try {
    document.querySelectorAll('h1, h2').forEach((h) => {
      const text = h.textContent?.replace(/\s+/g, ' ').trim();
      if (text && text.length > 3 && text.length < 120) {
        headings.push(text);
      }
    });
  } catch {
    // ignore
  }

  // 4. Targeted job site DOM hints (LinkedIn, Indeed, Naukri, Greenhouse, Lever, Workday, etc.)
  let domCompany = '';
  let domRole = '';
  let domLocation = '';
  let domSalary = '';
  let domCompanyLogo = '';
  let domCompanyWebsite = '';

  try {
    // LinkedIn
    const liTitle = document.querySelector(
      '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.top-card-layout__title, .topcard__title'
    );
    if (liTitle) domRole = liTitle.textContent?.trim() || '';

    const liComp = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .topcard__org-name-link, .topcard__flavor--black-link'
    );
    if (liComp) domCompany = liComp.textContent?.trim() || '';

    const liLoc = document.querySelector(
      '.job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet'
    );
    if (liLoc) domLocation = liLoc.textContent?.trim() || '';

    const liLogo = document.querySelector(
      '.job-details-jobs-unified-top-card__company-logo img, .jobs-unified-top-card__company-logo img, .jobs-company__logo img, .topcard__org-name-image'
    );
    if (liLogo && (liLogo as HTMLImageElement).src && !(liLogo as HTMLImageElement).src.startsWith('data:image/svg')) {
      domCompanyLogo = (liLogo as HTMLImageElement).src;
    }

    // Indeed
    if (!domRole) {
      const indTitle = document.querySelector('h1.jobsearch-JobInfoHeader-title, h1');
      if (indTitle) domRole = indTitle.textContent?.trim() || '';
    }
    if (!domCompany) {
      const indComp = document.querySelector(
        '[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating-companyHeader'
      );
      if (indComp) domCompany = indComp.textContent?.trim() || '';
    }
    if (!domLocation) {
      const indLoc = document.querySelector('[data-testid="inlineHeader-companyLocation"]');
      if (indLoc) domLocation = indLoc.textContent?.trim() || '';
    }
    if (!domCompanyLogo) {
      const indLogo = document.querySelector('[data-testid="employer-logo"] img, .jobsearch-CompanyAvatar img');
      if (indLogo && (indLogo as HTMLImageElement).src) {
        domCompanyLogo = (indLogo as HTMLImageElement).src;
      }
    }

    // Greenhouse / Lever
    if (!domRole) {
      const ghTitle = document.querySelector('.app-title, .posting-headline h2');
      if (ghTitle) domRole = ghTitle.textContent?.trim() || '';
    }
    if (!domCompany) {
      const ghComp = document.querySelector('.company-name');
      if (ghComp) domCompany = ghComp.textContent?.trim() || '';
    }
    if (!domCompanyLogo) {
      const ghLogo = document.querySelector('#header img, .logo img, .main-header-logo img, .company-logo');
      if (ghLogo && (ghLogo as HTMLImageElement).src) {
        domCompanyLogo = (ghLogo as HTMLImageElement).src;
      }
    }

    // Workday
    if (!domCompanyLogo) {
      const wdLogo = document.querySelector('[data-automation-id="companyLogo"] img, .header-logo img');
      if (wdLogo && (wdLogo as HTMLImageElement).src) {
        domCompanyLogo = (wdLogo as HTMLImageElement).src;
      }
    }

    // Naukri
    if (!domRole) {
      const nkTitle = document.querySelector('h1.styles_jd-header-title__rZwM1, .jd-header-title');
      if (nkTitle) domRole = nkTitle.textContent?.trim() || '';
    }
    if (!domCompany) {
      const nkComp = document.querySelector('a.styles_jd-header-comp-name__MvqAI, .comp-name');
      if (nkComp) domCompany = nkComp.textContent?.trim() || '';
    }
    if (!domCompanyLogo) {
      const nkLogo = document.querySelector('.company-info .company-logo img, .styles_jd-header-comp-name__MvqAI img');
      if (nkLogo && (nkLogo as HTMLImageElement).src) {
        domCompanyLogo = (nkLogo as HTMLImageElement).src;
      }
    }

    // Generic employer logo selector fallback
    if (!domCompanyLogo) {
      const genLogo = document.querySelector('img[class*="company-logo" i], img[class*="companyLogo" i], img[class*="employer-logo" i]');
      if (genLogo && (genLogo as HTMLImageElement).src) {
        domCompanyLogo = (genLogo as HTMLImageElement).src;
      }
    }

    // Store DOM hints into metaTags for the heuristic parser
    if (domCompany) metaTags['jobtrack:dom_company'] = domCompany;
    if (domRole) metaTags['jobtrack:dom_role'] = domRole;
    if (domLocation) metaTags['jobtrack:dom_location'] = domLocation;
    if (domSalary) metaTags['jobtrack:dom_salary'] = domSalary;
    if (domCompanyLogo) metaTags['jobtrack:dom_company_logo'] = domCompanyLogo;
    if (domCompanyWebsite) metaTags['jobtrack:dom_company_website'] = domCompanyWebsite;
  } catch {
    // ignore
  }

  // 5. Clean text snippet
  let cleanTextSnippet = '';
  try {
    const mainEl =
      document.querySelector('main') ||
      document.querySelector('article') ||
      document.querySelector('.jobs-description') ||
      document.querySelector('#job-details') ||
      document.querySelector('.job-description') ||
      document.body;

    const clone = (mainEl || document.body).cloneNode(true) as HTMLElement;
    const noisySelectors = [
      'script',
      'style',
      'noscript',
      'nav',
      'header',
      'footer',
      'svg',
      'iframe',
      '.cookie-banner',
      '#cookie-banner',
      '.advertisement',
    ];
    noisySelectors.forEach((sel) => clone.querySelectorAll(sel).forEach((el) => el.remove()));

    cleanTextSnippet = (clone.innerText || clone.textContent || '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim()
      .slice(0, 5500);
  } catch {
    cleanTextSnippet = document.body ? document.body.innerText.slice(0, 3000) : '';
  }

  return {
    url,
    title,
    domain,
    metaTags,
    jsonLdList,
    headings: headings.slice(0, 5),
    cleanTextSnippet,
    detectedSource: domain,
  };
}

/**
 * Extracts raw job page data from the active browser tab.
 */
export async function extractFromActiveTab(): Promise<TabExtractionResult> {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    // Dev or non-extension test mode
    return {
      success: true,
      pageData: {
        url: 'https://www.linkedin.com/jobs/view/3948572019/',
        title: 'Senior Software Engineer - Distributed Systems at Stripe | LinkedIn',
        domain: 'linkedin.com',
        metaTags: {
          'og:title': 'Senior Software Engineer - Distributed Systems',
          'og:site_name': 'Stripe',
          'jobtrack:dom_company': 'Stripe',
          'jobtrack:dom_role': 'Senior Software Engineer - Distributed Systems',
        },
        jsonLdList: [
          {
            '@type': 'JobPosting',
            title: 'Senior Software Engineer - Distributed Systems',
            hiringOrganization: { name: 'Stripe' },
            jobLocation: { address: 'San Francisco, CA (Hybrid)' },
            baseSalary: { value: '$185,000 - $240,000 / year' },
            description: 'Lead architecture for global payments infrastructure. Requires Go, Java, high throughput distributed systems, and SQL experience.',
          },
        ],
        headings: ['About the role', 'Minimum requirements', 'Compensation & Benefits'],
        cleanTextSnippet: 'Stripe is looking for a Senior Software Engineer to build high-scale financial infrastructure. We process hundreds of billions in transactions annually. You will design, build, and maintain scalable APIs and fault-tolerant backends. Requirements: 5+ years building backend systems in Go, Java, or Rust. Strong database fundamentals (Postgres, Cassandra). Compensation: $185,000 - $240,000 base salary plus equity.',
        detectedSource: 'LinkedIn',
      },
    };
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return { success: false, error: 'No active browser tab found.' };
    }

    const tabUrl = tab.url || '';
    if (
      tabUrl.startsWith('chrome://') ||
      tabUrl.startsWith('chrome-extension://') ||
      tabUrl.startsWith('edge://') ||
      tabUrl.startsWith('about:') ||
      tabUrl.startsWith('view-source:')
    ) {
      return {
        success: false,
        error: 'JobTrack cannot read internal browser pages. Please open a job listing on the web.',
        isRestrictedUrl: true,
      };
    }

    // Direct script execution in tab context
    if (chrome.scripting) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPageInContext,
        });

        if (results && results[0] && results[0].result) {
          return { success: true, pageData: results[0].result };
        }
      } catch (scriptErr: any) {
        console.warn('Direct scripting injection error:', scriptErr);
      }
    }

    // Fallback: If executeScript failed, construct basic pageData from tab properties
    const fallbackTitle = tab.title || '';
    return {
      success: true,
      pageData: {
        url: tabUrl,
        title: fallbackTitle,
        domain: new URL(tabUrl).hostname,
        metaTags: {},
        jsonLdList: [],
        headings: [fallbackTitle],
        cleanTextSnippet: fallbackTitle,
        detectedSource: new URL(tabUrl).hostname,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to inspect active tab.',
    };
  }
}
