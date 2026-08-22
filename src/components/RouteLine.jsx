/**
 * RouteLine — multi-city path visualiser (the signature motif)
 * Contract: COMPONENT_CONTRACTS.md §RouteLine
 * Export: named only (never default)
 *
 * Usage (interactive — Itinerary Builder):
 *   import { RouteLine } from '../components/RouteLine'
 *   <RouteLine
 *     stops={[
 *       { id: 'uuid-1', label: 'Tokyo', active: false },
 *       { id: 'uuid-2', label: 'Kyoto', active: true },
 *       { id: 'uuid-3', label: 'Osaka', active: false },
 *     ]}
 *     onStopClick={(stopId) => setActiveStop(stopId)}
 *   />
 *
 * Usage (read-only — Public/Shared View):
 *   <RouteLine stops={stops} />   ← omit onStopClick
 *
 * Layout:
 *   - Desktop (≥ 768px): horizontal  ● ╌╌╌ ● ╌╌╌ ●
 *   - Mobile  (< 768px): vertical column with dashed left border
 */

export function RouteLine({ stops = [], onStopClick }) {
  const isInteractive = typeof onStopClick === 'function';

  return (
    <>
      {/* Desktop: horizontal */}
      <div
        className="hidden md:flex items-start w-full"
        role={isInteractive ? 'list' : undefined}
        aria-label={isInteractive ? 'Trip stops' : undefined}
      >
        {stops.map((stop, idx) => {
          const isLast = idx === stops.length - 1;
          return (
            <div
              key={stop.id}
              className="flex items-start flex-1 min-w-0"
              role={isInteractive ? 'listitem' : undefined}
            >
              {/* Stop node */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <StopMarker
                  stop={stop}
                  isInteractive={isInteractive}
                  onStopClick={onStopClick}
                />
                <StopLabel stop={stop} />
              </div>

              {/* Dashed connector (not after last stop) */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="flex-1 mt-[7px] mx-1"   /* vertically center on the 16px marker */
                  style={{
                    borderTop: '2px dashed var(--color-border)',
                    minWidth: 24,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div
        className="flex md:hidden flex-col gap-0"
        role={isInteractive ? 'list' : undefined}
        aria-label={isInteractive ? 'Trip stops' : undefined}
      >
        {stops.map((stop, idx) => {
          const isLast = idx === stops.length - 1;
          return (
            <div key={stop.id} className="flex items-stretch gap-3" role={isInteractive ? 'listitem' : undefined}>
              {/* Left: marker + dashed vertical line */}
              <div className="flex flex-col items-center shrink-0">
                <StopMarker
                  stop={stop}
                  isInteractive={isInteractive}
                  onStopClick={onStopClick}
                />
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className="flex-1 mt-1"
                    style={{
                      borderLeft: '2px dashed var(--color-border)',
                      minHeight: 32,
                      width: 0,
                    }}
                  />
                )}
              </div>

              {/* Right: label */}
              <div className="pb-6">
                <StopLabel stop={stop} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Sub-components (not exported — internal only) ── */

function StopMarker({ stop, isInteractive, onStopClick }) {
  const baseStyle = {
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const activeStyle = {
    backgroundColor: 'var(--color-route)',
    border: '2px solid var(--color-route)',
  };

  const inactiveStyle = {
    backgroundColor: 'transparent',
    border: '2px solid var(--color-border)',
  };

  const mergedStyle = {
    ...baseStyle,
    ...(stop.active ? activeStyle : inactiveStyle),
  };

  if (isInteractive) {
    return (
      <button
        type="button"
        aria-label={`Go to ${stop.label}`}
        aria-pressed={stop.active}
        onClick={() => onStopClick(stop.id)}
        style={mergedStyle}
        className="cursor-pointer hover:scale-125 focus:outline-2 focus:outline-[var(--color-horizon)] focus:outline-offset-2"
      />
    );
  }

  return <span style={mergedStyle} aria-hidden="true" />;
}

function StopLabel({ stop }) {
  return (
    <span
      className="text-small text-center max-w-[80px] truncate block"
      style={{
        color: stop.active ? 'var(--color-ink)' : 'var(--color-muted)',
        fontWeight: stop.active ? 500 : 400,
      }}
    >
      {stop.label}
    </span>
  );
}
