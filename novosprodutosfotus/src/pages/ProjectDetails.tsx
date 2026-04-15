import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Users, Tag } from "lucide-react";
import { cn } from "../lib/utils";

const sectors = ["Gestão", "Novos Produtos", "Desenvolvimento", "Marketing", "Pricing"];

type Task = {
  id: string;
  title: string;
  sector: string;
  dueDate: string;
  completed: boolean;
};

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock data for "eletroposto"
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Alinhar formato de prospecção", sector: "Marketing", dueDate: "2024-11-20", completed: true },
    { id: "2", title: "Definir precificação inicial", sector: "Pricing", dueDate: "2024-11-25", completed: false },
    { id: "3", title: "Desenvolver MVP do app", sector: "Desenvolvimento", dueDate: "2024-12-10", completed: false },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskSector, setNewTaskSector] = useState(sectors[0]);
  const [newTaskDate, setNewTaskDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTaskTitle || !newTaskDate) return;
    const newTask: Task = {
      id: Date.now().toString(),
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
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{id === 'eletroposto' ? 'Eletroposto' : 'Projeto'}</h1>
          <p className="text-gray-500 mt-1">Visão geral e tarefas do projeto.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Progresso Geral</h3>
          <span className="font-bold text-secondary">{progress}%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">Tarefas</h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {isAdding && (
            <div className="p-4 bg-gray-50 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input 
                type="text" 
                placeholder="Título da tarefa..." 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.currentTarget.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <select 
                value={newTaskSector}
                onChange={(e) => setNewTaskSector(e.currentTarget.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input 
                type="date" 
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.currentTarget.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              />
              <div className="flex items-center gap-2">
                <button onClick={addTask} className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-hover">Salvar</button>
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          )}

          {tasks.map((task) => (
            <div key={task.id} className={cn("p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors", task.completed && "bg-gray-50/50")}>
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

              <div className="shrink-0">
                <button className="text-sm font-medium text-gray-500 hover:text-secondary px-3 py-1.5 rounded-lg border border-gray-200 hover:border-secondary/30 bg-white transition-colors">
                  Atribuir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
