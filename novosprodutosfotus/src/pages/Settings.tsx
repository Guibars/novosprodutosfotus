import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Shield, User, Save, Check } from "lucide-react";

const availableRoles = [
  "Membro",
  "Gerência",
  "Coordenação",
  "Desenvolvimento",
  "Novos Produtos",
  "Marketing",
  "Pricing",
  "TI",
  "Admin"
];

export function Settings() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(members);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar time:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        role: newRole
      });
      setSavedId(userId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (error) {
      console.error("Erro ao atualizar cargo:", error);
      alert("Erro ao atualizar cargo. Verifique suas permissões.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie as permissões e cargos dos usuários da plataforma.</p>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-xl shadow-black/5 overflow-hidden">
        <div className="p-6 border-b border-white/50">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-sm text-gray-500 mt-1">Defina o cargo de cada membro. Isso refletirá no perfil deles.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="divide-y divide-white/30">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-4">
                  <img 
                    src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.email}`} 
                    alt={member.full_name} 
                    className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role || "Membro"}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={savingId === member.id}
                    className="px-4 py-2 glass-input rounded-xl text-sm font-medium min-w-[160px]"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  
                  <div className="w-8 flex justify-center">
                    {savingId === member.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    {savedId === member.id && (
                      <Check className="w-5 h-5 text-success" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {teamMembers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
