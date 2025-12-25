import React from 'react';
import clsx from 'clsx';

export const Pagination = ({ page, totalPages, onPrev, onNext, className }) => {
  if (!totalPages || totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={clsx('flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6', className)}>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="ml-3 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
        </p>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};


