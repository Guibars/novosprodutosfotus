import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TrendingUp, DollarSign, Award, X, Edit2, ShieldCheck, MapPin, ChevronDown, Clock, Settings, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const COMPETITORS = [
  { id: "belenergy", name: "Belenergy", color: "text-blue-500", bg: "bg-blue-50", logo: "https://res.cloudinary.com/ddtpuucfi/image/upload/v1779822067/logo-bel-retina-1_ak5eqn.png" },
  { id: "soollar", name: "Soollar", color: "text-orange-500", bg: "bg-orange-50", logo: "https://res.cloudinary.com/ddtpuucfi/image/upload/v1779822342/soollar_e2rspy.png" },
  { id: "solfacil", name: "Solfácil", color: "text-emerald-500", bg: "bg-emerald-50", logo: "https://res.cloudinary.com/ddtpuucfi/image/upload/v1779822108/solfacil-logo-green-1_zwqsyj.png" },
  { id: "souenergy", name: "SouEnergy", color: "text-purple-500", bg: "bg-purple-50", logo: "https://res.cloudinary.com/ddtpuucfi/image/upload/v1779822422/Dimens_o-da-logo-da-Sou--180x60-px_amzxj2.png" }
];

const STANDARD_KITS = [
  "Kit 5 kWp (Fibrocimento - S/ String Box)",
  "Kit 10 kWp (Fibrocimento)",
  "Kit 15 kWp (Fibrocimento)",
  "Kit 50 kWp (Fibrocimento)"
];

const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

export function MarketIntelligence() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedRegion, setSelectedRegion] = useState<string>("Sul");
  
  const [editingKit, setEditingKit] = useState<{ competitorId: string; kitName: string } | null>(null);
  const [kitForm, setKitForm] = useState<{ price: number; inverterPower: string; modulePower: number; moduleQty: number; inverterBrand: string; batteryBrand: string; batteryPower: string }>({ price: 0, inverterPower: '', modulePower: 0, moduleQty: 0, inverterBrand: '', batteryBrand: '', batteryPower: '' });
  
  const [isGeneralViewOpen, setIsGeneralViewOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'market_prices'), (snapshot) => {
      const data: any = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setPrices(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openEditKit = (competitorId: string, kit: string) => {
    setEditingKit({ competitorId, kitName: kit });
    const compData = prices[`${competitorId}_${selectedRegion}`] || {};
    const currentKitData = compData[kit];
    
    if (typeof currentKitData === 'number') {
      setKitForm({ price: currentKitData, inverterPower: '', modulePower: 0, moduleQty: 0, inverterBrand: '', batteryBrand: '', batteryPower: '' });
    } else {
      setKitForm({
        price: currentKitData?.price || 0,
        inverterPower: currentKitData?.inverterPower || '',
        inverterBrand: currentKitData?.inverterBrand || '',
        modulePower: currentKitData?.modulePower || 0,
        moduleQty: currentKitData?.moduleQty || 0,
        batteryBrand: currentKitData?.batteryBrand || '',
        batteryPower: currentKitData?.batteryPower || ''
      });
    }
  };

  const handleSaveKit = async () => {
    try {
      if (!editingKit) return;
      const { competitorId, kitName } = editingKit;
      
      await setDoc(doc(db, 'market_prices', `${competitorId}_${selectedRegion}`), {
        [kitName]: kitForm,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name || user?.email || 'Unknown',
        region: selectedRegion
      }, { merge: true });
      
      setEditingKit(null);
    } catch(err) {
      console.error(err);
      setEditingKit(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando inteligência de mercado...</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex justify-between items-end shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Inteligência de Mercado
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhamento e comparação de preços dos principais concorrentes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 shadow-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none hover:border-gray-300 transition-colors"
            >
              {REGIONS.map(r => <option key={r} value={r}>Região {r}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => setIsGeneralViewOpen(true)}
            className="bg-gray-900 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-all shrink-0"
          >
            <Award className="w-4 h-4" />
            Visualização Geral (Ranking)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMPETITORS.map(comp => {
          const compData = prices[`${comp.id}_${selectedRegion}`] || {};
          const isRecentlyUpdated = compData.updatedAt && (new Date().getTime() - new Date(compData.updatedAt).getTime()) < 1000 * 60 * 60 * 24 * 7;
          
          return (
            <div key={comp.id} className={cn("bg-white rounded-3xl border shadow-sm p-6 hover:shadow-xl transition-all duration-300 relative group flex flex-col hover:-translate-y-1", isRecentlyUpdated ? "border-emerald-100" : "border-gray-100")}>
              
              <div className="flex items-start justify-between mb-6">
                <div className={cn("rounded-xl flex items-center shrink-0 h-14 w-[140px]", !comp.logo && cn("p-2.5 justify-center", comp.bg, comp.color))}>
                  {comp.logo ? (
                    <img src={comp.logo} alt={comp.name} className={cn("h-full w-full object-contain object-left", comp.id === 'soollar' && "scale-[4.5] ml-10 origin-left", comp.id === 'souenergy' && "scale-[1.2] origin-left")} referrerPolicy="no-referrer" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] uppercase font-black tracking-wider bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary/70" />
                    {selectedRegion}
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 mb-1 leading-tight">{comp.name}</h3>
              <div className="flex items-center gap-1.5 mb-5 border-b border-gray-100 pb-4">
                 <Clock className={cn("w-3.5 h-3.5", isRecentlyUpdated ? "text-emerald-500" : "text-gray-400")} />
                 <p className={cn("text-[10px] uppercase font-bold tracking-wider", isRecentlyUpdated ? "text-emerald-600" : "text-gray-400")}>
                   {compData.updatedAt ? `Atualizado: ${new Date(compData.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}` : 'Nunca Atualizado'}
                 </p>
              </div>
              
              <div className="space-y-3 flex-1">
                {STANDARD_KITS.map((kit, idx) => {
                  const kitData = compData[kit];
                  const price = typeof kitData === 'number' ? kitData : (kitData?.price || 0);

                  return (
                    <div key={idx} onClick={() => openEditKit(comp.id, kit)} className="flex flex-col p-3 bg-gray-50/60 rounded-2xl border border-gray-100 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all relative group/kit">
                      <Edit2 className="w-4 h-4 text-primary absolute top-3 right-3 opacity-0 group-hover/kit:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-bold text-gray-600 leading-tight mb-1 pr-6">{kit}</span>
                      <span className="text-base font-black text-gray-900">{price ? formatCurrency(Number(price)) : <span className="text-gray-300 text-sm font-medium italic">Não informado</span>}</span>
                      
                      {kitData && typeof kitData === 'object' && (kitData.inverterPower || kitData.modulePower > 0 || kitData.inverterBrand) && (
                          <div className="text-[10px] text-gray-500 font-medium leading-tight mt-2 pt-2 border-t border-gray-200 border-dashed">
                            {(kitData.inverterPower || kitData.inverterBrand) && (
                                <div className="mb-0.5"><span className="font-bold text-gray-600">Inv:</span> {kitData.inverterBrand} {kitData.inverterPower}</div>
                            )}
                            {kitData.moduleQty > 0 && kitData.modulePower > 0 && (
                                <div><span className="font-bold text-gray-600">Mód:</span> {kitData.moduleQty}x {kitData.modulePower}W ({(kitData.moduleQty * kitData.modulePower / 1000).toFixed(2)} kWp)</div>
                            )}
                            {(kitData.batteryBrand || kitData.batteryPower) && (
                                <div className="mt-0.5 pt-0.5 border-t border-gray-100"><span className="font-bold text-gray-600">Bat:</span> {kitData.batteryBrand} {kitData.batteryPower}</div>
                            )}
                          </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Kit Modal */}
      {editingKit && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 md:p-8">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            <button onClick={() => setEditingKit(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-[100] bg-white border border-gray-100 shadow-sm">
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center gap-3 mb-6">
               <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Edit2 className="w-5 h-5" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-gray-900">Editar Kit</h2>
                 <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1 uppercase tracking-wider">
                   {COMPETITORS.find(c => c.id === editingKit.competitorId)?.name} &bull; Região {selectedRegion}
                 </p>
               </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <h3 className="text-sm font-bold text-gray-800">{editingKit.kitName}</h3>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Preço Total do Kit (Obrigatório)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={kitForm.price || ''} 
                      onChange={e => setKitForm({...kitForm, price: Number(e.target.value)})} 
                      className="w-full pl-9 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-black text-lg text-gray-900 bg-white transition-colors" 
                      placeholder="0.00" 
                    />
                  </div>
               </div>

               <div className="pt-4 border-t border-gray-100">
                 <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Settings className="w-4 h-4 text-gray-400" /> Detalhes Técnicos do Kit
                 </h4>
                 
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Marca do Inversor</label>
                       <input 
                         type="text" 
                         value={kitForm.inverterBrand || ''} 
                         onChange={e => setKitForm({...kitForm, inverterBrand: e.target.value})} 
                         className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white transition-colors" 
                         placeholder="Ex: Deye" 
                       />
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Potência do Inversor</label>
                       <div className="relative">
                         <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input 
                           type="text" 
                           value={kitForm.inverterPower || ''} 
                           onChange={e => setKitForm({...kitForm, inverterPower: e.target.value})} 
                           className="w-full pl-9 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white transition-colors" 
                           placeholder="Ex: 5kW" 
                         />
                       </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Qtd. Módulos</label>
                       <input 
                         type="number" 
                         value={kitForm.moduleQty || ''} 
                         onChange={e => setKitForm({...kitForm, moduleQty: Number(e.target.value)})} 
                         className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white transition-colors" 
                         placeholder="Ex: 10" 
                       />
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Potência (W)</label>
                       <input 
                         type="number" 
                         value={kitForm.modulePower || ''} 
                         onChange={e => setKitForm({...kitForm, modulePower: Number(e.target.value)})} 
                         className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white transition-colors" 
                         placeholder="Ex: 550" 
                       />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Marca da Bateria</label>
                       <input 
                         type="text" 
                         value={kitForm.batteryBrand || ''} 
                         onChange={e => setKitForm({...kitForm, batteryBrand: e.target.value})} 
                         className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white transition-colors" 
                         placeholder="Ex: Moura" 
                       />
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Potência da Bateria</label>
                       <input 
                         type="text" 
                         value={kitForm.batteryPower || ''} 
                         onChange={e => setKitForm({...kitForm, batteryPower: e.target.value})} 
                         className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white transition-colors" 
                         placeholder="Ex: 100Ah" 
                       />
                     </div>
                   </div>
                   
                   {kitForm.moduleQty > 0 && kitForm.modulePower > 0 && (
                     <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 flex justify-between items-center text-sm font-bold">
                       <span>Total de Potência dos Módulos:</span>
                       <span>{((kitForm.moduleQty * kitForm.modulePower) / 1000).toFixed(2)} kWp</span>
                     </div>
                   )}
                 </div>
               </div>

               <button 
                 onClick={handleSaveKit} 
                 className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl mt-6 shadow-md hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
               >
                 <ShieldCheck className="w-5 h-5" />
                 Atualizar Kit
               </button>
             </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* General View Modal */}
      {isGeneralViewOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 md:p-8" onClick={() => setIsGeneralViewOpen(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-6xl h-full shadow-2xl relative flex flex-col cursor-default overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 shrink-0 gap-4 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-orange-100 text-orange-600 shadow-sm border border-orange-200">
                    <Award className="w-8 h-8" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-gray-900">Comparativo e Ranking</h2>
                   <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                     <MapPin className="w-4 h-4" /> Comparativo local focado na Região <strong>{selectedRegion}</strong>.
                   </p>
                 </div>
              </div>
              <button 
                onClick={() => setIsGeneralViewOpen(false)} 
                className="absolute top-6 right-6 p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                title="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-8 pr-2 custom-scrollbar">
              {STANDARD_KITS.map(kit => {
                // Determine ranking for this kit
                const compPrices = COMPETITORS.map(comp => {
                  const kData = prices[`${comp.id}_${selectedRegion}`]?.[kit];
                  const price = typeof kData === 'number' ? kData : (kData?.price || 0);
                  
                  return {
                    ...comp,
                    price,
                    kitData: kData
                  };
                }).filter(c => c.price > 0).sort((a, b) => a.price - b.price);

                return (
                  <div key={kit} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                     <h3 className="text-lg font-black text-gray-800 mb-6 border-l-4 border-primary pl-4">{kit}</h3>
                     
                     {compPrices.length > 0 ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         {compPrices.map((c, idx) => (
                           <div key={c.id} className={cn("p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden transition-all", idx === 0 ? "bg-emerald-50/40 border-emerald-300 shadow-sm" : "bg-gray-50/50 border-gray-200")}>
                              {idx === 0 && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  1º Lugar
                                </div>
                              )}
                              
                              <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2">
                                <span className={cn("text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white font-black shadow-sm", idx === 0 ? "bg-emerald-500" : "bg-gray-400")}>{idx + 1}º</span>
                                {c.name}
                              </p>
                              
                              <p className={cn("text-2xl font-black truncate tracking-tight", idx === 0 ? "text-emerald-700" : "text-gray-900")}>
                                {formatCurrency(c.price)}
                              </p>

                              {c.kitData && typeof c.kitData === 'object' && (c.kitData.inverterPower || c.kitData.modulePower > 0 || c.kitData.inverterBrand) && (
                                  <div className="mt-4 pt-4 border-t border-gray-200/60 border-dashed text-[11px] text-gray-500 font-medium">
                                    {(c.kitData.inverterPower || c.kitData.inverterBrand) && (
                                        <div className="mb-1.5"><span className="font-bold text-gray-700 uppercase tracking-wider text-[9px]">Inv:</span> {c.kitData.inverterBrand} {c.kitData.inverterPower}</div>
                                    )}
                                    {c.kitData.moduleQty > 0 && c.kitData.modulePower > 0 && (
                                        <div><span className="font-bold text-gray-700 uppercase tracking-wider text-[9px]">Mód:</span> {c.kitData.moduleQty}x {c.kitData.modulePower}W ({(c.kitData.moduleQty * c.kitData.modulePower / 1000).toFixed(2)} kWp)</div>
                                    )}
                                    {(c.kitData.batteryBrand || c.kitData.batteryPower) && (
                                        <div className="mt-1.5"><span className="font-bold text-gray-700 uppercase tracking-wider text-[9px]">Bat:</span> {c.kitData.batteryBrand} {c.kitData.batteryPower}</div>
                                    )}
                                  </div>
                              )}
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 text-center">
                         <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Nenhum valor cadastrado</p>
                         <p className="text-xs text-gray-400 mt-1">Atualize os preços na tela anterior para visualizar o ranking.</p>
                       </div>
                     )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

