/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { ProjectProvider } from "./contexts/ProjectContext";

export default function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            {/* Fallback routes for other menu items */}
            <Route path="/calendar" element={<div className="p-8 text-gray-500">Calendário em breve...</div>} />
            <Route path="/analytics" element={<div className="p-8 text-gray-500">Analytics em breve...</div>} />
            <Route path="/team" element={<div className="p-8 text-gray-500">Time em breve...</div>} />
            <Route path="/settings" element={<div className="p-8 text-gray-500">Configurações em breve...</div>} />
            <Route path="/help" element={<div className="p-8 text-gray-500">Ajuda em breve...</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}

