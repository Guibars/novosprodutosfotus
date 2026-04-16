import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Shield, User, Save, Check, Edit2, Trash2 } from "lucide-react";

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
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await updateDoc(doc(db, 'profiles', editingUser.id), {
        full_name: editName,
        avatar_url: editAvatar
      });
      setEditingUser(null);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Erro ao atualizar usuário. Verifique suas permissões.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário? (Esta ação apenas remove o perfil, o usuário ainda poderá ter acesso se não for removido no painel de autenticação do Firebase.)")) {
      try {
        await deleteDoc(doc(db, 'profiles', userId));
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao excluir usuário. Verifique suas permissões.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative">
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
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingUser(member);
                        setEditName(member.full_name || "");
                        setEditAvatar(member.avatar_url || "");
                      }}
                      className="p-2 text-gray-400 hover:text-primary transition-colors bg-white/50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(member.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Usuário</h2>
            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto de Perfil</label>
                <input 
                  type="url" 
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="https://exemplo.com/foto.jpg (Opcional)"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-secondary/30"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
