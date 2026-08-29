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


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* redirect root */}
        <Route
          path="/"
          element={<Navigate to="/home" replace />}
        />

        {/* auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* notifications*/}
         <Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>
{/* history*/}
<Route
  path="/history"
  element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  }
  />
  {/* PLAN */}
<Route
  path="/plan"
  element={
    <ProtectedRoute>
      <Plan />
    </ProtectedRoute>
  }
/>

{/* PLANS - alias */}
<Route
  path="/plans"
  element={
    <ProtectedRoute>
      <Plan />
    </ProtectedRoute>
  }
/>
{/* payment*/}
<Route
  path="/payment"
  element={
    <ProtectedRoute>
      <Payment />
    </ProtectedRoute>
  }
/>
{/* profile*/}
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
{/* settings*/}
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>
{/* help*/}
<Route
  path="/help"
  element={
    <ProtectedRoute>
      <Help />
    </ProtectedRoute>
  }
/>
{/* analysis*/}
<Route
  path="/analysis"
  element={
    <ProtectedRoute>
      <Analysis />
    </ProtectedRoute>
  }
/>
{/* systems*/}
<Route
  path="/systems"
  element={
    <ProtectedRoute>
      <Systems />
    </ProtectedRoute>
  }
/>

{/* device management */}
<Route
  path="/device-management"
  element={
    <ProtectedRoute>
      <DeviceManagement />
    </ProtectedRoute>
  }
/>
{/* forgot password */}
<Route
 path="/forgot-password" 
 element={
 <ForgotPassword />
 } />

{/* Antimate AI*/}
<Route
  path="/antimate-ai"
  element={
    <ProtectedRoute>
      <AntimateAI />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;