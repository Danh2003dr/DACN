import React from 'react';
import clsx from 'clsx';

export const EmptyState = ({
  icon: Icon,
  title = 'Không có dữ liệu',
  description,
  action,
  className
}) => {
  return (
    <div className={clsx('rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center', className)}>
      {Icon ? <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" /> : null}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description ? <p className="text-gray-600 mt-2">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
};


