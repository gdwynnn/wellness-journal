import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppShell from "./pages/AppShell";
import ChatPage from "./pages/ChatPage";
import StatsPage from "./pages/StatsPage";
import JournalPage from "./pages/JournalPage";
import AccountPage from "./pages/AccountPage";
import MapPage from "./pages/MapPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="/app/stats" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="map" element={<MapPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
