/**
 * ItineraryBuilder — Person C's primary screen
 * Route: /trips/:tripId/build
 *
 * Layout: Two-panel
 *   Left  — RouteLine of stops + "Add City" button + stop date/cost fields
 *   Right — Selected stop's activity list + "Add Activity" button
 *
 * Data owned by Person C:
 *   WRITE: trip_stops, stop_activities
 *   READ:  trips (name/dates), cities (catalog), activities (catalog)
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, ChevronRight, Clock, DollarSign, MapPin, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTrip } from '../hooks/useTrip';
import { RouteLine } from '../components/RouteLine';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';

// ─── Category → Badge tone map ───────────────────────────────
const CATEGORY_TONE = {
  sightseeing: 'horizon',
  food:        'route',
  adventure:   'danger',
  culture:     'success',
};

// ─── Helper: number of nights between two date strings ───────
function nights(start, end) {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// ─── Helper: format date for display ─────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export default function ItineraryBuilder() {
  const { tripId } = useParams();
  const { trip, stops, loading, error, refetch } = useTrip(tripId);

  // ── Active stop (selected in left panel) ─────────────────────
  const [activeStopId, setActiveStopId] = useState(null);
  const activeStop = stops.find((s) => s.id === activeStopId) ?? stops[0] ?? null;

  // Auto-select first stop when stops load
  useEffect(() => {
    if (stops.length > 0 && !activeStopId) {
      setActiveStopId(stops[0].id);
    }
  }, [stops, activeStopId]);

  // ── City search modal ────────────────────────────────────────
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch]       = useState('');
  const [cityResults, setCityResults]     = useState([]);
  const [cityLoading, setCityLoading]     = useState(false);

  async function searchCities(q) {
    setCityLoading(true);
    const { data } = await supabase
      .from('cities')
      .select('id, name, country, region, cost_index')
      .ilike('name', `%${q}%`)
      .limit(12);
    setCityResults(data ?? []);
    setCityLoading(false);
  }

  useEffect(() => {
    if (cityModalOpen) searchCities(citySearch);
  }, [citySearch, cityModalOpen]);

  async function addStop(city) {
    // Add as next stop after existing ones
    const nextOrder = stops.length;
    // Default dates: day after last stop ends, or trip start
    const defaultStart = stops.at(-1)?.end_date ?? trip?.start_date ?? new Date().toISOString().slice(0, 10);
    const defaultEnd   = defaultStart;

    const { error: err } = await supabase.from('trip_stops').insert({
      trip_id:               tripId,
      city_id:               city.id,
      order_index:           nextOrder,
      start_date:            defaultStart,
      end_date:              defaultEnd,
      stay_cost_per_night:   0,
      transport_cost_to_here: 0,
    });

    if (!err) {
      setCityModalOpen(false);
      setCitySearch('');
      await refetch();
    } else {
      alert('Error adding stop: ' + err.message);
    }
  }

  async function deleteStop(stopId) {
    if (!confirm('Remove this city from your trip?')) return;
    await supabase.from('trip_stops').delete().eq('id', stopId);
    if (activeStopId === stopId) setActiveStopId(null);
    await refetch();
  }

  // ── Stop field update (dates, costs) ─────────────────────────
  async function updateStop(stopId, field, value) {
    await supabase.from('trip_stops').update({ [field]: value }).eq('id', stopId);
    await refetch();
  }

  // ── Activity search modal ────────────────────────────────────
  const [actModalOpen, setActModalOpen]   = useState(false);
  const [actSearch, setActSearch]         = useState('');
  const [actResults, setActResults]       = useState([]);
  const [actLoading, setActLoading]       = useState(false);
  const [actCategory, setActCategory]     = useState('');

  async function searchActivities(q, category) {
    if (!activeStop?.city?.id) return;
    setActLoading(true);
    let query = supabase
      .from('activities')
      .select('id, name, category, description, estimated_cost, duration_minutes')
      .eq('city_id', activeStop.city.id)
      .ilike('name', `%${q}%`);
    if (category) query = query.eq('category', category);
    const { data } = await query.limit(20);
    setActResults(data ?? []);
    setActLoading(false);
  }

  useEffect(() => {
    if (actModalOpen) searchActivities(actSearch, actCategory);
  }, [actSearch, actCategory, actModalOpen, activeStop]);

  async function addActivity(activity) {
    const scheduledDate = activeStop?.start_date ?? new Date().toISOString().slice(0, 10);
    const nextOrder = (activeStop?.activities?.length ?? 0);

    const { error: err } = await supabase.from('stop_activities').insert({
      trip_stop_id:   activeStopId,
      activity_id:    activity.id,
      scheduled_date: scheduledDate,
      order_index:    nextOrder,
    });

    if (!err) {
      await refetch();
    } else {
      alert('Error adding activity: ' + err.message);
    }
  }

  async function removeActivity(stopActivityId) {
    await supabase.from('stop_activities').delete().eq('id', stopActivityId);
    await refetch();
  }

  async function updateActivityDate(stopActivityId, date) {
    await supabase.from('stop_activities').update({ scheduled_date: date }).eq('id', stopActivityId);
    await refetch();
  }

  // ── Route line stops shape ───────────────────────────────────
  const routeStops = stops.map((s) => ({
    id:     s.id,
    label:  s.city?.name ?? '?',
    active: s.id === (activeStop?.id),
  }));

  // ── Loading / error states ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">
        Loading itinerary…
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
    <div>
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/trips"
            className="inline-flex items-center gap-1 text-small text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors mb-2 no-underline"
          >
            <ArrowLeft size={14} /> My Trips
          </Link>
          <h1
            className="text-display text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {trip?.name ?? 'Trip'}
          </h1>
          {trip?.start_date && (
            <p className="text-small text-[var(--color-muted)] mt-1 font-mono">
              {fmtDate(trip.start_date)} → {fmtDate(trip.end_date)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/trips/${tripId}/view`}>
            <Button variant="secondary">Preview</Button>
          </Link>
          <Link to={`/trips/${tripId}/budget`}>
            <Button variant="secondary">Budget</Button>
          </Link>
        </div>
      </div>

      {/* ── Route line (full width above panels) ── */}
      {stops.length > 0 && (
        <Card padding="md" className="mb-6">
          <RouteLine stops={routeStops} onStopClick={setActiveStopId} />
        </Card>
      )}

      {/* ── Two-panel layout ── */}
      <div className="flex gap-5 items-start flex-col md:flex-row">

        {/* ══ LEFT PANEL — Stop list ══════════════════════════════ */}
        <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-h2 text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Cities
            </h2>
            <Button
              variant="primary"
              onClick={() => setCityModalOpen(true)}
              className="!px-3 !py-2 !text-small"
            >
              <Plus size={14} /> Add City
            </Button>
          </div>

          {stops.length === 0 && (
            <Card padding="md">
              <p className="text-small text-[var(--color-muted)] text-center py-4">
                No cities yet.<br />Click "Add City" to start planning.
              </p>
            </Card>
          )}

          {stops.map((stop, idx) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={idx}
              isActive={stop.id === activeStop?.id}
              onSelect={() => setActiveStopId(stop.id)}
              onDelete={() => deleteStop(stop.id)}
              onUpdateField={(field, val) => updateStop(stop.id, field, val)}
            />
          ))}
        </div>

        {/* ══ RIGHT PANEL — Activities ═════════════════════════════ */}
        <div className="flex-1 min-w-0">
          {!activeStop ? (
            <Card padding="lg">
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <MapPin size={40} className="text-[var(--color-border)]" />
                <p className="text-body text-[var(--color-muted)]">
                  Select a city on the left to manage its activities
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Right panel header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2
                    className="text-h2 text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {activeStop.city?.name}
                    <span className="text-small text-[var(--color-muted)] ml-2 font-sans font-normal">
                      {activeStop.city?.country}
                    </span>
                  </h2>
                  <p className="text-small text-[var(--color-muted)] font-mono mt-0.5">
                    {fmtDate(activeStop.start_date)} → {fmtDate(activeStop.end_date)}
                    {' · '}{nights(activeStop.start_date, activeStop.end_date)} night(s)
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setActModalOpen(true)}
                >
                  <Plus size={15} /> Add Activity
                </Button>
              </div>

              {/* Activities */}
              {activeStop.activities.length === 0 ? (
                <Card padding="lg">
                  <div className="flex flex-col items-center py-10 gap-2 text-center">
                    <Clock size={36} className="text-[var(--color-border)]" />
                    <p className="text-body text-[var(--color-muted)]">
                      No activities added yet.
                    </p>
                    <p className="text-small text-[var(--color-muted)]">
                      Click "Add Activity" to browse things to do in {activeStop.city?.name}.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeStop.activities.map((act) => (
                    <ActivityRow
                      key={act.id}
                      activity={act}
                      stopStartDate={activeStop.start_date}
                      stopEndDate={activeStop.end_date}
                      onRemove={() => removeActivity(act.id)}
                      onDateChange={(date) => updateActivityDate(act.id, date)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ City Search Modal ════════════════════════════════════ */}
      <Modal
        open={cityModalOpen}
        onClose={() => { setCityModalOpen(false); setCitySearch(''); }}
        title="Add a City"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Search cities"
            name="citySearch"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="Tokyo, Paris, Bali…"
          />
          {cityLoading && (
            <p className="text-small text-[var(--color-muted)]">Searching…</p>
          )}
          <div className="flex flex-col gap-2">
            {cityResults.map((city) => {
              const alreadyAdded = stops.some((s) => s.city?.id === city.id);
              return (
                <button
                  key={city.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => addStop(city)}
                  className={[
                    'flex items-center justify-between w-full',
                    'px-4 py-3 rounded-[var(--radius-sm)]',
                    'border border-[var(--color-border)]',
                    'text-left transition-colors duration-150',
                    'cursor-pointer',
                    alreadyAdded
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-[var(--color-route)] hover:bg-[rgba(196,98,45,0.04)]',
                  ].join(' ')}
                >
                  <div>
                    <p className="text-body font-medium text-[var(--color-ink)]">{city.name}</p>
                    <p className="text-small text-[var(--color-muted)]">{city.country} {city.region ? `· ${city.region}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {'💰'.repeat(city.cost_index ?? 1)}
                    {alreadyAdded && <Badge tone="neutral">Added</Badge>}
                    {!alreadyAdded && <ChevronRight size={16} className="text-[var(--color-muted)]" />}
                  </div>
                </button>
              );
            })}
            {!cityLoading && cityResults.length === 0 && citySearch && (
              <p className="text-small text-[var(--color-muted)] text-center py-4">
                No cities found for "{citySearch}"
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* ══ Activity Search Modal ════════════════════════════════ */}
      <Modal
        open={actModalOpen}
        onClose={() => { setActModalOpen(false); setActSearch(''); setActCategory(''); }}
        title={`Activities in ${activeStop?.city?.name ?? '…'}`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Search activities"
                name="actSearch"
                value={actSearch}
                onChange={(e) => setActSearch(e.target.value)}
                placeholder="Fushimi Inari, sushi…"
              />
            </div>
            <div className="w-36">
              <div className="flex flex-col gap-[var(--spacing-xs)]">
                <label className="text-label text-[var(--color-muted)]">Category</label>
                <select
                  value={actCategory}
                  onChange={(e) => setActCategory(e.target.value)}
                  className="
                    w-full bg-[var(--color-surface)] text-[var(--color-ink)]
                    border border-[var(--color-border)] rounded-[var(--radius-sm)]
                    px-3 py-[10px] text-body outline-none
                    focus:border-[var(--color-horizon)] transition-colors
                    cursor-pointer
                  "
                >
                  <option value="">All</option>
                  <option value="sightseeing">Sightseeing</option>
                  <option value="food">Food</option>
                  <option value="adventure">Adventure</option>
                  <option value="culture">Culture</option>
                </select>
              </div>
            </div>
          </div>

          {actLoading && (
            <p className="text-small text-[var(--color-muted)]">Loading activities…</p>
          )}

          <div className="flex flex-col gap-2">
            {actResults.map((act) => {
              const alreadyAdded = activeStop?.activities?.some((a) => a.activity_id === act.id);
              return (
                <button
                  key={act.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => addActivity(act)}
                  className={[
                    'flex items-start justify-between w-full gap-3',
                    'px-4 py-3 rounded-[var(--radius-sm)]',
                    'border border-[var(--color-border)]',
                    'text-left transition-colors duration-150 cursor-pointer',
                    alreadyAdded
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-[var(--color-route)] hover:bg-[rgba(196,98,45,0.04)]',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-[var(--color-ink)]">{act.name}</p>
                    {act.description && (
                      <p className="text-small text-[var(--color-muted)] mt-0.5 line-clamp-2">
                        {act.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge tone={CATEGORY_TONE[act.category] ?? 'neutral'}>{act.category}</Badge>
                      {act.duration_minutes && (
                        <span className="text-small text-[var(--color-muted)] font-mono">
                          {act.duration_minutes}min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-body font-medium font-mono"
                      style={{ color: 'var(--color-route)' }}
                    >
                      ${Number(act.estimated_cost).toFixed(0)}
                    </p>
                    {alreadyAdded && <Badge tone="neutral">Added</Badge>}
                  </div>
                </button>
              );
            })}
            {!actLoading && actResults.length === 0 && (
              <p className="text-small text-[var(--color-muted)] text-center py-4">
                No activities found. Try a different search or category.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── StopCard — left panel item ──────────────────────────────
function StopCard({ stop, index, isActive, onSelect, onDelete, onUpdateField }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={[
        'rounded-[var(--radius-md)] border transition-all duration-150',
        isActive
          ? 'border-[var(--color-route)] shadow-[0_0_0_2px_rgba(196,98,45,0.15)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-muted)]',
        'bg-[var(--color-surface)]',
        'overflow-hidden',
      ].join(' ')}
    >
      {/* Card header — click to select */}
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
      >
        {/* Stop number */}
        <span
          className="w-6 h-6 rounded-full text-label flex items-center justify-center shrink-0 font-medium"
          style={{
            backgroundColor: isActive ? 'var(--color-route)' : 'var(--color-border)',
            color: isActive ? '#fff' : 'var(--color-muted)',
          }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-[var(--color-ink)] truncate">
            {stop.city?.name ?? 'Unknown City'}
          </p>
          <p className="text-small text-[var(--color-muted)] font-mono">
            {fmtDate(stop.start_date)} → {fmtDate(stop.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge tone="neutral">{stop.activities.length} act.</Badge>
        </div>
      </button>

      {/* Expand/collapse for editing dates + costs */}
      {isActive && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              label="From"
              name={`start_date_${stop.id}`}
              type="date"
              value={stop.start_date ?? ''}
              onChange={(e) => onUpdateField('start_date', e.target.value)}
              className="flex-1"
            />
            <Input
              label="To"
              name={`end_date_${stop.id}`}
              type="date"
              value={stop.end_date ?? ''}
              onChange={(e) => onUpdateField('end_date', e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Input
              label="Stay/night ($)"
              name={`stay_${stop.id}`}
              type="number"
              value={stop.stay_cost_per_night ?? 0}
              onChange={(e) => onUpdateField('stay_cost_per_night', e.target.value)}
              className="flex-1"
            />
            <Input
              label="Transport ($)"
              name={`transport_${stop.id}`}
              type="number"
              value={stop.transport_cost_to_here ?? 0}
              onChange={(e) => onUpdateField('transport_cost_to_here', e.target.value)}
              className="flex-1"
            />
          </div>
          <Button variant="danger" onClick={onDelete} className="self-start !text-small !px-3 !py-1.5">
            <Trash2 size={13} /> Remove City
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── ActivityRow — right panel item ──────────────────────────
function ActivityRow({ activity, stopStartDate, stopEndDate, onRemove, onDateChange }) {
  return (
    <Card padding="md" className="flex items-start gap-4">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-body font-medium text-[var(--color-ink)]">{activity.name}</p>
          <Badge tone={CATEGORY_TONE[activity.category] ?? 'neutral'}>{activity.category}</Badge>
        </div>
        {activity.description && (
          <p className="text-small text-[var(--color-muted)] mt-1 line-clamp-2">
            {activity.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {/* Scheduled date picker */}
          <label className="flex items-center gap-1.5 text-small text-[var(--color-muted)]">
            <Clock size={13} />
            <input
              type="date"
              value={activity.scheduled_date ?? stopStartDate ?? ''}
              min={stopStartDate}
              max={stopEndDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="
                text-small font-mono text-[var(--color-ink)]
                bg-transparent border-none outline-none
                cursor-pointer
              "
            />
          </label>
          {activity.duration_minutes && (
            <span className="text-small text-[var(--color-muted)] font-mono flex items-center gap-1">
              <Clock size={12} /> {activity.duration_minutes}min
            </span>
          )}
        </div>
      </div>

      {/* Cost + remove */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <p
          className="text-body font-medium font-mono"
          style={{ color: 'var(--color-route)' }}
        >
          ${Number(activity.effective_cost).toFixed(0)}
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove activity"
          className="
            text-[var(--color-muted)] hover:text-[var(--color-danger)]
            transition-colors duration-150 cursor-pointer p-1
          "
        >
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}
