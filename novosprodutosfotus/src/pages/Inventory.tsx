import React, { useState, useEffect } from "react";
import { Package, Plus, Save, Box, MapPin, Edit3, X, Check, Trash2, ChevronDown, Search, Filter } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = ["Carregador DC", "RSD", "Bateria"];
const CDS = ["ES", "PE", "BA", "PA", "GO", "SP", "SC", "Fotus Galpão"];

export function Inventory() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any>({});
  const [localStocks, setLocalStocks] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showOnlyInStock, setShowOnlyInStock] = useState(() => {
    return localStorage.getItem("inventory_onlyInStock") === "true";
  });

  useEffect(() => {
    localStorage.setItem("inventory_onlyInStock", showOnlyInStock.toString());
  }, [showOnlyInStock]);

  // Product form state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    brand: "",
    code: "",
    power: "",
    subCategory: ""
  });

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
        // key is productId_cd
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

    const finalSubCategory = productForm.subCategory || (activeCategory === "RSD" ? "Módulo RSD" : "");

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
      subCategory: product.subCategory || (activeCategory === "RSD" ? "Módulo RSD" : "")
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

  // Derived state for filtered products
  const searchLower = searchQuery.toLowerCase();
  const searchTerms = searchLower.split(' ').filter(t => t.length > 0);

  const filteredCDs = CDS.map(cd => {
    const cdProducts = products.filter(product => {
      // 1. Search matching
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        (product.name && product.name.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.code && product.code.toLowerCase().includes(term)) ||
        (product.power && product.power.toString().includes(term)) ||
        (product.subCategory && product.subCategory.toLowerCase().includes(term))
      );
      
      // 2. Tag matching
      const matchesTag = !selectedTag || (
        (product.power ? `${product.power}kW` : null) === selectedTag ||
        product.brand === selectedTag ||
        product.subCategory === selectedTag
      );

      // 3. Stock matching
      const key = `${product.id}_${cd}`;
      const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);
      const hasStock = qty !== "" && Number(qty) > 0;
      
      const matchesStock = !showOnlyInStock || hasStock;
      
      return matchesSearch && matchesTag && matchesStock;
    });
    
    return { cd, products: cdProducts };
  }).filter(cdData => cdData.products.length > 0);

  // Generate quick filter tags
  const quickTags = Array.from(new Set(products.flatMap(p => [
    p.power ? `${p.power}kW` : null,
    p.brand,
    p.subCategory
  ]).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Controle de Estoque
            </h1>
            <p className="text-gray-500 mt-1">Gerencie o estoque distribuído por Centro de Distribuição.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Selector Pill */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-full shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produto:</span>
                <span className="font-semibold text-gray-900">{activeCategory}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {CATEGORIES.map(cat => (
                  <div 
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setIsEditing(false);
                    }}
                    className={cn(
                      "px-4 py-3 cursor-pointer text-sm font-medium transition-colors hover:bg-gray-50",
                      activeCategory === cat ? "text-primary bg-primary/5" : "text-gray-700"
                    )}
                  >
                    {cat}
                  </div>
                ))}
                <div 
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-t border-gray-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Gerenciar Produtos
                </div>
              </div>
            </div>

            {/* Action Button Pill */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setLocalStocks(stocks); // Reset changes
                  }}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={saveInventory}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 shadow-lg shadow-gray-900/20"
              >
                <Edit3 className="w-4 h-4" />
                Atualizar
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-3 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar por nome, marca, potência (ex: 60)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-2xl text-sm font-medium transition-all"
              />
            </div>
            
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl w-full sm:w-auto shrink-0">
              <button
                onClick={() => setShowOnlyInStock(false)}
                className={cn(
                  "flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  !showOnlyInStock
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Todos os Itens
              </button>
              <button
                onClick={() => setShowOnlyInStock(true)}
                className={cn(
                  "flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  showOnlyInStock 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Em Estoque
              </button>
            </div>
          </div>

          {quickTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Tags:</span>
              {quickTags.map(tag => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (isActive) {
                        setSelectedTag(null);
                      } else {
                        setSelectedTag(tag as string);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
          <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto cadastrado</h3>
          <p className="text-gray-500 mb-6">Cadastre produtos na categoria {activeCategory} para começar a gerenciar o estoque.</p>
          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="bg-primary text-white px-6 py-2 rounded-xl font-medium mx-auto flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Primeiro Produto
          </button>
        </div>
      ) : filteredCDs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
          <p className="text-gray-500">Não há produtos em estoque correspondentes à sua busca nos CDs.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
          {filteredCDs.map(({ cd, products: cdProducts }, cdIndex) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: cdIndex * 0.05 }}
              key={cd} 
              className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{cd}</h3>
                  <p className="text-xs text-gray-500 font-medium">Centro de Distribuição</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <AnimatePresence mode="popLayout">
                {cdProducts.map((product, index) => {
                  const key = `${product.id}_${cd}`;
                  const qty = isEditing ? (localStocks[key] ?? "") : (stocks[key] || 0);

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      key={product.id} 
                      className={cn("flex items-center justify-between gap-4 group py-3", index !== cdProducts.length - 1 ? "border-b border-gray-100" : "")}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-semibold text-gray-900 leading-tight">
                          {product.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {product.brand && (
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded tracking-wider uppercase">
                              {product.brand}
                            </span>
                          )}
                          {product.subCategory && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                              {product.subCategory}
                            </span>
                          )}
                          {product.power && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {product.power} kW
                            </span>
                          )}
                          {product.code && <span className="text-[10px] text-gray-400 font-mono">{product.code}</span>}
                        </div>
                      </div>
                      
                      <div className="shrink-0 w-24">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleStockChange(product.id, cd, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-center text-gray-900 text-sm bg-gray-50 focus:bg-white"
                            placeholder="0"
                          />
                        ) : (
                          <div className={cn(
                            "px-3 py-1.5 rounded-lg font-bold text-center text-sm",
                            qty > 10 ? "bg-green-50 text-green-700" : 
                            qty > 0 ? "bg-orange-50 text-orange-700" : "bg-gray-50 text-gray-400"
                          )}>
                            {qty} un
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Product Management Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gerenciar Produtos</h2>
                <p className="text-sm text-gray-500 mt-1">Categoria atual: <span className="font-semibold text-gray-700">{activeCategory}</span></p>
              </div>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nome do Produto</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Carregador 40kW"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-[120px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Marca</label>
                    <input
                      type="text"
                      value={productForm.brand}
                      onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Ex: Beny"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-[100px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Potência (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.power}
                      onChange={e => setProductForm(prev => ({ ...prev, power: e.target.value }))}
                      placeholder="Ex: 40"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
                    />
                  </div>
                  <div className="w-full sm:w-1/4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Código (Opcional)</label>
                    <input
                      type="text"
                      value={productForm.code}
                      onChange={e => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: BNY-40K"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {activeCategory === "RSD" ? (
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="subCategory"
                          value="Módulo RSD"
                          checked={productForm.subCategory === "Módulo RSD" || !productForm.subCategory}
                          onChange={e => setProductForm(prev => ({ ...prev, subCategory: e.target.value }))}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Módulo RSD</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="subCategory"
                          value="Unidade de Controle"
                          checked={productForm.subCategory === "Unidade de Controle"}
                          onChange={e => setProductForm(prev => ({ ...prev, subCategory: e.target.value }))}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Unidade de Controle</span>
                      </label>
                    </div>
                  ) : <div></div>}

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {editingProductId && (
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 h-[42px] px-4 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={!productForm.name.trim()}
                      className="bg-gray-900 hover:bg-gray-800 text-white h-[42px] px-5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {editingProductId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingProductId ? "Salvar" : "Adicionar"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Produtos Cadastrados ({products.length})</h3>
                {products.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">Nenhum produto cadastrado nesta categoria.</div>
                ) : (
                  products.map(product => (
                    <div key={product.id} className={cn("flex items-center justify-between p-4 rounded-xl border transition-colors", editingProductId === product.id ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200")}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Box className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-tight">
                            {product.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {product.brand && (
                              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded tracking-wider uppercase">
                                {product.brand}
                              </span>
                            )}
                            {product.subCategory && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                {product.subCategory}
                              </span>
                            )}
                            {product.power && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {product.power} kW
                              </span>
                            )}
                            {product.code && <span className="text-[10px] text-gray-400 font-mono">{product.code}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar Produto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right shrink-0">
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium transition-colors shadow-sm"
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
