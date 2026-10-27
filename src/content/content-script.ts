import { RawPageData, ExtractedJobData } from '../types/extractor';

function detectPlatformSource(rawUrl: string): string {
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
    const parts = hostname.replace(/^www\./, '').split('.');
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ' Careers';
    }
    return 'Company Website';
  } catch {
    return 'Other';
  }
}

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

    // Targeted DOM employer logo extraction
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
      'img[class*="employer-logo" i]',
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
    const clone = targetElement.cloneNode(true) as HTMLElement;

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

/* ==========================================================================
   NON-INTRUSIVE FLOATING PILL (SHADOW DOM ISOLATION)
   Zero center-of-screen modals — automatically triggers the extension popup.
   ========================================================================== */

let hostElement: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let autoHideTimer: any = null;
let minimizeTimer: any = null;

const LOGO_SVG = `
  <svg viewBox="0 0 32 32" width="22" height="22" fill="none" style="flex-shrink:0;">
    <rect width="32" height="32" rx="7.5" fill="#18191D"/>
    <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="#333842" stroke-width="1"/>
    <circle cx="10.5" cy="10" r="2.5" fill="#10B981"/>
    <path d="M15 9.5H22V19C22 21.8 19.8 24 17 24C14.2 24 12 21.8 12 19V17" stroke="#FFFFFF" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ensureShadowRoot(): ShadowRoot {
  if (shadowRoot && hostElement && document.contains(hostElement)) {
    return shadowRoot;
  }

  const existing = document.getElementById('jobtrack-floating-host');
  if (existing) existing.remove();

  hostElement = document.createElement('div');
  hostElement.id = 'jobtrack-floating-host';
  hostElement.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; bottom: 24px; right: 24px; pointer-events: none;';
  document.documentElement.appendChild(hostElement);

  shadowRoot = hostElement.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .jt-container {
      position: relative;
      pointer-events: auto;
    }

    /* 1. Initial Tracking Card: Slowly minimizes into a small pill */
    .jt-tracking-box {
      width: 320px;
      background: rgba(22, 27, 34, 0.98);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 18px;
      padding: 14px 16px;
      box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.6), 0 8px 16px -6px rgba(0, 0, 0, 0.4);
      color: #F0F6FC;
      transition: all 0.75s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      animation: jtBoxEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes jtBoxEnter {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.92);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .jt-box-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .jt-box-title {
      font-size: 13px;
      font-weight: 700;
      color: #F0F6FC;
      letter-spacing: -0.01em;
    }

    .jt-box-subtitle {
      font-size: 11px;
      color: #8B949E;
      margin-top: 1px;
    }

    .jt-progress-bar {
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
      margin-top: 6px;
    }

    .jt-progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 40%;
      background: linear-gradient(90deg, #E05638, #FF8A77);
      border-radius: 9999px;
      animation: jtShimmer 1.4s ease-in-out infinite alternate;
    }

    @keyframes jtShimmer {
      0% { left: 0%; width: 25%; }
      100% { left: 75%; width: 35%; }
    }

    /* Morphing into the compact pill */
    .jt-tracking-box.jt-is-pill {
      width: 270px;
      border-radius: 9999px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.5);
    }

    .jt-tracking-box.jt-is-pill .jt-progress-bar,
    .jt-tracking-box.jt-is-pill .jt-box-subtitle {
      display: none;
    }

    .jt-tracking-box.jt-is-pill .jt-box-top {
      margin-bottom: 0;
      width: 100%;
    }

    /* Disappearing state after 5 seconds */
    .jt-tracking-box.jt-hidden,
    .jt-pill.jt-hidden {
      opacity: 0 !important;
      transform: translateY(20px) scale(0.92) !important;
      pointer-events: none !important;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .jt-spinner {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #E05638;
      border-radius: 50%;
      animation: jtSpin 0.75s linear infinite;
      flex-shrink: 0;
    }

    @keyframes jtSpin {
      to { transform: rotate(360deg); }
    }

    /* 2. Ready Pill at Bottom-Right (No center modal) */
    .jt-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(22, 27, 34, 0.98);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #F0F6FC;
      padding: 9px 15px;
      border-radius: 9999px;
      box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.55), 0 6px 12px -4px rgba(0, 0, 0, 0.4);
      max-width: 460px;
      cursor: pointer;
      user-select: none;
      animation: jtPillSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .jt-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 36px -4px rgba(0, 0, 0, 0.65);
    }

    @keyframes jtPillSlideIn {
      from { opacity: 0; transform: translateY(18px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .jt-ready-content {
      display: flex;
      flex-direction: column;
      gap: 1px;
      max-width: 250px;
      overflow: hidden;
    }

    .jt-ready-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #34D399;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .jt-dot-green {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
    }

    .jt-ready-title {
      font-size: 12px;
      font-weight: 700;
      color: #F0F6FC;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .jt-btn-open-ext {
      background: #E05638;
      color: #FFFFFF;
      border: none;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease, transform 0.1s ease;
      box-shadow: 0 2px 6px rgba(224, 86, 56, 0.4);
      flex-shrink: 0;
    }

    .jt-btn-open-ext:hover {
      background: #EE7356;
      transform: translateY(-1px);
    }

    .jt-btn-open-ext:active {
      background: #CA472A;
      transform: translateY(0);
    }

    .jt-btn-close {
      background: transparent;
      border: none;
      color: #656D76;
      font-size: 15px;
      line-height: 1;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
      transition: color 0.15s, background 0.15s;
      flex-shrink: 0;
    }

    .jt-btn-close:hover {
      color: #F0F6FC;
      background: rgba(255, 255, 255, 0.1);
    }

    .jt-success-toast {
      background: #10B981;
      color: #FFFFFF;
      padding: 9px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
      animation: jtPillSlideIn 0.25s ease-out;
    }
  `;
  shadowRoot.appendChild(styleEl);

  const container = document.createElement('div');
  container.className = 'jt-container';
  container.id = 'jt-content-area';
  shadowRoot.appendChild(container);

  return shadowRoot;
}

/**
 * 1. Shows initial tracking card, SLOWLY MINIMIZES INTO A PILL after 1.2s,
 * and DISAPPEARS after 5 seconds.
 */
function showTrackingSequence() {
  if (autoHideTimer) clearTimeout(autoHideTimer);
  if (minimizeTimer) clearTimeout(minimizeTimer);

  const root = ensureShadowRoot();
  const area = root.getElementById('jt-content-area');
  if (!area) return;

  // Render initial card
  area.innerHTML = `
    <div class="jt-tracking-box" id="jt-tracking-box">
      <div class="jt-box-top">
        <div style="display:flex; align-items:center; gap:8px;">
          ${LOGO_SVG}
          <div>
            <div class="jt-box-title">Tracking Job Application…</div>
            <div class="jt-box-subtitle">Extracting company, role & compensation</div>
          </div>
        </div>
        <button class="jt-btn-close" id="jt-box-close" title="Dismiss">✕</button>
      </div>
      <div class="jt-progress-bar">
        <div class="jt-progress-fill"></div>
      </div>
    </div>
  `;

  root.getElementById('jt-box-close')?.addEventListener('click', () => dismissHost());

  // After 1.2s: Slowly minimize into a compact pill
  minimizeTimer = setTimeout(() => {
    const box = root.getElementById('jt-tracking-box');
    if (box) {
      box.classList.add('jt-is-pill');
      box.innerHTML = `
        <div class="jt-box-top">
          <div style="display:flex; align-items:center; gap:8px;">
            ${LOGO_SVG}
            <div class="jt-spinner"></div>
            <span style="font-size:12px; font-weight:600; color:#F0F6FC;">Tracking application…</span>
          </div>
          <button class="jt-btn-close" id="jt-pill-close" title="Dismiss">✕</button>
        </div>
      `;
      root.getElementById('jt-pill-close')?.addEventListener('click', () => dismissHost());
    }
  }, 1200);

  // After 5s: Disappear completely so it doesn't obstruct browsing
  autoHideTimer = setTimeout(() => {
    const box = root.getElementById('jt-tracking-box');
    if (box) {
      box.classList.add('jt-hidden');
    }
  }, 5000);
}

/**
 * 2. When tracking finishes:
 * Reappears at bottom-right and automatically opens the extension popup (no center modal!).
 */
function showReadyState(extractedData: ExtractedJobData) {
  if (autoHideTimer) clearTimeout(autoHideTimer);
  if (minimizeTimer) clearTimeout(minimizeTimer);

  // Request the extension popup to open automatically
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ action: 'OPEN_POPUP' }).catch(() => {});
  }

  const root = ensureShadowRoot();
  const area = root.getElementById('jt-content-area');
  if (!area) return;

  const roleText = extractedData.role || 'Job Application';
  const companyText = extractedData.company || 'Company';

  area.innerHTML = `
    <div class="jt-pill" id="jt-ready-pill" title="Click to open JobTrack approval">
      ${LOGO_SVG}
      <div class="jt-ready-content">
        <span class="jt-ready-badge">
          <span class="jt-dot-green"></span>Ready for approval
        </span>
        <span class="jt-ready-title" title="${escapeHtml(roleText)} at ${escapeHtml(companyText)}">
          <strong>${escapeHtml(roleText)}</strong> at ${escapeHtml(companyText)}
        </span>
      </div>
      <button class="jt-btn-open-ext" id="jt-btn-open-popup">Approve</button>
      <button class="jt-btn-close" id="jt-btn-dismiss" title="Dismiss">✕</button>
    </div>
  `;

  // Clicking the button or pill opens the extension popup immediately
  const triggerOpenPopup = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'OPEN_POPUP' });
    }
  };

  root.getElementById('jt-ready-pill')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'jt-btn-dismiss') return;
    triggerOpenPopup();
  });

  root.getElementById('jt-btn-open-popup')?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerOpenPopup();
  });

  root.getElementById('jt-btn-dismiss')?.addEventListener('click', (e) => {
    e.stopPropagation();
    // Dismiss only the in-page pill — do NOT discard the pending application from the extension
    dismissHost();
  });
}

function dismissHost() {
  if (autoHideTimer) clearTimeout(autoHideTimer);
  if (minimizeTimer) clearTimeout(minimizeTimer);
  if (hostElement && document.contains(hostElement)) {
    hostElement.remove();
    hostElement = null;
    shadowRoot = null;
  }
}

/* ==========================================================================
   MESSAGE LISTENER (FROM BACKGROUND SERVICE WORKER / POPUP)
   ========================================================================== */

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'EXTRACT_PAGE_DATA') {
      try {
        const data = extractPageContent();
        sendResponse({ success: true, data });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'Extraction failed' });
      }
      return true;
    }

    if (message?.action === 'SHOW_TRACKING_PILL') {
      showTrackingSequence();
      sendResponse({ success: true });
      return true;
    }

    if (message?.action === 'TRACKING_COMPLETE') {
      showReadyState(message.data);
      sendResponse({ success: true });
      return true;
    }

    if (message?.action === 'DISMISS_PILL') {
      dismissHost();
      sendResponse({ success: true });
      return true;
    }

    return true;
  });
}

// When application is confirmed or cleared in storage, dismiss the floating pill automatically
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.jobtrack_pending_approval && !changes.jobtrack_pending_approval.newValue) {
      const root = shadowRoot;
      const areaEl = root?.getElementById('jt-content-area');
      if (areaEl) {
        areaEl.innerHTML = `
          <div class="jt-success-toast">
            ✓ Application Saved to JobTrack!
          </div>
        `;
        setTimeout(() => dismissHost(), 1600);
      } else {
        dismissHost();
      }
    }
  });
}

// On page load, if there is a pending approval for this URL, display the compact ready pill
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get('jobtrack_pending_approval', (res) => {
    const pending = res?.jobtrack_pending_approval;
    if (pending && pending.extractedData && pending.pageUrl) {
      try {
        const currentClean = window.location.href.split('?')[0].split('#')[0];
        const pendingClean = pending.pageUrl.split('?')[0].split('#')[0];
        if (currentClean === pendingClean) {
          showReadyState(pending.extractedData);
        }
      } catch {
        if (window.location.href === pending.pageUrl) {
          showReadyState(pending.extractedData);
        }
      }
    }
  });
}
