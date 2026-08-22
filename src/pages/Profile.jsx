import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTrips } from "../hooks/useTrips";
import ProfileHeader from "../components/profile/ProfileHeader";
import TripGrid from "../components/profile/TripGrid";
import { useMemo } from "react";

export default function Profile() {
  const { user } = useAuth();
  const { trips, loading, error, deleteTrip } = useTrips();
  const navigate = useNavigate();

  // Sort and filter trips
  const { upcoming, past, totalCountries } = useMemo(() => {
    if (!trips) return { upcoming: [], past: [], totalCountries: 0 };

    const upcomingList = [];
    const pastList = [];
    const countries = new Set();

    trips.forEach((trip) => {
      if (trip.computedStatus === "completed") {
        pastList.push(trip);
      } else {
        upcomingList.push(trip);
      }

      // Calculate unique countries for stats
      if (trip.trip_stops) {
        trip.trip_stops.forEach((stop) => {
          if (stop.city?.country) {
            countries.add(stop.city.country);
          }
        });
      }
    });

    // Sort upcoming: soonest first
    upcomingList.sort(
      (a, b) =>
        new Date(a.start_date || 9999999999999) -
        new Date(b.start_date || 9999999999999)
    );

    // Sort past: most recent first
    pastList.sort(
      (a, b) => new Date(b.end_date || 0) - new Date(a.end_date || 0)
    );

    return {
      upcoming: upcomingList,
      past: pastList,
      totalCountries: countries.size,
    };
  }, [trips]);

  const handleShare = (trip) => {
    // Stub for share functionality
    if (trip.is_public) {
      const url = `${window.location.origin}/trip/public/${
        trip.public_slug || trip.id
      }`;
      navigator.clipboard.writeText(url);
      alert("Public link copied to clipboard!");
    } else {
      alert("Trip is private. Change visibility in settings to share.");
    }
  };

  const hasNoTrips = upcoming.length === 0 && past.length === 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg relative">
      {/* Desktop Sidebar (lg: >= 1024px) */}
      <aside className="hidden lg:flex flex-col w-[220px] fixed inset-y-0 left-0 border-r border-border bg-bg p-[24px] z-20">
        <div
          className="flex items-center gap-[10px] mb-[40px] cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-[34px] h-[34px] rounded-full relative shrink-0 overflow-hidden bg-route/10 flex items-center justify-center">
            <span className="font-['Fraunces'] font-bold text-route text-[18px]">
              G
            </span>
          </div>
          <div className="font-['Fraunces'] font-semibold text-[20px] tracking-[0.2px] text-ink">
            GlobeTrotter<span className="text-route">.</span>
          </div>
        </div>

        <nav className="flex flex-col gap-[8px] mb-[40px]">
          <Link
            to="/trips"
            className="font-['Inter'] font-medium text-muted hover:text-ink hover:bg-surface/50 rounded-[8px] px-[16px] py-[10px] transition-colors"
          >
            My Trips
          </Link>
          <a
            href="#"
            className="font-['Inter'] font-medium text-muted hover:text-ink hover:bg-surface/50 rounded-[8px] px-[16px] py-[10px] transition-colors"
          >
            Explore
          </a>
          <a
            href="#"
            className="font-['Inter'] font-medium text-muted hover:text-ink hover:bg-surface/50 rounded-[8px] px-[16px] py-[10px] transition-colors"
          >
            Saved
          </a>
          <Link
            to="/profile"
            className="font-['Inter'] font-medium text-ink bg-surface border border-border rounded-[8px] px-[16px] py-[10px] shadow-sm"
          >
            Profile
          </Link>
        </nav>
      </aside>

      {/* Mobile Header (hidden on lg) */}
      <div className="lg:hidden p-[18px] border-b border-border bg-surface flex items-center justify-between z-20 sticky top-0">
        <div
          className="flex items-center gap-[10px]"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-[34px] h-[34px] rounded-full relative shrink-0 overflow-hidden bg-route/10 flex items-center justify-center">
            <span className="font-['Fraunces'] font-bold text-route text-[18px]">
              G
            </span>
          </div>
          <div className="font-['Fraunces'] font-semibold text-[21px] tracking-[0.2px] text-ink">
            GlobeTrotter<span className="text-route">.</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[220px] p-[24px] lg:p-[48px] max-w-[1400px]">
        {loading ? (
          <div className="flex justify-center items-center h-[300px] text-muted font-['IBM_Plex_Mono']">
            Loading your travels...
          </div>
        ) : error ? (
          <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-[12px]">
            {error}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Header */}
            <ProfileHeader
              user={user}
              totalTrips={trips.length}
              countriesVisited={totalCountries}
            />

            {/* Empty State */}
            {hasNoTrips && (
              <div className="mt-[60px] flex flex-col items-center justify-center text-center p-[40px] border-2 border-dashed border-border rounded-[24px] bg-surface/50 max-w-[600px] mx-auto">
                <div className="w-[80px] h-[80px] mb-[24px] bg-bg rounded-full flex items-center justify-center shadow-sm border border-border text-[32px]">
                  🌍
                </div>
                <h2 className="font-['Fraunces'] text-[28px] font-semibold text-ink mb-[12px]">
                  Your travel journal is empty
                </h2>
                <p className="text-[15px] text-muted mb-[32px] max-w-[400px]">
                  It's time to stop dreaming and start planning. Create your
                  first itinerary to begin tracking your adventures.
                </p>
                <Link
                  to="/trips/new"
                  className="px-[24px] py-[12px] rounded-[12px] bg-route text-white font-medium hover:opacity-90 shadow-sm transition-opacity text-[15px]"
                >
                  Plan your first trip
                </Link>
              </div>
            )}

            {/* Grids */}
            {!hasNoTrips && (
              <div className="flex flex-col gap-[20px]">
                {/* Smart Section Reordering: If no upcoming, show past first */}
                {upcoming.length === 0 ? (
                  <>
                    <TripGrid
                      title="Previous Trips"
                      trips={past}
                      variant="past"
                      onDelete={deleteTrip}
                      onShare={handleShare}
                      showNewCard={false}
                    />
                    <TripGrid
                      title="Plan a New Adventure"
                      trips={upcoming}
                      variant="upcoming"
                      showNewCard={true}
                    />
                  </>
                ) : (
                  <>
                    <TripGrid
                      title="Preplanned Trips"
                      trips={upcoming}
                      variant="upcoming"
                      onDelete={deleteTrip}
                      onShare={handleShare}
                      showNewCard={true}
                    />
                    {past.length > 0 && (
                      <TripGrid
                        title="Previous Trips"
                        trips={past}
                        variant="past"
                        onDelete={deleteTrip}
                        onShare={handleShare}
                        showNewCard={false}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-[26px] right-[24px] z-30">
        <Link
          to="/trips/new"
          aria-label="Add trip"
          className="w-[56px] h-[56px] rounded-full bg-route text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            className="w-[24px] h-[24px] stroke-white stroke-[2]"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
