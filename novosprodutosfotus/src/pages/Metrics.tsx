import React, { useState, useEffect } from "react";
import { Target, TrendingUp, Calendar as CalendarIcon, Save } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";

const PRODUCTS = ["Inversores Híbridos", "Bateria", "Drive", "RSD", "Carregador"];

export function Metrics() {
  const [metricsData, setMetricsData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonthKey, setCurrentMonthKey] = useState("");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Calculate business days in the current month
  const getBusinessDays = (y: number, m: number) => {
    let days = [];
    const date = new Date(y, m, 1);
    while (date.getMonth() === m) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) and Not Saturday (6)
        days.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const businessDays = getBusinessDays(year, month);
  const totalBusinessDays = businessDays.length;

  const passedBusinessDays = businessDays.filter(d => d.getDate() <= today.getDate()).length;

  useEffect(() => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    setCurrentMonthKey(key);

    const unsubscribe = onSnapshot(doc(db, 'sales_metrics', key), (docSnap) => {
      if (docSnap.exists()) {
        setMetricsData(docSnap.data());
      } else {
        const initialData = PRODUCTS.reduce((acc, p) => {
          acc[p] = { metaMensal: 0, metaTrimestral: 0, quantidadeVendida: 0 };
          return acc;
        }, {} as any);
        setMetricsData(initialData);
      }
    });

    return () => unsubscribe();
  }, [year, month]);

  const handleInputChange = (product: string, field: string, value: string) => {
    const numValue = Number(value) || 0;
    setMetricsData((prev: any) => ({
      ...prev,
      [product]: {
        ...prev[product],
        [field]: numValue
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'sales_metrics', currentMonthKey), metricsData, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar métricas:", error);
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Métricas e Metas de Venda
          </h1>
          <p className="text-gray-500 mt-1">Acompanhe as metas do setor, previsto vs realizado, e calendário focado.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-secondary hover:bg-secondary-hover text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-secondary/20"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      {/* Tabela/Cards de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {PRODUCTS.map(product => {
          const data = metricsData[product] || { metaMensal: 0, metaTrimestral: 0, quantidadeVendida: 0 };
          const metaDiaria = totalBusinessDays > 0 ? (data.metaMensal / totalBusinessDays) : 0;
          const previstoAcumulado = metaDiaria * passedBusinessDays;
          const realAcumulado = data.quantidadeVendida;
          
          return (
            <div key={product} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-5 shadow-xl shadow-black/5 flex flex-col gap-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2">{product}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Trimestral</label>
                  <input 
                    type="number" 
                    value={data.metaTrimestral || ""}
                    onChange={(e) => handleInputChange(product, "metaTrimestral", e.target.value)}
                    className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Mensal</label>
                  <input 
                    type="number" 
                    value={data.metaMensal || ""}
                    onChange={(e) => handleInputChange(product, "metaMensal", e.target.value)}
                    className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Vendido (Real)</label>
                  <input 
                    type="number" 
                    value={data.quantidadeVendida || ""}
                    onChange={(e) => handleInputChange(product, "quantidadeVendida", e.target.value)}
                    className="w-full bg-primary/5 border border-primary/20 text-primary rounded-lg px-3 py-1.5 text-lg font-bold focus:ring-2 focus:ring-primary/40 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Meta/Dia:</span>
                  <span className="font-semibold text-gray-900">{metaDiaria.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Previsto Acumulado:</span>
                  <span className="font-semibold text-orange-600">{Math.round(previstoAcumulado)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Real Acumulado:</span>
                  <span className={cn("font-semibold", realAcumulado >= previstoAcumulado ? "text-success" : "text-red-500")}>
                    {realAcumulado}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendário de Dias Úteis */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Calendário de Dias Úteis do Mês
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {businessDays.map((date, idx) => {
            const isToday = date.getDate() === today.getDate();
            const isPast = date.getDate() < today.getDate();
            return (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center justify-center border transition-all",
                  isToday ? "bg-primary text-white border-primary shadow-lg shadow-primary/30" : 
                  isPast ? "bg-white/60 border-white/20 text-gray-900" : "bg-white/30 border-dashed border-gray-300 text-gray-400"
                )}
              >
                <span className={cn("text-xs font-semibold uppercase opacity-80 mb-1")}>
                  {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                </span>
                <span className="text-2xl font-bold">
                  {date.getDate()}
                </span>
                <span className={cn("text-[10px] mt-1 opacity-70", isToday ? "font-bold" : "font-medium")}>
                  Dia {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
