import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  dotColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: 'w-5 h-5 rounded-md',
    md: 'w-7 h-7 rounded-lg',
    lg: 'w-9 h-9 rounded-xl',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const iconUrl =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('icons/icon-48.png')
      : '/icons/icon-48.png';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official JobTrack Brand Icon */}
      {!imgError ? (
        <img
          src={iconUrl}
          alt="JobTrack Logo"
          className={`${iconSizes[size]} shrink-0 shadow-xs object-cover border border-slate-800/40`}
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 32 32"
          className={`${iconSizes[size]} shrink-0 shadow-xs select-none`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rounded tile background */}
          <rect width="32" height="32" rx="7.5" fill="#18191D" />
          <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="#2B323D" strokeWidth="1" />
          {/* Emerald status indicator dot */}
          <circle cx="10.5" cy="10" r="2.5" fill="#10B981" />
          {/* Geometric J checklist mark */}
          <path
            d="M15 9.5H22V19C22 21.8 19.8 24 17 24C14.2 24 12 21.8 12 19V17"
            stroke="#FFFFFF"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {showText && (
        <div className={`flex items-baseline tracking-tight font-sans ${textSizes[size]}`}>
          <span className="font-extrabold text-brand-ink dark:text-darkBrand-ink">
            Job
          </span>
          <span className="font-black text-terracotta-500 dark:text-terracotta-400">
            Track
          </span>
        </div>
      )}
    </div>
  );
};
