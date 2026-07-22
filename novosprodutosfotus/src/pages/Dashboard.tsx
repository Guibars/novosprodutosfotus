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

  const avgProjectProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects)
    : 0;

  const MetricCard = ({ title, value, subtitle, icon: Icon, highlight, accent = "text-secondary", tint = "bg-secondary/10" }: any) => (
    <div className={cn(
      "surface surface-hover p-4 relative overflow-hidden animate-fade-rise",
      highlight && "border-0 text-white bg-gradient-to-br from-secondary via-secondary to-accent shadow-[0_14px_34px_-12px_rgba(13,81,142,0.5)]"
    )}>
      {highlight && <div className="absolute -right-8 -top-10 w-32 h-32 bg-primary/25 rounded-full blur-2xl pointer-events-none"></div>}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className={cn("eyebrow", highlight && "text-white/70")}>{title}</span>
        <div className={cn("p-1.5 rounded-lg", highlight ? "bg-white/15 text-primary" : cn(tint, accent))}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="relative z-10">
        <p className={cn("text-2xl font-bold leading-none mb-1.5", highlight ? "text-white" : "text-slate-900")}>{value}</p>
        <p className={cn("text-xs", highlight ? "text-white/70" : "text-slate-400")}>{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Visão Projetos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Planeje, priorize e realize suas tarefas com facilidade.</p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-secondary/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Adicionar Projeto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Conclusão Geral"
          value={`${overallCompletionRate}%`}
          subtitle="Taxa de sucesso das tarefas"
          icon={Target}
          highlight
        />
        <MetricCard
          title="Entrega no Prazo"
          value={`${onTimeDeliveryRate}%`}
          subtitle="Índice de pontualidade"
          icon={Clock}
          accent="text-success" tint="bg-success/10"
        />
        <MetricCard
          title="Prazo Médio"
          value={`${avgDeliveryDays} dias`}
          subtitle="Tempo médio finalização"
          icon={Calendar}
          accent="text-primary" tint="bg-primary/10"
        />
        <MetricCard
          title="Membros Ativos"
          value={teamMembers.length}
          subtitle="Colaboradores no sistema"
          icon={Users}
          accent="text-accent" tint="bg-accent/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 📦 Dados de Projetos */}
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><FolderGit2 className="w-4 h-4" /></div>
            <h2 className="text-sm font-bold text-slate-800">Dados de Projetos</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="stat-tile p-3">
              <p className="eyebrow mb-1">Total</p>
              <p className="text-xl font-bold text-slate-900">{totalProjects}</p>
            </div>
            <div className="stat-tile p-3">
              <p className="eyebrow mb-1">Em Dev.</p>
              <p className="text-xl font-bold text-primary">{inProgressProjects}</p>
            </div>
            <div className="stat-tile p-3">
              <p className="eyebrow mb-1">Concluídos</p>
              <p className="text-xl font-bold text-success">{completedProjects}</p>
            </div>
            <div className="stat-tile p-3">
              <p className="eyebrow mb-1">Pendentes</p>
              <p className="text-xl font-bold text-slate-700">{pendingProjects}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 col-span-2 flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-red-500 mb-1">Prazo Vencido</p>
                <p className="text-xl font-bold text-red-600">{overdueProjects}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        {/* ✅ Dados de Tarefas */}
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary"><LayoutList className="w-4 h-4" /></div>
            <h2 className="text-sm font-bold text-slate-800">Dados de Tarefas</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="stat-tile p-3 relative overflow-hidden">
              <p className="eyebrow mb-1">Total Cadastradas</p>
              <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
              <LayoutList className="w-14 h-14 absolute -right-2 -bottom-2 text-slate-900/5" />
            </div>
            <div className="stat-tile p-3 relative overflow-hidden">
              <p className="eyebrow mb-1">Concluídas</p>
              <p className="text-2xl font-bold text-success">{completedTasks}</p>
              <CheckCircle2 className="w-14 h-14 absolute -right-2 -bottom-2 text-success/10" />
            </div>
            <div className="stat-tile p-3">
              <p className="eyebrow mb-1">Pendentes</p>
              <p className="text-xl font-bold text-primary">{pendingTasks}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-orange-500 mb-1">Atrasadas</p>
                <p className="text-xl font-bold text-orange-600">{overdueTasks}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Analytics Chart */}
        <div className="surface p-5 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tarefas Concluídas</h3>
              <p className="eyebrow mt-0.5">Por projeto em aberto</p>
            </div>
          </div>
          <div className="h-40 -ml-4 mt-4">
            {openProjectsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={openProjectsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={5} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="Concluídas" radius={[4, 4, 0, 0]} barSize={22} fill="#0D518E" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm">Nenhum projeto em aberto com tarefas</p>
              </div>
            )}
          </div>
        </div>

        {/* Reminders */}
        <div className="surface p-5 lg:col-span-1 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Lembretes</h3>
            <button
              onClick={() => {
                setEditingReminder(null);
                resetReminderForm();
                setIsAddingReminder(true);
              }}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 px-2.5 py-1 rounded-lg transition-colors"
            >
              + Novo
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto scrollbar-minimal pr-1.5 -mr-1.5">
            {reminders.map(reminder => (
              <div key={reminder.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 relative group flex flex-col justify-between">
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditReminder(reminder)}
                    className="p-1.5 text-slate-400 hover:text-primary bg-white rounded-md shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-md shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1 pr-14">{reminder.title}</h4>
                  {reminder.observation && (
                    <p className="text-slate-600 text-[11px] mb-2 leading-tight">{reminder.observation}</p>
                  )}
                  {(reminder.date || reminder.time) && (
                    <p className="text-slate-500 text-xs mb-2 font-medium">
                      {reminder.date && <span>{new Date(reminder.date + 'T12:00:00').toLocaleDateString('pt-BR')} </span>}
                      {reminder.time && <span>às {reminder.time}</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
            ))}
            {reminders.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-400">Nenhum lembrete.</p>
              </div>
            )}
          </div>
        </div>

        {/* Open Projects */}
        <div className="surface p-5 lg:col-span-1 row-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Projetos em Aberto</h3>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 px-2.5 py-1 rounded-lg transition-colors"
            >
              + Novo
            </button>
          </div>
          <div className="space-y-2">
            {projects
              .filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.tasks.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((project) => (
                <div key={project.id} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200/70">
                  <div className={`w-9 h-9 rounded-lg ${project.color} flex items-center justify-center shrink-0 shadow-inner`}>
                    <div className="w-3.5 h-3.5 bg-white/30 rounded-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5 gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 truncate">{project.name}</h4>
                      <span className="text-xs font-bold text-secondary shrink-0">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-secondary to-accent h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <p className="text-[11px] text-slate-400">Prazo: {new Date(project.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            {projects.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum projeto em aberto.</p>
            )}
          </div>
        </div>

        {/* Team Collaboration */}
        <div className="surface p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Colaboração do Time</h3>
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
              Ver Todos
            </button>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={member.avatar_url} alt={member.full_name} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{member.full_name}</h4>
                    <p className="text-xs text-slate-400 truncate">{member.role || 'Membro'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-100 shrink-0">
                  Ativo
                </span>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum membro cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* Project Progress */}
        <div className="surface p-5 lg:col-span-1 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-800 w-full mb-3">Progresso Geral</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Simple CSS Donut Chart representation */}
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-slate-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-secondary"
                strokeDasharray={`${avgProjectProgress}, 100`}
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">
                {avgProjectProgress}%
              </span>
              <span className="text-[11px] text-slate-400">Média dos Projetos</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-500 w-full">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary"></div> Concluído</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Restante</div>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isAddingReminder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 mb-5">{editingReminder ? "Editar Lembrete" : "Novo Lembrete"}</h2>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Título *</label>
                <input
                  type="text"
                  required
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm outline-none transition-all"
                  placeholder="Ex: Reunião de Alinhamento"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Observações (Opcional)</label>
                <textarea
                  value={newReminderObservation}
                  onChange={(e) => setNewReminderObservation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm outline-none transition-all min-h-[80px] resize-none"
                  placeholder="Anotações ou links importantes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Data (Opcional)</label>
                  <input
                    type="date"
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Hora (Opcional)</label>
                  <input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingReminder(false);
                    setEditingReminder(null);
                    resetReminderForm();
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-secondary/20"
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
