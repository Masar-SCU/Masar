import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className,
  required,
  ...props
}) => {
  const inputId = id ?? useId();
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-neutral-text"
      >
        {label}
        {required && <span className="text-severity-critical"> *</span>}
      </label>

      <input
        id={inputId}
        className={twMerge(
          clsx(
            "w-full px-3 py-2 text-sm text-neutral-text bg-neutral-surface border rounded-lg transition-colors placeholder:text-neutral-muted focus:outline-none focus-visible:ring-2",
            error
              ? "border-severity-critical focus-visible:ring-severity-critical"
              : "border-neutral-border focus-visible:ring-brand-500",
            className,
          ),
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        required={required}
        {...props}
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs text-severity-critical"
        >
          {error}
        </p>
      )}
    </div>
  );
};
