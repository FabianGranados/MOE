const fmt = (v) => {
  const n = Number(v);
  if (!n) return '';
  return n.toLocaleString('es-CO');
};

export function InputMoney({ value, onChange, placeholder = '0', className = '', disabled, autoFocus }) {
  const formatted = fmt(value);
  const handleChange = (e) => {
    const raw = String(e.target.value).replace(/\D/g, '');
    onChange(raw === '' ? 0 : Number(raw));
  };
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none text-[13px] font-mono select-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatted}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`input pl-7 font-mono tabular-nums text-right ${className}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />
    </div>
  );
}
