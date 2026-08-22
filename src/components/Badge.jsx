/**
 * Badge — status / category pill
 * Contract: COMPONENT_CONTRACTS.md §Badge
 * Export: named only (never default)
 *
 * Usage:
 *   import { Badge } from '../components/Badge'
 *   <Badge tone="horizon">Sightseeing</Badge>
 *   <Badge tone="success">Public</Badge>
 *   <Badge tone="danger">Over Budget</Badge>
 */

/** Maps tone → CSS color var (text + bg at 10% opacity) */
const TONE_MAP = {
  neutral:  { text: 'var(--color-ink)',     bg: 'rgba(31, 42, 36, 0.10)' },
  route:    { text: 'var(--color-route)',   bg: 'rgba(196, 98, 45, 0.10)' },
  horizon:  { text: 'var(--color-horizon)', bg: 'rgba(43, 93, 107, 0.10)' },
  success:  { text: 'var(--color-success)', bg: 'rgba(74, 122, 78, 0.10)' },
  danger:   { text: 'var(--color-danger)',  bg: 'rgba(179, 69, 46, 0.10)' },
};

export function Badge({ tone = 'neutral', children, className = '' }) {
  const colors = TONE_MAP[tone] ?? TONE_MAP.neutral;

  return (
    <span
      className={`
        inline-flex items-center
        text-label
        px-3 py-[4px]
        rounded-[var(--radius-full)]
        whitespace-nowrap
        ${className}
      `}
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
      }}
    >
      {children}
    </span>
  );
}
