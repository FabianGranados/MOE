export function InputTel({ value, onChange, placeholder = '+57 300 123 4567', className = '', ...rest }) {
  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/[^\d+\s-]/g, '');
    onChange(cleaned);
  };
  return (
    <input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={`input font-mono ${className}`}
      {...rest}
    />
  );
}

export function InputEmail({ value, onChange, placeholder = 'correo@dominio.com', className = '', ...rest }) {
  return (
    <input
      type="email"
      inputMode="email"
      autoComplete="email"
      spellCheck="false"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`input ${className}`}
      {...rest}
    />
  );
}
