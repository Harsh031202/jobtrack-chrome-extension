import React from 'react';

interface CompanyMonogramProps {
  company: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Curated subtle identities for prominent tech / hiring companies
const KNOWN_IDENTITIES: Record<string, { bg: string; text: string; dot?: string }> = {
  google: { bg: 'bg-[#4285F4]/10 dark:bg-[#4285F4]/20', text: 'text-[#4285F4]', dot: '#4285F4' },
  microsoft: { bg: 'bg-[#00A4EF]/10 dark:bg-[#00A4EF]/20', text: 'text-[#00A4EF]', dot: '#00A4EF' },
  stripe: { bg: 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20', text: 'text-[#635BFF]', dot: '#635BFF' },
  amazon: { bg: 'bg-[#FF9900]/10 dark:bg-[#FF9900]/20', text: 'text-[#D97706]', dot: '#FF9900' },
  apple: { bg: 'bg-black/5 dark:bg-white/10', text: 'text-brand-ink dark:text-darkBrand-ink' },
  meta: { bg: 'bg-[#0668E1]/10 dark:bg-[#0668E1]/20', text: 'text-[#0668E1]', dot: '#0668E1' },
  netflix: { bg: 'bg-[#E50914]/10 dark:bg-[#E50914]/20', text: 'text-[#E50914]', dot: '#E50914' },
  deloitte: { bg: 'bg-[#86BC25]/10 dark:bg-[#86BC25]/20', text: 'text-[#659118] dark:text-[#86BC25]', dot: '#86BC25' },
  atlassian: { bg: 'bg-[#0052CC]/10 dark:bg-[#0052CC]/20', text: 'text-[#0052CC]', dot: '#0052CC' },
  adobe: { bg: 'bg-[#FA0F00]/10 dark:bg-[#FA0F00]/20', text: 'text-[#FA0F00]', dot: '#FA0F00' },
  spotify: { bg: 'bg-[#1DB954]/10 dark:bg-[#1DB954]/20', text: 'text-[#1DB954]', dot: '#1DB954' },
  uber: { bg: 'bg-black/10 dark:bg-white/10', text: 'text-brand-ink dark:text-darkBrand-ink' },
  airbnb: { bg: 'bg-[#FF5A5F]/10 dark:bg-[#FF5A5F]/20', text: 'text-[#FF5A5F]', dot: '#FF5A5F' },
  github: { bg: 'bg-black/10 dark:bg-white/15', text: 'text-brand-ink dark:text-darkBrand-ink' },
  linkedin: { bg: 'bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20', text: 'text-[#0A66C2]', dot: '#0A66C2' },
};

// Deterministic editorial palette for arbitrary companies
const GENERATED_PALETTES = [
  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400' },
  { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  { bg: 'bg-coral-50 dark:bg-coral-950/30', text: 'text-coral-600 dark:text-coral-400' },
  { bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-700 dark:text-slate-300' },
];

export const CompanyMonogram: React.FC<CompanyMonogramProps> = ({
  company,
  size = 'md',
  className = '',
}) => {
  const cleanName = (company || 'Company').trim();
  const lower = cleanName.toLowerCase();

  // Check known brands
  const matchedKey = Object.keys(KNOWN_IDENTITIES).find(
    (k) => lower === k || lower.startsWith(k + ' ') || lower.includes(` ${k} `)
  );
  const known = matchedKey ? KNOWN_IDENTITIES[matchedKey] : null;

  // Initial letter or 2 initials if multiple words
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = cleanName.charAt(0).toUpperCase();
  if (words.length > 1 && words[1].charAt(0).match(/[a-zA-Z]/)) {
    initials = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  // Fallback hash
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const palette = known || GENERATED_PALETTES[Math.abs(hash) % GENERATED_PALETTES.length];

  const sizeStyles = {
    sm: 'w-6 h-6 text-[10px] rounded-md',
    md: 'w-8 h-8 text-xs rounded-lg',
    lg: 'w-10 h-10 text-sm rounded-xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center font-bold font-mono tracking-tight shrink-0 select-none border border-black/[0.06] dark:border-white/[0.08] shadow-subtle ${sizeStyles[size]} ${palette.bg} ${palette.text} ${className}`}
      title={company}
    >
      <span>{initials}</span>
      {known?.dot && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-darkBrand-surface"
          style={{ backgroundColor: known.dot }}
        />
      )}
    </div>
  );
};
