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
  AlertCircle, LayoutList, Target, TrendingUp, Users, Calendar, ShoppingCart, Info, Filter
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
  const [salesMetricsMap, setSalesMetricsMap] = useState<Record<string, any>>({});
  const [isQuarterView, setIsQuarterView] = useState(false);
  const [selectedProductTrend, setSelectedProductTrend] = useState(PRODUCTS[0]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setTeamMembersCount(snapshot.size);
    });

    const unsubscribeMetrics = onSnapshot(collection(db, 'sales_metrics'), (snapshot) => {
      const metricsMap: Record<string, any> = {};
      snapshot.forEach(docSnap => {
        metricsMap[docSnap.id] = docSnap.data();
      });
      setSalesMetricsMap(metricsMap);
    });

    return () => {
      unsubscribe();
      unsubscribeMetrics();
    };
  }, []);

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

  // ⚡ Métricas de Performance
  const onTimeDeliveryRate = totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100)) : 100;
  const avgDeliveryDays = 14;

  // 📈 Cálculos de Vendas
  const quarterIndex = Math.floor(selMonth / 3);
  const quarterMonths = [quarterIndex * 3, quarterIndex * 3 + 1, quarterIndex * 3 + 2];
  const quarterKeys = quarterMonths.map(m => `${selYear}-${String(m + 1).padStart(2, '0')}`);
  
  // Chart Product Trend (Bar chart Mês Anterior, Mês Atual, Trimestre)
  let prevMonth = selMonth - 1;
  let prevYear = parseInt(selYear);
  if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
  }
  const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

  const c_cmDb = salesMetricsMap[selectedDate];
  const c_cmSold = c_cmDb?.[selectedProductTrend]?.quantidadeVendida || 0;
  const c_cmGoal = c_cmDb?.[selectedProductTrend]?.metaMensal || 0;

  const c_pmDb = salesMetricsMap[prevMonthKey];
  const c_pmSold = c_pmDb?.[selectedProductTrend]?.quantidadeVendida || 0;
  const c_pmGoal = c_pmDb?.[selectedProductTrend]?.metaMensal || 0;

  let c_qSold = 0;
  let c_qGoal = 0;
  quarterKeys.forEach(k => {
    const dbObj = salesMetricsMap[k];
    if (dbObj && dbObj[selectedProductTrend]) {
      c_qSold += (dbObj[selectedProductTrend].quantidadeVendida || 0);
      c_qGoal += (dbObj[selectedProductTrend].metaMensal || 0);
    }
  });

  const monthsLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const productTrendBarData = [
    { name: monthsLabels[prevMonth], Realizado: c_pmSold, Meta: c_pmGoal },
    { name: monthsLabels[selMonth] + ' (Atual)', Realizado: c_cmSold, Meta: c_cmGoal },
    { name: `Tri (Q${quarterIndex + 1})`, Realizado: c_qSold, Meta: c_qGoal },
  ];

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
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
              Acompanhamento de Vendas
            </h2>
            <p className="text-sm text-gray-500 ml-8">Vendas baseadas no filtro abaixo</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <input 
              type="month" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-gray-700 w-full sm:w-auto"
            />
            <div className="bg-white/50 border border-gray-200 rounded-xl p-1 flex items-center shrink-0 w-full sm:w-auto overflow-hidden">
              <button 
                onClick={() => setIsQuarterView(false)}
                className={cn("flex-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", !isQuarterView ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white")}
              >
                Mês
              </button>
              <button 
                onClick={() => setIsQuarterView(true)}
                className={cn("flex-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", isQuarterView ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white")}
              >
                Trimestre
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PRODUCTS.map(product => {
            let sold = 0;
            let goal = 0;
            
            if (isQuarterView) {
              quarterKeys.forEach(k => {
                const dbObj = salesMetricsMap[k];
                if (dbObj && dbObj[product]) {
                  sold += (dbObj[product].quantidadeVendida || 0);
                  goal += (dbObj[product].metaMensal || 0);
                }
              });
            } else {
              const cmDb = salesMetricsMap[selectedDate];
              sold = cmDb?.[product]?.quantidadeVendida || 0;
              goal = cmDb?.[product]?.metaMensal || 0;
            }

            const percentage = goal > 0 ? Math.min(100, Math.round((sold / goal) * 100)) : 0;
            
            // Projection
            let projecao = 0;
            if (!isQuarterView && passedBusinessDays > 0) {
              const metaDiariaReal = sold / passedBusinessDays;
              projecao = isCurrentMonth ? Math.round(sold + (metaDiariaReal * (totalBusinessDays - passedBusinessDays))) : sold;
            }

            return (
              <div key={product} className="bg-white/60 p-4 rounded-2xl border border-white/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full">
                  <div className={cn("h-full", percentage >= 100 ? "bg-success" : "bg-orange-500")} style={{ width: `${percentage}%` }}></div>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 truncate" title={product}>
                  {product} {isQuarterView ? `(Tri)` : ``}
                </h4>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Real</p>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{sold}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Meta</p>
                    <p className="text-sm font-semibold text-gray-600 leading-none">{goal}</p>
                  </div>
                </div>
                
                {!isQuarterView && isCurrentMonth && goal > 0 && (
                  <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-200/60 pb-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1 group/info relative cursor-help">
                      Projeção Mês
                      <Info className="w-3 h-3 text-gray-400" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-[11px] rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all shadow-xl z-[60] leading-tight">
                        A projeção é calculada dividindo as vendas atuais pelos dias úteis passados, e multiplicando pela quantidade total de dias úteis no mês.
                      </div>
                    </span>
                    <span className={cn("font-bold relative z-10", projecao >= goal ? "text-success" : "text-gray-900")}>
                      {projecao}
                    </span>
                  </div>
                )}
                
                <div className="mt-3 text-right relative z-10">
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

      {/* 📊 Tendência do Produto */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Tendência de Vendas por Equipamento
            </h3>
            <select
              value={selectedProductTrend}
              onChange={(e) => setSelectedProductTrend(e.target.value)}
              className="bg-white/50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-gray-700"
            >
              {PRODUCTS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productTrendBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#4B5563', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Realizado" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Meta" fill="#0D518E" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

