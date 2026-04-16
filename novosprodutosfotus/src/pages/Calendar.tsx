import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { useProjects } from "../contexts/ProjectContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function Calendar() {
  const { projects } = useProjects();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getTasksForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let tasksForDay: any[] = [];
    projects.forEach(p => {
      p.tasks.forEach(t => {
        if (t.dueDate === dateString) {
          tasksForDay.push({ ...t, projectName: p.name, projectColor: p.color });
        }
      });
    });
    return tasksForDay;
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const [selectedDateTasks, setSelectedDateTasks] = useState<{date: string, tasks: any[]} | null>(null);

  const handleDayClick = (day: number) => {
    const tasks = getTasksForDate(day);
    if (tasks.length > 0) {
      setSelectedDateTasks({
        date: `${day} de ${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`,
        tasks
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendário</h1>
          <p className="text-gray-500 mt-1">Visão geral de tarefas por prazo.</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={nextMonth} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: startingDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-white/10 border border-white/20"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const tasks = getTasksForDate(day);
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-28 rounded-2xl border p-2 flex flex-col transition-all cursor-pointer overflow-hidden",
                  isToday ? "bg-primary/5 border-primary/30" : "bg-white/40 border-white/60 hover:bg-white/60",
                  tasks.length > 0 && "hover:ring-2 hover:ring-primary/20 hover:shadow-lg"
                )}
              >
                <div className={cn(
                  "text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                  isToday ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-700"
                )}>
                  {day}
                </div>
                <div className="flex-1 flex flex-col gap-1 overflow-auto no-scrollbar">
                  {tasks.slice(0, 3).map((t, i) => (
                    <div key={i} className={cn("text-[10px] truncate px-1.5 py-0.5 rounded font-medium text-white", t.projectColor)}>
                      {t.title}
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <div className="text-[10px] text-gray-500 font-medium px-1">
                      +{tasks.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for daily tasks */}
      <AnimatePresence>
        {selectedDateTasks && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">Tarefas - {selectedDateTasks.date}</h2>
              <div className="overflow-y-auto pr-2 space-y-4">
                {selectedDateTasks.tasks.map((task, idx) => (
                  <div key={idx} className="bg-white/60 p-4 rounded-xl border border-white/40 shadow-sm flex items-center gap-3">
                    {task.completed ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <Circle className="w-5 h-5 text-gray-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-gray-900 truncate", task.completed && "line-through text-gray-500")}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded-full inline-block", task.projectColor)}>
                          {task.projectName}
                        </span>
                        <span className="text-xs text-gray-500">{task.sector}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={() => setSelectedDateTasks(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
