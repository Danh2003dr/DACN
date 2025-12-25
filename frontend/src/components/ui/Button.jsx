import React from 'react';
import clsx from 'clsx';

const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  success: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
  warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500',
  purple: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-xl'
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  ...props
}) => {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      {LeftIcon ? <LeftIcon className="h-4 w-4" /> : null}
      {children}
      {RightIcon ? <RightIcon className="h-4 w-4" /> : null}
    </button>
  );
};


