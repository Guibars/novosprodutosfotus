import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
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
  ArrowUpRight, ArrowDownRight, Map, X, Maximize2, Minimize2
} from "lucide-react";
import { cn } from "../lib/utils";
import BrazilMapData from "@svg-maps/brazil";

const stateToRegion: Record<string, string> = {
  ac: "Norte", ap: "Norte", am: "Norte", pa: "Norte", ro: "Norte", rr: "Norte", to: "Norte",
  al: "Nordeste", ba: "Nordeste", ce: "Nordeste", ma: "Nordeste", pb: "Nordeste", pe: "Nordeste", pi: "Nordeste", rn: "Nordeste", se: "Nordeste",
  df: "Centro-Oeste", go: "Centro-Oeste", mt: "Centro-Oeste", ms: "Centro-Oeste",
  es: "Sudeste", mg: "Sudeste", rj: "Sudeste", sp: "Sudeste",
  pr: "Sul", rs: "Sul", sc: "Sul"
};

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
  const context = useOutletContext<{ isSidebarOpen?: boolean; setIsSidebarOpen?: (v: boolean) => void }>();
  const { projects } = useProjects();
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salesMetricsMap, setSalesMetricsMap] = useState<Record<string, any>>({});
  const [isQuarterView, setIsQuarterView] = useState(false);
  const [selectedProductTrend, setSelectedProductTrend] = useState(PRODUCTS[0]);
  
  // Interactive Map States
  const [selectedProductMap, setSelectedProductMap] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Auto-select region with highest sales volume on modal open
  useEffect(() => {
    if (selectedProductMap) {
      if (context?.setIsSidebarOpen) {
        context.setIsSidebarOpen(false); // Fechar sidebar automaticamente ao abrir o mapa
      }
      const currentMonthMetrics = salesMetricsMap[selectedDate] || {};
      const productMetrics = currentMonthMetrics[selectedProductMap] || {};
      const getRegionVendas = (r: string) => {
        if (productMetrics.regioes && productMetrics.regioes[r]) {
          return Number(productMetrics.regioes[r].vendas) || 0;
        }
        return 0;
      };
      const regionsList = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
      let topRegion = "Sudeste";
      let maxV = -1;
      regionsList.forEach(r => {
        const v = getRegionVendas(r);
        if (v > maxV) {
          maxV = v;
          topRegion = r;
        }
      });
      setSelectedRegion(topRegion);
    } else {
      setSelectedRegion(null);
      setHoveredRegion(null);
      setIsMapExpanded(false);
    }
  }, [selectedProductMap, selectedDate, salesMetricsMap]);
  
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cockpit Novos Produtos</h1>
        <p className="text-gray-500 mt-1">Visão detalhada do desempenho da equipe, acompanhamento de produtos.</p>
      </div>

      {/* 🚀 Métricas de Vendas (Integração) */}
      <div className="glass-panel rounded-[2rem] p-6">
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
              className="glass-input rounded-xl px-4 py-2 text-sm font-medium text-gray-700 w-full sm:w-auto"
            />
            <div className="glass-segment rounded-xl shrink-0 w-full sm:w-auto overflow-hidden">
              <button
                onClick={() => setIsQuarterView(false)}
                className={cn("seg-btn flex-1 px-4 py-1.5 text-sm", !isQuarterView && "seg-btn-active")}
              >
                Mês
              </button>
              <button
                onClick={() => setIsQuarterView(true)}
                className={cn("seg-btn flex-1 px-4 py-1.5 text-sm", isQuarterView && "seg-btn-active")}
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
            let leadsQuentes = 0;
            
            if (isQuarterView) {
              quarterKeys.forEach(k => {
                const dbObj = salesMetricsMap[k];
                if (dbObj && dbObj[product]) {
                  sold += (dbObj[product].quantidadeVendida || 0);
                  goal += (dbObj[product].metaMensal || 0);
                  const pA = dbObj[product].propostaAceita !== undefined ? dbObj[product].propostaAceita : dbObj[product].emAberto;
                  propostaAceita += (pA || 0);
                  leadsQuentes += (dbObj[product].leadsQuentes || 0);
                }
              });
            } else {
              const cmDb = salesMetricsMap[selectedDate];
              sold = cmDb?.[product]?.quantidadeVendida || 0;
              goal = cmDb?.[product]?.metaMensal || 0;
              propostaAceita = cmDb?.[product]?.propostaAceita !== undefined ? cmDb?.[product]?.propostaAceita : (cmDb?.[product]?.emAberto || 0);
              leadsQuentes = cmDb?.[product]?.leadsQuentes || 0;
            }

            const percentage = goal > 0 ? Math.min(100, Math.round((sold / goal) * 100)) : 0;
            
            // Projection
            let projecao = 0;
            if (!isQuarterView && passedBusinessDays > 0) {
              projecao = isCurrentMonth ? Math.round((sold / passedBusinessDays) * totalBusinessDays) : sold;
            }

            const isMapEnabled = product === 'Carregador' || product === 'RSD';

            return (
              <div 
                key={product} 
                onClick={() => isMapEnabled && setSelectedProductMap(product)}
                className={cn(
                  "glass-card rounded-[1.75rem] p-5 flex flex-col relative overflow-hidden group",
                  isMapEnabled ? "hover-lift hover:border-primary/40 cursor-pointer" : ""
                )}
              >
                <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700", isMapEnabled ? "group-hover:scale-150 group-hover:opacity-30" : "", percentage >= 100 ? "bg-success" : "bg-primary")}></div>
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="shrink-0">
                    <CircularProgress percentage={percentage} colorClass={percentage >= 100 ? "text-success" : "text-primary"} size={52} strokeWidth={5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2" title={product}>{product} {isQuarterView ? `(Tri)` : ``}</h4>
                    <p className={cn("text-[10px] uppercase font-bold tracking-wider", percentage >= 100 ? "text-success" : "text-gray-400")}>
                      {percentage >= 100 ? 'Meta Atingida!' : 'Em Progresso'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                  <div className="glass-tile rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Real</p>
                    <p className="text-xl font-black text-gray-900 tracking-tighter">{sold}</p>
                  </div>
                  <div className="glass-tile rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Meta</p>
                    <p className="text-xl font-black text-gray-400 tracking-tighter">{goal}</p>
                  </div>
                </div>

                <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100/50 mb-auto relative z-10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-600/80 uppercase tracking-wider">Unidades em aberto</span>
                    <span className="text-lg font-black text-orange-600 leading-none">{propostaAceita}</span>
                  </div>
                  {product === 'Carregador' && (
                    <div className="flex items-center justify-between border-t border-orange-200/50 pt-2 mt-1">
                      <span className="text-[11px] font-bold text-red-500/80 uppercase tracking-wider">Leads Quentes</span>
                      <span className="text-lg font-black text-red-500 leading-none">{leadsQuentes}</span>
                    </div>
                  )}
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
                  
                  {/* Interactive Map Indicator - Bottom Row */}
                  {isMapEnabled && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 relative z-10">
                      <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-primary transition-colors bg-gray-50 group-hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-transparent group-hover:border-primary/20">
                        <Map className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-black">Mapa</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 Tendência do Produto */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel rounded-[2rem] p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Tendência de Vendas por Equipamento
            </h3>
            <select
              value={selectedProductTrend}
              onChange={(e) => setSelectedProductTrend(e.target.value)}
              className="glass-input rounded-xl px-4 py-2 text-sm font-medium text-gray-700"
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
                <div key={item.id} className={cn("glass-card hover-lift rounded-[1.75rem] p-5 flex flex-col", isLast && "border-primary/40 ring-1 ring-primary/20")}>
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

      {/* Interactive Regional Map Modal */}
      {selectedProductMap && (() => {
        const currentMonthMetrics = salesMetricsMap[selectedDate] || {};
        const productMetrics = currentMonthMetrics[selectedProductMap] || {};
        
        const getRegionData = (regionName: string) => {
          if (productMetrics.regioes && productMetrics.regioes[regionName]) {
            return {
              vendas: Number(productMetrics.regioes[regionName].vendas) || 0,
              potencia: productMetrics.regioes[regionName].potencia || "Não cadastrada"
            };
          }
          return { vendas: 0, potencia: "Não cadastrada" };
        };

        const regionsList = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
        const maxSales = Math.max(...regionsList.map(r => getRegionData(r).vendas), 1);
        const totalSales = regionsList.reduce((acc, r) => acc + getRegionData(r).vendas, 0);

        // Sort regions by sales
        const sortedRegions = [...regionsList].sort((a, b) => getRegionData(b).vendas - getRegionData(a).vendas);
        const topRegion = sortedRegions[0];

        const activeRegion = hoveredRegion || selectedRegion || topRegion;
        const activeRegionData = getRegionData(activeRegion);

        return (
          <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4 lg:p-6" id="map-modal">
            <div className={cn("glass-modal rounded-[2rem] p-5 lg:p-6 relative flex flex-col transition-all duration-300 overflow-y-auto lg:overflow-hidden animate-pop-in", isMapExpanded ? "w-[95vw] h-[95vh] max-w-none" : "w-full max-w-5xl max-h-[90vh] lg:h-[85vh]")} id="map-modal-content">
              
              {/* Header Compact */}
              <div className="flex items-start justify-between mb-4 border-b border-gray-100 pb-4 shrink-0">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-gray-900">{selectedProductMap}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                        Mapa Interativo
                      </span>
                   </div>
                   <p className="text-xs text-gray-500">
                      Referente a <strong className="font-semibold text-gray-700">{monthsLabels[selMonth]} de {selYear}</strong>. Passe o mouse ou clique nas regiões para ver o detalhamento comercial.
                   </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    className="icon-btn p-2 rounded-xl bg-white/60 hidden lg:flex"
                    title={isMapExpanded ? "Reduzir" : "Expandir"}
                  >
                    {isMapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setSelectedProductMap(null)}
                    className="icon-btn p-2 rounded-xl bg-white/60"
                    id="close-modal-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 lg:h-full lg:min-h-0 lg:overflow-hidden">
                
                {/* Map Container */}
                <div className={cn("glass-tile rounded-2xl p-4 flex flex-col items-center justify-center relative lg:min-h-0", isMapExpanded ? "lg:col-span-6 min-h-[400px] lg:h-full" : "lg:col-span-5 min-h-[300px] lg:h-full")}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 self-start absolute top-4 left-4 z-10 hidden sm:block">
                    Visão Regional
                  </h4>
                  
                  <div className="flex-1 w-full flex items-center justify-center relative min-h-0 mt-2 lg:mt-0 lg:h-full">
                    <svg viewBox={BrazilMapData.viewBox} className="w-full h-full max-h-[100%] max-w-[320px] lg:max-w-none drop-shadow-xl filter pb-2 object-contain mx-auto">
                    <g>
                    {BrazilMapData.locations.map(location => {
                      const region = stateToRegion[location.id];
                      const rData = getRegionData(region);
                      const isHovered = hoveredRegion === region;
                      const isActive = activeRegion === region;
                      const fillIntensity = rData.vendas === 0 ? 0 : 0.15 + (rData.vendas / maxSales) * 0.7;
                      return (
                        <path
                          key={location.id}
                          id={location.id}
                          name={location.name}
                          d={location.path}
                          className={cn(
                            "transition-all duration-300 stroke-white stroke-[1.5px] cursor-pointer outline-none"
                          )}
                          fill={
                            isActive
                              ? "rgba(249, 115, 22, 1)"
                              : isHovered
                                ? "rgba(249, 115, 22, 0.85)"
                                : rData.vendas === 0
                                  ? "#E5E7EB"
                                  : `rgba(249, 115, 22, ${fillIntensity})`
                          }
                          style={{
                            filter: isActive ? "drop-shadow(0px 4px 12px rgba(249, 115, 22, 0.5))" : "none"
                          }}
                          onMouseEnter={() => setHoveredRegion(region)}
                          onMouseLeave={() => setHoveredRegion(null)}
                          onClick={() => setSelectedRegion(region)}
                        >
                          <title>{location.name} ({region})</title>
                        </path>
                      );
                    })}
                    </g>
                    {/* Labels de Regiões Manuais baseadas no viewBox (0 0 613 639) */}
                    <g className="pointer-events-none select-none">
                      <text x="180" y="200" className={cn("font-bold text-sm transition-colors duration-200", activeRegion === "Norte" || getRegionData("Norte").vendas > 0 ? "fill-white drop-shadow-md" : "fill-gray-500")} textAnchor="middle">NORTE</text>
                      <text x="470" y="220" className={cn("font-bold text-sm transition-colors duration-200", activeRegion === "Nordeste" || getRegionData("Nordeste").vendas > 0 ? "fill-white drop-shadow-md" : "fill-gray-500")} textAnchor="middle">NORDESTE</text>
                      <text x="320" y="360" className={cn("font-bold text-sm transition-colors duration-200", activeRegion === "Centro-Oeste" || getRegionData("Centro-Oeste").vendas > 0 ? "fill-white drop-shadow-md" : "fill-gray-500")} textAnchor="middle">C. OESTE</text>
                      <text x="440" y="430" className={cn("font-bold text-sm transition-colors duration-200", activeRegion === "Sudeste" || getRegionData("Sudeste").vendas > 0 ? "fill-white drop-shadow-md" : "fill-gray-500")} textAnchor="middle">SUDESTE</text>
                      <text x="310" y="520" className={cn("font-bold text-sm transition-colors duration-200", activeRegion === "Sul" || getRegionData("Sul").vendas > 0 ? "fill-white drop-shadow-md" : "fill-gray-500")} textAnchor="middle">SUL</text>
                    </g>
                  </svg>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider justify-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-200 border border-gray-300"></span>
                      Sem vendas
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-200"></span>
                      Baixo vol.
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Alto vol.
                    </div>
                  </div>
                </div>

                {/* Region Details */}
                <div className={cn("flex flex-col gap-3 lg:overflow-y-auto pr-2 scrollbar-hide lg:h-full lg:min-h-0 pb-4", isMapExpanded ? "lg:col-span-6" : "lg:col-span-7")}>
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Ranking & Desempenho Regional
                    </h4>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {totalSales} unid. totais
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {sortedRegions.map((regionName, idx) => {
                      const rData = getRegionData(regionName);
                      const isCurrentActive = regionName === activeRegion;
                      const percentage = totalSales > 0 ? Math.round((rData.vendas / totalSales) * 100) : 0;
                      
                      return (
                        <div 
                          key={regionName}
                          onClick={() => setSelectedRegion(regionName)}
                          className={cn(
                            "rounded-2xl transition-all duration-300 cursor-pointer border overflow-hidden flex flex-col relative shrink-0",
                            isCurrentActive
                              ? "glass-card border-primary/40"
                              : "glass-tile border-white/50 hover:bg-white/85 hover:border-white"
                          )}
                        >
                          {/* Background Progress Bar for inactive state or subtle for active */}
                          {!isCurrentActive && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-orange-500/20 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <div className={cn("p-4 flex items-center justify-between", isCurrentActive ? "pb-3 border-b border-gray-50" : "")}>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                                idx === 0 && !isCurrentActive ? "bg-amber-100 text-amber-700" :
                                idx === 1 && !isCurrentActive ? "bg-gray-200 text-gray-700" : 
                                idx === 2 && !isCurrentActive ? "bg-orange-100 text-orange-700" :
                                isCurrentActive ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-white text-gray-400 border border-gray-200"
                              )}>
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={cn("font-black text-sm", isCurrentActive ? "text-gray-900" : "text-gray-700")}>{regionName}</span>
                                  {isCurrentActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                  )}
                                </div>
                                {!isCurrentActive && percentage > 0 && (
                                  <span className="text-[10px] font-bold text-gray-400 block mt-0.5">{percentage}% do nacional</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <span className={cn("font-black", isCurrentActive ? "text-xl text-primary" : "text-sm text-gray-900")}>
                                {rData.vendas} <span className={cn("text-[10px] uppercase font-bold", isCurrentActive ? "text-primary/70" : "text-gray-400")}>un</span>
                              </span>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <div className={cn(
                            "grid grid-cols-2 gap-3 transition-all duration-300 ease-in-out px-4",
                            isCurrentActive ? "py-4 opacity-100 max-h-[200px]" : "max-h-0 opacity-0 overflow-hidden py-0"
                          )}>
                            <div className="glass-tile rounded-xl p-3">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Participação
                              </p>
                              <div className="flex items-end gap-2">
                                <p className="text-lg font-black text-gray-900 leading-none">
                                  {percentage}%
                                </p>
                                <p className="text-[9px] font-bold text-gray-500 pb-0.5">do volume total</p>
                              </div>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                            
                            <div className="glass-tile rounded-xl p-3">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Potência Destaque
                              </p>
                              <p className="text-sm font-black text-gray-900 leading-tight truncate" title={rData.potencia}>
                                {rData.potencia}
                              </p>
                              <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                                Mais vendido
                              </p>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

