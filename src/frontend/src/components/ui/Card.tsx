import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isSelected?: boolean;
  selectedLabel?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, isSelected = false, selectedLabel = 'Your target', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg bg-neutral-surface text-neutral-text border transition-all duration-200',
          isSelected
            ? 'border-2 border-brand-600 shadow-sm'
            : 'border-neutral-border shadow-none hover:border-neutral-300',
          className
        )}
        {...props}
      >
        {isSelected && (
          <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-caption font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            <span>{selectedLabel}</span>
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-h3 font-semibold text-neutral-900 leading-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-b2 text-neutral-600', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
