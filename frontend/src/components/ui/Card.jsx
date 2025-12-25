import React from 'react';
import clsx from 'clsx';

export const Card = ({ className, children, ...props }) => (
  <div
    {...props}
    className={clsx('bg-white rounded-2xl border border-gray-100 shadow-soft', className)}
  >
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div {...props} className={clsx('px-6 py-4 border-b border-gray-100', className)}>
    {children}
  </div>
);

export const CardBody = ({ className, children, ...props }) => (
  <div {...props} className={clsx('px-6 py-6', className)}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div {...props} className={clsx('px-6 py-4 border-t border-gray-100 bg-gray-50/60', className)}>
    {children}
  </div>
);


