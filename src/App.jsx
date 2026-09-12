import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Notifications from "./pages/Notifications";
import History from "./pages/History";
import Plan from "./pages/Plan";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Analysis from "./pages/Analysis";
import Systems from "./pages/Systems";
import DeviceManagement from "./pages/DeviceManager";
import ForgotPassword from "./pages/ForgotPassword";
import AntimateAI from "./pages/AntimateAI";
import BroodingGuide from "./pages/BroodingGuide";

import LinkProjects from "./pages/LinkProjects";
import LinkDeveloper from "./pages/LinkDeveloper";
import LinkNetwork from "./pages/LinkNetwork";
import LinkLayout from "./layouts/LinkLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <Plan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <Plan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <Analysis />
            </ProtectedRoute>
          }
        />

        <Route
          path="/systems"
          element={
            <ProtectedRoute>
              <Systems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/device-management"
          element={
            <ProtectedRoute>
              <DeviceManagement />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            ANTIMATE LINK
        ====================================================== */}
<Route
  path="/link"
  element={
    <ProtectedRoute>
      <LinkLayout />
    </ProtectedRoute>
  }
>
  <Route
    path="projects"
    element={<LinkProjects />}
  />

  <Route
    path="developer/:projectId"
    element={<LinkDeveloper />}
  />

  <Route
    path="network"
    element={<LinkNetwork />}
  />
</Route>

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/antimate-ai"
          element={<AntimateAI />}
        />

        <Route
          path="/brooding-guide"
          element={<BroodingGuide />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;