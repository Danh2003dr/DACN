import React from 'react';
import clsx from 'clsx';

const tones = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800'
};

export const Badge = ({ tone = 'gray', className, children, ...props }) => (
  <span
    {...props}
    className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      tones[tone] || tones.gray,
      className
    )}
  >
    {children}
  </span>
);


