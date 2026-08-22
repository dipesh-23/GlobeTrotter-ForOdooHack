/**
 * Input — shared form field primitive
 * Contract: COMPONENT_CONTRACTS.md §Input
 * Export: named only (never default)
 *
 * Usage:
 *   import { Input } from '../components/Input'
 *   <Input label="Trip Name" name="tripName" value={val} onChange={e => setVal(e.target.value)} error={null} />
 *
 * Note: type="textarea" renders a <textarea> (NOT a separate component).
 */

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error = null,
  placeholder = '',
  required = false,
  className = '',
  ...rest
}) {
  const isTextarea = type === 'textarea';
  const inputId = `input-${name}`;
  const errorId = error ? `${inputId}-error` : undefined;

  const sharedInputStyles = [
    'w-full',
    'bg-[var(--color-surface)]',
    'text-[var(--color-ink)]',
    'font-[var(--font-body)]',
    'text-[1rem]',
    'px-3 py-[10px]',
    'rounded-[var(--radius-sm)]',
    'outline-none',
    'transition-all duration-150 ease-out',
    'placeholder:text-[var(--color-muted)]',
    // border — error overrides default
    error
      ? 'border border-[var(--color-danger)] ring-1 ring-[var(--color-danger)]'
      : 'border border-[var(--color-border)] focus:border-[var(--color-horizon)] focus:ring-2 focus:ring-[var(--color-horizon)] focus:ring-opacity-25',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex flex-col gap-[var(--spacing-xs)] ${className}`}>
      {/* Label — always rendered above (contract requirement) */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-label text-[var(--color-muted)] flex items-center gap-1"
        >
          {label}
          {required && (
            <span className="text-[var(--color-danger)] leading-none" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Field */}
      {isTextarea ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          style={{ minHeight: '100px', resize: 'vertical' }}
          className={sharedInputStyles}
          {...rest}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          className={sharedInputStyles}
          {...rest}
        />
      )}

      {/* Error message (contract: shown below field in --color-danger) */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-small text-[var(--color-danger)] flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
