/**
 * useTrip(tripId) — data hook for Person C screens
 * Contract: COMPONENT_CONTRACTS.md §useTrip
 * Shape: { trip, stops, loading, error, refetch }
 *
 * - trip: { id, name, start_date, end_date, is_public, public_slug, ... }
 * - stops: [{ id, city, order_index, start_date, end_date,
 *              stay_cost_per_night, transport_cost_to_here,
 *              activities: [{ id, activity_id, name, category, description,
 *                             image_url, estimated_cost, duration_minutes,
 *                             scheduled_date, scheduled_time, order_index,
 *                             custom_cost_override }] }]
 *
 * Stops come pre-joined with city name and their stop_activities + activity details.
 * This is the ONE hook every itinerary-related screen should use.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useTrip(tripId) {
  const [trip, setTrip]       = useState(null);
  const [stops, setStops]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTrip = useCallback(async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ── 1. Fetch the trip row ─────────────────────────────────
      const { data: tripData, error: tripErr } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripErr) throw tripErr;
      setTrip(tripData);

      // ── 2. Fetch stops joined with city ──────────────────────
      const { data: stopsData, error: stopsErr } = await supabase
        .from('trip_stops')
        .select(`
          id,
          trip_id,
          order_index,
          start_date,
          end_date,
          stay_cost_per_night,
          transport_cost_to_here,
          cities (
            id,
            name,
            country,
            region,
            cost_index,
            image_url
          )
        `)
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true });

      if (stopsErr) throw stopsErr;

      // ── 3. For each stop, fetch its activities ────────────────
      const stopsWithActivities = await Promise.all(
        (stopsData ?? []).map(async (stop) => {
          const { data: actData, error: actErr } = await supabase
            .from('stop_activities')
            .select(`
              id,
              activity_id,
              scheduled_date,
              scheduled_time,
              order_index,
              custom_cost_override,
              activities (
                id,
                name,
                category,
                description,
                image_url,
                estimated_cost,
                duration_minutes
              )
            `)
            .eq('trip_stop_id', stop.id)
            .order('scheduled_date', { ascending: true })
            .order('order_index',    { ascending: true });

          if (actErr) throw actErr;

          // Flatten: merge stop_activity fields + activity catalog fields
          const activities = (actData ?? []).map((sa) => ({
            // stop_activity row fields
            id:                  sa.id,
            activity_id:         sa.activity_id,
            scheduled_date:      sa.scheduled_date,
            scheduled_time:      sa.scheduled_time,
            order_index:         sa.order_index,
            custom_cost_override: sa.custom_cost_override,
            // activity catalog fields
            name:                sa.activities?.name,
            category:            sa.activities?.category,
            description:         sa.activities?.description,
            image_url:           sa.activities?.image_url,
            estimated_cost:      sa.activities?.estimated_cost,
            duration_minutes:    sa.activities?.duration_minutes,
            // effective cost: override wins if set
            effective_cost:
              sa.custom_cost_override !== null && sa.custom_cost_override !== undefined
                ? sa.custom_cost_override
                : sa.activities?.estimated_cost ?? 0,
          }));

          return {
            // stop row fields
            id:                    stop.id,
            trip_id:               stop.trip_id,
            order_index:           stop.order_index,
            start_date:            stop.start_date,
            end_date:              stop.end_date,
            stay_cost_per_night:   stop.stay_cost_per_night,
            transport_cost_to_here: stop.transport_cost_to_here,
            // city (from join)
            city:                  stop.cities,
            // activities (pre-joined)
            activities,
          };
        })
      );

      setStops(stopsWithActivities);
    } catch (err) {
      console.error('[useTrip] fetch error:', err);
      setError(err.message ?? 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  return { trip, stops, loading, error, refetch: fetchTrip };
}
