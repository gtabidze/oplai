import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Auth } from "@/components/Auth";
import { useAuth } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Playbooks from "./pages/Playbooks";
import Playgrounds from "./pages/Playgrounds";
import Datasets from "./pages/Datasets";
import APIs from "./pages/APIs";
import Configuration from "./pages/Configuration";
import Account from "./pages/Account";
import Monitor from "./pages/Monitor";
import Published from "./pages/Published";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route without sidebar */}
            <Route path="/published/:id" element={<Published />} />
            
            {/* Routes with sidebar - protected */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/doc/:id" element={<Editor />} />
                          <Route path="/playbooks" element={<Playbooks />} />
                          <Route path="/playgrounds" element={<Playgrounds />} />
                          <Route path="/datasets" element={<Datasets />} />
                          <Route path="/apis" element={<APIs />} />
                          <Route path="/configuration" element={<Configuration />} />
                          <Route path="/account" element={<Account />} />
                          <Route path="/monitor" element={<Monitor />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
