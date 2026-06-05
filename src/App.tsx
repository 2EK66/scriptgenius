
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ScriptsLibrary from "./pages/ScriptsLibrary";
import Gallery from "./pages/Gallery";
import ComicGenerator from "./pages/ComicGenerator";
import SeriesCreate from "./pages/SeriesCreate";
import SeriesManage from "./pages/SeriesManage";
import Rewards from "./pages/Rewards";
import PaymentSuccess from "./pages/PaymentSuccess";
import AuthorDashboard from "./pages/AuthorDashboard";
import PremiumStore from "./pages/PremiumStore";
import SecurityDemo from "./pages/SecurityDemo";
import Workplace from "./pages/Workplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scripts" element={<ScriptsLibrary />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/comic-generator" element={<ComicGenerator />} />
            <Route path="/series/create" element={<SeriesCreate />} />
            <Route path="/series/:seriesId/manage" element={<SeriesManage />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/author-dashboard" element={<AuthorDashboard />} />
            <Route path="/premium-store" element={<PremiumStore />} />
            <Route path="/workplace" element={<Workplace />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/security-demo" element={<SecurityDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
