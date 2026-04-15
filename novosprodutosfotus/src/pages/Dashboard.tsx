import React, { useState } from "react";
import { ArrowUpRight, Plus, Download, Video, Play, Pause, Square } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { cn } from "../lib/utils";
import { useProjects } from "../contexts/ProjectContext";

const analyticsData = [
  { name: 'S', value: 40, active: false },
  { name: 'M', value: 60, active: false },
  { name: 'T', value: 74, active: true },
  { name: 'W', value: 85, active: false },
  { name: 'T', value: 50, active: false },
  { name: 'F', value: 65, active: false },
  { name: 'S', value: 45, active: false },
];

const teamMembers = [
  { name: "Alexandra Deff", role: "Trabalhando no Repositório do Projeto", status: "Concluído", avatar: "https://picsum.photos/seed/alex/100/100" },
  { name: "Edwin Adenike", role: "Trabalhando no Sistema de Autenticação", status: "Em Progresso", avatar: "https://picsum.photos/seed/edwin/100/100" },
  { name: "Isaac Oluwatemilorun", role: "Trabalhando na Funcionalidade de Busca", status: "Pendente", avatar: "https://picsum.photos/seed/isaac/100/100" },
  { name: "David Oshodi", role: "Trabalhando no Layout Responsivo", status: "Em Progresso", avatar: "https://picsum.photos/seed/david/100/100" },
];

export function Dashboard() {
  const { projects, addProject } = useProjects();
  const [isAddingProject, setIsAddingProject] = useState(false);
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

    setIsAddingProject(false);
    setNewProjectName("");
    setNewProjectDate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Planeje, priorize e realize suas tarefas com facilidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddingProject(true)}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Projeto
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors">
            <Download className="w-5 h-5" />
            Importar Dados
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary text-white rounded-2xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-white/80">Total de Projetos</h3>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold mb-4">24</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-success/20 text-success px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3 h-3" /> 5
              </span>
              <span className="text-white/60">Aumento no último mês</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {[
          { title: "Projetos Finalizados", value: "10", increase: "6", label: "Aumento no último mês" },
          { title: "Projetos em Execução", value: "12", increase: "2", label: "Aumento no último mês" },
          { title: "Projetos Pendentes", value: "2", increase: null, label: "Em discussão" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-500">{stat.title}</h3>
              <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-4">{stat.value}</p>
            <div className="flex items-center gap-2 text-sm">
              {stat.increase ? (
                <>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                    <ArrowUpRight className="w-3 h-3" /> {stat.increase}
                  </span>
                  <span className="text-gray-400">{stat.label}</span>
                </>
              ) : (
                <span className="text-gray-400">{stat.label}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-6">Analytics de Projetos</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={32}>
                  {analyticsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.active ? '#0D518E' : '#f3f4f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-4">Lembretes</h3>
          <div className="flex-1 flex flex-col justify-center">
            <h4 className="text-xl font-bold text-gray-900 mb-2">Reunião com a Equipe Arc</h4>
            <p className="text-gray-500 text-sm mb-6">Horário : 14:00 - 16:00</p>
            <button className="w-full bg-secondary hover:bg-secondary-hover text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              <Video className="w-5 h-5" />
              Iniciar Reunião
            </button>
          </div>
        </div>

        {/* Open Projects */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1 row-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Projetos em Aberto</h3>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1 rounded-lg">
              + Novo
            </button>
          </div>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${project.color} flex items-center justify-center shrink-0`}>
                  <div className="w-4 h-4 bg-white/30 rounded-sm"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">Prazo: {project.dueDate}</p>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum projeto em aberto.</p>
            )}
          </div>
        </div>

        {/* Team Collaboration */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Colaboração do Time</h3>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1 rounded-lg">
              + Membro
            </button>
          </div>
          <div className="space-y-4">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{member.name}</h4>
                    <p className="text-xs text-gray-500 truncate w-32 sm:w-48">{member.role}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-1 rounded-md",
                  member.status === 'Concluído' ? "bg-green-50 text-green-600" :
                  member.status === 'Em Progresso' ? "bg-yellow-50 text-yellow-600" :
                  "bg-red-50 text-red-600"
                )}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 w-full mb-4">Progresso dos Projetos</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Simple CSS Donut Chart representation */}
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-gray-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="text-secondary"
                strokeDasharray="41, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900">41%</span>
              <span className="text-xs text-gray-500">Projetos Finalizados</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary"></div> Concluído</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div> Em Progresso</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Pendente</div>
          </div>
        </div>
        
        {/* Time Tracker */}
        <div className="bg-dark rounded-2xl p-6 text-white relative overflow-hidden lg:col-span-1">
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="font-medium text-white/80 mb-auto">Rastreador de Tempo</h3>
            <div className="text-center my-6">
              <p className="text-5xl font-mono font-light tracking-wider">01:24:08</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                <Pause className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-success via-dark to-dark"></div>
        </div>

      </div>

      {/* Add Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Projeto</h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input 
                  type="text" 
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddingProject(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-medium transition-colors"
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
