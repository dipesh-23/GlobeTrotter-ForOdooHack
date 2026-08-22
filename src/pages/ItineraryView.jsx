/**
 * ItineraryView — Person C's read-only timeline screen
 * Route: /trips/:tripId/view
 *
 * Layout: Day-wise vertical timeline
 * - Groups activities by scheduled_date
 * - Displays a daily summary (stay cost + transport cost if applicable)
 * - Uses RouteLine motif vertically to connect days
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';

const CATEGORY_TONE = {
  sightseeing: 'horizon',
  food:        'route',
  adventure:   'danger',
  culture:     'success',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

export default function ItineraryView() {
  const { tripId } = useParams();
  const { trip, stops, loading, error } = useTrip(tripId);

  // Group activities by date across all stops
  const days = useMemo(() => {
    if (!stops.length) return [];

    const dateMap = new Map();

    stops.forEach(stop => {
      // 1. Add city arrival marker/costs to the start date of the stop
      if (stop.start_date) {
        if (!dateMap.has(stop.start_date)) {
          dateMap.set(stop.start_date, {
            date: stop.start_date,
            activities: [],
            stopInfo: stop, // used to show city arrival info
          });
        } else {
           dateMap.get(stop.start_date).stopInfo = stop;
        }
      }

      // 2. Add activities to their scheduled dates
      stop.activities.forEach(act => {
        const date = act.scheduled_date || stop.start_date;
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            activities: [],
            city: stop.city,
          });
        }
        dateMap.get(date).activities.push({ ...act, city: stop.city });
      });
    });

    // Sort by date
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    // Fill in empty days between start and end of trip if needed, 
    // or just show days with activities/stop starts. We'll just show active days for now.
    
    return sortedDates.map(date => dateMap.get(date));
  }, [stops]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">
        Loading itinerary view…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-danger)]">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Page header ── */}
      <div className="mb-8">
        <Link
          to={`/trips/${tripId}/build`}
          className="inline-flex items-center gap-1 text-small text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors mb-4 no-underline"
        >
          <ArrowLeft size={14} /> Back to Builder
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-display text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {trip?.name ?? 'Trip'}
            </h1>
             <p className="text-body text-[var(--color-muted)] mt-1">
              Read-only timeline view
            </p>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      {days.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <p className="text-body text-[var(--color-muted)]">
            This trip has no schedule yet.
          </p>
          <Link to={`/trips/${tripId}/build`} className="inline-block mt-4">
            <Button variant="primary">Go to Builder</Button>
          </Link>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line connecting days */}
          <div 
            className="absolute left-[15px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-[var(--color-border)]"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-8 relative">
            {days.map((day, dayIdx) => (
              <div key={day.date} className="flex gap-6">
                {/* Timeline node */}
                <div className="flex flex-col items-center mt-1.5 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-route)] flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-route)]" />
                  </div>
                </div>

                {/* Day content */}
                <div className="flex-1 pb-4">
                  <h3 
                    className="text-h2 text-[var(--color-ink)] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {fmtDate(day.date)}
                  </h3>
                  
                  {/* City Arrival / Costs summary if a stop starts today */}
                  {day.stopInfo && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[rgba(196,98,45,0.05)] border border-[rgba(196,98,45,0.1)]">
                      <MapPin size={14} className="text-[var(--color-route)]" />
                      <span className="text-small font-medium text-[var(--color-ink)]">
                        Arrive in {day.stopInfo.city?.name}
                      </span>
                      {Number(day.stopInfo.transport_cost_to_here) > 0 && (
                        <span className="text-small text-[var(--color-muted)] font-mono ml-2 border-l border-[var(--color-border)] pl-2">
                          Transport: ${Number(day.stopInfo.transport_cost_to_here).toFixed(0)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Activities list */}
                  <div className="flex flex-col gap-3">
                    {day.activities.length === 0 ? (
                      <p className="text-small text-[var(--color-muted)] italic">Free day</p>
                    ) : (
                      day.activities.map((act) => (
                        <Card key={act.id} padding="md" hoverable className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 flex-wrap mb-1">
                               <p className="text-body font-medium text-[var(--color-ink)]">{act.name}</p>
                               <Badge tone={CATEGORY_TONE[act.category] ?? 'neutral'}>{act.category}</Badge>
                             </div>
                             {act.description && (
                                <p className="text-small text-[var(--color-muted)] mb-2 line-clamp-2">
                                  {act.description}
                                </p>
                             )}
                             <div className="flex items-center gap-3 text-small text-[var(--color-muted)] font-mono">
                                {act.scheduled_time && (
                                  <span className="flex items-center gap-1"><Clock size={12}/> {act.scheduled_time.slice(0,5)}</span>
                                )}
                                {act.duration_minutes && (
                                  <span className="flex items-center gap-1"><Clock size={12}/> {act.duration_minutes}m</span>
                                )}
                             </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-body font-medium font-mono text-[var(--color-route)]">
                              ${Number(act.effective_cost).toFixed(0)}
                            </p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
