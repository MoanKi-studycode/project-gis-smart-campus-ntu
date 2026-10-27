import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component
 * Standardized select dropdown with label and error message support
 * 
 * @param {string} label - Select label
 * @param {string} error - Error message
 * @param {string} hint - Helper text
 * @param {array} options - Options array [{value, label}] or ['string']
 * @param {string} placeholder - Placeholder text
 * @param {string} size - Select size: 'sm', 'md', 'lg'
 */

const SIZES = {
  sm: 'px-3 py-1.5 text-sm pr-8',
  md: 'px-4 py-2.5 text-sm pr-10',
  lg: 'px-4 py-3 text-base pr-10',
};

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Chọn...',
  size = 'md',
  className = '',
  required = false,
  disabled = false,
  fullWidth = true,
  ...props
}, ref) => {
  const selectId = props.id || props.name || `select-${Math.random().toString(36).substr(2, 9)}`;

  // Normalize options to {value, label} format
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full rounded-xl border bg-white appearance-none
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalizedOptions.map((opt, idx) => (
            <option key={opt.value || idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Dropdown Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={18} />
        </div>
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

Select.displayName = 'Select';

export default Select;
