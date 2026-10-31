import React from 'react';
import { STATUS_CONFIG } from '../utils/formatters';

export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const config = STATUS_CONFIG[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400'
  };

  const sizeClasses = size === 'xs'
    ? 'text-xs px-2 py-0.5'
    : size === 'md'
    ? 'text-sm px-3 py-1'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status || 'Unknown'}
    </span>
  );
}
