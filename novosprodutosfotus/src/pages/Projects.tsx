import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Clock } from "lucide-react";
import { useProjects } from "../contexts/ProjectContext";

export function Projects() {
  const navigate = useNavigate();
  const { projects, deleteProject, setIsProjectModalOpen, searchQuery } = useProjects();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setDeletePassword("");
    setDeleteError("");
  };

  const confirmDelete = () => {
    if (deletePassword === "fotus") {
      deleteProject(projectToDelete!);
      setProjectToDelete(null);
    } else {
      setDeleteError("Senha incorreta!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-500 mt-1">Gerencie e acompanhe o andamento de todos os projetos.</p>
        </div>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects
          .filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.tasks.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((project) => (
          <div 
            key={project.id} 
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 hover:bg-white/60 hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 cursor-pointer group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${project.color} flex items-center justify-center text-white font-bold text-xl`}>
                {project.name.charAt(0)}
              </div>
              <button 
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" 
                onClick={(e) => handleDeleteClick(e, project.id)}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900 mb-1">{project.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Clock className="w-4 h-4" />
              <span>Prazo: {project.dueDate}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Progresso</span>
                <span className="font-bold text-gray-900">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${project.color} rounded-full`} 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex -space-x-2">
                {/* Team members will be shown here when integrated */}
              </div>
              <span className="text-sm font-medium text-gray-500">{project.tasks.length} Tarefas</span>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Excluir Projeto</h2>
            <p className="text-sm text-gray-600 mb-6">Digite a senha para confirmar a exclusão deste projeto.</p>
            
            <div className="space-y-5">
              <div>
                <input 
                  type="password" 
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:ring-red-500/30"
                  placeholder="Senha"
                />
                {deleteError && <p className="text-red-500 text-xs mt-2">{deleteError}</p>}
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
