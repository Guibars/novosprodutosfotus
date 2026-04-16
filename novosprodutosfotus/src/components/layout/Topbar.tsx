import { useState, useEffect } from "react";
import { Search, Bell, Mail, Menu, LogOut, Check, Trash2 } from "lucide-react";
import { useProjects } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { searchQuery, setSearchQuery } = useProjects();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Listen for notifications directed to the user or broadcasted to 'all'
    const q = query(
      collection(db, 'notifications'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(n => n.recipient_email === 'all' || n.recipient_email === user.email);
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read_by?.includes(user?.uid)).length;

  const markAsRead = async (notificationId: string, currentReadBy: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read_by: [...(currentReadBy || []), user.uid]
      });
    } catch (error) {
      console.error("Erro ao marcar como lido", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error("Erro ao deletar notificação", error);
    }
  };

  return (
    <div className="px-4 pt-4 sticky top-0 z-20">
      <header className="h-20 glass border border-white/50 rounded-[2rem] flex items-center justify-between px-8 shadow-xl shadow-black/5">
        <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:bg-white/50 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Pesquisar tarefa ou projeto..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-gray-500 bg-white/50 border border-white/50 rounded">
              <span className="text-xs">⌘</span>F
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:bg-white/50 rounded-full transition-colors relative">
          <Mail className="w-5 h-5" />
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:bg-white/50 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white/50"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-white/50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">{unreadCount} novas</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => {
                    const isRead = notification.read_by?.includes(user?.uid);
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b border-white/50 hover:bg-white/50 transition-colors flex gap-3 ${!isRead ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex-1">
                          <p className={`text-sm ${!isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          {!isRead && (
                            <button 
                              onClick={() => markAsRead(notification.id, notification.read_by)}
                              className="text-primary hover:bg-primary/10 p-1.5 rounded-lg h-fit transition-colors"
                              title="Marcar como lido"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg h-fit transition-colors"
                            title="Excluir notificação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Nenhuma notificação no momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-white/50 mx-2"></div>
        
        <div className="flex items-center gap-3 p-1.5 rounded-xl text-left">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'User'}`} 
            alt="User" 
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            referrerPolicy="no-referrer"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{user?.displayName || user?.email?.split('@')[0] || 'Usuário'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'Não logado'}</p>
          </div>
        </div>
        
        <button 
          onClick={signOut}
          title="Sair"
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors relative ml-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
    </div>
  );
}
