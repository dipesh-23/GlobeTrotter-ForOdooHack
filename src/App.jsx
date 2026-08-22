import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import ItineraryView from "./pages/ItineraryView";
import BudgetView from "./pages/BudgetView";
import PublicTrip from "./pages/PublicTrip";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import TripCalendar from "./pages/TripCalendar";
import AppShell from "./components/AppShell";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const appShell = (element) => <AppShell>{element}</AppShell>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route path="/trip/public/:slug" element={appShell(<PublicTrip />)} />

        <Route
          path="/dashboard"
          element={
            <Protected>
              {appShell(<Dashboard />)}
            </Protected>
          }
        />
        <Route path="/trips" element={appShell(<MyTrips />)} />
        <Route path="/community" element={appShell(<Community />)} />
        <Route
          path="/profile"
          element={
            <Protected>
              {appShell(<Profile />)}
            </Protected>
          }
        />
        <Route
          path="/trips/new"
          element={
            <Protected>
              {appShell(<CreateTrip />)}
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/build"
          element={
            <Protected>
              {appShell(<ItineraryBuilder />)}
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/view"
          element={
            <Protected>
              {appShell(<ItineraryView />)}
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/budget"
          element={
            <Protected>
              {appShell(<BudgetView />)}
            </Protected>
          }
        />
        <Route
          path="/trips/:tripId/calendar"
          element={
            <Protected>
              {appShell(<TripCalendar />)}
            </Protected>
          }
        />
        <Route
          path="/calendar"
          element={
            <Protected>
              {appShell(<TripCalendar />)}
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
