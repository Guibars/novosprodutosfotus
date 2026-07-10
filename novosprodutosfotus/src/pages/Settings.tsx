import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Shield, User, Save, Check, Edit2, Trash2, Send } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'updates'>('users');
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [updateVersion, setUpdateVersion] = useState("1.0.1");
  const [updateNotes, setUpdateNotes] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

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

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'profiles', userToDelete));
      setUserToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário. Verifique suas permissões.");
    }
  };

  const handleLaunchUpdate = async () => {
    if (!updateVersion || !updateNotes) {
      alert("Preencha a versão e as notas da atualização.");
      return;
    }
    setSavingUpdate(true);
    try {
      await setDoc(doc(db, 'system', 'latest_update'), {
        version: updateVersion,
        notes: updateNotes,
        timestamp: serverTimestamp()
      });
      alert(`Atualização ${updateVersion} lançada com sucesso!`);
      setUpdateNotes("");
    } catch (error) {
      console.error("Erro ao lançar atualização:", error);
      alert("Erro ao lançar atualização.");
    } finally {
      setSavingUpdate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie as permissões e configurações da plataforma.</p>
      </div>

      {user?.email === 'guilhermebarbosars@gmail.com' && (
        <div className="glass-segment inline-flex mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`seg-btn px-4 py-2 text-sm ${activeTab === 'users' ? 'seg-btn-active' : ''}`}
          >
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`seg-btn px-4 py-2 text-sm ${activeTab === 'updates' ? 'seg-btn-active' : ''}`}
          >
            Lançar Atualização
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-panel rounded-[2rem] overflow-hidden">
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
      )}

      {activeTab === 'updates' && user?.email === 'guilhermebarbosars@gmail.com' && (
        <div className="glass-panel rounded-[2rem] overflow-hidden">
          <div className="p-6 border-b border-white/50">
            <h2 className="text-xl font-semibold text-gray-900">Lançar Atualização</h2>
            <p className="text-sm text-gray-500 mt-1">Envie um comunicado que aparecerá para todos os usuários na próxima vez que abrirem o sistema.</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Versão do App</label>
              <input 
                type="text" 
                value={updateVersion}
                onChange={(e) => setUpdateVersion(e.target.value)}
                className="w-full max-w-xs px-4 py-3 glass-input rounded-xl font-mono"
                placeholder="Ex: 1.2.0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">O que há de novo? (Release Notes)</label>
              <textarea 
                rows={6}
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                className="w-full px-4 py-3 glass-input rounded-xl"
                placeholder="- Nova funcionalidade de X...&#10;- Correção de bugs em Y..."
              ></textarea>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleLaunchUpdate}
                disabled={savingUpdate || !updateNotes}
                className="btn-liquid btn-secondary-liquid px-6 py-3 rounded-xl"
              >
                {savingUpdate ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Lançar Atualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-[2rem] p-8 w-full max-w-md animate-pop-in">
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
                  className="btn-liquid btn-ghost-liquid px-5 py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-liquid btn-secondary-liquid px-5 py-2.5 rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-[2rem] p-8 w-full max-w-sm animate-pop-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Excluir Usuário</h2>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir este usuário? (Esta ação apenas remove o perfil da plataforma. O usuário ainda poderá ter acesso se não for removido no painel de autenticação do Firebase.)
            </p>
            
            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="btn-liquid btn-danger-liquid px-5 py-2.5 rounded-xl"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
