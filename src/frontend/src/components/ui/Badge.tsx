import * as React from 'react';
import { XCircle, AlertTriangle, Circle, CheckCircle2, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SeverityLevel = 'critical' | 'moderate' | 'minor' | 'met' | 'strength';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: SeverityLevel | 'brand' | 'neutral' | 'outline';
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const severityConfig: Record<
  SeverityLevel,
  { label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>; styles: string }
> = {
  critical: {
    label: 'Critical',
    icon: XCircle,
    styles: 'bg-severity-critical-bg text-severity-critical-800 border-severity-critical-border/50',
  },
  moderate: {
    label: 'Moderate',
    icon: AlertTriangle,
    styles: 'bg-severity-moderate-bg text-severity-moderate-800 border-severity-moderate-border/50',
  },
  minor: {
    label: 'Minor',
    icon: Circle,
    styles: 'bg-severity-minor-bg text-severity-minor-800 border-severity-minor-border/50',
  },
  met: {
    label: 'Met',
    icon: CheckCircle2,
    styles: 'bg-severity-met-bg text-severity-met-800 border-severity-met-border/50',
  },
  strength: {
    label: 'Strength',
    icon: Star,
    styles: 'bg-severity-strength-bg text-severity-strength-800 border-severity-strength-border/50',
  },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', icon, showIcon = true, children, ...props }, ref) => {
    const isSeverity = variant in severityConfig;
    const severity = isSeverity ? severityConfig[variant as SeverityLevel] : null;

    const baseStyles =
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label font-medium border select-none transition-colors';

    const nonSeverityVariants = {
      brand: 'bg-brand-50 text-brand-700 border-brand-100',
      neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      outline: 'bg-transparent text-neutral-700 border-neutral-300',
    };

    const variantStyles = severity
      ? severity.styles
      : nonSeverityVariants[variant as keyof typeof nonSeverityVariants] || nonSeverityVariants.neutral;

    const DefaultIcon = severity?.icon;
    const displayLabel = children || severity?.label;

    return (
      <span ref={ref} className={cn(baseStyles, variantStyles, className)} {...props}>
        {showIcon && (
          <span className="shrink-0 flex items-center" aria-hidden="true">
            {icon ? (
              icon
            ) : DefaultIcon ? (
              <DefaultIcon className="h-3.5 w-3.5 fill-current/20" aria-hidden="true" />
            ) : null}
          </span>
        )}
        <span>{displayLabel}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
