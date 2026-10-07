import { RawPageData } from '../types/extractor';
import { detectPlatformSource } from '../lib/normalizer';

/**
 * Cleanly extracts page metadata and visible job text without garbage
 */
export function extractPageContent(): RawPageData {
  const url = window.location.href;
  const title = document.title || '';
  const domain = window.location.hostname;
  const detectedSource = detectPlatformSource(url);

  // 1. Extract JSON-LD scripts
  const jsonLdList: any[] = [];
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((s) => {
      try {
        const text = s.textContent?.trim();
        if (text) {
          jsonLdList.push(JSON.parse(text));
        }
      } catch {
        // Skip malformed individual JSON-LD
      }
    });
  } catch (err) {
    console.debug('JobTrack: JSON-LD extraction skipped', err);
  }

  // 2. Extract OpenGraph / Meta tags
  const metaTags: Record<string, string> = {};
  try {
    const metas = document.querySelectorAll('meta');
    metas.forEach((m) => {
      const prop = m.getAttribute('property') || m.getAttribute('name');
      const content = m.getAttribute('content');
      if (prop && content) {
        metaTags[prop] = content;
      }
    });
    // 2b. Targeted DOM employer logo extraction
    const domLogoSelectors = [
      '.job-details-jobs-unified-top-card__company-logo img',
      '.jobs-unified-top-card__company-logo img',
      '.jobs-company__logo img',
      '.topcard__org-name-image',
      '[data-testid="employer-logo"] img',
      '.jobsearch-CompanyAvatar img',
      '#header img',
      '.main-header-logo img',
      '[data-automation-id="companyLogo"] img',
      '.header-logo img',
      '.company-info .company-logo img',
      'img[class*="company-logo" i]',
      'img[class*="companyLogo" i]',
      'img[class*="employer-logo" i]'
    ];
    for (const sel of domLogoSelectors) {
      const img = document.querySelector(sel);
      if (img && (img as HTMLImageElement).src && !(img as HTMLImageElement).src.startsWith('data:image/svg')) {
        metaTags['jobtrack:dom_company_logo'] = (img as HTMLImageElement).src;
        break;
      }
    }
  } catch (err) {
    console.debug('JobTrack: Meta extraction skipped', err);
  }

  // 3. Extract Main Headings (H1, H2)
  const headings: string[] = [];
  try {
    const h1s = document.querySelectorAll('h1, h2');
    h1s.forEach((h) => {
      const text = h.textContent?.replace(/\s+/g, ' ').trim();
      if (text && text.length > 3 && text.length < 120) {
        headings.push(text);
      }
    });
  } catch (err) {
    console.debug('JobTrack: Heading extraction skipped', err);
  }

  // 4. Extract Main Content snippet
  let cleanTextSnippet = '';
  try {
    // Look for common main job containers
    const candidates = [
      document.querySelector('main'),
      document.querySelector('article'),
      document.querySelector('.jobs-description'),
      document.querySelector('#job-details'),
      document.querySelector('.job-description'),
      document.querySelector('[data-testid="job-description"]'),
      document.querySelector('.job-details'),
      document.body,
    ];

    const targetElement = candidates.find((el) => el !== null) || document.body;

    // Clone element to avoid mutating live DOM
    const clone = targetElement.cloneNode(true) as HTMLElement;

    // Remove noise: scripts, styles, noscript, nav, header, footer, svgs, iframes
    const tagsToRemove = [
      'script',
      'style',
      'noscript',
      'nav',
      'header',
      'footer',
      'svg',
      'iframe',
      'button',
      'form',
      'aside',
      '.cookie-banner',
      '#cookie-banner',
      '.advertisement',
      '.ad-banner',
    ];

    tagsToRemove.forEach((selector) => {
      try {
        clone.querySelectorAll(selector).forEach((el) => el.remove());
      } catch {
        // Ignore selector errors
      }
    });

    const rawText = clone.innerText || clone.textContent || '';
    // Normalize whitespace and truncate to 5500 chars (safe for LLM token limits & fast transport)
    cleanTextSnippet = rawText
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim()
      .slice(0, 5500);
  } catch (err) {
    console.debug('JobTrack: Body text extraction error', err);
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
    detectedSource,
  };
}

// Listen for message from Extension popup / sidepanel / service worker
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'EXTRACT_PAGE_DATA') {
      try {
        const data = extractPageContent();
        sendResponse({ success: true, data });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'Extraction failed' });
      }
    }
    return true; // Keep message channel open
  });
}
