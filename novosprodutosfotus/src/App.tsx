/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TransferBoard } from "./pages/TransferBoard";
import { FollowUp } from "./pages/FollowUp";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { Team } from "./pages/Team";
import { Settings } from "./pages/Settings";
import { Calendar } from "./pages/Calendar";
import { Analytics } from "./pages/Analytics";
import { Help } from "./pages/Help";
import { Metrics } from "./pages/Metrics";
import { Vacations } from "./pages/Vacations";
import { Inventory } from "./pages/Inventory";
import { ProjectProvider } from "./contexts/ProjectContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Ao carregar/recarregar a página, sempre inicia no Cockpit de Novos Produtos.
// Roda apenas uma vez por carregamento real da página (um refresh remonta o App
// e reavalia este módulo); a navegação interna do app não é afetada.
let didInitialLanding = false;
function InitialLanding() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!didInitialLanding) {
      didInitialLanding = true;
      // Não redireciona quem chega direto na tela de login.
      if (location.pathname !== "/login") {
        navigate("/analytics", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-[125vh] flex items-center justify-center bg-gray-50">Carregando...</div>;
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <InitialLanding />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/analytics" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/metrics" element={<Metrics />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/transfer-board" element={<TransferBoard />} />
              <Route path="/follow-up" element={<FollowUp />} />
              <Route path="/vacations" element={<Vacations />} />
              <Route path="/help" element={<Help />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}

