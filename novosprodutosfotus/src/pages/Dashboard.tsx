import React, { useState, useEffect } from "react";
import { ArrowUpRight, Plus, Download, Video, Play, Pause, Square, Edit2 } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { cn } from "../lib/utils";
import { useProjects } from "../contexts/ProjectContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Dashboard() {
  const { projects, setIsProjectModalOpen, searchQuery } = useProjects();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data());
      setTeamMembers(members);
    }, (error) => {
      console.error("Erro ao buscar time:", error);
    });
    return () => unsubscribe();
  }, []);

  // Calculate dynamic analytics data based on tasks per sector
  const sectors = ["Gestão", "Novos Produtos", "Desenvolvimento", "Marketing", "Pricing"];
  const analyticsData = sectors.map(sector => {
    let totalTasks = 0;
    let completedTasks = 0;
    projects.forEach(p => {
      p.tasks.forEach(t => {
        if (t.sector === sector) {
          totalTasks++;
          if (t.completed) completedTasks++;
        }
      });
    });
    return {
      name: sector.substring(0, 3), // Short name for X-axis
      fullName: sector,
      value: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      active: totalTasks > 0
    };
  });

  const [reminders, setReminders] = useState<{id: number, title: string, time: string}[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState<number | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  const totalProjects = projects.length;
  const finishedProjects = projects.filter(p => p.status === 'Concluído').length;
  const runningProjects = projects.filter(p => p.status === 'Em Progresso').length;
  const pendingProjects = projects.filter(p => p.status === 'Planejamento' || p.status === 'Pendente').length;

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderTime) return;
    
    if (editingReminder) {
      setReminders(reminders.map(r => r.id === editingReminder ? { ...r, title: newReminderTitle, time: newReminderTime } : r));
      setEditingReminder(null);
    } else {
      setReminders([...reminders, {
        id: Date.now(),
        title: newReminderTitle,
        time: newReminderTime
      }]);
    }
    
    setIsAddingReminder(false);
    setNewReminderTitle("");
    setNewReminderTime("");
  };

  const handleEditReminder = (reminder: {id: number, title: string, time: string}) => {
    setEditingReminder(reminder.id);
    setNewReminderTitle(reminder.title);
    setNewReminderTime(reminder.time);
    setIsAddingReminder(true);
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
            onClick={() => setIsProjectModalOpen(true)}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Projeto
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary/90 backdrop-blur-xl border border-white/20 text-white rounded-[2rem] p-6 relative overflow-hidden shadow-2xl shadow-secondary/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-white/80">Total de Projetos</h3>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold mb-4">{totalProjects}</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {[
          { title: "Projetos Finalizados", value: finishedProjects },
          { title: "Projetos em Execução", value: runningProjects },
          { title: "Projetos Pendentes", value: pendingProjects },
        ].map((stat, i) => (
          <div key={i} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-600">{stat.title}</h3>
              <div className="p-1.5 bg-white/50 rounded-lg text-gray-500">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-4">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 lg:col-span-1 shadow-xl shadow-black/5">
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
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 lg:col-span-1 flex flex-col shadow-xl shadow-black/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Lembretes</h3>
            <button 
              onClick={() => {
                setEditingReminder(null);
                setNewReminderTitle("");
                setNewReminderTime("");
                setIsAddingReminder(true);
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-white/50 bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              + Novo
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-48">
            {reminders.map(reminder => (
              <div key={reminder.id} className="p-4 bg-white/40 rounded-xl border border-white/50 relative group">
                <button 
                  onClick={() => handleEditReminder(reminder)}
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-md"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <h4 className="text-sm font-bold text-gray-900 mb-1 pr-6">{reminder.title}</h4>
                <p className="text-gray-600 text-xs mb-3">Horário : {reminder.time}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <a 
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reminder.title)}&details=${encodeURIComponent('Lembrete do Fotus Novos Produtos')}`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-medium text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                    >
                      + Google Calendar
                    </a>
                    <a 
                      href={`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(reminder.title)}`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-medium text-sky-600 hover:underline bg-sky-50 px-2 py-1 rounded"
                    >
                      + Outlook
                    </a>
                  </div>
                  <a 
                    href="https://meet.google.com/new" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-secondary hover:bg-secondary-hover text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    Iniciar Meet
                  </a>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum lembrete.</p>
            )}
          </div>
        </div>

        {/* Open Projects */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 lg:col-span-1 row-span-2 shadow-xl shadow-black/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Projetos em Aberto</h3>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-white/50 bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              + Novo
            </button>
          </div>
          <div className="space-y-4">
            {projects
              .filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.tasks.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((project) => (
                <div key={project.id} className="flex items-start gap-4 p-3 hover:bg-white/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/50">
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
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 lg:col-span-1 shadow-xl shadow-black/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Colaboração do Time</h3>
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-white/50 bg-white/30 px-3 py-1 rounded-lg transition-colors">
              Ver Todos
            </button>
          </div>
          <div className="space-y-4">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={member.avatar_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover border border-white/50" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{member.full_name}</h4>
                    <p className="text-xs text-gray-500 truncate w-32 sm:w-48">{member.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-green-50 text-green-600">
                  Ativo
                </span>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum membro cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 lg:col-span-1 flex flex-col items-center justify-center shadow-xl shadow-black/5">
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
                strokeDasharray={`${totalProjects > 0 ? (finishedProjects / totalProjects) * 100 : 0}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900">
                {totalProjects > 0 ? Math.round((finishedProjects / totalProjects) * 100) : 0}%
              </span>
              <span className="text-xs text-gray-500">Projetos Finalizados</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary"></div> Concluído</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div> Em Progresso</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Pendente</div>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isAddingReminder && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingReminder ? "Editar Lembrete" : "Novo Lembrete"}</h2>
            <form onSubmit={handleAddReminder} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Ex: Reunião de Alinhamento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <input 
                  type="text" 
                  required
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Ex: 14:00 - 15:00"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingReminder(false);
                    setEditingReminder(null);
                  }}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-secondary/30"
                >
                  {editingReminder ? "Salvar" : "Criar Lembrete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
