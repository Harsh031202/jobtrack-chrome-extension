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
 * Parse salary/CTC string to an annualized numeric INR value for comparative sorting
 * Handles:
 * - Currencies: USD ($), EUR (€), GBP (£), CAD (C$), AUD (A$), INR (₹ / Rs / INR)
 * - Frequencies: Per Year / Per Annum / LPA, Per Month / pm, Per Hour / hr, Per Week
 * - Units: Crore (Cr), Lakh / Lac (LPA / L), Thousand (k / thousand)
 * - Ranges: "$185,000 - $240,000", "₹42 - ₹55 LPA" (uses upper bound)
 */
export function parseSalaryToAnnualValue(salary?: string | null): number {
  if (!salary || typeof salary !== 'string') return 0;
  const lower = salary.toLowerCase().trim();
  if (!lower || lower.includes('not specified') || lower === 'null' || lower === 'undefined') {
    return 0;
  }

  // 1. Detect Currency Exchange Multiplier (normalizing to INR base)
  let currencyMultiplier = 1; // Default INR
  if (lower.includes('£') || lower.includes('gbp')) {
    currencyMultiplier = 110;
  } else if (lower.includes('€') || lower.includes('eur')) {
    currencyMultiplier = 92;
  } else if (lower.includes('c$') || lower.includes('cad')) {
    currencyMultiplier = 62;
  } else if (lower.includes('a$') || lower.includes('aud')) {
    currencyMultiplier = 55;
  } else if (lower.includes('$') || lower.includes('usd')) {
    currencyMultiplier = 85;
  }

  // 2. Detect Frequency Multiplier (annualized)
  let defaultFreqMultiplier = 1;
  if (/month|\/mo|\bpm\b|per month|\/m(?![a-z])|stipend/i.test(lower)) {
    defaultFreqMultiplier = 12;
  } else if (/week|\/wk|per week/i.test(lower)) {
    defaultFreqMultiplier = 52;
  } else if (/hour|\/hr|per hour/i.test(lower)) {
    defaultFreqMultiplier = 2000; // ~2000 working hours/year
  } else if (/day|\/day|per day/i.test(lower)) {
    defaultFreqMultiplier = 250; // ~250 working days/year
  }

  // Clean commas for numerical matching: "1,00,000" -> "100000", "20,000" -> "20000"
  const clean = lower.replace(/,/g, '');

  // Detect general unit hints in the string
  const hasCroreHint = /cr(?:ore)?s?\b/i.test(clean);
  const hasLakhHint = /lpa|lakhs?|lacs?|lac|\bl\b/i.test(clean) || /\d\s*l(?![a-z])/i.test(clean);
  const hasThousandHint = /thousand|\bk\b/i.test(clean) || /\d\s*k(?![a-z])/i.test(clean);
  const hasMillionHint = /million|\bm\b/i.test(clean) || /\d\s*m(?![a-z])/i.test(clean);

  // Match numbers and attached/following units
  // Example matches: "10lpa", "10 lpa", "10L", "20k", "1.5cr", "20000", "55"
  const itemRegex =
    /(\d+(?:\.\d+)?)\s*(cr(?:ore)?s?|lpa|lakhs?|lacs?|lac|l(?![a-z])|k(?![a-z])|thousand|m(?![a-z])|million)?/gi;

  const candidates: { num: number; unit: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(clean)) !== null) {
    const num = parseFloat(m[1]);
    if (isNaN(num)) continue;
    const rawUnit = (m[2] || '').toLowerCase();
    candidates.push({
      num,
      unit: rawUnit,
      index: m.index,
    });
  }

  if (candidates.length === 0) return 0;

  // Propagate shared range unit: e.g. "10 - 15 LPA" or "20 - 25k"
  // If a candidate lacks a unit but a neighbour in range has one, adopt it
  for (let i = 0; i < candidates.length; i++) {
    if (!candidates[i].unit) {
      if (i + 1 < candidates.length && candidates[i + 1].unit) {
        candidates[i].unit = candidates[i + 1].unit;
      } else if (i > 0 && candidates[i - 1].unit) {
        candidates[i].unit = candidates[i - 1].unit;
      } else if (hasCroreHint && candidates[i].num < 100) {
        candidates[i].unit = 'cr';
      } else if (hasLakhHint && candidates[i].num < 1000) {
        candidates[i].unit = 'lpa';
      } else if (hasThousandHint && candidates[i].num < 1000) {
        candidates[i].unit = 'k';
      } else if (hasMillionHint && candidates[i].num < 1000) {
        candidates[i].unit = 'm';
      }
    }
  }

  // Calculate annualized INR value for each candidate
  const annualizedValues = candidates.map((cand) => {
    let amount = cand.num;
    const u = cand.unit;

    if (/^cr/i.test(u)) {
      amount *= 10000000;
    } else if (/^(lpa|lakh|lac|l)/i.test(u)) {
      amount *= 100000;
    } else if (/^(k|thousand)/i.test(u)) {
      amount *= 1000;
    } else if (/^(m|million)/i.test(u)) {
      amount *= 1000000;
    }

    // Apply frequency multiplier
    // Note: LPA, Lakhs per annum, etc. are already annual by definition
    let freq = defaultFreqMultiplier;
    if (u === 'lpa' || /per annum|\/yr|\/year|p\.a\.|pa\b/i.test(clean)) {
      // If expressly annual or LPA, don't multiply by monthly even if "month" is mentioned elsewhere in notes
      freq = 1;
    }

    amount *= freq;
    amount *= currencyMultiplier;

    return amount;
  });

  return Math.max(...annualizedValues);
}


export interface DaysLeftInfo {
  days: number | null;
  displayDays: string;
  label: string;
  isOverdue: boolean;
  isToday: boolean;
}

/**
 * Calculate days remaining until job application deadline
 */
export function calculateDaysLeft(endDate?: string | null): DaysLeftInfo {
  if (!endDate) {
    return { days: null, displayDays: '—', label: 'NO DUE', isOverdue: false, isToday: false };
  }

  try {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return { days: null, displayDays: '—', label: 'NO DUE', isOverdue: false, isToday: false };
    }

    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    const diffMs = endZero - todayZero;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        displayDays: String(Math.abs(diffDays)).padStart(2, '0'),
        label: 'OVERDUE',
        isOverdue: true,
        isToday: false,
      };
    }

    if (diffDays === 0) {
      return {
        days: 0,
        displayDays: '00',
        label: 'DUE TODAY',
        isOverdue: false,
        isToday: true,
      };
    }

    return {
      days: diffDays,
      displayDays: String(diffDays).padStart(2, '0'),
      label: 'DAYS LEFT',
      isOverdue: false,
      isToday: false,
    };
  } catch {
    return { days: null, displayDays: '—', label: 'NO DUE', isOverdue: false, isToday: false };
  }
}
