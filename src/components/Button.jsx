/**
 * Button — shared primitive
 * Contract: COMPONENT_CONTRACTS.md §Button
 * Export: named only (never default)
 *
 * Usage:
 *   import { Button } from '../components/Button'
 *   <Button variant="primary" onClick={handleSave}>Save Trip</Button>
 */

const VARIANTS = {
  primary: {
    base: 'text-white border-transparent',
    bg: 'bg-[var(--color-route)]',
    hover: 'hover:brightness-90 hover:-translate-y-[1px] hover:shadow-md',
    active: 'active:translate-y-0 active:brightness-75',
  },
  secondary: {
    base: 'text-[var(--color-ink)] bg-transparent',
    bg: 'border border-[var(--color-border)]',
    hover: 'hover:bg-[var(--color-border)] hover:bg-opacity-40 hover:-translate-y-[1px]',
    active: 'active:translate-y-0',
  },
  danger: {
    base: 'text-[var(--color-danger)] bg-transparent border-transparent',
    bg: '',
    hover: 'hover:bg-[var(--color-danger)] hover:bg-opacity-10 hover:-translate-y-[1px]',
    active: 'active:translate-y-0',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',        // v1: only "md" — reserved for future sizes
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        // layout & shape
        'inline-flex items-center justify-center gap-2',
        'rounded-[var(--radius-sm)]',
        'px-5 py-[10px]',       // 10px 20px per contract
        'text-[1rem] font-medium',
        'font-[var(--font-body)]',
        'leading-none',
        'border',               // secondary needs border; others set border-transparent
        'cursor-pointer',
        'select-none',
        // transitions
        'transition-all duration-150 ease-out',
        'will-change-transform',
        // variant
        v.base, v.bg, v.hover, v.active,
        // disabled state (contract: 50% opacity + cursor-not-allowed)
        disabled && 'opacity-50 !cursor-not-allowed !translate-y-0 pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
