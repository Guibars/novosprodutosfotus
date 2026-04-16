import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Users, Tag } from "lucide-react";
import { cn } from "../lib/utils";

import { useProjects, Task } from "../contexts/ProjectContext";

const sectors = ["Gestão", "Novos Produtos", "Desenvolvimento", "Marketing", "Pricing"];

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProjectTasks } = useProjects();
  
  const project = projects.find(p => p.id === id);
  const tasks = project?.tasks || [];

  const setTasks = (newTasks: Task[]) => {
    if (id) updateProjectTasks(id, newTasks);
  };

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskSector, setNewTaskSector] = useState(sectors[0]);
  const [newTaskDate, setNewTaskDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeName || !assigneeEmail || !assigningTask) return;
    setTasks(tasks.map(t => t.id === assigningTask ? { ...t, assignee: `${assigneeName} (${assigneeEmail})` } : t));
    setAssigningTask(null);
    setAssigneeName("");
    setAssigneeEmail("");
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTaskTitle || !newTaskDate) return;
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      sector: newTaskSector,
      dueDate: newTaskDate,
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskDate("");
    setIsAdding(false);
  };

  const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{project?.name || 'Projeto'}</h1>
          <p className="text-gray-500 mt-1">Visão geral e tarefas do projeto.</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Progresso Geral</h3>
          <span className="font-bold text-secondary">{progress}%</span>
        </div>
        <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
        <div className="p-6 border-b border-white/50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">Tarefas</h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        <div className="divide-y divide-white/30">
          {isAdding && (
            <div className="p-4 bg-white/40 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input 
                type="text" 
                placeholder="Título da tarefa..." 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.currentTarget.value)}
                className="flex-1 px-3 py-2 glass-input rounded-lg text-sm"
              />
              <select 
                value={newTaskSector}
                onChange={(e) => setNewTaskSector(e.currentTarget.value)}
                className="px-3 py-2 glass-input rounded-lg text-sm"
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input 
                type="date" 
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.currentTarget.value)}
                className="px-3 py-2 glass-input rounded-lg text-sm"
              />
              <div className="flex items-center gap-2">
                <button onClick={addTask} className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-hover shadow-sm">Salvar</button>
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white/50 border border-white/50 text-gray-700 rounded-lg text-sm font-medium hover:bg-white/80">Cancelar</button>
              </div>
            </div>
          )}

          {tasks.map((task) => (
            <div key={task.id} className={cn("p-4 flex items-center gap-4 hover:bg-white/50 transition-colors", task.completed && "bg-white/30")}>
              <button onClick={() => toggleTask(task.id)} className="shrink-0 text-gray-400 hover:text-secondary transition-colors">
                {task.completed ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Circle className="w-6 h-6" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-gray-900 truncate", task.completed && "text-gray-500 line-through")}>
                  {task.title}
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {task.sector}</span>
                  <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {task.dueDate}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                {task.assignee ? (
                  <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-white/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {task.assignee.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{task.assignee}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAssigningTask(task.id)}
                    className="text-sm font-medium text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Atribuir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Task Modal */}
      {assigningTask && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Atribuir Tarefa</h2>
            <form onSubmit={handleAssign} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Membro</label>
                <input 
                  type="text" 
                  required
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do Membro</label>
                <input 
                  type="email" 
                  required
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Ex: joao@fotus.com"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setAssigningTask(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/30"
                >
                  Atribuir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
