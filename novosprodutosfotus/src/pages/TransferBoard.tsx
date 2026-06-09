import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, X, Trash2, Package, Tag, MessageSquare, User, TrendingUp, Inbox, Search, CheckCircle2, ListFilter, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function TransferBoard() {
  const { user } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [newStageIsCompleted, setNewStageIsCompleted] = useState(false);

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
  }>({
    title: "",
    productCode: "",
    quantity: "",
    extraProducts: [],
    destinationCd: "",
    observations: "",
    assignedTo: ""
  });

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'card' | 'stage' } | null>(null);

  const [generatedEmailPreview, setGeneratedEmailPreview] = useState<string | null>(null);

  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    setIsAddStageModalOpen(true);
  };

  const openEditStageModal = (stage: any) => {
    setEditingStageId(stage.id);
    setNewStageName(stage.name || "");
    setNewStageIsCompleted(!!stage.isCompletedStage);
    setIsAddStageModalOpen(true);
  };

  const handleSaveStage = async () => {
    if (!newStageName.trim()) return;
    
    if (editingStageId) {
      await updateDoc(doc(db, 'transfer_stages', editingStageId), {
        name: newStageName,
        isCompletedStage: newStageIsCompleted
      });
    } else {
      await addDoc(collection(db, 'transfer_stages'), {
        name: newStageName,
        isCompletedStage: newStageIsCompleted,
        order: stages.length,
        createdAt: serverTimestamp()
      });
    }
    setNewStageName("");
    setNewStageIsCompleted(false);
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
      assignedTo: ""
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
      assignedTo: card.assignedTo || ""
    });
    setGeneratedEmailPreview(null);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!cardData.title.trim()) return;
    if (editingCardId) {
      await updateDoc(doc(db, 'transfer_cards', editingCardId), {
        ...cardData
      });
    } else {
      await addDoc(collection(db, 'transfer_cards'), {
        ...cardData,
        stageId: addingToStageId,
        createdBy: user?.displayName || user?.email || 'Unknown',
        createdByUid: user?.uid || null,
        createdAt: serverTimestamp()
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
        stageId: targetStageId
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
      stageId: targetStage.id
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

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'card') {
      await deleteDoc(doc(db, 'transfer_cards', itemToDelete.id));
      if (isCardModalOpen && editingCardId === itemToDelete.id) {
        setIsCardModalOpen(false);
      }
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
  const getFilteredCards = (stageId: string) => {
    return cards.filter(c => 
      c.stageId === stageId && 
      (!searchTerm || 
       (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
       (c.productCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
       (c.extraProducts || []).some((ep: any) => (ep.code || "").toLowerCase().includes(searchTerm.toLowerCase())))
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-[1600px] mx-auto pb-10 overflow-hidden">
      <div className="flex justify-between items-end shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quadro de Transferência</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os pedidos e etapas de transferência</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por n° pedido..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>
          <button 
            onClick={() => setIsViewAllModalOpen(true)}
            className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 flex items-center gap-2 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition-all shrink-0"
          >
            <ListFilter className="w-4 h-4" />
            Ver Tudo
          </button>
          <button 
            onClick={openAddStageModal}
            className="bg-gray-900 text-white px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Etapa
          </button>
        </div>
      </div>

      {/* Analytics Transferências */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total de Pedidos</p>
            <p className="text-3xl font-black text-gray-900">{cards.length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Em Aberto (Aguardando)</p>
            <p className="text-3xl font-black text-gray-900">{openCardsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pedidos Transferidos</p>
            <p className="text-3xl font-black text-gray-900">{transferredCardsCount}</p>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start pt-2 px-1 custom-scrollbar snap-x snap-mandatory">
        {stages.map(stage => {
          const stageCards = getFilteredCards(stage.id);
          return (
            <div 
              key={stage.id} 
              draggable
              onDragStart={(e) => handleStageDragStart(e, stage.id)}
              className={cn(
                "rounded-3xl w-[85vw] sm:w-80 md:flex-1 md:min-w-[250px] shrink-0 flex flex-col max-h-[75vh] border-2 transition-all shadow-sm cursor-grab active:cursor-grabbing snap-center",
                draggedStageId === stage.id ? "opacity-30 border-dashed scale-95" : "",
                stage.isCompletedStage ? "border-emerald-200 bg-emerald-50/50" : "border-transparent bg-gray-100"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="p-4 flex items-center justify-between border-b border-gray-200/50 shrink-0 group">
                <div 
                  onClick={() => openEditStageModal(stage)}
                  className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
                  title="Editar Etapa"
                >
                  <h3 className={cn("font-bold flex items-center gap-2", stage.isCompletedStage ? "text-emerald-900" : "text-gray-800")}>
                    {stage.name} 
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", stage.isCompletedStage ? "bg-emerald-200 text-emerald-800" : "bg-gray-200 text-gray-600")}>
                      {stageCards.length}
                    </span>
                  </h3>
                  {stage.isCompletedStage && <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Transferências Finalizadas</p>}
                </div>
                <button onClick={() => handleDeleteStage(stage.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                {stageCards.map(card => {
                  const assignee = profiles.find(p => p.id === card.assignedTo);
                  const creator = profiles.find(p => p.id === card.createdByUid);
                  
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => openEditCardModal(card)}
                      className={cn(
                        "p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg transition-all group relative duration-300 ease-out",
                        stage.isCompletedStage 
                          ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:border-emerald-400" 
                          : "bg-white border-gray-200 hover:border-primary/40",
                        draggedCardId === card.id ? "opacity-30 border-dashed scale-90" : ""
                      )}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} 
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white border border-gray-50 rounded-md shadow-sm"
                        title="Excluir Card"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      {!stage.isCompletedStage && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCompleteTransfer(card.id); }} 
                          className="absolute top-3 right-11 text-gray-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white border border-gray-50 rounded-md shadow-sm"
                          title="Finalizar Transferência"
                        >
                           <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="flex gap-2 flex-wrap mb-2">
                        {card.productCode && (
                          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-100 inline-block px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Package className="w-3 h-3" /> Cód: {card.productCode}
                          </div>
                        )}
                        {card.extraProducts?.map((ep: any, idx: number) => (
                           ep.code && (
                             <div key={idx} className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-100 inline-block px-2 py-0.5 rounded-md flex items-center gap-1">
                               <Package className="w-3 h-3" /> Cód: {ep.code}
                             </div>
                           )
                        ))}
                      </div>
                      
                      <h4 className="font-bold text-gray-900 text-sm leading-tight pr-6">{card.title}</h4>
                      
                      {card.observations && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          {card.observations}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                          <User className="w-3 h-3" />
                          {assignee ? (
                            <span className="text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded-md">{assignee.name || assignee.full_name || assignee.email}</span>
                          ) : (
                            <span>Não atribuído</span>
                          )}
                        </div>
                        {creator && (
                          <div className="flex items-center gap-1.5" title={`Criado por ${creator.full_name || creator.name || creator.email}`}>
                            <img src={creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.email}`} alt="Criador" className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {!creator && card.createdBy && (
                          <div className="flex items-center gap-1.5" title={`Criado por ${card.createdBy}`}>
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${card.createdBy}`} alt="Criador" className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openAddCardModal(stage.id)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-gray-500 font-bold text-sm bg-black/5 hover:bg-black/10 rounded-xl transition-colors border border-transparent hover:border-black/5"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Pedido
                </button>
              </div>
            </div>
          )
        })}

        {stages.length === 0 && !loading && (
          <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl text-gray-400 gap-4">
             <p className="font-bold">Nenhuma etapa configurada.</p>
             <button onClick={openAddStageModal} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Criar Primeira Etapa</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h2 className="text-xl font-black text-gray-900 mb-2">Confirmar Exclusão</h2>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita. Deseja continuar?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)} 
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Excluir
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
               <button onClick={handleSaveStage} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4 shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">{editingStageId ? 'Salvar Alterações' : 'Criar Etapa'}</button>
            </div>
          </div>
        </div>
      )}

      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-6">{editingCardId ? 'Editar Pedido' : 'Novo Pedido'}</h2>
            
            <div className="space-y-4">
               <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nº do Pedido *</label>
                    <input type="text" value={cardData.title} onChange={e => setCardData({...cardData, title: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900" placeholder="Ex: 12345" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cód Produto</label>
                    <input type="text" value={cardData.productCode} onChange={e => setCardData({...cardData, productCode: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900" placeholder="Ex: 98765" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
                    <input type="text" value={cardData.quantity} onChange={e => setCardData({...cardData, quantity: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900" placeholder="Ex: 10" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Atribuir à / Responsável</label>
                    <select 
                      value={cardData.assignedTo} 
                      onChange={e => setCardData({...cardData, assignedTo: e.target.value})} 
                      className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium bg-white text-gray-900"
                    >
                      <option value="">-- Sem responsável --</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name || p.full_name || p.email}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">CD Destino</label>
                    <select 
                      value={cardData.destinationCd} 
                      onChange={e => setCardData({...cardData, destinationCd: e.target.value})} 
                      className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium bg-white text-gray-900"
                    >
                      <option value="">-- Selecione o CD --</option>
                      {['PE', 'ES', 'SP', 'SC', 'BA', 'PA', 'MT', 'GO'].map(cd => (
                        <option key={cd} value={cd}>{cd}</option>
                      ))}
                    </select>
                 </div>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Equipamento (Principal)</label>
                  <textarea 
                    value={cardData.observations} 
                    onChange={e => setCardData({...cardData, observations: e.target.value})} 
                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none font-medium text-gray-900" 
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
                 <div key={idx} className="p-4 border border-gray-100 rounded-xl bg-gray-50 relative space-y-3 shadow-inner">
                   <button 
                     type="button"
                     onClick={() => {
                       const newExtras = [...(cardData.extraProducts || [])];
                       newExtras.splice(idx, 1);
                       setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                     }}
                     className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-full transition-all shadow-sm bg-white/50"
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
                       }} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 text-sm bg-white" placeholder="Ex: 98765" />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
                       <input type="text" value={ep.quantity} onChange={e => {
                         const newExtras = [...(cardData.extraProducts || [])];
                         newExtras[idx].quantity = e.target.value;
                         setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                       }} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 text-sm bg-white" placeholder="Ex: 10" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Equipamento</label>
                     <input type="text" value={ep.description} onChange={e => {
                       const newExtras = [...(cardData.extraProducts || [])];
                       newExtras[idx].description = e.target.value;
                       setCardData(prev => ({ ...prev, extraProducts: newExtras }));
                     }} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-gray-900 text-sm bg-white" placeholder="Nome do produto ou descrição..." />
                   </div>
                 </div>
               ))}

               {generatedEmailPreview && (
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4 relative">
                   <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pré-visualização do E-mail</h4>
                   <pre className="whitespace-pre-wrap text-sm text-gray-800 font-medium font-sans mb-12">{generatedEmailPreview}</pre>
                   <button 
                     onClick={handleCopyEmail}
                     className="absolute bottom-4 right-4 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
                   >
                     <Copy className="w-4 h-4" />
                     Copiar E-mail
                   </button>
                 </div>
               )}

               <div className="pt-2 flex gap-3 flex-wrap">
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
                   className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl shadow-md hover:bg-gray-800 transition-colors"
                 >
                   {editingCardId ? 'Salvar Alterações' : 'Adicionar Pedido'}
                 </button>
               </div>
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
