import React, { useState, useEffect } from "react";
import { useProjects } from "../contexts/ProjectContext";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, CartesianGrid, Legend, PieChart, Pie
} from "recharts";
import { 
  FolderGit2, CheckCircle2, Clock, PauseCircle,
  AlertCircle, LayoutList, Target, TrendingUp, Users, Calendar, ShoppingCart
} from "lucide-react";
import { cn } from "../lib/utils";

const PRODUCTS = ["Inversores Híbridos", "Bateria", "Drive", "RSD", "Carregador"];

export function Analytics() {
  const { projects } = useProjects();
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salesMetrics, setSalesMetrics] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setTeamMembersCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeMetrics = onSnapshot(doc(db, 'sales_metrics', selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setSalesMetrics(docSnap.data());
      } else {
        setSalesMetrics({});
      }
    });

    return () => unsubscribeMetrics();
  }, [selectedDate]);

  const [selYear, selMonthStr] = selectedDate.split('-');
  const selMonth = parseInt(selMonthStr, 10) - 1;

  const getBusinessDays = (y: number, m: number) => {
    let days = [];
    const date = new Date(y, m, 1);
    while (date.getMonth() === m) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        days.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const businessDays = getBusinessDays(parseInt(selYear), selMonth);
  const totalBusinessDays = businessDays.length;

  const todayActual = new Date();
  const isCurrentMonth = todayActual.getFullYear() === parseInt(selYear) && todayActual.getMonth() === selMonth;
  const isPastMonth = todayActual > new Date(parseInt(selYear), selMonth, 1);
  
  const passedBusinessDays = isCurrentMonth 
    ? businessDays.filter(d => d.getDate() <= todayActual.getDate()).length 
    : (isPastMonth ? totalBusinessDays : 0);

  // 📦 Dados de Projetos
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

  // 📊 Histórico e Distribuição
  // Cronograma de Entregas (Projetos por Mês)
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  const projectTrendData = months.map((month, index) => {
    const monthProjects = projects.filter(p => {
      if (!p.dueDate) return false;
      const d = new Date(p.dueDate + 'T12:00:00');
      return d.getMonth() === index;
    });

    return {
      name: month,
      Abertos: monthProjects.filter(p => p.progress < 100).length,
      Concluídos: monthProjects.filter(p => p.progress === 100).length,
    };
  });

  // Desempenho de Tarefas por Setor
  const sectorsMap = new Map();
  projects.forEach(p => {
    p.tasks.forEach(t => {
      const sec = t.sector || "Sem Setor";
      if (!sectorsMap.has(sec)) {
        sectorsMap.set(sec, { name: sec.substring(0, 3).toUpperCase(), fullName: sec, Pendentes: 0, Concluídas: 0 });
      }
      const data = sectorsMap.get(sec);
      if (t.completed) data.Concluídas++;
      else data.Pendentes++;
    });
  });
  const taskSectorData = Array.from(sectorsMap.values());

  // ⚡ Métricas de Performance
  // Taxa de entrega no prazo: Percentage of completed tasks that weren't overdue (estimated)
  const onTimeDeliveryRate = totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100)) : 100;
  
  // Prazo médio de entrega estimado
  const avgDeliveryDays = 14; // Default estimate as we don't have creation dates for tasks yet.

  const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass, highlight }: any) => (
    <div className={cn("bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5 relative overflow-hidden", highlight && "text-white " + colorClass)}>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Visão detalhada do desempenho da equipe, projetos e tarefas.</p>
      </div>

      {/* ⚡ Resumo Geral - Métricas Chave */}
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
          value={teamMembersCount} 
          subtitle="Colaboradores no sistema" 
          icon={Users} 
        />
      </div>

      {/* 🚀 Métricas de Vendas (Integração) */}
      <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            Acompanhamento de Vendas
          </h2>
          <input 
            type="month" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-gray-700 w-full md:w-auto"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PRODUCTS.map(product => {
            const data = salesMetrics[product] || { metaMensal: 0, quantidadeVendida: 0 };
            const percentage = data.metaMensal > 0 ? Math.min(100, Math.round((data.quantidadeVendida / data.metaMensal) * 100)) : 0;
            
            // Projection
            let projecao = 0;
            if (passedBusinessDays > 0) {
              const metaDiariaReal = data.quantidadeVendida / passedBusinessDays;
              projecao = isCurrentMonth ? Math.round(data.quantidadeVendida + (metaDiariaReal * (totalBusinessDays - passedBusinessDays))) : data.quantidadeVendida;
            }

            return (
              <div key={product} className="bg-white/60 p-4 rounded-2xl border border-white/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full">
                  <div className={cn("h-full", percentage >= 100 ? "bg-success" : "bg-orange-500")} style={{ width: `${percentage}%` }}></div>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 truncate" title={product}>{product}</h4>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Real</p>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{data.quantidadeVendida}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Meta</p>
                    <p className="text-sm font-semibold text-gray-600 leading-none">{data.metaMensal}</p>
                  </div>
                </div>
                
                {isCurrentMonth && data.metaMensal > 0 && (
                  <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-200/60 pb-1">
                    <span className="text-gray-500 font-medium">Projeção Mês:</span>
                    <span className={cn("font-bold", projecao >= data.metaMensal ? "text-success" : "text-gray-900")}>
                      {projecao}
                    </span>
                  </div>
                )}
                
                <div className="mt-3 text-right">
                  <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 rounded-lg border", percentage >= 100 ? "bg-success/10 text-success border-success/20" : "bg-orange-50 text-orange-600 border-orange-500/20")}>
                    {percentage}% Atingido
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 📦 Dados de Projetos */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-primary" />
            Dados de Projetos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Em Dev.</p>
              <p className="text-2xl font-bold text-primary">{inProgressProjects}</p>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Concluídos</p>
              <p className="text-2xl font-bold text-success">{completedProjects}</p>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
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
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <LayoutList className="w-6 h-6 text-secondary" />
            Dados de Tarefas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50 relative overflow-hidden group">
              <p className="text-sm text-gray-500 mb-1">Total Cadastradas</p>
              <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
              <div className="absolute right-0 bottom-0 p-4 opacity-10">
                <LayoutList className="w-16 h-16" />
              </div>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50 relative overflow-hidden group">
              <p className="text-sm text-gray-500 mb-1">Concluídas</p>
              <p className="text-3xl font-bold text-success">{completedTasks}</p>
              <div className="absolute right-0 bottom-0 p-4 opacity-10">
                <CheckCircle2 className="w-16 h-16 text-success" />
              </div>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Pendentes / Em Progresso</p>
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

      {/* 📊 Histórico e Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Tendência de Atividade Mensal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAbertos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D518E" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0D518E" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="Concluídos" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorConcluidos)" />
                <Area type="monotone" dataKey="Abertos" stroke="#0D518E" strokeWidth={3} fillOpacity={1} fill="url(#colorAbertos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Produtividade: Tarefas por Setor
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskSectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Concluídas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="Pendentes" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
