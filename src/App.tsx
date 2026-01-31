import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DashboardHistory from "./pages/DashboardHistory";
import DashboardProfile from "./pages/DashboardProfile";
import DashboardSettings from "./pages/DashboardSettings";
import InterviewRoom from "./pages/InterviewRoom";
import Feedback from "./pages/Feedback";
import AdminOverview from "./pages/AdminOverview";
import AdminCandidates from "./pages/AdminCandidates";
import AdminInterviews from "./pages/AdminInterviews";
import UploadResume from "./pages/UploadResume";
import AddDetails from "./pages/AddDetails";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/sign-up/*" element={<SignUp />} />


          {/* Candidate Routes */}
          <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<DashboardHistory />} />
            <Route path="/profile" element={<DashboardProfile />} />
            <Route path="/settings" element={<DashboardSettings />} />
            <Route path="/interview" element={<InterviewRoom />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/upload-resume" element={<UploadResume />} />
            <Route path="/add-details" element={<AddDetails />} />
            <Route path="/account" element={<Account />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/candidates" element={<AdminCandidates />} />
            <Route path="/admin/interviews" element={<AdminInterviews />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
