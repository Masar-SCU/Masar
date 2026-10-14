import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type CardPadding = '4' | '8' | '12' | '16' | '24' | '32';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

// Spacing tokens from tailwind.config.js
const paddings: Record<CardPadding, string> = {
  4: "p-4",
  8: "p-8",
  12: "p-12",
  16: "p-16",
  24: "p-24",
  32: "p-32",
};

export const Card: React.FC<CardProps> = ({
  children,
  padding = '16',
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-lg border border-neutral-border bg-neutral-surface shadow-sm",
          paddings[padding],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
