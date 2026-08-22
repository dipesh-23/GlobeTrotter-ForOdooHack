import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AppShell } from "./components/AppShell";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import ItineraryView from "./pages/ItineraryView";
import BudgetView from "./pages/BudgetView";
import PublicTrip from "./pages/PublicTrip";

/** Redirects unauthenticated users to /login */
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--color-bg)",
          color: "var(--color-muted)",
          fontFamily: "var(--font-body)",
        }}
      >
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public / unauthenticated routes (no AppShell) ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/trip/public/:slug" element={<PublicTrip />} />

        {/* ── Protected routes — all wrapped in AppShell ── */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <AppShell>
                <Dashboard />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/trips"
          element={
            <Protected>
              <AppShell>
                <MyTrips />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/trips/new"
          element={
            <Protected>
              <AppShell>
                <CreateTrip />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/build"
          element={
            <Protected>
              <AppShell>
                <ItineraryBuilder />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/view"
          element={
            <Protected>
              <AppShell>
                <ItineraryView />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/budget"
          element={
            <Protected>
              <AppShell>
                <BudgetView />
              </AppShell>
            </Protected>
          }
        />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
