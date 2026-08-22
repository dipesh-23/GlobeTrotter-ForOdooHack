import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useItinerary } from '../hooks/useItinerary';

function EditActivityModal({ activity, onClose, onSave }) {
  const [cost, setCost] = useState(activity.cost || 0);
  const [time, setTime] = useState(activity.time || '');

  const handleSave = () => {
    onSave(activity.id, { 
      custom_cost_override: cost !== '' ? Number(cost) : null,
      scheduled_time: time !== '' ? `${time}:00` : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out_forwards]">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div className="bg-surface border border-border rounded-[16px] w-full max-w-[400px] p-[24px] shadow-2xl mx-[16px]">
        <h3 className="font-['Fraunces'] text-[20px] font-semibold text-ink mb-[4px]">Edit Activity</h3>
        <p className="text-[13px] text-muted mb-[24px]">{activity.title} ({activity.city_name})</p>
        
        <div className="flex flex-col gap-[16px] mb-[24px]">
          <div>
            <label className="block text-[12px] font-medium text-muted mb-[6px] uppercase tracking-wide">Scheduled Time</label>
            <input 
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-bg border border-border rounded-[8px] px-[12px] py-[10px] text-[14px] text-ink focus:border-route outline-none"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-[6px] uppercase tracking-wide">Expense ($)</label>
            <input 
              type="number" 
              value={cost} 
              onChange={(e) => setCost(e.target.value)}
              className="w-full bg-bg border border-border rounded-[8px] px-[12px] py-[10px] text-[14px] text-ink focus:border-route outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-[12px]">
          <button onClick={onClose} className="px-[16px] py-[8px] rounded-[8px] font-medium text-[13.5px] text-muted hover:text-ink">Cancel</button>
          <button onClick={handleSave} className="px-[16px] py-[8px] rounded-[8px] font-medium text-[13.5px] bg-route text-white hover:opacity-90 shadow-sm">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function DropZone({ onDrop }) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(e); }}
      className={`transition-all duration-200 w-full ${isOver ? 'h-[64px] border-2 border-dashed border-route bg-route/5 rounded-[12px] my-[8px]' : 'h-[16px] my-0'}`}
    ></div>
  );
}

export default function ItineraryView() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trip, tripStops, activities, loading, error, updateActivityDetails, reorderActivity } = useItinerary(tripId);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [sortBy, setSortBy] = useState('time_asc');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  
  const [showGroup, setShowGroup] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [editingActivity, setEditingActivity] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [draggedAct, setDraggedAct] = useState(null);

  const handleSaveActivity = async (id, updates) => {
    await updateActivityDetails(id, updates);
  };

  const toggleDayCollapse = (dayNumber) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

  const getDaysInStop = (stop) => {
    if (!trip) return [];
    const days = [];
    const start = new Date(stop.start_date); start.setHours(0,0,0,0);
    const end = new Date(stop.end_date); end.setHours(0,0,0,0);
    const tripStart = new Date(trip.start_date); tripStart.setHours(0,0,0,0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateObj = new Date(d);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayNumber = Math.max(1, Math.round((dateObj - tripStart) / (1000 * 60 * 60 * 24)) + 1);
      days.push({ dateStr, dayNumber });
    }
    return days;
  };

  // Process activities for non-day grouping (category/cost)
  const nonDayProcessedData = useMemo(() => {
    if (groupBy === 'day') return [];
    let filtered = [...activities];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.city_name.toLowerCase().includes(q));
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.category.toLowerCase() === filterType.toLowerCase());
    }

    filtered.sort((a, b) => {
      if (sortBy === 'time_asc') {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return a.order_index - b.order_index;
      }
      if (sortBy === 'cost_desc') return b.cost - a.cost;
      if (sortBy === 'cost_asc') return a.cost - b.cost;
      return 0;
    });

    const groups = {};
    filtered.forEach(act => {
      let key = 'Other';
      if (groupBy === 'category') key = act.category || 'Other';
      if (groupBy === 'cost') key = act.cost > 100 ? 'High Cost ($100+)' : (act.cost > 0 ? 'Low Cost' : 'Free');

      if (!groups[key]) groups[key] = { items: [], totalCost: 0 };
      groups[key].items.push(act);
      groups[key].totalCost += act.cost;
    });
    return Object.entries(groups);
  }, [activities, searchQuery, filterType, sortBy, groupBy]);

  const grandTotal = activities.reduce((sum, act) => sum + act.cost, 0);

  const handleDragStart = (e, act) => {
    setDraggedAct(act);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetAct, targetDateStr) => {
    e.preventDefault();
    if (!draggedAct) return;
    
    // Move to a new index or date
    const newOrderIndex = targetAct ? (targetAct.order_index > 0 ? targetAct.order_index - 1 : 0) : 0;
    await reorderActivity(draggedAct.id, newOrderIndex, targetDateStr);
    setDraggedAct(null);
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-muted">Loading itinerary...</div>;
  if (error) return <div className="min-h-screen bg-bg p-8 text-danger">{error}</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg relative" onClick={() => { setShowGroup(false); setShowSort(false); setShowFilter(false); }}>
      
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] fixed inset-y-0 left-0 border-r border-border bg-bg p-[24px] z-20">
        <div className="flex items-center gap-[10px] mb-[40px]">
           <div className="w-[34px] h-[34px] rounded-full relative shrink-0 overflow-hidden bg-route/10 flex items-center justify-center">
             <span className="font-['Fraunces'] font-bold text-route text-[18px]">G</span>
           </div>
           <div className="font-['Fraunces'] font-semibold text-[20px] tracking-[0.2px] text-ink">
             GlobalTrotter<span className="text-route">.</span>
           </div>
        </div>
        <nav className="flex flex-col gap-[8px] mb-[40px]">
          <Link to="/trips" className="font-['Inter'] font-medium text-muted hover:text-ink hover:bg-surface/50 rounded-[8px] px-[16px] py-[10px] transition-colors">My Trips</Link>
          <a href="#" className="font-['Inter'] font-medium text-ink bg-surface border border-border rounded-[8px] px-[16px] py-[10px] shadow-sm">Itinerary</a>
          <a href="#" className="font-['Inter'] font-medium text-muted hover:text-ink hover:bg-surface/50 rounded-[8px] px-[16px] py-[10px] transition-colors">Explore</a>
        </nav>
      </aside>

      <main className="flex-1 lg:ml-[220px] flex flex-col min-h-screen pb-[100px]">
        {/* Top App Bar */}
        <div className="p-[18px] lg:p-[24px] border-b border-border bg-bg/80 backdrop-blur-sm z-10 sticky top-0 flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Trip Planner</h2>
            <div className="flex gap-[12px]">
              <Link to={`/trips/${tripId}/budget`} className="text-[13px] font-medium px-[12px] py-[8px] border border-border rounded-[8px] hover:border-horizon transition-colors">Budget Breakdown</Link>
              <Link to={`/trips/public/${trip.public_slug || trip.id}`} className="text-[13px] font-medium px-[12px] py-[8px] bg-route text-white rounded-[8px] hover:opacity-90 transition-opacity">Share</Link>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[16px]">
            {/* Search */}
            <div className="flex-1 max-w-[480px] relative flex items-center bg-surface border border-border rounded-[12px] px-[12px] focus-within:border-horizon transition-all">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[15px] h-[15px] stroke-muted shrink-0"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input 
                type="text" 
                placeholder="Search activities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-ink font-['Inter'] text-[14px] py-[10px] px-[8px] w-full placeholder:text-muted" 
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-[12px] flex-wrap lg:flex-nowrap pb-1 lg:pb-0">
              
              {/* View Toggle */}
              <div className="flex bg-surface border border-border rounded-[12px] overflow-hidden p-[2px]">
                <button onClick={() => setViewMode('list')} className={`px-[12px] py-[6px] text-[12px] font-medium rounded-[8px] ${viewMode === 'list' ? 'bg-bg shadow-sm text-ink' : 'text-muted hover:text-ink'}`}>List</button>
                <button onClick={() => setViewMode('timeline')} className={`px-[12px] py-[6px] text-[12px] font-medium rounded-[8px] ${viewMode === 'timeline' ? 'bg-bg shadow-sm text-ink' : 'text-muted hover:text-ink'}`}>Timeline</button>
              </div>

              {/* Group By */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowGroup(!showGroup); setShowSort(false); setShowFilter(false); }} className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${showGroup ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}>
                  <span className="text-[13px] font-medium text-ink">Group: {groupBy}</span>
                </button>
                {showGroup && (
                  <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => setGroupBy('day')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">By Day</button>
                    <button onClick={() => setGroupBy('category')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">By Category</button>
                    <button onClick={() => setGroupBy('cost')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">By Cost</button>
                  </div>
                )}
              </div>

              {/* Filter */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); setShowGroup(false); setShowSort(false); }} className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${showFilter ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}>
                  <span className="text-[13px] font-medium text-ink">Filter</span>
                </button>
                {showFilter && (
                  <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => setFilterType('all')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">All</button>
                    <button onClick={() => setFilterType('food')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Food</button>
                    <button onClick={() => setFilterType('sightseeing')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Sightseeing</button>
                  </div>
                )}
              </div>

              {/* Sort By */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowSort(!showSort); setShowGroup(false); setShowFilter(false); }} className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${showSort ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}>
                  <span className="text-[13px] font-medium text-ink">Sort</span>
                </button>
                {showSort && (
                  <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => setSortBy('time_asc')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Time</button>
                    <button onClick={() => setSortBy('cost_desc')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Highest Cost</button>
                    <button onClick={() => setSortBy('cost_asc')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Lowest Cost</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="px-[24px] py-[32px] max-w-[800px] mx-auto w-full">
          <h1 className="font-['Fraunces'] text-[28px] font-bold text-ink text-center mb-[8px]">
            Itinerary for {trip?.name || 'Selected Place'}
          </h1>
          <p className="text-center text-muted text-[14px]">
            {activities.length} activities planned
          </p>
        </div>

        {/* Itinerary Body */}
        <div className="px-[16px] md:px-[24px] max-w-[800px] mx-auto w-full">
          {/* Column Headers (List mode) */}
          {viewMode === 'list' && (
            <div className="flex gap-[16px] mb-[24px] px-[16px]">
               <div className="flex-1 text-[11px] font-bold text-muted uppercase tracking-[1px] font-['IBM_Plex_Mono']">Physical Activity</div>
               <div className="w-[100px] md:w-[140px] text-right text-[11px] font-bold text-muted uppercase tracking-[1px] font-['IBM_Plex_Mono']">Expense</div>
            </div>
          )}

          {activities.length === 0 && groupBy === 'day' && tripStops.length === 0 && (
             <div className="text-center py-12 text-muted bg-surface rounded-[16px] border border-border border-dashed">
               Your itinerary is empty. Build out your trip stops first!
             </div>
          )}

          {/* Render Grouping by Day (City -> Day hierarchy) */}
          {groupBy === 'day' && tripStops.map((stop) => {
             const days = getDaysInStop(stop);
             return (
               <div key={stop.id} className="mb-[48px]">
                 {/* City Header */}
                 <div className="flex items-center gap-[16px] mb-[32px]">
                   <h3 className="font-['Fraunces'] text-[24px] font-semibold text-ink shrink-0">{stop.city?.name || 'Unknown City'}</h3>
                   <div className="flex-1 h-[1px] bg-border mt-1"></div>
                 </div>

                 {days.map((day) => {
                    const isCollapsed = collapsedDays.has(day.dayNumber);
                    // Filter and search activities for this specific day
                    let dayActivities = activities.filter(a => a.stop_id === stop.id && a.scheduled_date === day.dateStr);
                    if (searchQuery.trim()) {
                      dayActivities = dayActivities.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    }
                    if (filterType !== 'all') {
                      dayActivities = dayActivities.filter(a => a.category.toLowerCase() === filterType.toLowerCase());
                    }

                    const dayTotal = dayActivities.reduce((sum, a) => sum + a.cost, 0);

                    return (
                      <div key={day.dateStr} className="mb-[40px]">
                        {/* Collapsible Day Badge */}
                        <div className="mb-[20px] flex items-center gap-[12px] cursor-pointer group" onClick={() => toggleDayCollapse(day.dayNumber)}>
                          <div className="bg-surface-hi border border-border px-[14px] py-[6px] rounded-full flex items-center gap-[8px] group-hover:border-muted transition-colors">
                            <span className="font-['Fraunces'] font-semibold text-[15px] text-ink tracking-[0.2px]">Day {day.dayNumber}</span>
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-[14px] h-[14px] stroke-muted transition-transform ${isCollapsed ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                          </div>
                          <div className="text-[12px] text-muted font-['IBM_Plex_Mono']">
                            {new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                          </div>
                          <div className="flex-1 h-[1px] bg-border"></div>
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col min-h-[60px]">
                            {dayActivities.length === 0 ? (
                              <div 
                                onDragOver={handleDragOver}
                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, 0, day.dateStr); }}
                                className="text-center py-[24px] text-muted bg-surface/50 rounded-[12px] border border-border border-dashed cursor-pointer hover:border-route transition-colors"
                              >
                                {draggedAct ? 'Drop Activity Here' : `+ Add Activity to Day ${day.dayNumber}`}
                              </div>
                            ) : (
                              <>
                                {/* Initial Drop Zone */}
                                {draggedAct && (
                                  <DropZone onDrop={(e) => handleDrop(e, 0, day.dateStr)} />
                                )}

                                {dayActivities.map((act, actIdx) => (
                                  <React.Fragment key={act.id}>
                                    {/* Hide the dragged card so it looks like it was picked up */}
                                    <div 
                                      className={`flex gap-[12px] md:gap-[16px] items-stretch group/row relative ${draggedAct?.id === act.id ? 'opacity-30' : ''}`}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, act)}
                                      onDragEnd={() => setDraggedAct(null)}
                                    >
                                      
                                      {/* Activity Card */}
                                      <div 
                                        onClick={() => setEditingActivity(act)}
                                        className={`flex-1 bg-surface border rounded-[12px] p-[16px] cursor-pointer hover:border-route transition-colors shadow-sm flex flex-col md:flex-row md:items-center gap-[12px] ${viewMode === 'timeline' ? 'ml-[40px]' : ''} border-border`}
                                      >
                                        {viewMode === 'timeline' && (
                                          <div className="absolute left-[-20px] top-[24px] w-[8px] h-[8px] rounded-full bg-horizon border-2 border-bg"></div>
                                        )}
                                        <div className="w-[48px] h-[48px] rounded-[8px] bg-bg flex items-center justify-center border border-border shrink-0 cursor-grab active:cursor-grabbing">
                                          {act.category === 'food' ? '🍔' : act.category === 'sightseeing' ? '📸' : '📍'}
                                        </div>
                                        <div className="flex-1 pointer-events-none">
                                          <h4 className="font-semibold text-ink text-[16px] mb-[4px] leading-tight">{act.title}</h4>
                                          <div className="flex items-center gap-[8px] text-[12.5px] text-muted">
                                            {act.time && <span className="font-['IBM_Plex_Mono']">{act.time}</span>}
                                            {act.time && <span className="w-[4px] h-[4px] rounded-full bg-border"></span>}
                                            <span>{act.city_name}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Expense Card */}
                                      <div 
                                        onClick={() => setEditingActivity(act)}
                                        className="w-[100px] md:w-[140px] shrink-0 bg-surface border border-border rounded-[12px] p-[16px] cursor-pointer hover:border-horizon transition-colors shadow-sm flex flex-col items-end justify-center pointer-events-none"
                                      >
                                        <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">Cost</span>
                                        <span className="font-['IBM_Plex_Mono'] text-[16px] font-bold text-ink">
                                          ${act.cost.toFixed(2)}
                                        </span>
                                      </div>

                                    </div>

                                    {/* Drop Zone after this item */}
                                    {draggedAct ? (
                                      <DropZone onDrop={(e) => handleDrop(e, act.order_index + 1, day.dateStr)} />
                                    ) : (
                                      <>
                                        {/* Normal Spacing / Connector Arrow when NOT dragging */}
                                        {actIdx < dayActivities.length - 1 && viewMode === 'list' && (
                                          <div className="flex gap-[16px] py-[8px] px-[24px]">
                                            <div className="w-[1px] h-[24px] bg-border relative">
                                              <div className="absolute bottom-[-2px] left-[-3px] border-[4px] border-transparent border-t-border"></div>
                                            </div>
                                          </div>
                                        )}
                                        {actIdx < dayActivities.length - 1 && viewMode === 'timeline' && (
                                          <div className="absolute left-[39px] w-[2px] h-[24px] bg-border bottom-[-24px]"></div>
                                        )}
                                        {(actIdx < dayActivities.length - 1 && viewMode !== 'list') && <div className="h-[12px]"></div>}
                                      </>
                                    )}
                                  </React.Fragment>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Daily Summary */}
                        {!isCollapsed && dayActivities.length > 0 && (
                          <div className="mt-[20px] flex justify-end px-[16px]">
                            <div className="text-[13px] text-muted">
                              Total for Day {day.dayNumber}: 
                              <b className="font-['IBM_Plex_Mono'] text-ink ml-[8px] text-[15px]">${dayTotal.toFixed(2)}</b>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
               </div>
             );
          })}

          {/* Render Grouping by Category or Cost */}
          {groupBy !== 'day' && nonDayProcessedData.map(([groupName, groupData]) => (
            <div key={groupName} className="mb-[40px]">
              <div className="mb-[20px] flex items-center gap-[12px]">
                <div className="bg-surface-hi border border-border px-[14px] py-[6px] rounded-full">
                  <span className="font-['Fraunces'] font-semibold text-[15px] text-ink tracking-[0.2px] capitalize">{groupName}</span>
                </div>
                <div className="flex-1 h-[1px] bg-border"></div>
              </div>

              <div className="flex flex-col">
                {groupData.items.map((act, actIdx) => (
                  <React.Fragment key={act.id}>
                    <div className="flex gap-[12px] md:gap-[16px] items-stretch group/row relative">
                      <div className="flex-1 bg-surface border border-border rounded-[12px] p-[16px] flex flex-col md:flex-row md:items-center gap-[12px]">
                        <div className="w-[48px] h-[48px] rounded-[8px] bg-bg flex items-center justify-center border border-border shrink-0">
                          {act.category === 'food' ? '🍔' : act.category === 'sightseeing' ? '📸' : '📍'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-ink text-[16px] mb-[4px] leading-tight">{act.title}</h4>
                          <div className="flex items-center gap-[8px] text-[12.5px] text-muted">
                            <span className="font-['IBM_Plex_Mono']">Day {act.day}</span>
                            <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
                            <span>{act.city_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-[100px] md:w-[140px] shrink-0 bg-surface border border-border rounded-[12px] p-[16px] flex flex-col items-end justify-center">
                        <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">Cost</span>
                        <span className="font-['IBM_Plex_Mono'] text-[16px] font-bold text-ink">
                          ${act.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {actIdx < groupData.items.length - 1 && <div className="h-[12px]"></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Grand Total Sticky Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[220px] right-0 bg-surface/95 backdrop-blur-md border-t border-border p-[20px] px-[24px] flex justify-between items-center z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-[12px] font-medium text-muted uppercase tracking-[1px] mb-[2px]">Trip Grand Total</div>
          <div className="text-[13px] text-muted">Based on all selected activities</div>
        </div>
        <div className="font-['IBM_Plex_Mono'] text-[24px] font-bold text-route">
          ${grandTotal.toFixed(2)}
        </div>
      </div>

      {/* Modals */}
      {editingActivity && (
        <EditActivityModal 
          activity={editingActivity} 
          onClose={() => setEditingActivity(null)} 
          onSave={handleSaveActivity} 
        />
      )}
    </div>
  );
}
