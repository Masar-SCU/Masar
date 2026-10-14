import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type BadgeSeverity = 'critical' | 'moderate' | 'minor' | 'met' | 'strength';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity?: BadgeSeverity;
}

const severityStyles: Record<BadgeSeverity, string> = {
  critical: "bg-severity-critical-bg text-severity-critical",
  moderate: "bg-severity-moderate-bg text-severity-moderate",
  minor: "bg-severity-minor-bg text-severity-minor",
  met: "bg-severity-met-bg text-severity-met",
  strength: "bg-severity-strength-bg text-severity-strength",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  severity = 'met',
  className,
  ...props
}) => {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
          severityStyles[severity],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
