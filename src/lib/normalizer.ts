/**
 * URL normalization utility
 * Strips tracking queries and parameters (utm_*, ref, trk, trackingId, etc.)
 */
export function normalizeJobUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    
    // Tracking parameters to strip
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'refId',
      'trackingId',
      'trk',
      'trkInfo',
      'midToken',
      'midSig',
      'source',
      'f_TPR',
      'position',
      'pageNum',
      'from',
      'refCode',
    ];

    trackingParams.forEach((param) => url.searchParams.delete(param));

    // Handle LinkedIn job URLs: extract canonical job posting ID
    // e.g. https://www.linkedin.com/jobs/view/123456789/
    if (url.hostname.includes('linkedin.com')) {
      const match = url.pathname.match(/\/jobs\/view\/(\d+)/);
      if (match) {
        return `https://www.linkedin.com/jobs/view/${match[1]}`;
      }
    }

    // Return clean URL without hash unless needed
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}${url.search ? url.search : ''}`;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Detect source platform from URL or domain
 */
export function detectPlatformSource(rawUrl: string): string {
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();

    if (hostname.includes('linkedin.com')) return 'LinkedIn';
    if (hostname.includes('naukri.com')) return 'Naukri';
    if (hostname.includes('indeed.com')) return 'Indeed';
    if (hostname.includes('greenhouse.io')) return 'Greenhouse';
    if (hostname.includes('lever.co')) return 'Lever';
    if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) return 'Wellfound';
    if (hostname.includes('internshala.com')) return 'Internshala';
    if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) return 'Workday';
    if (hostname.includes('smartrecruiters.com')) return 'SmartRecruiters';
    if (hostname.includes('ashbyhq.com')) return 'Ashby';
    if (hostname.includes('glassdoor.com')) return 'Glassdoor';
    if (hostname.includes('ziprecruiter.com')) return 'ZipRecruiter';

    // Extract clean domain name as Company Careers
    const parts = hostname.replace(/^www\./, '').split('.');
    if (parts.length >= 2) {
      const brand = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      return `${brand} Careers`;
    }

    return 'Company Website';
  } catch {
    return 'Other';
  }
}

/**
 * Format date intelligently:
 * - "Today"
 * - "Yesterday"
 * - "Oct 4" (if this year)
 * - "Oct 4, 2025" (if previous/future year)
 */
export function formatDisplayDate(isoDateString?: string | null): string {
  if (!isoDateString) return 'Not set';

  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    const isThisYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    });
  } catch {
    return isoDateString;
  }
}

/**
 * Extract structured date components for Tabato-style date block
 * Returns day name (e.g. "Wed"), 2-digit day number (e.g. "28"), and month name (e.g. "Oct")
 */
export function formatDateBlock(isoDateString?: string | null): {
  dayName: string;
  dayNumber: string;
  monthName: string;
  year: number;
} {
  const fallback = { dayName: '—', dayNumber: '—', monthName: '', year: new Date().getFullYear() };
  if (!isoDateString) return fallback;

  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return fallback;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const dayName = dayNames[date.getDay()];
    const dayNumber = String(date.getDate()).padStart(2, '0');
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return { dayName, dayNumber, monthName, year };
  } catch {
    return fallback;
  }
}

/**
 * Format due date as "DD Month YYYY" (e.g. "19 Dec 2026")
 */
export function formatDueByDate(isoDateString?: string | null): string {
  if (!isoDateString) return '';
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return isoDateString;
  }
}

/**
 * Clean & preserve compensation/CTC formatting
 * Ensures we don't hallucinate or mangle symbols
 */
export function cleanSalaryString(rawSalary?: string): string {
  if (!rawSalary) return 'Not specified';
  const trimmed = rawSalary.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return 'Not specified';
  }
  return trimmed;
}

/**
 * Parse numeric count of vacancies from text (e.g. "5 Openings", "1 Position", "Multiple")
 */
export function parseVacancies(vacancies?: string | null): number {
  if (!vacancies) return 0;
  const match = vacancies.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  if (/multiple/i.test(vacancies)) return 5;
  return 0;
}

/**
 * Parse salary/CTC string to an annualized numeric value for comparative sorting
 */
export function parseSalaryToAnnualValue(salary?: string | null): number {
  if (!salary || salary.toLowerCase().includes('not specified')) return 0;

  const text = salary.toLowerCase().replace(/,/g, '');

  // Detect multipliers & frequencies
  const isLakh = /lpa|lakh|\bl\b/i.test(text);
  const isMonthly = /month|\/mo|\bpm\b/i.test(text);
  const isHourly = /hour|\/hr/i.test(text);
  const isK = /\bk\b/.test(text);

  // Extract all numbers
  const numbers = text.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return 0;

  // Use the upper bound in ranges (e.g. 42 - 55 LPA -> 55)
  const maxNum = Math.max(...numbers.map(Number));

  if (isLakh) {
    return maxNum * 100000;
  }
  if (isK) {
    return maxNum * 1000;
  }
  if (isMonthly) {
    return maxNum * 12;
  }
  if (isHourly) {
    return maxNum * 2000;
  }

  return maxNum;
}
