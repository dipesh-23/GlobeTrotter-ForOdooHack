import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCommunityTrips } from '../hooks/useCommunityTrips';
import CommunityHeader from '../components/community/CommunityHeader';
import RelevantRail from '../components/community/RelevantRail';
import PublicTripCard from '../components/community/PublicTripCard';

export default function Community() {
  const { publicTrips, loading, loadingMore, hasMore, loadMore, error, userUpcomingDestinations } = useCommunityTrips();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recent'); // 'recent', 'relevant'
  const [filterBudget, setFilterBudget] = useState('all'); // 'all', 'low', 'med', 'high'
  const [filterSeason, setFilterSeason] = useState('all'); // 'all', 'Spring', 'Summer', 'Autumn', 'Winter'

  // Process Trips based on Search, Filter, Sort
  const processedTrips = useMemo(() => {
    if (!publicTrips) return { exact: [], relaxed: [] };
    
    let filtered = [...publicTrips];

    // 1. Search Filter (Exact)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(trip => 
        trip.title?.toLowerCase().includes(q) || 
        trip.destinations.some(d => d.toLowerCase().includes(q))
      );
    }

    // 2. Budget Filter (Exact)
    if (filterBudget !== 'all') {
      filtered = filtered.filter(trip => {
        if (filterBudget === 'low') return trip.totalCost < 500;
        if (filterBudget === 'med') return trip.totalCost >= 500 && trip.totalCost <= 1500;
        if (filterBudget === 'high') return trip.totalCost > 1500;
        return true;
      });
    }

    // 3. Season Filter (Exact)
    if (filterSeason !== 'all') {
      filtered = filtered.filter(trip => trip.season === filterSeason);
    }

    // Sort function
    const applySort = (arr) => {
      arr.sort((a, b) => {
        if (sortOption === 'relevant') {
          if (a.isRelevant && !b.isRelevant) return -1;
          if (!a.isRelevant && b.isRelevant) return 1;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return arr;
    };

    const exactMatches = applySort([...filtered]);
    
    // If exact matches are empty but we have filters applied, provide some relaxed fallback
    let relaxedMatches = [];
    if (exactMatches.length === 0 && (searchQuery || filterBudget !== 'all' || filterSeason !== 'all') && publicTrips.length > 0) {
      // Just sort all public trips to suggest them instead
      relaxedMatches = applySort([...publicTrips]).slice(0, 4);
    }

    return { exact: exactMatches, relaxed: relaxedMatches };
  }, [publicTrips, searchQuery, filterBudget, filterSeason, sortOption]);

  const relevantTrips = useMemo(() => {
    return (publicTrips || []).filter(t => t.isRelevant).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [publicTrips]);

  const isColdStart = publicTrips.length === 0 && !loading;
  const isSearchEmpty = processedTrips.exact.length === 0 && publicTrips.length > 0 && !loading;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg relative">
      
      {/* Main Content Area */}
      <main className="flex-1 p-[24px] lg:p-[48px] max-w-[1400px]">
        {error && (
          <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-[12px] mb-6">{error}</div>
        )}

        <CommunityHeader 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          filterBudget={filterBudget}
          setFilterBudget={setFilterBudget}
          filterSeason={filterSeason}
          setFilterSeason={setFilterSeason}
          hasUpcomingTrips={userUpcomingDestinations.size > 0}
        />

        {loading && publicTrips.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted font-['IBM_Plex_Mono']">Loading community trips...</div>
        ) : isColdStart ? (
          <div className="mt-[60px] flex flex-col items-center justify-center text-center p-[40px] border-2 border-dashed border-border rounded-[24px] bg-surface/50 max-w-[600px] mx-auto animate-in fade-in duration-500">
            <div className="w-[80px] h-[80px] mb-[24px] bg-bg rounded-full flex items-center justify-center shadow-sm border border-border text-[32px]">
              🌎
            </div>
            <h2 className="font-['Fraunces'] text-[28px] font-semibold text-ink mb-[12px]">Welcome to the Community</h2>
            <p className="text-[15px] text-muted mb-[32px] max-w-[400px]">
              No public trips have been shared yet. Be the first to inspire others by sharing your itinerary!
            </p>
            <Link to="/trips" className="px-[24px] py-[12px] rounded-[12px] bg-route text-white font-medium hover:opacity-90 shadow-sm transition-opacity text-[15px]">
              Share a Trip
            </Link>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 delay-200 fill-mode-both">
            {/* Relevant Rail */}
            {!searchQuery && filterBudget === 'all' && filterSeason === 'all' && userUpcomingDestinations.size > 0 && (
              <RelevantRail 
                relevantTrips={relevantTrips} 
                userUpcomingDestinations={userUpcomingDestinations} 
              />
            )}

            {/* Main Feed */}
            <div className="flex items-center justify-between mb-[20px]">
              <h2 className="font-['Fraunces'] text-[24px] font-semibold text-ink">
                {searchQuery ? 'Search Results' : 'All Public Trips'}
              </h2>
              <span className="font-['IBM_Plex_Mono'] text-[12px] text-muted bg-surface border border-border px-[8px] py-[2px] rounded-full">
                {processedTrips.exact.length} found
              </span>
            </div>

            {isSearchEmpty ? (
              <div className="flex flex-col gap-[32px] mb-[40px]">
                <div className="flex flex-col items-center justify-center text-center p-[40px] border border-border rounded-[24px] bg-surface/50">
                  <div className="text-[32px] mb-[16px] opacity-50">🔍</div>
                  <h3 className="font-['Fraunces'] text-[20px] font-semibold text-ink mb-[8px]">No exact matches</h3>
                  <p className="text-[14px] text-muted mb-[24px] max-w-[300px]">
                    We couldn't find trips matching all your filters.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterBudget('all'); setFilterSeason('all'); }}
                    className="px-[16px] py-[8px] rounded-[8px] bg-bg border border-border text-ink text-[13px] font-medium hover:border-route transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                {/* Relaxed Fallback */}
                {processedTrips.relaxed.length > 0 && (
                  <div>
                    <h3 className="font-['Fraunces'] text-[20px] font-semibold text-ink mb-[16px]">You might like these instead</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[24px]">
                      {processedTrips.relaxed.map(trip => (
                        <PublicTripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[24px]">
                {processedTrips.exact.map(trip => (
                  <PublicTripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
            
            {/* Pagination Load More */}
            {!isSearchEmpty && hasMore && (
              <div className="mt-[40px] flex justify-center">
                <button 
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-[24px] py-[12px] bg-surface border border-border rounded-[12px] text-[14px] font-medium text-ink hover:border-route transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Trips'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
