import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCategoryStyles } from '../utils/categoryColors';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cities: [], activities: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ cities: [], activities: [] });
        return;
      }
      setLoading(true);
      
      const [citiesRes, activitiesRes] = await Promise.all([
        supabase.from('cities').select('*').ilike('name', `%${query}%`).limit(5),
        supabase.from('activities').select('*, city:cities(name)').ilike('name', `%${query}%`).limit(10)
      ]);

      setResults({
        cities: citiesRes.data || [],
        activities: activitiesRes.data || []
      });
      setLoading(false);
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="min-h-screen bg-bg flex flex-col font-['Inter']">
      
      {/* Navbar Stub */}
      <nav className="border-b border-border bg-surface px-[24px] py-[16px] flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-[12px]">
          <div className="w-[32px] h-[32px] bg-route rounded-full flex items-center justify-center font-['Fraunces'] font-bold text-white">
            G
          </div>
          <span className="font-['Fraunces'] font-semibold text-[18px] text-ink">GlobeTrotter.</span>
        </div>
        <div className="flex gap-[16px]">
          <Link to="/trips" className="text-[14px] font-medium text-muted hover:text-ink">My Trips</Link>
          <Link to="/community" className="text-[14px] font-medium text-muted hover:text-ink">Community</Link>
          <Link to="/profile" className="text-[14px] font-medium text-muted hover:text-ink">Profile</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[360px] w-full bg-surface-hi flex items-center justify-center overflow-hidden">
        {/* Abstract warm gradient placeholder for the 'backdrop' */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5ECD5] to-[#E8D9C0] opacity-60"></div>
        
        <div className="relative z-10 w-full max-w-[600px] px-[20px]">
          <h1 className="font-['Fraunces'] text-[32px] md:text-[40px] font-bold text-ink text-center mb-[24px] leading-tight drop-shadow-sm">
            Where to next?
          </h1>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-[16px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"></div>
            <div className="relative flex items-center px-[20px] py-[16px]">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px] stroke-muted mr-[12px]"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search destinations or activities..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[16px] text-ink placeholder:text-muted/70 font-medium"
              />
              {loading && <div className="w-[16px] h-[16px] border-2 border-route border-t-transparent rounded-full animate-spin"></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <main className="flex-1 w-full max-w-[800px] mx-auto px-[24px] py-[48px]">
        {!query.trim() ? (
           <div className="text-center text-muted font-['IBM_Plex_Mono'] text-[14px]">
             Begin typing to discover places and activities...
           </div>
        ) : (
          <div className="flex flex-col gap-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Cities */}
            {results.cities.length > 0 && (
              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted mb-[16px] flex items-center gap-[8px]">
                  Destinations <span className="bg-surface border border-border px-[6px] py-[2px] rounded-full text-[10px]">{results.cities.length}</span>
                </h3>
                <div className="flex flex-col gap-[12px]">
                  {results.cities.map(city => (
                    <div key={city.id} className="flex items-center gap-[16px] bg-surface border border-border rounded-[12px] p-[16px] hover:border-horizon transition-colors shadow-sm relative overflow-hidden group cursor-pointer">
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-horizon opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-[48px] h-[48px] bg-bg rounded-[8px] flex items-center justify-center border border-border overflow-hidden shrink-0">
                        {city.image_url ? <img src={city.image_url} alt="" className="w-full h-full object-cover" /> : '📍'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-ink text-[16px]">{city.name}</div>
                        <div className="text-muted text-[13px]">{city.country}</div>
                      </div>
                      <div className="font-['IBM_Plex_Mono'] text-muted text-[12px]">
                        Cost Index: {city.cost_index}/5
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {results.activities.length > 0 && (
              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted mb-[16px] flex items-center gap-[8px]">
                  Activities <span className="bg-surface border border-border px-[6px] py-[2px] rounded-full text-[10px]">{results.activities.length}</span>
                </h3>
                <div className="flex flex-col gap-[12px]">
                  {results.activities.map(act => {
                    const catStyle = getCategoryStyles(act.category);
                    return (
                      <div key={act.id} className="flex items-center gap-[16px] bg-surface border border-border rounded-[12px] p-[16px] hover:border-route transition-colors shadow-sm relative overflow-hidden group cursor-pointer">
                        {/* Boarding pass accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] opacity-0 group-hover:opacity-100 transition-opacity ${catStyle.text.replace('text-', 'bg-')}`}></div>
                        
                        <div className="w-[48px] h-[48px] bg-bg rounded-[8px] flex items-center justify-center border border-border overflow-hidden shrink-0">
                          {act.image_url ? <img src={act.image_url} alt="" className="w-full h-full object-cover" /> : '📸'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-[8px] mb-[4px]">
                            <span className="font-semibold text-ink text-[16px] leading-none">{act.name}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[4px] ${catStyle.bg} ${catStyle.text}`}>
                              {act.category}
                            </span>
                          </div>
                          <div className="text-muted text-[13px]">
                            {act.city?.name}
                          </div>
                        </div>
                        <div className="font-['IBM_Plex_Mono'] font-bold text-ink text-[15px]">
                          ${act.estimated_cost}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {query.trim() && results.cities.length === 0 && results.activities.length === 0 && !loading && (
              <div className="text-center py-[40px] text-muted bg-surface rounded-[16px] border border-border border-dashed">
                No destinations or activities found for "{query}".
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
