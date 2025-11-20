import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Collaborators from "./pages/Collaborators";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import NFSe from "./pages/NFSe";
import ClientNFSe from "./pages/ClientNFSe";
import ClientNFSeConfig from "./pages/ClientNFSeConfig";
import UploadDocument from "./pages/UploadDocument";
import Documents from "./pages/Documents";
import Requests from "./pages/Requests";
import InternalRequests from "./pages/InternalRequests";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'colaborador', 'cliente']}>
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
          <Route 
            path="/solicitacoes" 
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/solicitacoes-internas" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'colaborador']}>
                <InternalRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/perfil" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/relatorios" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nfse" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'colaborador']}>
                <NFSe />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nfse/cliente" 
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <ClientNFSe />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nfse/cliente/config" 
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <ClientNFSeConfig />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
