import React, { useState, useEffect } from "react";
import { Package, Plus, Box, MapPin, Edit3, X, Check, Trash2, Search, Filter, LayoutGrid, Table, RotateCcw, SlidersHorizontal } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = ["Inversor", "Carregador DC", "RSD", "Bateria", "BESS", "Driver"];
const CDS = ["ES", "PE", "BA", "PA", "GO", "SP", "SC", "Fotus Galpão"];

export function Inventory() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any>({});
  const [localStocks, setLocalStocks] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Structured Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [selectedPower, setSelectedPower] = useState("ALL");
  
  const [showOnlyInStock, setShowOnlyInStock] = useState(() => {
    return localStorage.getItem("inventory_onlyInStock") === "true";
  });

  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    return (localStorage.getItem("inventory_viewMode") as "grid" | "table") || "grid";
  });

  useEffect(() => {
    localStorage.setItem("inventory_onlyInStock", showOnlyInStock.toString());
  }, [showOnlyInStock]);

  useEffect(() => {
    localStorage.setItem("inventory_viewMode", viewMode);
  }, [viewMode]);

  // Product form state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    brand: "",
    code: "",
    power: "",
    subCategory: ""
  });

  // Reset sub-filters when changing active category
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setIsEditing(false);
    setSearchQuery("");
    setSelectedBrand("ALL");
    setSelectedSubCategory("ALL");
    setSelectedPower("ALL");
  };

  useEffect(() => {
    // Fetch products for active category
    const q = query(collection(db, "inventory_products"), where("category", "==", activeCategory));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      const prods: any[] = [];
      snapshot.docs.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prods.sort((a, b) => a.name.localeCompare(b.name)));
    });

    return () => unsubProducts();
  }, [activeCategory]);

  useEffect(() => {
    // Fetch all stocks
    const unsubStocks = onSnapshot(collection(db, "inventory_stocks"), (snapshot) => {
      const data: any = {};
      snapshot.docs.forEach((doc) => {
        data[doc.id] = doc.data().quantity || 0;
      });
      setStocks(data);
      setLocalStocks(data); // Sync local state when not saving
    });

    return () => unsubStocks();
  }, []);

  const handleStockChange = (productId: string, cd: string, value: string) => {
    const key = `${productId}_${cd}`;
    setLocalStocks((prev: any) => ({
      ...prev,
      [key]: value === "" ? "" : parseInt(value, 10) || 0
    }));
  };

  const saveInventory = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(localStocks).map(([key, quantity]: [string, any]) => {
        if (quantity !== "" && quantity >= 0 && quantity !== stocks[key]) {
          return setDoc(doc(db, "inventory_stocks", key), {
            quantity: quantity,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving inventory", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const finalSubCategory = productForm.subCategory || 
      (activeCategory === "RSD" ? "Módulo RSD" : 
      (activeCategory === "Inversor" ? "Monofásico 127V" : ""));

    try {
      if (editingProductId) {
        await setDoc(doc(db, "inventory_products", editingProductId), {
          category: activeCategory,
          name: productForm.name.trim(),
          brand: productForm.brand.trim(),
          code: productForm.code.trim(),
          power: productForm.power.trim(),
          subCategory: finalSubCategory
        }, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "inventory_products"));
        await setDoc(newDocRef, {
          category: activeCategory,
          name: productForm.name.trim(),
          brand: productForm.brand.trim(),
          code: productForm.code.trim(),
          power: productForm.power.trim(),
          subCategory: finalSubCategory
        });
      }
      setProductForm({ name: "", brand: "", code: "", power: "", subCategory: "" });
      setEditingProductId(null);
    } catch (error) {
      console.error("Error saving product", error);
    }
  };

  const handleEditProduct = (product: any) => {
    setProductForm({
      name: product.name || "",
      brand: product.brand || "",
      code: product.code || "",
      power: product.power || "",
      subCategory: product.subCategory || 
        (activeCategory === "RSD" ? "Módulo RSD" : 
        (activeCategory === "Inversor" ? "Monofásico 127V" : ""))
    });
    setEditingProductId(product.id);
  };

  const handleCancelEdit = () => {
    setProductForm({ name: "", brand: "", code: "", power: "", subCategory: "" });
    setEditingProductId(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Tem certeza que deseja remover este produto? O histórico de estoque também será afetado.")) {
      try {
        await deleteDoc(doc(db, "inventory_products", productId));
      } catch (error) {
        console.error("Error deleting product", error);
      }
    }
  };

  // Extract Filter Options dynamically
  const availableBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort();
  const availableSubCategories = Array.from(new Set(products.map(p => p.subCategory).filter(Boolean))).sort();
  const availablePowers = Array.from(new Set(products.map(p => p.power).filter(Boolean)))
    .sort((a: any, b: any) => parseFloat(a) - parseFloat(b));

  const hasActiveFilters = searchQuery !== "" || selectedBrand !== "ALL" || selectedSubCategory !== "ALL" || selectedPower !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("ALL");
    setSelectedSubCategory("ALL");
    setSelectedPower("ALL");
  };

  // Filtered Products
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase().trim();
    const searchTerms = searchLower.split(' ').filter(t => t.length > 0);

    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
      (product.name && product.name.toLowerCase().includes(term)) ||
      (product.brand && product.brand.toLowerCase().includes(term)) ||
      (product.code && product.code.toLowerCase().includes(term)) ||
      (product.power && product.power.toString().includes(term)) ||
      (product.subCategory && product.subCategory.toLowerCase().includes(term))
    );

    const matchesBrand = selectedBrand === "ALL" || product.brand === selectedBrand;
    const matchesSubCategory = selectedSubCategory === "ALL" || product.subCategory === selectedSubCategory;
    const matchesPower = selectedPower === "ALL" || (product.power && `${product.power}kW` === selectedPower);

    return matchesSearch && matchesBrand && matchesSubCategory && matchesPower;
  });

  // Filtered CDs for Grid View
  const filteredCDs = CDS.map(cd => {
    const cdProducts = filteredProducts.filter(product => {
      const key = `${product.id}_${cd}`;
      const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);
      const hasStock = qty !== "" && Number(qty) > 0;
      return !showOnlyInStock || hasStock;
    });
    return { cd, products: cdProducts };
  }).filter(cdData => cdData.products.length > 0);

  // Filtered Products for Table View
  const tableProducts = filteredProducts.filter(product => {
    if (!showOnlyInStock) return true;
    const totalQty = CDS.reduce((sum, cd) => {
      const key = `${product.id}_${cd}`;
      const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);
      return sum + (Number(qty) || 0);
    }, 0);
    return totalQty > 0;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-secondary flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-secondary font-bold" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Controle de Estoque
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Visão consolidada de equipamentos distribuídos por CD.</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="px-3 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-secondary" />
            <span className="hidden sm:inline">Gerenciar Produtos</span>
          </button>

          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLocalStocks(stocks);
                }}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                onClick={saveInventory}
                disabled={isSaving}
                className="bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Salvar Estoque
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              Editar Quantidades
            </button>
          )}
        </div>
      </div>

      {/* Categories Bar (Horizontal Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                isActive
                  ? "bg-secondary text-white border-secondary shadow-xs"
                  : "bg-white/80 text-slate-600 border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-900"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filter & View Controls Panel (Frosted Glass) */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/90 shadow-xs space-y-3">
        {/* Main Filters Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={`Buscar em ${activeCategory}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-xs font-medium transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Structured Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="px-2.5 py-2 bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:border-secondary rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              >
                <option value="ALL">Marca: Todas ({availableBrands.length})</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {/* SubCategory/Tension Filter */}
            {availableSubCategories.length > 0 && (
              <select
                value={selectedSubCategory}
                onChange={e => setSelectedSubCategory(e.target.value)}
                className="px-2.5 py-2 bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:border-secondary rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              >
                <option value="ALL">
                  {activeCategory === "Inversor" ? "Tensão: Todas" : "Subcategoria: Todas"}
                </option>
                {availableSubCategories.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {/* Power Filter */}
            {availablePowers.length > 0 && (
              <select
                value={selectedPower}
                onChange={e => setSelectedPower(e.target.value)}
                className="px-2.5 py-2 bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:border-secondary rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              >
                <option value="ALL">Potência: Todas</option>
                {availablePowers.map(p => (
                  <option key={p} value={`${p}kW`}>{p} kW</option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* View Switch & Stock Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setShowOnlyInStock(false)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                !showOnlyInStock ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Todos os Itens
            </button>
            <button
              onClick={() => setShowOnlyInStock(true)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                showOnlyInStock ? "bg-secondary text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Em Estoque
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Exibição:</span>
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
                title="Visão por Cards de CD"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-xs">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
                title="Visão de Tabela Compacta Geral"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="text-xs">Tabela Matriz</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {products.length === 0 ? (
        <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-slate-300">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Nenhum produto em {activeCategory}</h3>
          <p className="text-xs text-slate-500 mb-4">Cadastre produtos nesta categoria para começar a controlar o estoque.</p>
          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="bg-secondary text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-secondary-hover transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-primary" />
            Cadastrar Produto
          </button>
        </div>
      ) : (viewMode === "grid" ? filteredCDs.length === 0 : tableProducts.length === 0) ? (
        <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-slate-300">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Nenhum resultado encontrado</h3>
          <p className="text-xs text-slate-500">Nenhum item corresponde aos filtros selecionados.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-secondary font-bold hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar Filtros
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Matrix Table View */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[220px]">Equipamento</th>
                  <th className="py-3 px-3 text-center">Marca</th>
                  <th className="py-3 px-3 text-center">Tensão / Tipo</th>
                  <th className="py-3 px-3 text-center">Potência</th>
                  <th className="py-3 px-3 text-center bg-slate-100/60 font-extrabold text-slate-700">Total</th>
                  {CDS.map(cd => (
                    <th key={cd} className="py-3 px-2 text-center min-w-[65px]">{cd}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tableProducts.map(product => {
                  const totalStock = CDS.reduce((sum, cd) => {
                    const key = `${product.id}_${cd}`;
                    const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);
                    return sum + (Number(qty) || 0);
                  }, 0);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        <div>{product.name}</div>
                        {product.code && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{product.code}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {product.brand && (
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 uppercase">
                            {product.brand}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {product.subCategory && (
                          <span className="text-[10px] font-bold text-secondary bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded">
                            {product.subCategory}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {product.power && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                            {product.power} kW
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold bg-slate-50/50">
                        <span className={cn(
                          "px-2 py-0.5 rounded font-bold text-xs",
                          totalStock > 0 ? "text-slate-900 bg-slate-200/80" : "text-slate-400"
                        )}>
                          {totalStock}
                        </span>
                      </td>
                      {CDS.map(cd => {
                        const key = `${product.id}_${cd}`;
                        const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);
                        const qtyNum = Number(qty) || 0;

                        return (
                          <td key={cd} className="py-2 px-1 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => handleStockChange(product.id, cd, e.target.value)}
                                className="w-12 text-center py-1 rounded border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 text-xs font-semibold bg-white"
                                placeholder="0"
                              />
                            ) : (
                              <span className={cn(
                                "inline-block px-1.5 py-0.5 rounded font-bold text-[11px]",
                                qtyNum > 10 ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60" :
                                qtyNum > 0 ? "text-amber-700 bg-amber-50 border border-amber-200/60" : "text-slate-300"
                              )}>
                                {qtyNum}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Compact Grid View by CD */
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <AnimatePresence mode="popLayout">
            {filteredCDs.map(({ cd, products: cdProducts }, cdIndex) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: cdIndex * 0.03 }}
                key={cd} 
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col h-full hover:border-slate-300 transition-all"
              >
                {/* CD Card Header */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{cd}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Centro de Distribuição</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {cdProducts.length} {cdProducts.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* CD Product Items */}
                <div className="flex-1 flex flex-col gap-2">
                  {cdProducts.map((product) => {
                    const key = `${product.id}_${cd}`;
                    const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);
                    const qtyNum = Number(qty) || 0;

                    return (
                      <div 
                        key={product.id} 
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 text-xs truncate leading-tight">
                            {product.name}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {product.brand && (
                              <span className="text-[9px] font-bold text-slate-700 bg-white border border-slate-200 px-1 py-0.5 rounded uppercase tracking-wider">
                                {product.brand}
                              </span>
                            )}
                            {product.subCategory && (
                              <span className="text-[9px] font-bold text-secondary bg-sky-50 border border-sky-100 px-1 py-0.5 rounded">
                                {product.subCategory}
                              </span>
                            )}
                            {product.power && (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded">
                                {product.power} kW
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => handleStockChange(product.id, cd, e.target.value)}
                              className="w-14 text-center py-1 rounded-lg border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-semibold text-slate-900 text-xs bg-white"
                              placeholder="0"
                            />
                          ) : (
                            <div className={cn(
                              "px-2 py-1 rounded-lg font-bold text-center text-[11px] whitespace-nowrap",
                              qtyNum > 10 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : 
                              qtyNum > 0 ? "bg-amber-50 text-amber-700 border border-amber-200/60" : "bg-slate-100 text-slate-400"
                            )}>
                              {qtyNum} un
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Product Management Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Gerenciar Cadastros de Produtos</h2>
                <p className="text-xs text-slate-500">Categoria selecionada: <span className="font-semibold text-secondary">{activeCategory}</span></p>
              </div>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-6">
              {/* Form */}
              <form onSubmit={handleSaveProduct} className="flex flex-col gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {editingProductId ? "Editar Produto" : "Novo Produto"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Inversor Hybrid 6kW"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 text-xs bg-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marca</label>
                    {activeCategory === "Inversor" ? (
                      <select
                        value={productForm.brand}
                        onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 text-xs bg-white outline-none font-medium"
                      >
                        <option value="">Selecione...</option>
                        <option value="Deye">Deye</option>
                        <option value="GoodWe">GoodWe</option>
                        <option value="Solis">Solis</option>
                        <option value="Solplanet">Solplanet</option>
                        {productForm.brand && !["Deye", "GoodWe", "Solis", "Solplanet"].includes(productForm.brand) && (
                          <option value={productForm.brand}>{productForm.brand}</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={productForm.brand}
                        onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Ex: Beny"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 text-xs bg-white outline-none"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Potência (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.power}
                      onChange={e => setProductForm(prev => ({ ...prev, power: e.target.value }))}
                      placeholder="Ex: 6"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 text-xs bg-white outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código</label>
                    <input
                      type="text"
                      value={productForm.code}
                      onChange={e => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Cod."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 text-xs bg-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {activeCategory === "RSD" ? (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="subCategory"
                          value="Módulo RSD"
                          checked={productForm.subCategory === "Módulo RSD" || !productForm.subCategory}
                          onChange={e => setProductForm(prev => ({ ...prev, subCategory: e.target.value }))}
                          className="w-3.5 h-3.5 text-secondary"
                        />
                        <span className="text-xs font-semibold text-slate-700">Módulo RSD</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="subCategory"
                          value="Unidade de Controle"
                          checked={productForm.subCategory === "Unidade de Controle"}
                          onChange={e => setProductForm(prev => ({ ...prev, subCategory: e.target.value }))}
                          className="w-3.5 h-3.5 text-secondary"
                        />
                        <span className="text-xs font-semibold text-slate-700">Unidade de Controle</span>
                      </label>
                    </div>
                  ) : activeCategory === "Inversor" ? (
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tensão:</label>
                      <select 
                        value={productForm.subCategory || "Monofásico 127V"}
                        onChange={e => setProductForm(prev => ({ ...prev, subCategory: e.target.value }))}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-secondary text-xs font-semibold bg-white outline-none"
                      >
                        <option value="Monofásico 127V">Monofásico 127V</option>
                        <option value="Monofásico 220V">Monofásico 220V</option>
                        <option value="Split Phase/Bifásico 127V/220V">Split Phase/Bifásico 127V/220V</option>
                        <option value="Trifásico 220V">Trifásico 220V</option>
                        <option value="Trifásico 380V">Trifásico 380V</option>
                      </select>
                    </div>
                  ) : <div></div>}

                  <div className="flex items-center gap-1.5 ml-auto">
                    {editingProductId && (
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={!productForm.name.trim()}
                      className="bg-secondary hover:bg-secondary-hover text-white py-1.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      {editingProductId ? <Check className="w-3 h-3 text-primary" /> : <Plus className="w-3 h-3 text-primary" />}
                      {editingProductId ? "Salvar Alterações" : "Adicionar Produto"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Product List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Produtos Cadastrados ({products.length})</h3>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Nenhum produto cadastrado nesta categoria.</div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                    {products.map(product => (
                      <div key={product.id} className={cn("flex items-center justify-between p-3 transition-colors", editingProductId === product.id ? "bg-amber-50/50" : "hover:bg-slate-50")}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Box className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {product.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {product.brand && (
                                <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60 uppercase">
                                  {product.brand}
                                </span>
                              )}
                              {product.subCategory && (
                                <span className="text-[9px] font-bold text-secondary bg-sky-50 border border-sky-100 px-1 py-0.5 rounded">
                                  {product.subCategory}
                                </span>
                              )}
                              {product.power && (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded">
                                  {product.power} kW
                                </span>
                              )}
                              {product.code && <span className="text-[9px] text-slate-400 font-mono">{product.code}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-secondary hover:bg-sky-50 rounded-lg transition-colors"
                            title="Editar Produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remover Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
