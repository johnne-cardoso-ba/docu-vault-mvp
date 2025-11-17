import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Collaborators from "./pages/Collaborators";
import UploadDocument from "./pages/UploadDocument";
import Documents from "./pages/Documents";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { useTestUsersSetup } from "./hooks/useTestUsersSetup";

const queryClient = new QueryClient();

const AppContent = () => {
  useTestUsersSetup();
  
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'colaborador']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'colaborador']}>
                <Clients />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/colaboradores" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Collaborators />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/enviar-documento" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'colaborador']}>
                <UploadDocument />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documentos" 
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
