/**
 * Card — visual container primitive
 * Contract: COMPONENT_CONTRACTS.md §Card
 * Export: named only (never default)
 *
 * Usage:
 *   import { Card } from '../components/Card'
 *   <Card padding="lg" hoverable={false}>{children}</Card>
 *
 * Note: Card has no onClick — wrap in <Link> or add onClick to parent if clickable.
 */

const PADDING_MAP = {
  md: 'var(--spacing-md)',   // 16px
  lg: 'var(--spacing-lg)',   // 24px
};

export function Card({ padding = 'lg', hoverable = false, children, className = '', ...rest }) {
  return (
    <div
      className={[
        'bg-[var(--color-surface)]',
        'rounded-[var(--radius-md)]',
        'border border-[var(--color-border)]',
        hoverable && 'cursor-pointer transition-all duration-200 hover:-translate-y-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        padding: PADDING_MAP[padding] ?? PADDING_MAP.lg,
        boxShadow: 'var(--shadow-card)',
        ...(hoverable
          ? { '--hover-shadow': 'var(--shadow-hover)' }
          : {}),
      }}
      onMouseEnter={
        hoverable
          ? (e) => { e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }
          : undefined
      }
      onMouseLeave={
        hoverable
          ? (e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  );
}
