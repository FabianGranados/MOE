export function FotoProducto({ foto, nombre, className = '' }) {
  if (foto && typeof foto === 'string' && foto.length > 0) {
    return <img src={foto} alt={nombre || ''} className={`w-full h-full object-cover no-drag ${className}`} />;
  }
  // Placeholder con el nombre del producto centrado
  return (
    <div className={`w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-brand-softer to-brand-softer/40 ${className}`}>
      <span className="text-center text-[11px] font-semibold leading-tight text-brand line-clamp-4 break-words">
        {nombre || 'Producto'}
      </span>
    </div>
  );
}
