import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useProjects } from "../../contexts/ProjectContext";
import { cn } from "../../lib/utils";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isProjectModalOpen, setIsProjectModalOpen, addProject } = useProjects();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");
  
  const [updatePopupData, setUpdatePopupData] = useState<{ version: string; notes: string } | null>(null);

  useEffect(() => {
    // Listen for updates
    const unsubscribe = onSnapshot(doc(db, 'system', 'latest_update'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.version) {
          const lastSeenVersion = localStorage.getItem('seen_update_version');
          if (lastSeenVersion !== data.version) {
            setUpdatePopupData({ version: data.version, notes: data.notes || "" });
          }
        }
      }
    }, (error) => {
      console.warn("Could not load system updates:", error);
    });
    return () => unsubscribe();
  }, []);

  const dismissUpdatePopup = () => {
    if (updatePopupData) {
      localStorage.setItem('seen_update_version', updatePopupData.version);
      setUpdatePopupData(null);
    }
  };

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
    <div className="flex h-screen bg-transparent relative overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 z-10 transition-all duration-300 h-full",
        isSidebarOpen ? "pl-72" : "pl-[5.5rem]"
      )}>
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col">
          <div className="w-full max-w-[1600px] mx-auto flex flex-col flex-1">
            <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
          </div>
        </main>
      </div>

      {/* Global Add Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Novo Projeto</h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nome do Projeto</label>
                <input 
                  type="text" 
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm transition-all outline-none"
                  placeholder="Ex: Novo App Mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Prazo</label>
                <input 
                  type="date" 
                  required
                  value={newProjectDate}
                  onChange={(e) => setNewProjectDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm transition-all outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-secondary/20"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Update Notification Modal */}
      {updatePopupData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Novidades da Versão {updatePopupData.version} ✨</h2>
            <p className="text-gray-500 mb-6 font-medium">Acabamos de lançar uma atualização no sistema.</p>
            
            <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 max-h-[40vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm">{updatePopupData.notes}</pre>
            </div>
            
            <button 
              onClick={dismissUpdatePopup}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-gray-900/20 active:scale-[0.98]"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
