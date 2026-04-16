/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { Team } from "./pages/Team";
import { Settings } from "./pages/Settings";
import { Calendar } from "./pages/Calendar";
import { ProjectProvider } from "./contexts/ProjectContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-[125vh] flex items-center justify-center bg-gray-50">Carregando...</div>;
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/calendar" element={<Calendar />} />
              {/* Fallback routes for other menu items */}
              <Route path="/analytics" element={<div className="p-8 text-gray-500">Analytics em breve...</div>} />
              <Route path="/help" element={<div className="p-8 text-gray-500">Ajuda em breve...</div>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}

