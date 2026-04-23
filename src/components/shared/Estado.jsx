import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ESTADOS_META } from '../../constants.js';

const ICONS = {
  'EN ESPERA': Clock,
  'VENDIDO': CheckCircle2,
  'PERDIDO': XCircle
};

export function EstadoBadge({ estado, size = 'sm' }) {
  const meta = ESTADOS_META[estado];
  const Icon = ICONS[estado] || Clock;
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[10px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${pad} ${meta?.color || ''}`}>
      <Icon className="w-3 h-3" />
      {estado}
    </span>
  );
}
