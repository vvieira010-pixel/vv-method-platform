export function Select({ label, error, hint, options, value, onChange, placeholder, className = '', ...props }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <select className={`select ${className}`} value={value} onChange={onChange} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
      {hint && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </label>
  );
}
