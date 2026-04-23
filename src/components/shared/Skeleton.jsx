import { Loader2 } from 'lucide-react';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SpinnerPage({ label }) {
  return (
    <div className="min-h-screen bg-surface-sunken flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-fg-subtle" />
      {label && <div className="text-xs text-fg-muted">{label}</div>}
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
