import React from 'react';
import clsx from 'clsx';

export const Label = ({ className, ...props }) => (
  <label {...props} className={clsx('block text-sm font-medium text-gray-700 mb-1', className)} />
);

export const HelpText = ({ className, ...props }) => (
  <p {...props} className={clsx('text-xs text-gray-500 mt-1', className)} />
);

export const ErrorText = ({ className, ...props }) => (
  <p {...props} className={clsx('text-sm text-danger-600 mt-1', className)} />
);

export const Input = React.forwardRef(function Input(
  { className, leftIcon: LeftIcon, ...props },
  ref
) {
  return (
    <div className="relative">
      {LeftIcon ? (
        <LeftIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      ) : null}
      <input
        ref={ref}
        {...props}
        className={clsx(
          'w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          LeftIcon ? 'pl-10' : '',
          className
        )}
      />
    </div>
  );
});


