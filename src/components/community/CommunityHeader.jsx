import React, { useState } from 'react';

export default function CommunityHeader({ searchQuery, setSearchQuery, sortOption, setSortOption, filterBudget, setFilterBudget, filterSeason, setFilterSeason, hasUpcomingTrips }) {
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSeason, setShowSeason] = useState(false);

  return (
    <div className="flex flex-col gap-[16px] mb-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
        <div>
          <h1 className="font-['Fraunces'] text-[32px] font-semibold text-ink leading-tight">Community</h1>
          <p className="text-[15px] text-muted">Discover itineraries built by fellow travelers.</p>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-[12px]">
        {/* Search Input */}
        <div className="flex-1 relative flex items-center bg-surface border border-border rounded-[12px] px-[12px] focus-within:border-horizon transition-colors shadow-sm h-[48px]">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] stroke-muted shrink-0"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input 
            type="text" 
            placeholder="Search by destination or trip name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-ink font-['Inter'] text-[15px] py-[12px] px-[10px] w-full placeholder:text-muted" 
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-[4px] text-muted hover:text-ink">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-[8px] flex-wrap">
          {/* Season Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowSeason(!showSeason); setShowFilter(false); setShowSort(false); }}
              aria-expanded={showSeason}
              aria-haspopup="true"
              aria-label="Filter by season"
              className={`flex items-center gap-[8px] h-[48px] px-[16px] rounded-[12px] bg-surface border transition-colors ${showSeason || filterSeason !== 'all' ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[16px] h-[16px] ${filterSeason !== 'all' ? 'stroke-route' : 'stroke-muted'}`}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <span className={`text-[14px] font-medium ${filterSeason !== 'all' ? 'text-route' : 'text-ink'}`}>
                {filterSeason === 'all' ? 'Season' : filterSeason}
              </span>
            </button>
            
            {showSeason && (
              <div role="menu" className="absolute right-0 mt-[8px] w-[180px] bg-surface border border-border rounded-[12px] shadow-xl py-[8px] z-30">
                <div className="px-[16px] py-[8px] text-[12px] font-semibold text-muted uppercase tracking-wider font-['IBM_Plex_Mono']">Season</div>
                <button role="menuitem" onClick={() => { setFilterSeason('all'); setShowSeason(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterSeason === 'all' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>All Seasons</button>
                <button role="menuitem" onClick={() => { setFilterSeason('Spring'); setShowSeason(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterSeason === 'Spring' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>Spring</button>
                <button role="menuitem" onClick={() => { setFilterSeason('Summer'); setShowSeason(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterSeason === 'Summer' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>Summer</button>
                <button role="menuitem" onClick={() => { setFilterSeason('Autumn'); setShowSeason(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterSeason === 'Autumn' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>Autumn</button>
                <button role="menuitem" onClick={() => { setFilterSeason('Winter'); setShowSeason(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterSeason === 'Winter' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>Winter</button>
              </div>
            )}
          </div>

          {/* Budget Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowFilter(!showFilter); setShowSeason(false); setShowSort(false); }}
              aria-expanded={showFilter}
              aria-haspopup="true"
              aria-label="Filter by budget tier"
              className={`flex items-center gap-[8px] h-[48px] px-[16px] rounded-[12px] bg-surface border transition-colors ${showFilter || filterBudget !== 'all' ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[16px] h-[16px] ${filterBudget !== 'all' ? 'stroke-route' : 'stroke-muted'}`}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <span className={`text-[14px] font-medium ${filterBudget !== 'all' ? 'text-route' : 'text-ink'}`}>
                {filterBudget === 'all' ? 'Budget' : filterBudget === 'low' ? '$ (<$500)' : filterBudget === 'med' ? '$$ ($500-$1500)' : '$$$ (>$1500)'}
              </span>
            </button>
            
            {showFilter && (
              <div role="menu" className="absolute right-0 mt-[8px] w-[200px] bg-surface border border-border rounded-[12px] shadow-xl py-[8px] z-30">
                <div className="px-[16px] py-[8px] text-[12px] font-semibold text-muted uppercase tracking-wider font-['IBM_Plex_Mono']">Budget Tier</div>
                <button role="menuitem" onClick={() => { setFilterBudget('all'); setShowFilter(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterBudget === 'all' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>All Budgets</button>
                <button role="menuitem" onClick={() => { setFilterBudget('low'); setShowFilter(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterBudget === 'low' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>$ (Under $500)</button>
                <button role="menuitem" onClick={() => { setFilterBudget('med'); setShowFilter(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterBudget === 'med' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>$$ ($500 - $1500)</button>
                <button role="menuitem" onClick={() => { setFilterBudget('high'); setShowFilter(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${filterBudget === 'high' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>$$$ (Over $1500)</button>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowSort(!showSort); setShowFilter(false); setShowSeason(false); }}
              aria-expanded={showSort}
              aria-haspopup="true"
              aria-label="Sort trips"
              className={`flex items-center gap-[8px] h-[48px] px-[16px] rounded-[12px] bg-surface border transition-colors ${showSort ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] stroke-muted"><path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l3-3M17 20l-3-3"/></svg>
              <span className="text-[14px] font-medium text-ink">
                {sortOption === 'recent' ? 'Most Recent' : 'Most Relevant'}
              </span>
            </button>
            
            {showSort && (
              <div role="menu" className="absolute right-0 mt-[8px] w-[180px] bg-surface border border-border rounded-[12px] shadow-xl py-[8px] z-30">
                <button role="menuitem" onClick={() => { setSortOption('recent'); setShowSort(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${sortOption === 'recent' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>Most Recent</button>
                {hasUpcomingTrips && (
                  <button role="menuitem" onClick={() => { setSortOption('relevant'); setShowSort(false); }} className={`w-full text-left px-[16px] py-[10px] text-[14px] ${sortOption === 'relevant' ? 'bg-route/10 text-route font-medium' : 'text-ink hover:bg-bg'}`}>Most Relevant</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
