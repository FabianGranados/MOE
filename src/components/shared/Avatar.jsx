import { initials } from '../../utils/format.js';

export function Avatar({ name, size = 'md', className = '', color = 'bg-stone-800' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm'
  };
  return (
    <div
      className={`rounded-full ${color} text-white flex items-center justify-center font-bold no-drag ${sizes[size]} ${className}`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
