import React from 'react';

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
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Tabato-inspired 4-petal geometric asterisk symbol */}
      <svg
        className={`${iconSizes[size]} text-brand-secondary/80 dark:text-darkBrand-secondary shrink-0 transition-colors`}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Four symmetrical organic petals curved inward and outward */}
        <path
          d="M12 2C13.2 5.5 15.5 7.8 19 9C15.5 10.2 13.2 12.5 12 16C10.8 12.5 8.5 10.2 5 9C8.5 7.8 10.8 5.5 12 2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 4.5C9.5 8 11.8 10.3 15.3 11.3C11.8 12.3 9.5 14.6 8.5 18.1C7.5 14.6 5.2 12.3 1.7 11.3C5.2 10.3 7.5 8 8.5 4.5Z"
          className="opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(45 12 12)"
        />
      </svg>

      {showText && (
        <span
          className={`font-semibold tracking-tight text-brand-ink dark:text-darkBrand-ink ${textSizes[size]}`}
        >
          JobTrack
        </span>
      )}
    </div>
  );
};
