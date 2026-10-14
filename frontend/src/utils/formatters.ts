export function formatYear(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  return parts[0] || 'N/A';
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatRating(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return val.toFixed(1);
}

export function getRatingColor(val?: number): string {
  if (!val) return 'text-slate-400 border-slate-700 bg-slate-800/60';
  if (val >= 8.0) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  if (val >= 7.0) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
}
