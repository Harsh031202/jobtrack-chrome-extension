import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';

interface CompanyLogoProps {
  company: string;
  jobUrl?: string;
  companyDomain?: string;
  companyLogoUrl?: string;
  isDashboard?: boolean;
  className?: string;
}

// Strictly blacklist job boards, ATSs, and generic hostnames from ever being used as company logos
const JOB_BOARD_OR_ATS_DOMAINS = [
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
  'snaphunt.com',
];

function isJobBoardOrAtsDomain(hostname: string): boolean {
  if (!hostname) return true;
  const lower = hostname.toLowerCase().replace(/^www\./, '');
  return JOB_BOARD_OR_ATS_DOMAINS.some(
    (d) => lower === d || lower.endsWith('.' + d)
  );
}

// Canonical domain lookup for prominent hiring companies
const COMPANY_DOMAINS: Record<string, string> = {
  deloitte: 'deloitte.com',
  google: 'google.com',
  microsoft: 'microsoft.com',
  stripe: 'stripe.com',
  amazon: 'amazon.com',
  apple: 'apple.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  netflix: 'netflix.com',
  atlassian: 'atlassian.com',
  adobe: 'adobe.com',
  spotify: 'spotify.com',
  uber: 'uber.com',
  airbnb: 'airbnb.com',
  github: 'github.com',
  linkedin: 'linkedin.com',
  salesforce: 'salesforce.com',
  oracle: 'oracle.com',
  cisco: 'cisco.com',
  intel: 'intel.com',
  nvidia: 'nvidia.com',
  amd: 'amd.com',
  ibm: 'ibm.com',
  twitter: 'x.com',
  notion: 'notion.so',
  linear: 'linear.app',
  figma: 'figma.com',
  canva: 'canva.com',
  slack: 'slack.com',
  zoom: 'zoom.us',
  snowflake: 'snowflake.com',
  databricks: 'databricks.com',
  cloudflare: 'cloudflare.com',
  datadog: 'datadoghq.com',
  mongodb: 'mongodb.com',
  docker: 'docker.com',
  paypal: 'paypal.com',
  shopify: 'shopify.com',
  square: 'block.xyz',
  block: 'block.xyz',
  coinbase: 'coinbase.com',
  dropbox: 'dropbox.com',
  pinterest: 'pinterest.com',
  reddit: 'reddit.com',
  snapchat: 'snap.com',
  snap: 'snap.com',
  bytedance: 'bytedance.com',
  tiktok: 'tiktok.com',
  accenture: 'accenture.com',
  infosys: 'infosys.com',
  tcs: 'tcs.com',
  wipro: 'wipro.com',
  cognizant: 'cognizant.com',
  goldmansachs: 'goldmansachs.com',
  'goldman sachs': 'goldmansachs.com',
  jpmorgan: 'jpmorgan.com',
  'jp morgan': 'jpmorgan.com',
  morganstanley: 'morganstanley.com',
  'morgan stanley': 'morganstanley.com',
  mckinsey: 'mckinsey.com',
  bcg: 'bcg.com',
  bain: 'bain.com',
  swiggy: 'swiggy.in',
  zomato: 'zomato.com',
  flipkart: 'flipkart.com',
  razorpay: 'razorpay.com',
  phonepe: 'phonepe.com',
  paytm: 'paytm.com',
  zepto: 'zeptonow.com',
  blinkit: 'blinkit.com',
  browserstack: 'browserstack.com',
  postman: 'postman.com',
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  company,
  jobUrl,
  companyDomain: explicitDomain,
  companyLogoUrl: explicitLogoUrl,
  isDashboard = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const cleanName = (company || 'Company').trim();
  const lower = cleanName.toLowerCase();

  // --- Official Vector / SVG Logos for Top Companies ---

  // DELOITTE (Full official wordmark with green dot)
  if (lower.includes('deloitte')) {
    if (isDashboard) {
      return (
        <div
          className={`inline-flex items-center px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] shadow-2xs select-none ${className}`}
          title="Deloitte"
        >
          <span className="font-bold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink font-sans">
            Deloitte
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#86BC25] ml-0.5 inline-block shrink-0" />
        </div>
      );
    }
    return (
      <div
        className={`w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center select-none font-bold text-xs text-brand-ink dark:text-darkBrand-ink ${className}`}
        title="Deloitte"
      >
        <span>D</span>
        <span className="w-1 h-1 rounded-full bg-[#86BC25] ml-0.2 -mb-1" />
      </div>
    );
  }

  // GOOGLE (Full official 4-color wordmark)
  if (lower.includes('google')) {
    if (isDashboard) {
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border shadow-2xs select-none ${className}`}
          title="Google"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-semibold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink">
            Google
          </span>
        </div>
      );
    }
    return (
      <div className={`w-7 h-7 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border flex items-center justify-center ${className}`}>
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      </div>
    );
  }

  // MICROSOFT (4-square emblem + Microsoft wordmark)
  if (lower.includes('microsoft')) {
    if (isDashboard) {
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border shadow-2xs select-none ${className}`}
          title="Microsoft"
        >
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0">
            <span className="bg-[#F25022] rounded-2xs" />
            <span className="bg-[#7FBA00] rounded-2xs" />
            <span className="bg-[#00A4EF] rounded-2xs" />
            <span className="bg-[#FFB900] rounded-2xs" />
          </div>
          <span className="font-semibold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink">
            Microsoft
          </span>
        </div>
      );
    }
    return (
      <div className={`w-7 h-7 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border flex items-center justify-center ${className}`}>
        <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
          <span className="bg-[#F25022] rounded-2xs" />
          <span className="bg-[#7FBA00] rounded-2xs" />
          <span className="bg-[#00A4EF] rounded-2xs" />
          <span className="bg-[#FFB900] rounded-2xs" />
        </div>
      </div>
    );
  }

  // STRIPE (Official wordmark)
  if (lower.includes('stripe')) {
    if (isDashboard) {
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 border border-[#635BFF]/20 shadow-2xs select-none ${className}`}
          title="Stripe"
        >
          <span className="font-extrabold text-xs tracking-tight text-[#635BFF] font-sans">
            stripe
          </span>
        </div>
      );
    }
    return (
      <div className={`w-7 h-7 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs text-[#635BFF] ${className}`}>
        <span>stripe</span>
      </div>
    );
  }

  // AMAZON (Official smile logo)
  if (lower.includes('amazon')) {
    if (isDashboard) {
      return (
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border shadow-2xs select-none ${className}`}
          title="Amazon"
        >
          <span className="font-bold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink">
            amazon
          </span>
          <span className="text-[#FF9900] text-xs font-black">↵</span>
        </div>
      );
    }
    return (
      <div className={`w-7 h-7 rounded-lg bg-[#FF9900]/10 border border-[#FF9900]/20 flex items-center justify-center font-bold text-xs text-[#D97706] ${className}`}>
        <span>amazon</span>
      </div>
    );
  }

  // APPLE
  if (lower.includes('apple')) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] border border-brand-border shadow-2xs select-none ${className}`}>
        <span className="text-xs"></span>
        {isDashboard && <span className="font-semibold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink">Apple</span>}
      </div>
    );
  }

  // ATLASSIAN
  if (lower.includes('atlassian')) {
    if (isDashboard) {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0052CC]/10 border border-[#0052CC]/20 shadow-2xs select-none ${className}`}>
          <span className="font-bold text-xs text-[#0052CC]">▲</span>
          <span className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink">Atlassian</span>
        </div>
      );
    }
    return (
      <div className={`w-7 h-7 rounded-lg bg-[#0052CC]/10 border border-[#0052CC]/20 flex items-center justify-center font-bold text-xs text-[#0052CC] ${className}`}>
        <span className="text-xs">▲</span>
      </div>
    );
  }

  // ADOBE
  if (lower.includes('adobe')) {
    if (isDashboard) {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FA0F00]/10 border border-[#FA0F00]/20 shadow-2xs select-none ${className}`}>
          <span className="font-extrabold text-xs text-[#FA0F00]">A</span>
          <span className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink">Adobe</span>
        </div>
      );
    }
    return (
      <div className={`w-7 h-7 rounded-lg bg-[#FA0F00]/10 border border-[#FA0F00]/20 flex items-center justify-center font-bold text-xs text-[#FA0F00] ${className}`}>
        <span>Adobe</span>
      </div>
    );
  }

  // NETFLIX
  if (lower.includes('netflix')) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E50914]/10 border border-[#E50914]/20 shadow-2xs select-none ${className}`}>
        <span className="font-extrabold text-xs text-[#E50914] tracking-tight">NETFLIX</span>
      </div>
    );
  }

  // META
  if (lower.includes('meta')) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0081FB]/10 border border-[#0081FB]/20 shadow-2xs select-none ${className}`}>
        <span className="font-bold text-xs text-[#0081FB]">∞</span>
        {isDashboard && <span className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink">Meta</span>}
      </div>
    );
  }

  // SPOTIFY
  if (lower.includes('spotify')) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/20 shadow-2xs select-none ${className}`}>
        <span className="font-bold text-xs text-[#1DB954]">●</span>
        {isDashboard && <span className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink">Spotify</span>}
      </div>
    );
  }

  // UBER
  if (lower.includes('uber')) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] border border-brand-border shadow-2xs select-none ${className}`}>
        <span className="font-bold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink">Uber</span>
      </div>
    );
  }

  // AIRBNB
  if (lower.includes('airbnb')) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 shadow-2xs select-none ${className}`}>
        <span className="font-bold text-xs text-[#FF5A5F]">⌂</span>
        {isDashboard && <span className="font-semibold text-xs text-brand-ink dark:text-darkBrand-ink">Airbnb</span>}
      </div>
    );
  }

  // --- Dynamic Logo Resolution for Other Companies ---

  // 1. Check known brand keys
  const matchedKey = Object.keys(COMPANY_DOMAINS).find(
    (k) => lower === k || lower.startsWith(k + ' ') || lower.includes(` ${k} `) || lower.includes(k)
  );

  let targetDomain = explicitDomain && !isJobBoardOrAtsDomain(explicitDomain) ? explicitDomain : '';

  if (!targetDomain && matchedKey) {
    targetDomain = COMPANY_DOMAINS[matchedKey];
  }

  // 2. Only check jobUrl if it is NOT a job board or ATS tab
  if (!targetDomain && jobUrl) {
    try {
      const hostname = new URL(jobUrl).hostname.replace(/^www\./, '');
      if (!isJobBoardOrAtsDomain(hostname)) {
        targetDomain = hostname;
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback domain inference from company name
  if (!targetDomain && cleanName && cleanName !== 'Company' && cleanName !== 'Unknown Company') {
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (slug.length >= 2) {
      targetDomain = slug + '.com';
    }
  }

  // Prefer direct logo URL if provided, else Google Favicon Service for the resolved domain
  let resolvedLogoUrl: string | null = null;
  if (!imageError) {
    if (explicitLogoUrl && explicitLogoUrl.startsWith('http')) {
      resolvedLogoUrl = explicitLogoUrl;
    } else if (targetDomain && !isJobBoardOrAtsDomain(targetDomain)) {
      resolvedLogoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(targetDomain)}&sz=128`;
    }
  }

  // RENDER DASHBOARD EXPANDED MODE
  if (isDashboard) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border shadow-2xs select-none max-w-[180px] ${className}`}
        title={cleanName}
      >
        {resolvedLogoUrl ? (
          <img
            src={resolvedLogoUrl}
            alt={cleanName}
            className="w-3.5 h-3.5 object-contain shrink-0 rounded-2xs"
            onError={() => setImageError(true)}
          />
        ) : (
          <Briefcase className="w-3.5 h-3.5 text-brand-secondary dark:text-darkBrand-secondary shrink-0" />
        )}
        <span className="font-semibold text-xs tracking-tight text-brand-ink dark:text-darkBrand-ink truncate">
          {cleanName}
        </span>
      </div>
    );
  }

  // RENDER COMPACT / POPUP MODE
  return (
    <div
      className={`w-7 h-7 rounded-lg bg-white dark:bg-darkBrand-elevated border border-brand-border dark:border-darkBrand-border flex items-center justify-center select-none shadow-2xs shrink-0 ${className}`}
      title={cleanName}
    >
      {resolvedLogoUrl ? (
        <img
          src={resolvedLogoUrl}
          alt={cleanName}
          className="w-4 h-4 object-contain rounded-2xs"
          onError={() => setImageError(true)}
        />
      ) : (
        <Briefcase className="w-3.5 h-3.5 text-brand-secondary dark:text-darkBrand-secondary" />
      )}
    </div>
  );
};
