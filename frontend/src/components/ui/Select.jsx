import React from 'react';
import clsx from 'clsx';

export const Select = React.forwardRef(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      {...props}
      className={clsx(
        'w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        className
      )}
    />
  );
});


