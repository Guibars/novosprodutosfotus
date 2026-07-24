import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, X, Trash2, Package, Tag, MessageSquare, User, TrendingUp, Inbox, Search, CheckCircle2, ListFilter, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function TransferBoard() {
  const { user } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [newStageIsCompleted, setNewStageIsCompleted] = useState(false);
  const [newStageIsCancelled, setNewStageIsCancelled] = useState(false);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [addingToStageId, setAddingToStageId] = useState("");
  const [cardData, setCardData] = useState<{
    title: string;
    productCode: string;
    quantity: string;
    extraProducts: { code: string; quantity: string; description: string; }[];
    destinationCd: string;
    observations: string;
    assignedTo: string;
    consultantName: string;
  }>({
    title: "",
    productCode: "",
    quantity: "",
    extraProducts: [],
    destinationCd: "",
    observations: "",
    assignedTo: "",
    consultantName: ""
  });

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'card' | 'stage' | 'cancelled_cards', stageId?: string } | null>(null);
  const [clearingCancelled, setClearingCancelled] = useState(false);

  const [generatedEmailPreview, setGeneratedEmailPreview] = useState<string | null>(null);

  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyMyTransfers, setOnlyMyTransfers] = useState(false);

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);

  useEffect(() => {
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStages = onSnapshot(query(collection(db, 'transfer_stages'), orderBy('order')), (snapshot) => {
      setStages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCards = onSnapshot(query(collection(db, 'transfer_cards'), orderBy('createdAt')), (snapshot) => {
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubProfiles();
      unsubStages();
      unsubCards();
    };
  }, []);

  const openAddStageModal = () => {
    setEditingStageId(null);
    setNewStageName("");
    setNewStageIsCompleted(false);
    setNewStageIsCancelled(false);
    setIsAddStageModalOpen(true);
  };

  const openEditStageModal = (stage: any) => {
    setEditingStageId(stage.id);
    setNewStageName(stage.name || "");
    setNewStageIsCompleted(!!stage.isCompletedStage);
    setNewStageIsCancelled(!!stage.isCancelledStage);
    setIsAddStageModalOpen(true);
  };

  const handleSaveStage = async () => {
    if (!newStageName.trim()) return;
    
    if (editingStageId) {
      await updateDoc(doc(db, 'transfer_stages', editingStageId), {
        name: newStageName,
        isCompletedStage: newStageIsCompleted,
        isCancelledStage: newStageIsCancelled
      });
    } else {
      await addDoc(collection(db, 'transfer_stages'), {
        name: newStageName,
        isCompletedStage: newStageIsCompleted,
        isCancelledStage: newStageIsCancelled,
        order: stages.length,
        createdAt: serverTimestamp()
      });
    }
    setNewStageName("");
    setNewStageIsCompleted(false);
    setNewStageIsCancelled(false);
    setIsAddStageModalOpen(false);
  };

  const openAddCardModal = (stageId: string) => {
    setEditingCardId(null);
    setAddingToStageId(stageId);
    setCardData({
      title: "",
      productCode: "",
      quantity: "",
      extraProducts: [],
      destinationCd: "",
      observations: "",
      assignedTo: "",
      consultantName: ""
    });
    setGeneratedEmailPreview(null);
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (card: any) => {
    setEditingCardId(card.id);
    setAddingToStageId(card.stageId);
    setCardData({
      title: card.title || "",
      productCode: card.productCode || "",
      quantity: card.quantity || "",
      extraProducts: card.extraProducts || [],
      destinationCd: card.destinationCd || "",
      observations: card.observations || "",
      assignedTo: card.assignedTo || "",
      consultantName: card.consultantName || ""
    });
    setGeneratedEmailPreview(null);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!cardData.title.trim()) return;
    if (editingCardId) {
      await updateDoc(doc(db, 'transfer_cards', editingCardId), {
        ...cardData,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'transfer_cards'), {
        ...cardData,
        stageId: addingToStageId,
        createdBy: user?.displayName || user?.email || 'Unknown',
        createdByUid: user?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    setIsCardModalOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.stopPropagation();
    setDraggedCardId(cardId);
    e.dataTransfer.setData("type", "card");
    e.dataTransfer.setData("id", cardId);
  };

  const handleStageDragStart = (e: React.DragEvent, stageId: string) => {
    e.stopPropagation();
    setDraggedStageId(stageId);
    e.dataTransfer.setData("type", "stage");
    e.dataTransfer.setData("id", stageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData("type");
    const dragId = e.dataTransfer.getData("id");

    if (dragType === "stage") {
      if (dragId && dragId !== targetStageId) {
        const draggedIndex = stages.findIndex(s => s.id === dragId);
        const targetIndex = stages.findIndex(s => s.id === targetStageId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newStages = [...stages];
          const [draggedStage] = newStages.splice(draggedIndex, 1);
          newStages.splice(targetIndex, 0, draggedStage);
          
          await Promise.all(newStages.map((s, idx) => 
            updateDoc(doc(db, 'transfer_stages', s.id), { order: idx })
          ));
        }
      }
      setDraggedStageId(null);
      return;
    }

    const cardIdToMove = dragId || draggedCardId;
    if (!cardIdToMove) return;

    const card = cards.find(c => c.id === cardIdToMove);
    if (card && card.stageId !== targetStageId) {
      await updateDoc(doc(db, 'transfer_cards', cardIdToMove), {
        stageId: targetStageId,
        updatedAt: serverTimestamp()
      });
    }
    setDraggedCardId(null);
  };

  const handleDeleteCard = (id: string) => {
    setItemToDelete({ id, type: 'card' });
  };

  const handleDeleteStage = (id: string) => {
    setItemToDelete({ id, type: 'stage' });
  };

  const handleCompleteTransfer = async (cardId: string) => {
    let targetStage = stages.find(s => s.isCompletedStage);
    if (!targetStage) {
      const newDocRef = await addDoc(collection(db, 'transfer_stages'), {
        name: "Transferências Finalizadas",
        isCompletedStage: true,
        order: stages.length,
        createdAt: serverTimestamp()
      });
      targetStage = { id: newDocRef.id };
    }
    await updateDoc(doc(db, 'transfer_cards', cardId), {
      stageId: targetStage.id,
      updatedAt: serverTimestamp()
    });
    if (editingCardId === cardId) {
      setIsCardModalOpen(false);
    }
  };

  const handleGenerateEmail = () => {
    const hour = new Date().getHours();
    let greeting = 'Bom dia!';
    if (hour >= 12 && hour < 18) {
      greeting = 'Boa tarde!';
    } else if (hour >= 18) {
      greeting = 'Boa noite!';
    }

    let productsList = `${cardData.quantity || '___'}\n${cardData.observations || '___'} — Cód ${cardData.productCode || '___'}`;
    
    if (cardData.extraProducts && cardData.extraProducts.length > 0) {
      cardData.extraProducts.forEach(ep => {
        productsList += `\n\n${ep.quantity || '___'}\n${ep.description || '___'} — Cód ${ep.code || '___'}`;
      });
    }

    const emailText = `${greeting}

Solicito a transferencia de : 
${productsList}

para o CD de ${cardData.destinationCd || '___'}

O pedido já teve o seu pagamento vinculado.

Atenciosamente.`;

    setGeneratedEmailPreview(emailText);
  };

  const handleCopyEmail = () => {
    if (generatedEmailPreview) {
      navigator.clipboard.writeText(generatedEmailPreview)
        .then(() => alert('Texto de e-mail copiado para a área de transferência!'))
        .catch(err => alert('Erro ao copiar texto: ' + err));
    }
  };

  const handleDeleteAllCancelledInStage = (stageId: string) => {
    setItemToDelete({ id: stageId, type: 'cancelled_cards', stageId });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'card') {
      await deleteDoc(doc(db, 'transfer_cards', itemToDelete.id));
      if (isCardModalOpen && editingCardId === itemToDelete.id) {
        setIsCardModalOpen(false);
      }
    } else if (itemToDelete.type === 'cancelled_cards') {
      setClearingCancelled(true);
      const stageCards = cards.filter(c => c.stageId === (itemToDelete.stageId || itemToDelete.id));
      for (const c of stageCards) {
        await deleteDoc(doc(db, 'transfer_cards', c.id));
      }
      setClearingCancelled(false);
    } else {
      const stageCards = cards.filter(c => c.stageId === itemToDelete.id);
      for (const c of stageCards) {
        await deleteDoc(doc(db, 'transfer_cards', c.id));
      }
      await deleteDoc(doc(db, 'transfer_stages', itemToDelete.id));
    }
    setItemToDelete(null);
  };

  // Analytics Computation
  const completedStageIds = stages.filter(s => s.isCompletedStage).map(s => s.id);
  const transferredCardsCount = cards.filter(c => completedStageIds.includes(c.stageId)).length;
  const openCardsCount = cards.length - transferredCardsCount;

  // Filtered Cards for Board
  const getCardTimestamp = (card: any) => {
    const ts = card.updatedAt || card.createdAt;
    if (!ts) return 0;
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts.seconds) return ts.seconds * 1000;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === 'number') return ts;
    return new Date(ts).getTime() || 0;
  };

  const getFilteredCards = (stageId: string) => {
    const filtered = cards.filter(c => {
      if (c.stageId !== stageId) return false;

      if (onlyMyTransfers) {
        const userEmail = (user?.email || '').toLowerCase();
        const userName = (user?.displayName || '').toLowerCase();
        const userUid = user?.uid;

        const isCreatedByUid = c.createdByUid && c.createdByUid === userUid;
        const isCreatedByNameOrEmail = c.createdBy && (
          c.createdBy.toLowerCase() === userEmail ||
          c.createdBy.toLowerCase() === userName
        );
        const isAssigned = c.assignedTo && (c.assignedTo === userUid || c.assignedTo === userEmail);

        if (!isCreatedByUid && !isCreatedByNameOrEmail && !isAssigned) {
          return false;
        }
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitle = (c.title || "").toLowerCase().includes(term);
        const matchProduct = (c.productCode || "").toLowerCase().includes(term);
        const matchConsultant = (c.consultantName || "").toLowerCase().includes(term);
        const matchExtra = (c.extraProducts || []).some((ep: any) => (ep.code || "").toLowerCase().includes(term));
        if (!matchTitle && !matchProduct && !matchConsultant && !matchExtra) return false;
      }

      return true;
    });

    // Sort by most recently created / moved / updated first
    return filtered.sort((a, b) => getCardTimestamp(b) - getCardTimestamp(a));
  };

  return (
    <div className="flex-1 flex flex-col min-h-[600px] h-full space-y-3">
      {/* Header Bar - Material Design 3 Tonal Toolbar */}
      <div className="flex justify-between items-center shrink-0 gap-3 flex-wrap bg-white/90 backdrop-blur-md p-3.5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
            Quadro de Transferência
          </h1>
          <p className="text-[11px] text-slate-500 font-normal mt-1">Gerencie pedidos e etapas em tempo real com controle visual</p>
        </div>

        {/* MD3 Analytics Bar - Tonal Surface Pill */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 bg-slate-100/90 rounded-full border border-slate-200/70 text-xs font-medium text-slate-700 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            <span>Total: <strong className="text-slate-900 font-semibold">{cards.length}</strong></span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-amber-600" />
            <span>Aberto: <strong className="text-slate-900 font-semibold">{openCardsCount}</strong></span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Finalizadas: <strong className="text-slate-900 font-semibold">{transferredCardsCount}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* User Filter Toggle - MD3 Filter Chip */}
          <button 
            onClick={() => setOnlyMyTransfers(!onlyMyTransfers)}
            className={cn(
              "px-3.5 py-1.5 flex items-center gap-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border shadow-2xs",
              onlyMyTransfers 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
            title="Filtrar apenas as transferências criadas por você ou sob sua responsabilidade"
          >
            <User className="w-3.5 h-3.5" />
            <span>Minhas Transferências</span>
          </button>

          {/* Search Input - MD3 Search Field */}
          <div className="relative w-40 md:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar pedido..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100/90 focus:bg-white border border-slate-200/70 focus:border-indigo-400 rounded-full text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          {/* MD3 Elevated Action Buttons */}
          <button 
            onClick={() => setIsViewAllModalOpen(true)}
            className="bg-white border border-slate-200/90 text-slate-700 font-semibold px-3.5 py-1.5 flex items-center gap-1.5 rounded-full text-xs hover:bg-slate-50 transition-all shrink-0 shadow-2xs"
          >
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Tudo</span>
          </button>

          <button 
            onClick={() => {
              if (stages.length > 0) {
                openAddCardModal(stages[0].id);
              } else {
                openAddStageModal();
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 flex items-center gap-1.5 rounded-full text-xs font-semibold shadow-xs hover:shadow transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Pedido</span>
          </button>

          <button 
            onClick={openAddStageModal}
            className="bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 px-3.5 py-1.5 flex items-center gap-1.5 rounded-full text-xs font-semibold transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Nova Etapa</span>
          </button>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex-1 flex gap-2.5 overflow-x-auto items-stretch pb-2 pt-1 px-0.5 custom-scrollbar min-h-0">
        {stages.map(stage => {
          const stageCards = getFilteredCards(stage.id);
          const isExpanded = !!expandedStages[stage.id];
          const visibleCards = isExpanded ? stageCards : stageCards.slice(0, 5);
          const hiddenCount = stageCards.length - 5;

          return (
            <div 
              key={stage.id} 
              draggable
              onDragStart={(e) => handleStageDragStart(e, stage.id)}
              className={cn(
                "rounded-3xl flex-1 min-w-[250px] sm:min-w-[260px] max-w-[320px] shrink-0 flex flex-col h-full max-h-full border transition-all shadow-2xs cursor-grab active:cursor-grabbing overflow-hidden",
                draggedStageId === stage.id ? "opacity-30 border-dashed scale-95" : "",
                stage.isCompletedStage 
                  ? "border-emerald-200/80 bg-emerald-50/20" 
                  : stage.isCancelledStage 
                    ? "border-rose-200/80 bg-rose-50/20" 
                    : "border-slate-200/80 bg-slate-100/70"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header - Material Design 3 Tonal Container */}
              <div className="p-2.5 px-3 flex items-center justify-between border-b border-slate-200/70 bg-white/90 backdrop-blur-xs shrink-0 group gap-1.5 min-h-[52px]">
                <div 
                  onClick={() => openEditStageModal(stage)}
                  className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0 pr-1"
                  title="Clique para editar esta etapa"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 
                      className={cn(
                        "font-bold text-[12px] leading-tight break-words line-clamp-2", 
                        stage.isCompletedStage ? "text-emerald-900" : stage.isCancelledStage ? "text-rose-900" : "text-slate-900"
                      )}
                      title={stage.name}
                    >
                      {stage.name}
                    </h3>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 shadow-2xs", stage.isCompletedStage ? "bg-emerald-100 text-emerald-900" : stage.isCancelledStage ? "bg-rose-100 text-rose-900" : "bg-slate-200/80 text-slate-800")}>
                      {stageCards.length}
                    </span>
                  </div>
                </div>

                {/* Header Action Buttons - MD3 Pills */}
                <div className="flex items-center gap-1 shrink-0">
                  {stage.isCancelledStage && stageCards.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAllCancelledInStage(stage.id); }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/80 hover:bg-rose-200 px-2 py-1 rounded-full transition-all shadow-2xs shrink-0"
                      title="Esvaziar todos os pedidos cancelados"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Limpar</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); openAddCardModal(stage.id); }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-all border border-indigo-200/80 shadow-2xs shrink-0"
                    title="Adicionar novo pedido nesta etapa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo</span>
                  </button>

                  <button 
                    onClick={() => handleDeleteStage(stage.id)} 
                    className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-full shrink-0"
                    title="Excluir esta etapa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards Scroll Container */}
              <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-0 custom-scrollbar">
                {visibleCards.map(card => {
                  const assignee = profiles.find(p => p.id === card.assignedTo);
                  const creator = profiles.find(p => p.id === card.createdByUid);
                  
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => openEditCardModal(card)}
                      className={cn(
                        "p-3 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group relative duration-150 ease-out",
                        stage.isCompletedStage 
                          ? "border-emerald-200/80 hover:border-emerald-300" 
                          : stage.isCancelledStage 
                            ? "border-rose-200/80 hover:border-rose-300"
                            : "",
                        draggedCardId === card.id ? "opacity-30 border-dashed scale-90" : ""
                      )}
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-full border border-slate-100 shadow-xs">
                        {!stage.isCompletedStage && !stage.isCancelledStage && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCompleteTransfer(card.id); }} 
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded-full hover:bg-emerald-50"
                            title="Finalizar Transferência"
                          >
                             <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} 
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50"
                          title="Excluir Card"
                        >
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Product Codes Badges - MD3 Rounded Pills */}
                      <div className="flex gap-1 flex-wrap mb-1.5 pr-12">
                        {card.productCode && (
                          <div className="text-[9.5px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Package className="w-2.5 h-2.5 text-amber-700" /> CÓD: {card.productCode}
                          </div>
                        )}
                        {card.extraProducts?.map((ep: any, idx: number) => (
                           ep.code && (
                             <div key={idx} className="text-[9.5px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                               <Package className="w-2.5 h-2.5 text-amber-700" /> CÓD: {ep.code}
                             </div>
                           )
                        ))}
                      </div>

                      {/* Order Title */}
                      <h4 className="font-bold text-slate-900 text-[11px] leading-snug pr-5 line-clamp-2 tracking-tight">{card.title}</h4>

                      {/* Created Date */}
                      {card.createdAt?.toDate && (
                        <div className="text-[8.5px] text-slate-400 font-medium mt-0.5">
                          {new Date(card.createdAt.toDate()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}

                      {/* Consultant - MD3 Pill */}
                      {card.consultantName && (
                        <div className="text-[9.5px] text-slate-700 font-semibold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1.5 truncate max-w-full">
                          <User className="w-2.5 h-2.5 text-slate-400" />
                          Consultor: {card.consultantName}
                        </div>
                      )}

                      {/* Equipment / Observations snippet */}
                      {card.observations && (
                        <p className="text-[9.5px] text-slate-500 mt-1 line-clamp-1 italic flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                          <span className="truncate">{card.observations}</span>
                        </p>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[9.5px]">
                        <div className="flex items-center gap-1 text-slate-500 truncate max-w-[140px]">
                          <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          {assignee ? (
                            <span className="text-slate-800 font-semibold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full truncate">{assignee.name || assignee.full_name || assignee.email}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sem resp.</span>
                          )}
                        </div>

                        {creator && (
                          <div className="flex items-center gap-1 shrink-0" title={`Criado por ${creator.full_name || creator.name || creator.email}`}>
                            <img src={creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.email}`} alt="Criador" className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {!creator && card.createdBy && (
                          <div className="flex items-center gap-1 shrink-0" title={`Criado por ${card.createdBy}`}>
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${card.createdBy}`} alt="Criador" className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MD3 Expand Column Button if cards > 5 */}
              {stageCards.length > 5 && (
                <button
                  onClick={() => setExpandedStages(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                  className="mx-2 mb-1.5 py-1.5 px-3 text-center text-xs font-semibold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100/90 rounded-full border border-indigo-200/80 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Recolher (Mostrando todos os {stageCards.length})</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Ver mais {hiddenCount} {hiddenCount === 1 ? 'pedido' : 'pedidos'}</span>
                    </>
                  )}
                </button>
              )}

              {/* Add Card Button inside column - MD3 Surface Button */}
              <button 
                onClick={() => openAddCardModal(stage.id)}
                className="mx-2 mb-2 py-2 px-3 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 bg-slate-200/50 rounded-full transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar novo pedido</span>
              </button>
            </div>
          )
        })}

        {stages.length === 0 && !loading && (
          <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 gap-3">
             <p className="font-semibold text-sm">Nenhuma etapa configurada.</p>
             <button onClick={openAddStageModal} className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-xs">Criar Primeira Etapa</button>
          </div>
        )}
      </div>

      {/* Modals - Apple Dialog Style */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex justify-center items-center z-[110] p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200/80 relative">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {itemToDelete.type === 'cancelled_cards' ? 'Esvaziar Pedidos Cancelados' : 'Confirmar Exclusão'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              {itemToDelete.type === 'cancelled_cards'
                ? 'Deseja excluir permanentemente todos os pedidos na etapa Cancelados? Esta ação não poderá ser desfeita.'
                : 'Esta ação não poderá ser desfeita. Deseja continuar?'}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setItemToDelete(null)} 
                disabled={clearingCancelled}
                className="flex-1 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={clearingCancelled}
                className="flex-1 py-2 text-xs font-medium bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 shadow-xs"
              >
                {clearingCancelled ? 'Esvaziando...' : itemToDelete.type === 'cancelled_cards' ? 'Esvaziar' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddStageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsAddStageModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-6">{editingStageId ? 'Editar Etapa' : 'Nova Etapa'}</h2>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Etapa</label>
                  <input type="text" value={newStageName} onChange={e => setNewStageName(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" placeholder="Ex: A Faturar" />
               </div>
               <label className="flex items-center gap-3 cursor-pointer mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                 <input type="checkbox" checked={newStageIsCompleted} onChange={e => setNewStageIsCompleted(e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300" />
                 <div>
                   <span className="text-sm font-bold text-gray-900 block">Etapa de Conclusão / Transferido?</span>
                   <span className="text-xs text-gray-500 font-medium">Marque se cards nesta etapa já foram transferidos/finalizados.</span>
                 </div>
               </label>
               <label className="flex items-center gap-3 cursor-pointer mt-4 bg-red-50 p-3 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                 <input type="checkbox" checked={newStageIsCancelled} onChange={e => setNewStageIsCancelled(e.target.checked)} className="w-5 h-5 rounded text-red-500 focus:ring-red-500 border-gray-300" />
                 <div>
                   <span className="text-sm font-bold text-red-900 block">Etapa de Cancelados?</span>
                   <span className="text-xs text-red-700/80 font-medium">Marque se cards nesta etapa foram cancelados ou reprovados.</span>
                 </div>
               </label>
               <button onClick={handleSaveStage} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4 shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">{editingStageId ? 'Salvar Alterações' : 'Criar Etapa'}</button>
            </div>
          </div>
        </div>
      )}

      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="w-full max-w-xl relative flex flex-col max-h-[95vh]">
            <div className="bg-white rounded-t-[2rem] p-6 shrink-0 relative z-10 border-b border-gray-100 shadow-sm">
              <button onClick={() => setIsCardModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 transition-colors rounded-full z-10">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black text-gray-900 pr-8">{editingCardId ? 'Editar Pedido' : 'Novo Pedido'}</h2>
            </div>
            
            <div className="bg-white p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 relative">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nº do Pedido *</label>
                    <input type="text" value={cardData.title} onChange={e => setCardData({...cardData, title: e.target.value})} className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900" placeholder="Ex: 12345" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cód Produto</label>
                    <input type="text" value={cardData.productCode} onChange={e => setCardData({...cardData, productCode: e.target.value})} className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900" placeholder="Ex: 98765" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
                    <input type="text" value={cardData.quantity} onChange={e => setCardData({...cardData, quantity: e.target.value})} className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900" placeholder="Ex: 10" />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Atribuir à / Responsável</label>
                    <select 
                      value={cardData.assignedTo} 
                      onChange={e => setCardData({...cardData, assignedTo: e.target.value})} 
                      className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium bg-white text-gray-900"
                    >
                      <option value="">-- Sem responsável --</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name || p.full_name || p.email}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nome do Consultor</label>
                    <input 
                      type="text" 
                      value={cardData.consultantName || ''} 
                      onChange={e => setCardData({...cardData, consultantName: e.target.value})} 
                      className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 bg-white" 
                      placeholder="Ex: João Silva" 
                    />
                 </div>
               </div>
               
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">CD Destino</label>
                  <select 
                    value={cardData.destinationCd} 
                    onChange={e => setCardData({...cardData, destinationCd: e.target.value})} 
                    className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium bg-white text-gray-900"
                  >
                    <option value="">-- Selecione o CD --</option>
                    {['PE', 'ES', 'SP', 'SC', 'BA', 'PA', 'MT', 'GO'].map(cd => (
                      <option key={cd} value={cd}>{cd}</option>
                    ))}
                  </select>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Equipamento (Principal)</label>
                  <textarea 
                    value={cardData.observations} 
                    onChange={e => setCardData({...cardData, observations: e.target.value})} 
                    className="w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none font-medium text-gray-900" 
                    rows={2} 
                    placeholder="Ex: HÍBRIDO SP GOODWE GW7.5K-ES-LD-G10..."
                  />
               </div>

               <div className="flex items-center justify-between mt-6">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Produtos Adicionais</label>
                 <button 
                   type="button"
                   onClick={() => {
                     setCardData(prev => ({
                       ...prev,
                       extraProducts: [...(prev.extraProducts || []), { code: '', quantity: '', description: '' }]
                     }))
                   }}
                   className="text-[10px] font-black text-primary flex items-center gap-1 hover:text-primary-dark transition-colors uppercase tracking-wider"
                 >
                   <Plus className="w-3 h-3" /> Adicionar Outro Produto
                 </button>
               </div>
               
               {(cardData.extraProducts || []).map((ep, idx) => (
                 <div key={idx} className="p-5 border border-gray-100 rounded-xl bg-gray-50 relative space-y-4 shadow-inner">
                   <button 
                     type="button"
                     onClick={() => {
                       const newExtras = [...(cardData.extraProducts || [])];
                       newExtras.splice(idx, 1);
                       setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                     }}
                     className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-full transition-all shadow-sm bg-white/50"
                   >
                     <X className="w-3.5 h-3.5" />
                   </button>
                   <div className="grid grid-cols-2 gap-4 mr-8">
                     <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cód Produto</label>
                       <input type="text" value={ep.code} onChange={e => {
                         const newExtras = [...(cardData.extraProducts || [])];
                         newExtras[idx].code = e.target.value;
                         setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                       }} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 text-sm bg-white" placeholder="Ex: 98765" />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
                       <input type="text" value={ep.quantity} onChange={e => {
                         const newExtras = [...(cardData.extraProducts || [])];
                         newExtras[idx].quantity = e.target.value;
                         setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                       }} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 text-sm bg-white" placeholder="Ex: 10" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Equipamento</label>
                     <input type="text" value={ep.description} onChange={e => {
                       const newExtras = [...(cardData.extraProducts || [])];
                       newExtras[idx].description = e.target.value;
                       setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                     }} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 text-sm bg-white" placeholder="Nome do produto ou descrição..." />
                   </div>
                 </div>
               ))}

               {generatedEmailPreview && (
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-6 relative">
                   <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Pré-visualização do E-mail</h4>
                   <pre className="whitespace-pre-wrap text-sm text-gray-800 font-medium font-sans mb-12">{generatedEmailPreview}</pre>
                   <button 
                     onClick={handleCopyEmail}
                     className="absolute bottom-4 right-4 bg-white border border-gray-200 px-4 py-2 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
                   >
                     <Copy className="w-4 h-4" />
                     Copiar E-mail
                   </button>
                 </div>
               )}
            </div>
            
            <div className="bg-white rounded-b-[2rem] p-6 pt-4 shrink-0 border-t border-gray-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] z-10 flex gap-3 flex-wrap">
                 {editingCardId && (
                   <button 
                     onClick={() => handleDeleteCard(editingCardId)} 
                     className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm shrink-0"
                     title="Excluir"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 )}
                 {editingCardId && (
                   <button 
                     onClick={() => handleCompleteTransfer(editingCardId)} 
                     className="px-4 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center shadow-sm shrink-0 whitespace-nowrap"
                     title="Finalizar Transferência"
                   >
                     <CheckCircle2 className="w-5 h-5 mr-2" />
                     Finalizar
                   </button>
                 )}
                 <button 
                   onClick={handleGenerateEmail} 
                   className="px-4 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center shadow-sm shrink-0 whitespace-nowrap"
                   title="Gerar E-mail"
                 >
                   Gerar E-mail
                 </button>
                 <button 
                   onClick={handleSaveCard} 
                   className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl shadow-md hover:bg-gray-800 transition-colors min-w-[200px]"
                 >
                   {editingCardId ? 'Salvar Alterações' : 'Adicionar Pedido'}
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* Ver Tudo Modal / Tabela de Transferências */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col p-4 md:p-8 items-center cursor-pointer" onClick={() => setIsViewAllModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-5xl h-full shadow-2xl relative flex flex-col cursor-default overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <ListFilter className="w-6 h-6 text-primary" />
                  Todas as Transferências
                </h2>
                <p className="text-sm text-gray-500 mt-1">Busque todos os pedidos e histórico de transferências.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar (N° ou Cód)..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <button onClick={() => setIsViewAllModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                    <tr>
                      <th className="px-6 py-4">N° Pedido (Título)</th>
                      <th className="px-6 py-4">Código Produto</th>
                      <th className="px-6 py-4">Data de Criação</th>
                      <th className="px-6 py-4">Etapa Atual</th>
                      <th className="px-6 py-4">Responsável</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cards.filter(c => 
                        !searchTerm || 
                        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (c.productCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.extraProducts || []).some((ep: any) => (ep.code || "").toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map(card => {
                      const assignee = profiles.find(p => p.id === card.assignedTo);
                      const currentStage = stages.find(s => s.id === card.stageId);
                      return (
                        <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{card.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {card.productCode ? (
                                <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-md text-[10px] inline-block">{card.productCode}</span>
                              ) : '-'}
                              {card.extraProducts?.map((ep: any, idx: number) => (
                                ep.code && (
                                  <span key={idx} className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-md text-[10px] inline-block">{ep.code}</span>
                                )
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                            {card.createdAt?.toDate ? new Date(card.createdAt.toDate()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {currentStage ? (
                              <span className={cn(
                                "font-bold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider",
                                currentStage.isCompletedStage ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                              )}>
                                {currentStage.name}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 font-medium">
                             {assignee ? (assignee.name || assignee.full_name || assignee.email) : <span className="text-gray-400 italic">Não atribuído</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => {
                                 setIsViewAllModalOpen(false);
                                 openEditCardModal(card);
                               }}
                               className="text-primary hover:text-primary-dark font-bold text-xs"
                             >
                               Editar
                             </button>
                             <button 
                               onClick={() => handleDeleteCard(card.id)}
                               className="ml-4 text-red-400 hover:text-red-600 font-bold text-xs"
                             >
                               Excluir
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                    {cards.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">Nenhum pedido encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
