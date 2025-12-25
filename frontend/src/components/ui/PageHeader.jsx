import React from 'react';
import clsx from 'clsx';

export const PageHeader = ({
  title,
  subtitle,
  actions,
  tone = 'blue',
  className
}) => {
  const toneMap = {
    blue: 'from-slate-50 to-blue-50',
    green: 'from-slate-50 to-green-50',
    purple: 'from-slate-50 to-purple-50',
    amber: 'from-slate-50 to-amber-50'
  };

  return (
    <div
      className={clsx(
        'rounded-2xl bg-gradient-to-r border border-gray-100 shadow-soft',
        toneMap[tone] || toneMap.blue,
        className
      )}
    >
      <div className="p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle ? <p className="text-gray-600 mt-2">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
};


