export function FormField({ label, htmlFor, error, hint, required, children, className = '', style }) {
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`.trim()} style={style}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}{required && ' *'}
        </label>
      )}
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
}
