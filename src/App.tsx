import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import TimelineReminders from "./pages/TimelineReminders.tsx";
import LocationMap from "./pages/LocationMap.tsx";
import HealthVitals from "./pages/HealthVitals.tsx";
import ContactsSupport from "./pages/ContactsSupport.tsx";
import CareLogs from "./pages/CareLogs.tsx";
import Inventory from "./pages/Inventory.tsx";
import Memories from "./pages/Memories.tsx";
import DoctorVault from "./pages/DoctorVault.tsx";
import DashboardSettings from "./pages/DashboardSettings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={(
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            )}
          />
          <Route path="/dashboard/timeline" element={<RequireAuth><TimelineReminders /></RequireAuth>} />
          <Route path="/dashboard/location" element={<RequireAuth><LocationMap /></RequireAuth>} />
          <Route path="/dashboard/vitals" element={<RequireAuth><HealthVitals /></RequireAuth>} />
          <Route path="/dashboard/contacts" element={<RequireAuth><ContactsSupport /></RequireAuth>} />
          <Route path="/dashboard/logs" element={<RequireAuth><CareLogs /></RequireAuth>} />
          <Route path="/dashboard/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
          <Route path="/dashboard/memories" element={<RequireAuth><Memories /></RequireAuth>} />
          <Route path="/dashboard/doctor-vault" element={<RequireAuth><DoctorVault /></RequireAuth>} />
          <Route path="/dashboard/settings" element={<RequireAuth><DashboardSettings /></RequireAuth>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
