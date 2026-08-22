import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Clock, MapPin, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTrip } from '../hooks/useTrip';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

// City coordinates mapping for map visualization (hackathon quick setup)
const CITY_COORDS = {
  'Tokyo': [35.6762, 139.6503],
  'Kyoto': [35.0116, 135.7681],
  'Osaka': [34.6937, 135.5023],
  'Bali': [-8.4095, 115.1889],
  'Paris': [48.8566, 2.3522],
  'London': [51.5074, -0.1278],
  'New York': [40.7128, -74.0060],
  'Rome': [41.9028, 12.4964],
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export default function ItineraryBuilder() {
  const { tripId } = useParams();
  const { trip, stops, loading, error, refetch } = useTrip(tripId);

  // Local state for optimistic drag-and-drop
  const [orderedStops, setOrderedStops] = useState([]);
  
  useEffect(() => {
    // Keep local stops in sync with server, sorted by order_index
    setOrderedStops([...stops].sort((a, b) => a.order_index - b.order_index));
  }, [stops]);

  // ── Modals State ────────────────────────────────────────
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch]       = useState('');
  const [cityResults, setCityResults]     = useState([]);
  
  const [actModalOpen, setActModalOpen]   = useState(false);
  const [activeStopIdForAct, setActiveStopIdForAct] = useState(null);
  const [actSearch, setActSearch]         = useState('');
  const [actResults, setActResults]       = useState([]);
  
  // ── Drag and Drop Handler ────────────────────────────────────
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;

    // Optimistic UI update
    const newStops = Array.from(orderedStops);
    const [reorderedItem] = newStops.splice(sourceIndex, 1);
    newStops.splice(destIndex, 0, reorderedItem);
    
    // Update order_index on all affected items
    const updatedStops = newStops.map((stop, idx) => ({ ...stop, order_index: idx }));
    setOrderedStops(updatedStops);

    // Persist to Supabase sequentially
    for (let i = 0; i < updatedStops.length; i++) {
      await supabase.from('trip_stops').update({ order_index: i }).eq('id', updatedStops[i].id);
    }
    refetch();
  };

  // ── Data Fetching ────────────────────────────────────
  async function searchCities(q) {
    const { data } = await supabase.from('cities').select('*').ilike('name', `%${q}%`).limit(10);
    setCityResults(data ?? []);
  }

  useEffect(() => { if (cityModalOpen) searchCities(citySearch); }, [citySearch, cityModalOpen]);

  async function searchActivities(q) {
    if (!activeStopIdForAct) return;
    const stop = stops.find(s => s.id === activeStopIdForAct);
    if (!stop?.city?.id) return;
    const { data } = await supabase.from('activities').select('*').eq('city_id', stop.city.id).ilike('name', `%${q}%`).limit(15);
    setActResults(data ?? []);
  }

  useEffect(() => { if (actModalOpen) searchActivities(actSearch); }, [actSearch, actModalOpen, activeStopIdForAct]);

  // ── CRUD operations ────────────────────────────────────
  async function addStop(city) {
    const nextOrder = stops.length;
    const defaultStart = stops.at(-1)?.end_date ?? trip?.start_date ?? new Date().toISOString().slice(0, 10);
    
    await supabase.from('trip_stops').insert({
      trip_id: tripId,
      city_id: city.id,
      order_index: nextOrder,
      start_date: defaultStart,
      end_date: defaultStart,
    });
    setCityModalOpen(false);
    refetch();
  }

  async function addActivity(activity) {
    const stop = stops.find(s => s.id === activeStopIdForAct);
    await supabase.from('stop_activities').insert({
      trip_stop_id: stop.id,
      activity_id: activity.id,
      scheduled_date: stop.start_date,
      order_index: stop.activities?.length ?? 0,
    });
    refetch();
  }

  async function deleteStop(stopId) {
    if (confirm('Remove this section?')) {
      await supabase.from('trip_stops').delete().eq('id', stopId);
      refetch();
    }
  }

  async function deleteActivity(stopActId) {
    await supabase.from('stop_activities').delete().eq('id', stopActId);
    refetch();
  }

  async function updateStopField(stopId, field, value) {
    await supabase.from('trip_stops').update({ [field]: value }).eq('id', stopId);
    refetch();
  }

  if (loading && stops.length === 0) return <div className="p-12 text-center text-[var(--color-muted)]">Loading...</div>;

  // Compute map markers/lines
  const mapPositions = orderedStops
    .map(s => CITY_COORDS[s.city?.name])
    .filter(Boolean);

  const centerPos = mapPositions.length > 0 ? mapPositions[0] : [35.6762, 139.6503];

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
        <div>
           <Link to="/trips" className="inline-flex items-center gap-1 text-small text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors mb-2 no-underline">
             <ArrowLeft size={14} /> My Trips
           </Link>
           <h1 className="text-display text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
             {trip?.name ?? 'Build Itinerary'}
           </h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/trips/${tripId}/view`}><Button variant="secondary">Preview View</Button></Link>
        </div>
      </div>

      {/* ── Map Visualization ── */}
      <Card padding="md" className="mb-8 z-0 overflow-hidden" style={{ padding: 0 }}>
        <div style={{ height: 250, width: '100%', zIndex: 0 }}>
           <MapContainer center={centerPos} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}>
             <TileLayer
               url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
             />
             {mapPositions.map((pos, i) => (
                <Marker key={i} position={pos}>
                  <Popup>{orderedStops[i].city?.name}</Popup>
                </Marker>
             ))}
             {mapPositions.length > 1 && (
               <Polyline positions={mapPositions} color="var(--color-route)" dashArray="5, 10" weight={3} />
             )}
           </MapContainer>
        </div>
      </Card>

      {/* ── Sections (Drag and Drop) ── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-6">
              {orderedStops.map((stop, index) => (
                <Draggable key={stop.id} draggableId={stop.id} index={index}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-[var(--color-bg)]"
                    >
                       <Card padding="lg" className={`transition-shadow ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[var(--color-route)]' : ''}`}>
                         {/* Section Header */}
                         <div className="flex items-center gap-3 mb-6">
                           <div {...provided.dragHandleProps} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-grab active:cursor-grabbing">
                             <GripVertical size={20} />
                           </div>
                           <h2 className="text-h2 text-[var(--color-ink)] flex-1" style={{ fontFamily: 'var(--font-display)' }}>
                             Section {index + 1}: {stop.city?.name}
                           </h2>
                           <Button variant="danger" onClick={() => deleteStop(stop.id)}>
                             <Trash2 size={16} />
                           </Button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                           {/* Dates area */}
                           <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgba(255,255,255,0.5)]">
                             <h4 className="text-label text-[var(--color-muted)] mb-3">Date Range</h4>
                             <div className="flex items-center gap-3">
                               <Input type="date" value={stop.start_date || ''} onChange={(e) => updateStopField(stop.id, 'start_date', e.target.value)} className="w-full" />
                               <span className="text-[var(--color-muted)]">to</span>
                               <Input type="date" value={stop.end_date || ''} onChange={(e) => updateStopField(stop.id, 'end_date', e.target.value)} className="w-full" />
                             </div>
                           </div>

                           {/* Budget area */}
                           <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgba(255,255,255,0.5)]">
                             <h4 className="text-label text-[var(--color-muted)] mb-3">Budget of this section</h4>
                             <div className="flex items-center gap-3">
                               <Input label="Stay/night" type="number" value={stop.stay_cost_per_night || 0} onChange={(e) => updateStopField(stop.id, 'stay_cost_per_night', e.target.value)} className="w-full" />
                               <Input label="Transport" type="number" value={stop.transport_cost_to_here || 0} onChange={(e) => updateStopField(stop.id, 'transport_cost_to_here', e.target.value)} className="w-full" />
                             </div>
                           </div>
                         </div>

                         {/* Activities List */}
                         <div className="mb-4">
                           <h4 className="text-label text-[var(--color-muted)] mb-3">Activities</h4>
                           {stop.activities?.length === 0 ? (
                             <p className="text-small text-[var(--color-muted)] italic">No activities added.</p>
                           ) : (
                             <div className="flex flex-col gap-2">
                               {stop.activities?.map(act => (
                                 <div key={act.id} className="flex justify-between items-center p-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)]">
                                   <div>
                                     <p className="text-body font-medium">{act.name}</p>
                                     <p className="text-small text-[var(--color-muted)] font-mono">${Number(act.effective_cost).toFixed(2)}</p>
                                   </div>
                                   <button onClick={() => deleteActivity(act.id)} className="text-[var(--color-muted)] hover:text-[var(--color-danger)] p-1">
                                     <Trash2 size={16} />
                                   </button>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>

                         <Button variant="secondary" onClick={() => { setActiveStopIdForAct(stop.id); setActModalOpen(true); }} className="w-full justify-center border-dashed">
                           <Plus size={16} /> Add Activity
                         </Button>
                       </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-8 text-center">
         <Button variant="primary" onClick={() => setCityModalOpen(true)} className="px-8 py-4 text-h2 shadow-md hover:shadow-lg transition-shadow">
            <Plus size={20} /> Add another Section
         </Button>
      </div>

      {/* ── Modals ── */}
      <Modal open={cityModalOpen} onClose={() => setCityModalOpen(false)} title="Select a City">
         <Input placeholder="Search..." value={citySearch} onChange={e => setCitySearch(e.target.value)} className="mb-4" />
         <div className="flex flex-col gap-2">
           {cityResults.map(city => (
             <button key={city.id} onClick={() => addStop(city)} className="p-3 border rounded text-left hover:border-[var(--color-route)] cursor-pointer bg-[var(--color-surface)]">
               <span className="font-medium">{city.name}</span> <span className="text-[var(--color-muted)] text-small">({city.country})</span>
             </button>
           ))}
         </div>
      </Modal>

      <Modal open={actModalOpen} onClose={() => { setActModalOpen(false); setActiveStopIdForAct(null); }} title="Select an Activity">
         <Input placeholder="Search activities..." value={actSearch} onChange={e => setActSearch(e.target.value)} className="mb-4" />
         <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
           {actResults.map(act => (
             <button key={act.id} onClick={() => addActivity(act)} className="flex justify-between p-3 border rounded text-left hover:border-[var(--color-route)] cursor-pointer bg-[var(--color-surface)]">
               <div>
                 <p className="font-medium">{act.name}</p>
                 <Badge tone="neutral" className="mt-1">{act.category}</Badge>
               </div>
               <span className="text-[var(--color-route)] font-mono">${act.estimated_cost}</span>
             </button>
           ))}
         </div>
      </Modal>
    </div>
  );
}
