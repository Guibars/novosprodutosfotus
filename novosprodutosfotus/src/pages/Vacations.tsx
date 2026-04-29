import React, { useState, useEffect } from "react";
import { Palmtree, Plus, Save, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

export function Vacations() {
  const { user } = useAuth();
  const [vacations, setVacations] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newVacation, setNewVacation] = useState({ userId: "", startDate: "", endDate: "" });

  useEffect(() => {
    // Busca todo o time
    const unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setTeamMembers(snapshot.docs.map(doc => doc.data()));
    });

    // Busca as férias
    const unsubscribeVacations = onSnapshot(collection(db, 'vacations'), (snapshot) => {
      setVacations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeProfiles();
      unsubscribeVacations();
    };
  }, []);

  const handleCreateVacation = async () => {
    if (!newVacation.userId || !newVacation.startDate || !newVacation.endDate) return;
    
    try {
      const vId = `${newVacation.userId}_${Date.now()}`;
      await setDoc(doc(db, 'vacations', vId), {
        userId: newVacation.userId,
        startDate: newVacation.startDate,
        endDate: newVacation.endDate,
        created_by: user?.uid
      });
      setIsAdding(false);
      setNewVacation({ userId: "", startDate: "", endDate: "" });
    } catch (error) {
      console.error("Erro ao registrar férias", error);
    }
  };

  const handleDeleteVacation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vacations', id));
    } catch (error) {
      console.error("Erro ao excluir férias", error);
    }
  };

  const isTodayBetween = (start: string, end: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sDate = new Date(start + 'T12:00:00');
    const eDate = new Date(end + 'T12:00:00');
    return today >= sDate && today <= eDate;
  };

  const isFuture = (start: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sDate = new Date(start + 'T12:00:00');
    return sDate > today;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Palmtree className="w-8 h-8 text-orange-500" />
            Férias do Time
          </h1>
          <p className="text-gray-500 mt-1">Visualize e cadastre os períodos de férias da equipe de forma transparente.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          Registrar Férias
        </button>
      </div>

      {isAdding && (
         <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl mb-8 flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
              <select 
                value={newVacation.userId}
                onChange={(e) => setNewVacation({...newVacation, userId: e.target.value})}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl"
              >
                <option value="">Selecione um membro...</option>
                {teamMembers.map((m: any) => (
                  <option key={m.uid} value={m.uid}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
              <input 
                type="date"
                value={newVacation.startDate}
                onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Retorno</label>
              <input 
                type="date"
                value={newVacation.endDate}
                onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-3 text-gray-600 border border-gray-200 bg-white/50 rounded-xl hover:bg-gray-50 flex-1 md:flex-none"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateVacation}
                disabled={!newVacation.userId || !newVacation.startDate || !newVacation.endDate}
                className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 flex-1 md:flex-none font-medium flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vacations.map(vacation => {
          const member = teamMembers.find((m: any) => m.uid === vacation.userId);
          const isCurrent = isTodayBetween(vacation.startDate, vacation.endDate);
          const isComing = isFuture(vacation.startDate);
          
          if (!member) return null;

          return (
            <div key={vacation.id} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5 flex flex-col relative overflow-hidden group transition-all hover:shadow-2xl">
              <div className={cn(
                "absolute top-0 right-0 left-0 h-2",
                isCurrent ? "bg-orange-500" : isComing ? "bg-blue-400" : "bg-gray-300"
              )}></div>
              
              <button 
                onClick={() => handleDeleteVacation(vacation.id)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-md"
                title="Remover Registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-5 pt-2">
                <img 
                  src={member.avatar_url} 
                  alt={member.full_name} 
                  className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{member.full_name}</h3>
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block",
                    isCurrent ? "bg-orange-100 text-orange-600" : isComing ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {isCurrent ? "De férias agora" : isComing ? "Férias Agendadas" : "Férias Concluídas"}
                  </span>
                </div>
              </div>

              <div className="bg-white/50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2 relative">
                <Palmtree className="absolute right-2 bottom-2 w-12 h-12 text-black opacity-5" />
                <div className="flex items-center gap-2 relative z-10">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Início:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(vacation.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Retorno:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(vacation.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {vacations.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-gray-500">
            <Palmtree className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">Nenhum período de férias agendado.</p>
            <p className="text-sm mt-1">Utilize o botão acima para registrar as férias da equipe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
