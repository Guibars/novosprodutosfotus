import React, { useState, useEffect } from "react";
import { Target, TrendingUp, Calendar as CalendarIcon, Save, Map } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";

const PRODUCTS = ["Inversores Híbridos", "Bateria", "Drive", "RSD", "Carregador"];

export function Metrics() {
  const [metricsData, setMetricsData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeProductTab, setActiveProductTab] = useState("Carregador");

  const [selYearStr, selMonthStr] = selectedDate.split('-');
  const year = parseInt(selYearStr, 10);
  const month = parseInt(selMonthStr, 10) - 1;

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

  const todayActual = new Date();
  const isCurrentMonth = todayActual.getFullYear() === year && todayActual.getMonth() === month;
  const isPastMonth = todayActual > new Date(year, month, 1);
  
  const passedBusinessDays = isCurrentMonth 
    ? businessDays.filter(d => d.getDate() <= todayActual.getDate()).length 
    : (isPastMonth ? totalBusinessDays : 0);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'sales_metrics', selectedDate), (docSnap) => {
      const regionsList = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const normalized = { ...data };
        PRODUCTS.forEach(p => {
          if (!normalized[p]) {
            normalized[p] = { metaMensal: 0, metaTrimestral: 0, quantidadeVendida: 0, propostaAceita: 0 };
          }
          if (!normalized[p].regioes) {
            normalized[p].regioes = {};
          }
          regionsList.forEach(r => {
            if (!normalized[p].regioes[r]) {
              normalized[p].regioes[r] = { vendas: 0, potencia: "" };
            }
          });
        });
        setMetricsData(normalized);
      } else {
        const initialData = PRODUCTS.reduce((acc, p) => {
          const regioesObj: Record<string, any> = {};
          regionsList.forEach(r => {
            regioesObj[r] = { vendas: 0, potencia: "" };
          });
          acc[p] = { 
            metaMensal: 0, 
            metaTrimestral: 0, 
            quantidadeVendida: 0, 
            propostaAceita: 0,
            regioes: regioesObj
          };
          return acc;
        }, {} as any);
        setMetricsData(initialData);
      }
    });

    return () => unsubscribe();
  }, [selectedDate]);

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

  const handleRegionalInputChange = (product: string, region: string, field: "vendas" | "potencia", value: string) => {
    setMetricsData((prev: any) => {
      const prodData = prev[product] || {};
      const regioes = prodData.regioes || {};
      const regData = regioes[region] || { vendas: 0, potencia: "" };
      
      return {
        ...prev,
        [product]: {
          ...prodData,
          regioes: {
            ...regioes,
            [region]: {
              ...regData,
              [field]: field === "vendas" ? (Number(value) || 0) : value
            }
          }
        }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'sales_metrics', selectedDate), metricsData, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar métricas:", error);
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Unidades em Aberto
          </h1>
          <p className="text-gray-500 mt-1">Acompanhe as metas do setor, previsto vs realizado, e calendário focado.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <input 
            type="month" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-gray-700 w-full sm:w-auto"
          />
          <button 
            onClick={handleSave}
            className="bg-secondary w-full sm:w-auto hover:bg-secondary-hover text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-secondary/20"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Tabela/Cards de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {PRODUCTS.map(product => {
          const data = metricsData[product] || { metaMensal: 0, metaTrimestral: 0, quantidadeVendida: 0, propostaAceita: 0 };
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
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unidades em Aberto</label>
                  <input 
                    type="number" 
                    value={data.propostaAceita !== undefined ? data.propostaAceita : (data.emAberto || "")}
                    onChange={(e) => handleInputChange(product, "propostaAceita", e.target.value)}
                    className="w-full bg-orange-50 border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                    placeholder="0"
                  />
                </div>
                {product === 'Carregador' && (
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Leads Quentes</label>
                    <input 
                      type="number" 
                      value={data.leadsQuentes || ""}
                      onChange={(e) => handleInputChange(product, "leadsQuentes", e.target.value)}
                      className="w-full bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-red-400 outline-none"
                      placeholder="0"
                    />
                  </div>
                )}
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
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-700 font-medium">Previsão (Fechamento):</span>
                  <span className="font-bold text-primary text-base">
                    {(data.quantidadeVendida || 0) + (data.propostaAceita || data.emAberto || 0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Métricas Regionais (Mapa Interativo) */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5 mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Map className="w-6 h-6 text-primary" />
              Métricas Regionais para o Mapa Interativo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Defina o volume de vendas e a potência de equipamento mais vendida em cada região geográfica do Brasil para o mapa interativo.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl shrink-0 self-start lg:self-center">
            {['Carregador', 'RSD'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setActiveProductTab(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                  activeProductTab === p ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"].map(region => {
            const productData = metricsData[activeProductTab] || {};
            const regionData = (productData.regioes && productData.regioes[region]) || { vendas: 0, potencia: "" };
            
            return (
              <div key={region} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-sm text-gray-800">{region}</span>
                  <span className="text-[9px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Região</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Qtd de Vendas (Unidades)</label>
                    <input
                      type="number"
                      value={regionData.vendas || ""}
                      onChange={(e) => handleRegionalInputChange(activeProductTab, region, "vendas", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Potência Mais Vendida</label>
                    <input
                      type="text"
                      value={regionData.potencia || ""}
                      onChange={(e) => handleRegionalInputChange(activeProductTab, region, "potencia", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Ex: 50 kWp, 10kW"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
