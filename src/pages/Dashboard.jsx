import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { Plus, MapPin, Calendar } from "lucide-react";

// Unsplash fallback – no API key needed
const getCityPhoto = (name, country = "") =>
  `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`;

const Dashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [recommendedCities, setRecommendedCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch recent trips
        const { data: tripsData, error: tripsError } = await supabase
          .from("trips")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (tripsError) throw tripsError;
        setTrips(tripsData || []);

        // Fetch recommended cities with activities
        const { data: citiesData, error: citiesError } = await supabase
          .from("cities")
          .select("*, activities(*)")
          .order("popularity_score", { ascending: false })
          .limit(6);

        if (citiesError) throw citiesError;
        setRecommendedCities(citiesData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="max-w-[1120px] mx-auto px-4 lg:px-6 py-8 md:py-10">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-display text-ink font-display mb-2">Dashboard</h1>
          <p className="text-muted text-body">
            Welcome back, {user?.email?.split('@')[0] || 'Traveler'}. Ready for your next adventure?
          </p>
        </div>
        <Link
          to="/trips/new"
          className="inline-flex items-center gap-2 bg-route text-surface px-5 py-3 rounded-sm font-body font-medium hover:bg-[#a35225] transition-colors"
        >
          <Plus size={20} />
          <span>Plan New Trip</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading dashboard...</div>
      ) : (
        <div className="space-y-16">
          {/* Recent Trips Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2 font-display text-ink">Your Recent Trips</h2>
              {trips.length > 0 && (
                <Link to="/my-trips" className="text-horizon text-body hover:underline">
                  View all
                </Link>
              )}
            </div>
            
            {trips.length === 0 ? (
              <div className="bg-surface rounded-md shadow-card p-10 text-center border border-border">
                <MapPin className="mx-auto text-muted mb-4 opacity-50" size={40} />
                <h3 className="text-h2 font-display text-ink mb-2">No trips planned yet</h3>
                <p className="text-muted text-body mb-6">
                  It's time to start planning your next great adventure.
                </p>
                <Link
                  to="/trips/new"
                  className="inline-flex items-center gap-2 border border-border text-ink px-5 py-2 rounded-sm font-body font-medium hover:bg-gray-50 transition-colors"
                >
                  Create a trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <Link
                    key={trip.id}
                    to={`/trips/${trip.id}`}
                    className="group bg-surface rounded-md shadow-card border border-border overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(31,42,36,0.12)] flex flex-col"
                  >
                    <div className="h-40 bg-horizon flex items-center justify-center relative overflow-hidden">
                      <img
                        src={trip.cover_photo_url || getCityPhoto(trip.name)}
                        alt={trip.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = getCityPhoto(trip.name); }}
                      />
                      {trip.is_public && (
                        <span className="absolute top-3 right-3 bg-surface text-ink px-3 py-1 rounded-full text-label uppercase tracking-widest shadow-sm">
                          Public
                        </span>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-h2 font-display text-ink mb-2 line-clamp-1">{trip.name}</h3>
                      <div className="flex items-center gap-2 text-muted text-small mt-auto font-mono">
                        <Calendar size={14} />
                        <span>
                          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recommended Destinations Section */}
          <section>
            <h2 className="text-h2 font-display text-ink mb-6">Recommended Destinations</h2>
            
            {recommendedCities.length === 0 ? (
              <p className="text-muted">No recommendations available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCities.map((city) => (
                  <div
                    key={city.id}
                    className="group bg-surface rounded-md shadow-card border border-border overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(31,42,36,0.12)]"
                  >
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <img
                        src={city.image_url || getCityPhoto(city.name, city.country)}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.target.src = getCityPhoto(city.name, city.country); }}
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-[1.125rem] font-bold text-ink mb-1">{city.name}</h3>
                          <p className="text-muted text-small flex items-center gap-1">
                            {city.country}
                          </p>
                        </div>
                        {city.popularity_score && (
                          <div className="flex items-center gap-1">
                            <span className="text-[#C4622D] text-[14px]">★</span>
                            <span className="text-xs font-semibold text-ink">{(city.popularity_score / 20).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      {city.activities && city.activities.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Top Activities</p>
                          <ul className="space-y-1">
                            {city.activities.slice(0, 3).map((act) => (
                              <li key={act.id} className="text-sm text-ink truncate flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-horizon flex-shrink-0"></span>
                                {act.name}
                              </li>
                            ))}
                            {city.activities.length > 3 && (
                              <li className="text-xs text-route mt-1 font-medium">
                                +{city.activities.length - 3} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
