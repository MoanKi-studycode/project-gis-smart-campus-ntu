import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * Reusable button with variants: primary, secondary, danger, outline, ghost
 * 
 * @param {string} variant - Button style variant
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} disabled - Disabled state
 * @param {boolean} fullWidth - Full width button
 * @param {ReactNode} icon - Leading icon
 * @param {ReactNode} children - Button content
 */

const VARIANTS = {
  primary: `
    bg-blue-600 text-white border-blue-600
    hover:bg-blue-700 hover:border-blue-700
    focus:ring-blue-500/30
    disabled:bg-blue-300 disabled:border-blue-300
  `,
  secondary: `
    bg-gray-100 text-gray-700 border-gray-200
    hover:bg-gray-200 hover:border-gray-300
    focus:ring-gray-500/30
    disabled:bg-gray-50 disabled:text-gray-400
  `,
  danger: `
    bg-red-600 text-white border-red-600
    hover:bg-red-700 hover:border-red-700
    focus:ring-red-500/30
    disabled:bg-red-300 disabled:border-red-300
  `,
  success: `
    bg-green-600 text-white border-green-600
    hover:bg-green-700 hover:border-green-700
    focus:ring-green-500/30
    disabled:bg-green-300 disabled:border-green-300
  `,
  outline: `
    bg-transparent text-gray-700 border-gray-300
    hover:bg-gray-50 hover:border-gray-400
    focus:ring-gray-500/30
    disabled:text-gray-300 disabled:border-gray-200
  `,
  ghost: `
    bg-transparent text-gray-600 border-transparent
    hover:bg-gray-100 hover:text-gray-800
    focus:ring-gray-500/30
    disabled:text-gray-300
  `,
  'outline-danger': `
    bg-transparent text-red-600 border-red-300
    hover:bg-red-50 hover:border-red-400
    focus:ring-red-500/30
    disabled:text-red-300 disabled:border-red-200
  `,
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-xl border
        transition-all duration-200
        focus:outline-none focus:ring-4
        disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}

// Convenience variants as separate exports
Button.Primary = (props) => <Button variant="primary" {...props} />;
Button.Secondary = (props) => <Button variant="secondary" {...props} />;
Button.Danger = (props) => <Button variant="danger" {...props} />;
Button.Success = (props) => <Button variant="success" {...props} />;
Button.Outline = (props) => <Button variant="outline" {...props} />;
Button.Ghost = (props) => <Button variant="ghost" {...props} />;
