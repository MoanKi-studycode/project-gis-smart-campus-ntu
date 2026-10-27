import React, { forwardRef } from 'react';

/**
 * Input Component
 * Standardized text input with label and error message support
 * 
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {string} hint - Helper text
 * @param {ReactNode} icon - Leading icon
 * @param {string} size - Input size: 'sm', 'md', 'lg'
 */

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  size = 'md',
  className = '',
  required = false,
  disabled = false,
  fullWidth = true,
  ...props
}, ref) => {
  const inputId = props.id || props.name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Leading Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full rounded-xl border bg-white
            transition-all duration-200
            focus:outline-none focus:ring-4
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }
            ${SIZES[size]}
            ${className}
          `}
          {...props}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Hint Text */}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

// Textarea variant
export const Textarea = forwardRef(({
  label,
  error,
  hint,
  size = 'md',
  className = '',
  required = false,
  disabled = false,
  rows = 4,
  ...props
}, ref) => {
  const inputId = props.id || props.name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={`
          w-full rounded-xl border bg-white resize-none
          transition-all duration-200
          focus:outline-none focus:ring-4
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }
          ${SIZES[size]}
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
