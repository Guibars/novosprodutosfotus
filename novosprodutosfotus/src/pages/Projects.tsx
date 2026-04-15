import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Clock } from "lucide-react";
import { useProjects } from "../contexts/ProjectContext";

export function Projects() {
  const navigate = useNavigate();
  const { projects } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-500 mt-1">Gerencie e acompanhe o andamento de todos os projetos.</p>
        </div>
        <button className="flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-xl font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${project.color} flex items-center justify-center text-white font-bold text-xl`}>
                {project.name.charAt(0)}
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-5 h-5" />
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

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/${project.id}${i}/100/100`} 
                    alt="Team member" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-500">{project.tasks} Tarefas</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
