import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrainingProvider } from "@/context/TrainingContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Index from "./pages/Index";
import CalendarPage from "./pages/CalendarPage";
import ToolsPage from "./pages/ToolsPage";
import SupportPage from "./pages/SupportPage";
import AdminPage from "./pages/AdminPage";
import TrainingDetailPage from "./pages/TrainingDetailPage";
import SignInPage from "./pages/SignInPage";
import NotFound from "./pages/NotFound";
import { TrainingFormPage } from "@/components/admin/TrainingFormPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TrainingProvider>
        <LoadingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/training/new"
                element={
                  <AdminRoute>
                    <TrainingFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/training/:id/edit"
                element={
                  <AdminRoute>
                    <TrainingFormPage />
                  </AdminRoute>
                }
              />
              <Route path="/training/:id" element={<TrainingDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LoadingProvider>
    </TrainingProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
