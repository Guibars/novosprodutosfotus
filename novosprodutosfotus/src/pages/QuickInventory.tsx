import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Minus, Search as SearchIcon, Trash2, History, X, Package, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ["Bateria", "Carregador", "Drive", "RSD"];

const CARREGADORES_BENY = [
  "BMDC60-D 380V",
  "BMDC80-D 380V",
  "BMDC60-D V2 380V",
  "BMDC80-D V2 380V",
  "BBDC40 V2 380V",
  "BMDC120-D V2 380V"
];

const BATERIAS_UNIPOWER = [
  "UNPWR - 48V/100AH/4.8KWH"
];

const BATERIAS_DEYE = [
  "DEYE SE-F5-51.2V-100AH",
  "DEYE BOS-W 51.2V-100AH HV",
  "CONTROL BOX DEYE BOS-W-PDU-2"
];

const BATERIAS_GOODWE = [
  "GW LX-A5.0-30 SOLO",
  "GW LX-A5.0-30 PAREDE"
];

const CDs = ["ES", "PE", "BA", "PA", "GO", "SP", "SC", "FOTUS GALPÃO"];

const DEFAULT_PRODUCTS = [
  ...CARREGADORES_BENY.map(name => ({ name, brand: "Beny", categoryId: "Carregador" })),
  ...BATERIAS_UNIPOWER.map(name => ({ name, brand: "Unipower", categoryId: "Bateria" })),
  ...BATERIAS_DEYE.map(name => ({ name, brand: "Deye", categoryId: "Bateria" })),
  ...BATERIAS_GOODWE.map(name => ({ name, brand: "GoodWe", categoryId: "Bateria" }))
];

export function QuickInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<Record<string, any>>({});
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const [updateType, setUpdateType] = useState<"add" | "remove">("add");
  const [updateCD, setUpdateCD] = useState(CDs[0]);
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("");

  // Firebase Subscriptions
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'inventory_products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      
      // Seed default products if empty
      if (data.length === 0) {
        DEFAULT_PRODUCTS.forEach(async (prod) => {
          await addDoc(collection(db, 'inventory_products'), {
             ...prod,
             minQuantity: 0,
             createdAt: Timestamp.now()
          });
        });
      }
      setLoading(false);
    });

    const unsubStocks = onSnapshot(collection(db, 'inventory_stocks'), (snapshot) => {
      const stockData: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        stockData[doc.id] = doc.data();
      });
      setStocks(stockData);
    });

    const unsubHistory = onSnapshot(query(collection(db, 'inventory_history')), (snapshot) => {
      setStockHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.date?.toMillis() - a.date?.toMillis()));
    });

    return () => {
      unsubProducts();
      unsubStocks();
      unsubHistory();
    };
  }, []);

  const categoryProducts = products.filter(p => p.categoryId === selectedCategory);
  const availableBrands = Array.from(new Set(categoryProducts.map(p => p.brand).filter(Boolean))).sort();

  const filteredCategoryProducts = categoryProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
    return matchesSearch && matchesBrand;
  });

  useEffect(() => {
    if (categoryProducts.length > 0) {
      if (!selectedProductId || !categoryProducts.find(p => p.id === selectedProductId)) {
        if (filteredCategoryProducts.length > 0) {
           setSelectedProductId(filteredCategoryProducts[0].id);
        } else {
           setSelectedProductId(categoryProducts[0].id);
        }
      }
    } else {
      setSelectedProductId("");
    }
  }, [selectedCategory, categoryProducts.length, selectedBrands, filteredCategoryProducts.length]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const currentStock = stocks[selectedProductId] || {};

  const handleUpdateStock = async () => {
     if (!selectedProductId || !updateQuantity || !updateCD) return;
     const qty = parseInt(updateQuantity);
     if (isNaN(qty) || qty <= 0) return;

     const currentQtyForCD = currentStock[updateCD] || 0;
     const newQtyForCD = updateType === 'add' ? currentQtyForCD + qty : currentQtyForCD - qty;

     await setDoc(doc(db, 'inventory_stocks', selectedProductId), {
        [updateCD]: newQtyForCD,
        lastUpdated: Timestamp.now(),
        lastUpdatedBy: user?.name || user?.email || 'Unknown'
     }, { merge: true });

     await addDoc(collection(db, 'inventory_history'), {
        productId: selectedProductId,
        productName: selectedProduct?.name,
        cd: updateCD,
        type: updateType,
        quantity: qty,
        previousQuantity: currentQtyForCD,
        newQuantity: newQtyForCD,
        notes: updateNotes,
        date: Timestamp.now(),
        user: user?.name || user?.email || 'Unknown'
     });

     setIsUpdateModalOpen(false);
     setUpdateQuantity("");
     setUpdateNotes("");
  };

  const handleAddProduct = async () => {
     if (!prodName.trim()) return;
     await addDoc(collection(db, 'inventory_products'), {
         name: prodName,
         brand: prodBrand,
         categoryId: selectedCategory,
         minQuantity: 0,
         createdAt: Timestamp.now()
     });
     setIsAddProductModalOpen(false);
     setProdName("");
     setProdBrand("");
  };

  const handleDeleteProduct = async (id: string) => {
     if (window.confirm("Tem certeza que deseja remover este produto?")) {
        await deleteDoc(doc(db, 'inventory_products', id));
     }
  };

  const renderProductName = (name: string) => {
    const parts = name.split(/\b(SP|OFF-GRID)\b/g);
    return (
      <span className="inline-flex items-center flex-wrap gap-1">
        {parts.map((part, i) => {
          if (part === "SP") {
            return <span key={i} className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold leading-none border border-yellow-200">SP</span>;
          }
          if (part === "OFF-GRID") {
            return <span key={i} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold leading-none border border-blue-200">OFF-GRID</span>;
          }
          return <span key={i} className="whitespace-pre-wrap">{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Estoque Rápido</h1>
        <p className="text-sm text-gray-500 mt-1">Gerenciamento simplificado de estoque de Baterias, Carregadores, Drives e RSD</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
        {/* Top Controls: Categories */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedBrands([]);
                }}
                className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all", 
                  selectedCategory === cat 
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Marcas:</span>
              <button
                onClick={() => setSelectedBrands([])}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", 
                  selectedBrands.length === 0 
                    ? "bg-gray-900 text-white shadow-md" 
                    : "bg-white text-gray-500 hover:bg-gray-200 border border-gray-200"
                )}
              >
                Todas
              </button>
              {availableBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    if (selectedBrands.includes(brand)) {
                      setSelectedBrands(selectedBrands.filter(b => b !== brand));
                    } else {
                      setSelectedBrands([...selectedBrands, brand]);
                    }
                  }}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", 
                    selectedBrands.includes(brand)
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-white text-gray-500 hover:bg-gray-200 border border-gray-200"
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="relative flex-1 w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-sm"
            />
          </div>
          <button
            onClick={() => { setUpdateType("add"); setIsUpdateModalOpen(true); }}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all shrink-0", selectedProductId ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90" : "bg-gray-200 text-gray-500 cursor-not-allowed")}
            disabled={!selectedProductId}
          >
            Atualizar Estoque
          </button>
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col h-[600px] bg-gray-50/50">
            <div className="p-4 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900 text-sm">Produtos ({filteredCategoryProducts.length})</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {filteredCategoryProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={cn("w-full text-left p-3 rounded-xl transition-all flex flex-col relative group",
                    selectedProductId === p.id ? "bg-white shadow-sm ring-1 ring-primary/20" : "hover:bg-white border text-transparent border-transparent hover:border-gray-100"
                  )}
                >
                  <span className={cn("text-xs font-bold line-clamp-2", selectedProductId === p.id ? "text-primary" : "text-gray-700")}>
                    {renderProductName(p.name)}
                  </span>
                  {p.brand && <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{p.brand}</span>}
                  
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col">
            {selectedProduct ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20">
                    <Package className="w-10 h-10" />
                  </div>
                  
                  {selectedProduct.brand && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                      {selectedProduct.brand}
                    </span>
                  )}
                  
                  <h2 className="text-2xl font-black text-gray-900 mb-2">
                    {renderProductName(selectedProduct.name)}
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8 mb-6">
                    {CDs.map(cd => (
                      <div key={cd} className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 whitespace-nowrap">{cd}</span>
                        <span className={cn("text-3xl font-black tracking-tighter", (currentStock[cd] || 0) <= 0 ? "text-red-500" : "text-gray-900")}>
                          {currentStock[cd] || 0}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    Ver histórico de movimentações
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center h-[600px] text-gray-400">
                <Package className="w-12 h-12 mb-4 text-gray-300" />
                <p className="font-bold">Selecione um produto para visualizar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsAddProductModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-6">Novo Produto</h2>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Produto</label>
                  <input type="text" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Bateria X..." />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca (Opcional)</label>
                  <input type="text" value={prodBrand} onChange={e => setProdBrand(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: GoodWe" />
               </div>
               <button onClick={handleAddProduct} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {isUpdateModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsUpdateModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-1">Atualizar Estoque</h2>
            <p className="text-sm font-bold text-primary mb-6">{renderProductName(selectedProduct.name)}</p>
            
            <div className="space-y-4">
               <div className="flex gap-2 p-1 bg-gray-50 border border-gray-100 rounded-xl mb-2">
                 <button 
                   onClick={() => setUpdateType('add')} 
                   className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", updateType === 'add' ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700")}
                 >
                   Entrada
                 </button>
                 <button 
                   onClick={() => setUpdateType('remove')} 
                   className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", updateType === 'remove' ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700")}
                 >
                   Saída
                 </button>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Centro de Distribuição</label>
                  <select value={updateCD} onChange={e => setUpdateCD(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-900 bg-white">
                    {CDs.map(cd => (
                      <option key={cd} value={cd}>{cd}</option>
                    ))}
                  </select>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade</label>
                  <input type="number" min="1" value={updateQuantity} onChange={e => setUpdateQuantity(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-lg font-bold" placeholder="0" />
                  <p className="text-xs text-gray-500 mt-1 font-medium">Estoque atual neste CD: <strong className={cn((currentStock[updateCD] || 0) <= 0 ? "text-red-500" : "text-gray-900")}>{currentStock[updateCD] || 0}</strong></p>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observações / Motivo</label>
                  <textarea value={updateNotes} onChange={e => setUpdateNotes(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none" rows={3} placeholder="Ex: Recebimento NF 123..."></textarea>
               </div>
               <button onClick={handleUpdateStock} className={cn("w-full text-white font-bold py-3 rounded-xl mt-4 shadow-md", updateType === 'add' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-gray-900 hover:bg-gray-800')}>
                 Confirmar {updateType === 'add' ? 'Entrada' : 'Saída'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl relative">
            <button onClick={() => setIsHistoryModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-1">Histórico de Movimentações</h2>
            <p className="text-sm font-bold text-primary mb-6">{renderProductName(selectedProduct.name)}</p>
            
            <div className="overflow-y-auto flex-1 pr-2 relative">
               {stockHistory.filter(h => h.productId === selectedProduct.id).length === 0 ? (
                  <div className="text-center text-gray-400 py-10 font-bold">Nenhuma movimentação registrada.</div>
               ) : (
                  <div className="space-y-3">
                     {stockHistory.filter(h => h.productId === selectedProduct.id).map(record => (
                        <div key={record.id} className="p-4 border rounded-2xl flex items-center justify-between bg-gray-50">
                           <div className="flex items-center gap-4">
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white", record.type === 'add' ? 'bg-green-500' : 'bg-red-500')}>
                                 {record.type === 'add' ? <Plus className="w-5 h-5"/> : <Minus className="w-5 h-5"/>}
                              </div>
                              <div>
                                 <p className="font-bold text-gray-900">{record.type === 'add' ? 'Entrada' : 'Saída'} <span className="text-gray-400 font-medium text-xs ml-1">• {record.cd}</span></p>
                                 <p className="text-xs text-gray-500">{new Date(record.date?.toDate()).toLocaleString()} • Por {record.user}</p>
                                 {record.notes && <p className="text-sm text-gray-600 mt-1 italic">"{record.notes}"</p>}
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={cn("font-black text-lg", record.type === 'add' ? 'text-green-600' : 'text-red-600')}>
                                 {record.type === 'add' ? '+' : '-'}{record.quantity}
                              </p>
                              <p className="text-xs font-bold text-gray-400">Estoque: {record.newQuantity}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
