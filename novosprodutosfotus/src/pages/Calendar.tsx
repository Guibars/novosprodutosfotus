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

    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (dateObj.getDay() === 1) { // 1 = Monday
      tasksForDay.unshift({
        title: "PSV - REUNIÃO RESULTADO",
        fullTitle: "PSV - REUNIÃO DE MOSTRAR COMO FOI O RESULTADO",
        projectName: "Evento Fixo",
        projectColor: "bg-[#eab308]", // Amarelo
        completed: false,
        isEvent: true
      });
    }

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Calendário</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão geral de tarefas por prazo.</p>
        </div>
      </div>

      <div className="surface p-4 sm:p-5 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-1.5">
            <button onClick={prevMonth} className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-lg transition-colors hover-lift">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={nextMonth} className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-lg transition-colors hover-lift">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: startingDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-lg bg-slate-50/40 border border-slate-100"></div>
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
                  "relative h-16 sm:h-20 rounded-lg border p-1 sm:p-1.5 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                  isToday ? "bg-primary/[0.07] border-primary/40" : "bg-white border-slate-200/70 hover:bg-slate-50",
                  tasks.length > 0 && "hover:border-secondary/40 hover:shadow-[0_10px_24px_-14px_rgba(13,81,142,0.5)] hover:-translate-y-0.5"
                )}
              >
                {isToday && <span className="absolute -top-3 -right-3 w-10 h-10 bg-primary/25 blur-lg rounded-full glow-pulse pointer-events-none" />}
                <div className={cn(
                  "text-[11px] font-bold mb-0.5 w-5 h-5 flex items-center justify-center rounded-full shrink-0 relative z-10",
                  isToday ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-slate-600"
                )}>
                  {day}
                </div>
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden relative z-10">
                  {tasks.slice(0, 2).map((t, i) => (
                    <div key={i} className={cn("text-[8px] sm:text-[9px] truncate px-1 py-0.5 rounded font-semibold text-white leading-tight", t.projectColor)}>
                      {t.isEvent ? t.fullTitle : t.title}
                    </div>
                  ))}
                  {tasks.length > 2 && (
                    <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold px-0.5">
                      +{tasks.length - 2} mais
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
            >
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Tarefas · {selectedDateTasks.date}</h2>
              <div className="overflow-y-auto pr-1.5 space-y-2.5 scrollbar-minimal">
                {selectedDateTasks.tasks.map((task, idx) => (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
                    {task.isEvent ? (
                      <div className="w-5 h-5 flex items-center justify-center bg-[#eab308] rounded-full shrink-0 shadow-inner">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      task.completed ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-sm text-slate-900 truncate flex items-center gap-2", task.completed && "line-through text-slate-400")}>
                        {task.fullTitle || task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full inline-block", task.projectColor)}>
                          {task.projectName}
                        </span>
                        {!task.isEvent && <span className="text-xs text-slate-400">{task.sector}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedDateTasks(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
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
