import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useProjects } from "../../contexts/ProjectContext";
import { cn } from "../../lib/utils";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isProjectModalOpen, setIsProjectModalOpen, addProject } = useProjects();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectDate) return;
    
    const colors = ["bg-blue-500", "bg-teal-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-primary", "bg-secondary"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addProject({
      name: newProjectName,
      dueDate: newProjectDate,
      status: "Planejamento",
      color: randomColor
    });

    setIsProjectModalOpen(false);
    setNewProjectName("");
    setNewProjectDate("");
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Liquid glass background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none"></div>

      <Sidebar isOpen={isSidebarOpen} />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 z-10 transition-all duration-300",
        isSidebarOpen ? "pl-72" : "pl-0"
      )}>
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Add Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Projeto</h2>
            <form onSubmit={handleAddProject} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input 
                  type="text" 
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Ex: Novo App Mobile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                <input 
                  type="date" 
                  required
                  value={newProjectDate}
                  onChange={(e) => setNewProjectDate(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-secondary/30"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
