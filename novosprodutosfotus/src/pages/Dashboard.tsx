import React, { useState, useEffect } from "react";
import { ArrowUpRight, Plus, Download, Video, Play, Pause, Square, Edit2, Trash2, FolderGit2, CheckCircle2, LayoutList, Target, Clock, Calendar, Users, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip, AreaChart, Area, YAxis } from "recharts";
import { cn } from "../lib/utils";
import { useProjects } from "../contexts/ProjectContext";
import { useAuth } from "../contexts/AuthContext";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Dashboard() {
  const { projects, setIsProjectModalOpen, searchQuery } = useProjects();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<any>({});

  useEffect(() => {
    if (!user) {
      setTeamMembers([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data());
      setTeamMembers(members);
    }, (error) => {
      console.error("Erro ao buscar time:", error);
    });
    
    // Fetch current month's sales metrics
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const unsubscribeMetrics = onSnapshot(doc(db, 'sales_metrics', currentMonthKey), (docSnap) => {
      if (docSnap.exists()) {
        setSalesMetrics(docSnap.data());
      } else {
        setSalesMetrics({});
      }
    });

    return () => {
      unsubscribe();
      unsubscribeMetrics();
    };
  }, [user]);

  // Transform project data for the chart: completed tasks in open projects
  const openProjectsData = projects
    .filter(p => p.progress < 100 && p.tasks.length > 0)
    .map(p => {
      const completedTasks = p.tasks.filter(t => t.completed).length;
      return {
        name: p.name.substring(0, 10) + (p.name.length > 10 ? '...' : ''), // Short name for X-axis
        fullName: p.name,
        Concluídas: completedTasks,
      };
    });

  const [reminders, setReminders] = useState<{id: number, title: string, observation?: string, date?: string, time?: string}[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState<number | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderObservation, setNewReminderObservation] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.progress > 0 && p.progress < 100).length;
  const completedProjects = projects.filter(p => p.progress === 100 && p.tasks.length > 0).length;
  const pendingProjects = projects.filter(p => p.progress === 0 || p.tasks.length === 0).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueProjects = projects.filter(p => {
    if (p.progress >= 100) return false;
    const dueDate = new Date(p.dueDate + 'T12:00:00');
    return dueDate < today;
  }).length;

  // ✅ Dados de Tarefas
  let totalTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;

  projects.forEach(p => {
    p.tasks.forEach(t => {
      totalTasks++;
      if (t.completed) completedTasks++;
      else {
        const tDueDate = new Date(t.dueDate + 'T12:00:00');
        if (tDueDate < today) overdueTasks++;
      }
    });
  });

  const pendingTasks = totalTasks - completedTasks;
  const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ⚡ Métricas de Performance
  const onTimeDeliveryRate = totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100)) : 100;
  const avgDeliveryDays = 14;

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle) return;
    
    if (editingReminder) {
      setReminders(reminders.map(r => r.id === editingReminder ? { 
        ...r, 
        title: newReminderTitle, 
        observation: newReminderObservation,
        date: newReminderDate,
        time: newReminderTime 
      } : r));
      setEditingReminder(null);
    } else {
      setReminders([...reminders, {
        id: Date.now(),
        title: newReminderTitle,
        observation: newReminderObservation,
        date: newReminderDate,
        time: newReminderTime
      }]);
    }
    
    setIsAddingReminder(false);
    resetReminderForm();
  };

  const handleEditReminder = (reminder: {id: number, title: string, observation?: string, date?: string, time?: string}) => {
    setEditingReminder(reminder.id);
    setNewReminderTitle(reminder.title);
    setNewReminderObservation(reminder.observation || "");
    setNewReminderDate(reminder.date || "");
    setNewReminderTime(reminder.time || "");
    setIsAddingReminder(true);
  };
  
  const handleDeleteReminder = (id: number) => {
    setReminders(reminders.filter(r => r.id !== id));
  };
  
  const resetReminderForm = () => {
    setNewReminderTitle("");
    setNewReminderObservation("");
    setNewReminderDate("");
    setNewReminderTime("");
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass, highlight }: any) => (
    <div className={cn(
      highlight
        ? "rounded-[2rem] p-6 relative overflow-hidden text-white border border-white/30 shadow-xl shadow-secondary/25 hover-lift " + colorClass
        : "glass-card hover-lift rounded-[2rem] p-6 relative overflow-hidden"
    )}>
      {highlight && <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className={cn("font-medium", highlight ? "text-white/80" : "text-gray-600")}>{title}</h3>
        <div className={cn("p-2 rounded-xl backdrop-blur-sm", highlight ? "bg-white/20" : "bg-white/50 text-gray-500")}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <p className={cn("text-3xl font-bold mb-1", highlight ? "text-white" : "text-gray-900")}>{value}</p>
        <p className={cn("text-sm", highlight ? "text-white/70" : "text-gray-500")}>{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visão Projetos</h1>
          <p className="text-gray-500 mt-1">Planeje, priorize e realize suas tarefas com facilidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="btn-liquid btn-secondary-liquid px-4 py-2 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Adicionar Projeto
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Conclusão Geral" 
          value={`${overallCompletionRate}%`} 
          subtitle="Taxa de sucesso das tarefas" 
          icon={Target} 
          colorClass="bg-gradient-to-br from-primary to-secondary" 
          highlight 
        />
        <MetricCard 
          title="Entrega no Prazo" 
          value={`${onTimeDeliveryRate}%`} 
          subtitle="Índice de pontualidade" 
          icon={Clock} 
        />
        <MetricCard 
          title="Prazo Médio" 
          value={`${avgDeliveryDays} dias`} 
          subtitle="Tempo médio finalização" 
          icon={Calendar} 
        />
        <MetricCard 
          title="Membros Ativos" 
          value={teamMembers.length} 
          subtitle="Colaboradores no sistema" 
          icon={Users} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 📦 Dados de Projetos */}
        <div className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-primary" />
            Dados de Projetos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-tile p-4 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <div className="glass-tile p-4 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Em Dev.</p>
              <p className="text-2xl font-bold text-primary">{inProgressProjects}</p>
            </div>
            <div className="glass-tile p-4 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Concluídos</p>
              <p className="text-2xl font-bold text-success">{completedProjects}</p>
            </div>
            <div className="glass-tile p-4 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-gray-700">{pendingProjects}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 col-span-2 sm:col-span-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-1 font-medium">Prazo Vencido</p>
                <p className="text-2xl font-bold text-red-700">{overdueProjects}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* ✅ Dados de Tarefas */}
        <div className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <LayoutList className="w-6 h-6 text-secondary" />
            Dados de Tarefas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-tile p-4 rounded-2xl relative overflow-hidden group">
              <p className="text-sm text-gray-500 mb-1">Total Cadastradas</p>
              <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
              <div className="absolute right-0 bottom-0 p-4 opacity-10">
                <LayoutList className="w-16 h-16" />
              </div>
            </div>
            <div className="glass-tile p-4 rounded-2xl relative overflow-hidden group">
              <p className="text-sm text-gray-500 mb-1">Concluídas</p>
              <p className="text-3xl font-bold text-success">{completedTasks}</p>
              <div className="absolute right-0 bottom-0 p-4 opacity-10">
                <CheckCircle2 className="w-16 h-16 text-success" />
              </div>
            </div>
            <div className="glass-tile p-4 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-primary">{pendingTasks}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 mb-1 font-medium">Atrasadas</p>
                <p className="text-2xl font-bold text-orange-700">{overdueTasks}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="glass-panel rounded-[2rem] p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Tarefas Concluídas por Projeto</h3>
            <p className="text-xs text-gray-500 mb-6">Projetos em aberto</p>
          </div>
          <div className="h-44 -ml-4">
            {openProjectsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={openProjectsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={5} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="Concluídas" radius={[4, 4, 0, 0]} barSize={24} fill="#0D518E" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-sm">Nenhum projeto em aberto com tarefas</p>
              </div>
            )}
          </div>
        </div>

        {/* Reminders */}
        <div className="glass-panel rounded-[2rem] p-6 lg:col-span-1 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Lembretes</h3>
            <button 
              onClick={() => {
                setEditingReminder(null);
                resetReminderForm();
                setIsAddingReminder(true);
              }}
              className="btn-liquid btn-white-liquid text-sm px-3 py-1 rounded-lg"
            >
              + Novo
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-minimal pr-2">
            {reminders.map(reminder => (
              <div key={reminder.id} className="p-4 bg-white/40 rounded-xl border border-white/50 relative group flex flex-col justify-between">
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditReminder(reminder)}
                    className="p-1.5 text-gray-400 hover:text-primary bg-white/50 rounded-md"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 bg-white/50 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1 pr-14">{reminder.title}</h4>
                  {reminder.observation && (
                    <p className="text-gray-600 text-[11px] mb-2 leading-tight">{reminder.observation}</p>
                  )}
                  {(reminder.date || reminder.time) && (
                    <p className="text-gray-500 text-xs mb-3 font-medium">
                      {reminder.date && <span>{new Date(reminder.date + 'T12:00:00').toLocaleDateString('pt-BR')} </span>}
                      {reminder.time && <span>às {reminder.time}</span>}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <a 
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reminder.title)}&details=${encodeURIComponent(reminder.observation || 'Lembrete do Fotus Novos Produtos')}${reminder.date ? `&dates=${reminder.date.replace(/-/g, '')}/${reminder.date.replace(/-/g, '')}` : ''}`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-medium text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                    >
                      + Google Calendar
                    </a>
                    <a 
                      href={`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(reminder.title)}&body=${encodeURIComponent(reminder.observation || '')}`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-medium text-sky-600 hover:underline bg-sky-50 px-2 py-1 rounded"
                    >
                      + Outlook
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum lembrete.</p>
            )}
          </div>
        </div>

        {/* Open Projects */}
        <div className="glass-panel rounded-[2rem] p-6 lg:col-span-1 row-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Projetos em Aberto</h3>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="btn-liquid btn-white-liquid text-sm px-3 py-1 rounded-lg"
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
              .map((project, index) => (
                <div key={project.id} className="flex items-start gap-4 p-3 hover:bg-white/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/50 hover:shadow-md hover:-translate-y-0.5">
                  <div className={`w-10 h-10 rounded-xl ${project.color} flex items-center justify-center shrink-0 shadow-inner`}>
                    <div className="w-4 h-4 bg-white/30 rounded-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                      <span className="text-xs font-bold text-secondary">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                      <div className="bg-secondary h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Prazo: {new Date(project.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            {projects.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum projeto em aberto.</p>
            )}
          </div>
        </div>

        {/* Team Collaboration */}
        <div className="glass-panel rounded-[2rem] p-6 lg:col-span-1">
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
                    <p className="text-xs text-gray-500 truncate w-32 sm:w-48">{member.role || 'Membro'}</p>
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
        <div className="glass-panel rounded-[2rem] p-6 lg:col-span-1 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 w-full mb-4">Progresso Geral</h3>
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
                strokeDasharray={`${totalProjects > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) : 0}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900">
                {totalProjects > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) : 0}%
              </span>
              <span className="text-xs text-gray-500">Média dos Projetos</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500 w-full">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary"></div> Concluído</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Restante</div>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isAddingReminder && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-[100] p-4">
          <div className="glass-modal rounded-[2rem] p-8 w-full max-w-md animate-pop-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingReminder ? "Editar Lembrete" : "Novo Lembrete"}</h2>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input 
                  type="text" 
                  required
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl"
                  placeholder="Ex: Reunião de Alinhamento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea 
                  value={newReminderObservation}
                  onChange={(e) => setNewReminderObservation(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl min-h-[80px] resize-none"
                  placeholder="Anotações ou links importantes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data (Opcional)</label>
                  <input 
                    type="date" 
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora (Opcional)</label>
                  <input 
                    type="time" 
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingReminder(false);
                    setEditingReminder(null);
                    resetReminderForm();
                  }}
                  className="btn-liquid btn-ghost-liquid px-5 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-liquid btn-secondary-liquid px-5 py-2 rounded-xl"
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
