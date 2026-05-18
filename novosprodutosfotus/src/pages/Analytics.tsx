import React, { useState, useEffect } from "react";
import { useProjects } from "../contexts/ProjectContext";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from "recharts";
import { 
  FolderGit2, CheckCircle2, Clock, PauseCircle,
  AlertCircle, LayoutList, Target, TrendingUp, Users, Calendar, ShoppingCart, Info, Filter,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { cn } from "../lib/utils";

const PRODUCTS = ["Inversores Híbridos", "Bateria", "Drive", "RSD", "Carregador"];

const CircularProgress = ({ percentage, colorClass, size = 64, strokeWidth = 6 }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-100" />
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={colorClass} style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xs font-black text-gray-900 tracking-tighter">{percentage}%</span>
      </div>
    </div>
  );
};

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

  // Generate last 6 months data for the selected product
  const getLast6MonthsData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      let d = new Date(selYear, selMonth - i, 1);
      let m = d.getMonth() + 1;
      let y = d.getFullYear();
      let key = `${y}-${m.toString().padStart(2, '0')}`;
      let dbObj = salesMetricsMap[key];
      let sold = dbObj?.[selectedProductTrend]?.quantidadeVendida || 0;
      let goal = dbObj?.[selectedProductTrend]?.metaMensal || 0;
      data.push({
        id: key,
        monthName: monthsLabels[d.getMonth()],
        yearLabel: y.toString().substring(2),
        Realizado: sold,
        Meta: goal
      });
    }
    return data;
  };
  const trendData6Months = getLast6MonthsData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cockpit Comercial</h1>
        <p className="text-gray-500 mt-1">Visão detalhada do desempenho da equipe, projetos e tarefas.</p>
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
            let propostaAceita = 0;
            
            if (isQuarterView) {
              quarterKeys.forEach(k => {
                const dbObj = salesMetricsMap[k];
                if (dbObj && dbObj[product]) {
                  sold += (dbObj[product].quantidadeVendida || 0);
                  goal += (dbObj[product].metaMensal || 0);
                  propostaAceita += (dbObj[product].propostaAceita || dbObj[product].emAberto || 0);
                }
              });
            } else {
              const cmDb = salesMetricsMap[selectedDate];
              sold = cmDb?.[product]?.quantidadeVendida || 0;
              goal = cmDb?.[product]?.metaMensal || 0;
              propostaAceita = (cmDb?.[product]?.propostaAceita || cmDb?.[product]?.emAberto || 0);
            }

            const percentage = goal > 0 ? Math.min(100, Math.round((sold / goal) * 100)) : 0;
            
            // Projection
            let projecao = 0;
            if (!isQuarterView && passedBusinessDays > 0) {
              projecao = isCurrentMonth ? Math.round((sold / passedBusinessDays) * totalBusinessDays) : sold;
            }

            return (
              <div key={product} className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col relative overflow-visible group">
                <div className={cn("absolute -top-4 -right-4 w-28 h-28 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:opacity-30", percentage >= 100 ? "bg-success" : "bg-primary")}></div>
                
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <CircularProgress percentage={percentage} colorClass={percentage >= 100 ? "text-success" : "text-primary"} size={54} strokeWidth={5} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-[13px] leading-tight mb-0.5 line-clamp-2" title={product}>{product} {isQuarterView ? `(Tri)` : ``}</h4>
                    <p className={cn("text-[10px] uppercase font-bold tracking-wider", percentage >= 100 ? "text-success" : "text-gray-400")}>
                      {percentage >= 100 ? 'Meta Atingida!' : 'Em Progresso'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Real</p>
                    <p className="text-xl font-black text-gray-900 tracking-tighter">{sold}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Meta</p>
                    <p className="text-xl font-black text-gray-400 tracking-tighter">{goal}</p>
                  </div>
                </div>

                <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100/50 mb-auto relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-600/80 uppercase tracking-wider">Unidades em aberto</span>
                    <span className="text-lg font-black text-orange-600 leading-none">{propostaAceita}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100 relative z-10">
                  {!isQuarterView && isCurrentMonth && goal > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium flex items-center gap-1 group/info relative cursor-help">
                        Tendência 
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                        <div className={cn("absolute bottom-full mb-2 w-64 p-4 bg-gray-900 border border-gray-700 text-white rounded-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all shadow-2xl z-[9999] leading-relaxed", (product === 'RSD' || product === 'Carregador') ? "right-[-20px]" : "left-[-20px]")}>
                          <p className="font-semibold text-[13px] mb-1 text-white">Cálculo de Projeção Mensal</p>
                          <p className="text-gray-300 text-xs shadow-none whitespace-normal leading-relaxed">A projeção mapeia as vendas realizadas ({sold}) nos dias úteis passados ({passedBusinessDays}), e as multiplica pelos {totalBusinessDays} dias úteis do mês.</p>
                          <div className="mt-3 bg-black/50 p-2 rounded-lg font-mono text-white/70 text-[10px] border border-white/10 break-all whitespace-normal">Calc: ({sold} / {passedBusinessDays}) * {totalBusinessDays}</div>
                          <div className={cn("absolute -bottom-1.5 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 rotate-45", (product === 'RSD' || product === 'Carregador') ? "right-8" : "left-8")}></div>
                        </div>
                      </span>
                      <span className={cn("font-bold text-[13px]", projecao >= goal ? "text-success" : "text-gray-900")}>
                        {projecao}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-semibold flex items-center gap-1 group/info2 relative cursor-help">
                      Proposta Aceita
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                      <div className={cn("absolute bottom-full mb-2 w-60 p-4 bg-gray-900 border border-gray-700 text-white rounded-2xl opacity-0 invisible group-hover/info2:opacity-100 group-hover/info2:visible transition-all shadow-2xl z-[9999] leading-relaxed", (product === 'RSD' || product === 'Carregador') ? "right-[-20px]" : "left-[-20px]")}>
                        <p className="font-semibold text-[13px] mb-1 text-white">Proposta Aceita</p>
                        <p className="text-gray-300 text-xs shadow-none whitespace-normal leading-relaxed">Considera as vendas já realizadas ({sold}) mais a base de propostas aceitas ({propostaAceita}).</p>
                        <div className="mt-3 bg-black/50 p-2 rounded-lg font-mono text-white/70 text-[10px] border border-white/10 break-all whitespace-normal">Calc: {sold} + {propostaAceita}</div>
                        <div className={cn("absolute -bottom-1.5 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 rotate-45", (product === 'RSD' || product === 'Carregador') ? "right-8" : "left-8")}></div>
                      </div>
                    </span>
                    <span className={cn("font-black text-[14px]", (sold + propostaAceita) >= goal ? "text-success" : "text-gray-900")}>
                      {sold + propostaAceita}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trendData6Months.map((item, index) => {
              const perc = item.Meta > 0 ? Math.round((item.Realizado / item.Meta) * 100) : 0;
              const isLast = index === trendData6Months.length - 1;
              const isSuccess = perc >= 100 && item.Meta > 0;
              
              const prevItem = index > 0 ? trendData6Months[index - 1] : null;
              const growth = prevItem && prevItem.Realizado > 0 ? Math.round(((item.Realizado - prevItem.Realizado) / prevItem.Realizado) * 100) : null;
              
              return (
                <div key={item.id} className={cn("bg-white rounded-[1.5rem] p-5 shadow-sm border transition-shadow flex flex-col", isLast ? "border-primary/40 shadow-primary/5" : "border-gray-100/80 hover:shadow-md")}>
                  <div className="flex justify-between items-start mb-6">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", isLast ? "text-primary" : "text-gray-500")}>
                      {item.monthName} '{item.yearLabel}
                      {isLast && <span className="ml-1.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Atual</span>}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex flex-col gap-1 mb-2">
                      <span className="text-3xl font-black text-gray-900 leading-none">{item.Realizado}</span>
                      <span className="text-xs font-semibold text-gray-400">Meta: {item.Meta}</span>
                    </div>
                    <div className="h-4">
                      {growth !== null && growth !== 0 ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                          {growth > 0 ? (
                            <span className="text-success flex items-center bg-success/10 px-1.5 py-0.5 rounded"><ArrowUpRight className="w-3 h-3 mr-0.5"/> +{growth}% vs ant.</span>
                          ) : (
                            <span className="text-red-500 flex items-center bg-red-50 px-1.5 py-0.5 rounded"><ArrowDownRight className="w-3 h-3 mr-0.5"/> {Math.abs(growth)}% vs ant.</span>
                          )}
                        </div>
                      ) : index > 0 && prevItem?.Realizado === 0 && item.Realizado > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                          <span className="text-success flex items-center bg-success/10 px-1.5 py-0.5 rounded"><ArrowUpRight className="w-3 h-3 mr-0.5"/> Novo (100%)</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Atingimento</span>
                      <span className={cn("text-xs font-bold", isSuccess ? "text-success" : "text-orange-500")}>{Math.min(perc, 999)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", isSuccess ? "bg-success" : "bg-orange-400")} style={{ width: `${Math.min(perc, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

