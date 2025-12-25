import React, { useEffect } from 'react';
import clsx from 'clsx';
import { XCircle } from 'lucide-react';

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeMap = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <button
        type="button"
        className="fixed inset-0 w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Đóng modal"
      />
      <div className={clsx('relative mx-auto w-11/12 py-10', sizeMap[size] || sizeMap.md)}>
        <div className={clsx('rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden', className)}>
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <div className="min-w-0">
              {subtitle ? (
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">{subtitle}</p>
              ) : null}
              {title ? <h3 className="mt-1 text-lg font-semibold text-gray-900">{title}</h3> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Đóng"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6">{children}</div>

          {footer ? (
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">{footer}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};


