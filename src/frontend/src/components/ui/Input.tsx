import * as React from 'react';
import { Eye, EyeOff, Search, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Unconditional hook invocation satisfying React rules of hooks
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const isSearch = type === 'search';

    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Build aria-describedby based on available hints/errors
    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label text-neutral-900 font-medium"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {/* Leading Search Icon if type is search */}
          {isSearch && !leftIcon && (
            <div className="absolute left-3.5 text-neutral-500 pointer-events-none flex items-center">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
          )}

          {leftIcon && (
            <div className="absolute left-3.5 text-neutral-500 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'w-full px-4 py-2 text-b2 text-neutral-900 bg-white border rounded-full transition-colors',
              'placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
              error
                ? 'border-error-700 text-error-700 focus:border-error-700 focus:ring-error-700/30'
                : 'border-neutral-border focus:border-brand-700 focus:ring-brand-500/30',
              (isSearch || leftIcon) && 'pl-10',
              (isPassword || rightIcon || error) && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Right Icon / Password toggle / Error Icon */}
          <div className="absolute right-3.5 flex items-center gap-1.5">
            {error && !isPassword && (
              <AlertCircle className="h-4 w-4 text-error-700" aria-hidden="true" />
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}

            {rightIcon && !isPassword && (
              <span className="text-neutral-500 flex items-center">{rightIcon}</span>
            )}
          </div>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="flex items-center gap-1 text-caption text-error-700 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-caption text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
