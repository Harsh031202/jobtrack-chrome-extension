import React, { useEffect, useState, useRef } from 'react';
import { X, ArrowLeft, Sparkles, Sliders, Cpu, Key, Briefcase } from 'lucide-react';
import { Button } from './ui/Button';

export interface TutorialStepInfo {
  step: number;
  targetId: string;
  badge: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TUTORIAL_STEPS: TutorialStepInfo[] = [
  {
    step: 1,
    targetId: 'tutorial-step-1-settings',
    badge: 'Quick Setup • 1/4',
    title: 'Open Extension Settings',
    description: 'Click the settings button above to configure your AI provider and unlock 1-click automatic job extraction.',
    actionLabel: 'Open Settings →',
    icon: Sliders,
  },
  {
    step: 2,
    targetId: 'tutorial-step-2-provider',
    badge: 'AI Engine • 2/4',
    title: 'Choose Provider & Model',
    description: 'Select your preferred AI service (Gemini, OpenRouter, OpenAI, or Claude) and pick the model you want to parse job postings.',
    actionLabel: 'Next: Enter API Key →',
    icon: Cpu,
  },
  {
    step: 3,
    targetId: 'tutorial-step-3-apikey',
    badge: 'Authentication • 3/4',
    title: 'Enter Your API Key',
    description: 'Paste your provider API key. It is encrypted and stored safely on your local device—never shared or logged.',
    actionLabel: 'Next: Ready to Track →',
    icon: Key,
  },
  {
    step: 4,
    targetId: 'tutorial-step-4-track',
    badge: 'Ready to Go! • 4/4',
    title: 'Track Job Applications Instantly',
    description: "You're all set! Whenever you find a job on LinkedIn, Indeed, or career sites, click 'Track Current Tab' to capture it in seconds.",
    actionLabel: 'Done • Enjoy Tracking! 🎉',
    icon: Briefcase,
  },
];

interface InteractiveTutorialProps {
  isOpen: boolean;
  step: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isOpen,
  step,
  onClose,
  onNext,
  onPrev,
  containerRef,
}) => {
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardRect, setCardRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const currentStepInfo = TUTORIAL_STEPS[step - 1] || TUTORIAL_STEPS[0];

  // Measure target element relative to the tutorial container
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      const el = document.getElementById(currentStepInfo.targetId);
      if (el && containerRef?.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const tRect = el.getBoundingClientRect();
        setTargetRect({
          top: tRect.top - cRect.top,
          left: tRect.left - cRect.left,
          width: tRect.width,
          height: tRect.height,
        });
      } else {
        setTargetRect(null);
      }

      if (cardRef.current && containerRef?.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const cdRect = cardRef.current.getBoundingClientRect();
        setCardRect({
          top: cdRect.top - cRect.top,
          left: cdRect.left - cRect.left,
          width: cdRect.width,
          height: cdRect.height,
        });
      }
    };

    // Run immediately and after slight delay for modal transitions
    measure();
    const timer1 = setTimeout(measure, 60);
    const timer2 = setTimeout(measure, 200);

    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, step, currentStepInfo.targetId, containerRef]);

  if (!isOpen) return null;

  const IconComponent = currentStepInfo.icon;

  // Compute SVG connecting line path
  let pathString = '';
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  if (targetRect && cardRect) {
    // If card is below target
    if (cardRect.top > targetRect.top) {
      endX = targetRect.left + targetRect.width / 2;
      endY = targetRect.top + targetRect.height + 4;
      startX = Math.min(Math.max(endX, cardRect.left + 24), cardRect.left + cardRect.width - 24);
      startY = cardRect.top;

      // Smooth cubic bezier curving from card top to target bottom
      const controlY1 = startY - (startY - endY) * 0.5;
      const controlY2 = endY + (startY - endY) * 0.2;
      pathString = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
    } else {
      // If card is above target
      endX = targetRect.left + targetRect.width / 2;
      endY = targetRect.top - 4;
      startX = Math.min(Math.max(endX, cardRect.left + 24), cardRect.left + cardRect.width - 24);
      startY = cardRect.top + cardRect.height;

      const controlY1 = startY + (endY - startY) * 0.5;
      const controlY2 = endY - (endY - startY) * 0.2;
      pathString = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
    }
  }

  // Positioning the card based on step
  let cardPositionStyle: React.CSSProperties = {
    top: '76px',
    left: '16px',
    right: '16px',
  };

  if (step === 2) {
    cardPositionStyle = {
      top: '235px',
      left: '16px',
      right: '16px',
    };
  } else if (step === 3) {
    cardPositionStyle = {
      top: '280px',
      left: '16px',
      right: '16px',
    };
  } else if (step === 4) {
    cardPositionStyle = {
      top: '240px',
      left: '16px',
      right: '16px',
    };
  }

  return (
    <div className="absolute inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* 1. Darkened Backdrop Overlay with Spotlight Cutout (NO BLUR over target) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={onClose}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* White = Darkened backdrop outside */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black = Completely clear, transparent cutout over the target button */}
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Clean darkened overlay, rendered ONLY outside the spotlight hole */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* 2. Spotlight Frame & Radiating Wavy Ripple Waves (100% Unblurred) */}
      {targetRect && (
        <div
          className="absolute pointer-events-none z-45 transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        >
          {/* Central Spotlight Border Frame */}
          <div className="absolute inset-0 rounded-xl border-2 border-terracotta-500 shadow-[0_0_16px_rgba(249,87,56,0.6)]" />

          {/* Radiating Wavy Wave 1 (Fast ripple) */}
          <div className="absolute -inset-1.5 rounded-xl border-2 border-terracotta-400/80 animate-ping opacity-75" />

          {/* Radiating Wavy Wave 2 (Medium ripple) */}
          <div
            className="absolute -inset-3 rounded-2xl border border-terracotta-400/60 animate-ping opacity-45"
            style={{ animationDuration: '1.8s' }}
          />

          {/* Radiating Wavy Wave 3 (Outer ambient pulse) */}
          <div
            className="absolute -inset-5 rounded-2xl border border-terracotta-500/30 animate-pulse opacity-50"
            style={{ animationDuration: '2.4s' }}
          />
        </div>
      )}

      {/* 3. SVG Curved Connecting Line */}
      {pathString && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-55">
          <defs>
            <linearGradient id="tutorial-line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F95738" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
            <marker
              id="tutorial-arrowhead"
              markerWidth="7"
              markerHeight="7"
              refX="4"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#F95738" />
            </marker>
          </defs>

          {/* Connected path */}
          <path
            d={pathString}
            fill="none"
            stroke="url(#tutorial-line-gradient)"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            markerEnd="url(#tutorial-arrowhead)"
            className="drop-shadow-md"
          />

          {/* Pulse dot at start of line on instruction card */}
          <circle cx={startX} cy={startY} r="5" fill="#F95738" className="animate-ping opacity-75" />
          <circle cx={startX} cy={startY} r="3.5" fill="#F95738" />
        </svg>
      )}

      {/* 4. Connected Floating Instruction Card */}
      <div
        ref={cardRef}
        style={cardPositionStyle}
        className="absolute z-60 bg-white dark:bg-darkBrand-surface border border-brand-border/90 dark:border-darkBrand-border shadow-float rounded-2xl p-4 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Card Header: Step Pill & Close */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-500/15 dark:text-terracotta-400 border border-terracotta-200/50 dark:border-terracotta-500/20">
              <Sparkles className="w-3 h-3 text-terracotta-500" />
              {currentStepInfo.badge}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-brand-muted hover:text-brand-ink dark:hover:text-darkBrand-ink p-1 rounded-lg hover:bg-brand-pillBg dark:hover:bg-darkBrand-pillBg transition-colors cursor-pointer"
            aria-label="Skip tutorial"
            title="Skip tutorial"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Title & Icon */}
        <div className="flex items-start gap-2.5 mt-2">
          <div className="w-7 h-7 rounded-xl bg-terracotta-500/10 text-terracotta-500 dark:bg-terracotta-500/20 dark:text-terracotta-400 flex items-center justify-center shrink-0 mt-0.5">
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-ink dark:text-darkBrand-ink leading-tight">
              {currentStepInfo.title}
            </h4>
            <p className="text-[11px] text-brand-secondary dark:text-darkBrand-secondary mt-1 leading-normal">
              {currentStepInfo.description}
            </p>
          </div>
        </div>

        {/* Step Indicator Dots & Navigation Buttons */}
        <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-brand-border/60 dark:border-darkBrand-border/60">
          {/* 4 Progress Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-4 bg-terracotta-500'
                    : s < step
                    ? 'w-1.5 bg-emerald-500'
                    : 'w-1.5 bg-brand-border dark:bg-darkBrand-border'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                size="xs"
                variant="ghost"
                onClick={onPrev}
                leftIcon={<ArrowLeft className="w-3 h-3" />}
                className="h-7 text-[11px] px-2"
              >
                Back
              </Button>
            )}

            <Button
              size="xs"
              variant="primary"
              onClick={onNext}
              className="h-7 text-[11px] px-3 shadow-xs"
            >
              {currentStepInfo.actionLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
