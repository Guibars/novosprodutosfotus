import { useState, useEffect } from "react";
import { Search, Bell, Mail, Menu, LogOut, Check, Trash2, MessageSquare, X, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useProjects } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { searchQuery, setSearchQuery } = useProjects();
  const { user, profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Listen for notifications directed to the user or broadcasted to 'all'
    const qNotifs = query(
      collection(db, 'notifications'),
      orderBy('created_at', 'desc')
    );

    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const notifs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(n => n.recipient_email === 'all' || n.recipient_email === user.email);
      setNotifications(notifs);
    });

    // Listen for messages directed to the user
    const qMsgs = query(
      collection(db, 'messages'),
      where('recipient_email', '==', user.email),
      orderBy('created_at', 'desc')
    );

    const unsubscribeMsgs = onSnapshot(qMsgs, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMessages(msgs);
    });

    return () => {
      unsubscribeNotifs();
      unsubscribeMsgs();
    };
  }, [user]);

  const unreadNotifsCount = notifications.filter(n => !n.read_by?.includes(user?.uid)).length;
  const unreadMsgsCount = messages.filter(m => !m.read).length;

  const markNotifAsRead = async (notificationId: string, currentReadBy: string[]) => {
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

  const markMsgAsRead = async (messageId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'messages', messageId), { read: true });
    } catch (error) {
      console.error("Erro ao marcar mensagem como lida", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error("Erro ao deletar mensagem", error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;
    try {
      await Promise.all(notifications.map(n => deleteDoc(doc(db, 'notifications', n.id))));
    } catch (error) {
      console.error("Erro ao deletar todas notificações", error);
    }
  };

  const deleteAllMessages = async () => {
    if (!user) return;
    try {
      await Promise.all(messages.map(m => deleteDoc(doc(db, 'messages', m.id))));
    } catch (error) {
      console.error("Erro ao deletar todas mensagens", error);
    }
  };

  return (
    <div className="px-4 pt-4 sticky top-0 z-20">
      <header className="h-16 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative w-72 sm:w-80 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar tarefa ou projeto..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 rounded-xl text-sm transition-all outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
                <span className="text-xs">⌘</span>F
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowMessages(!showMessages)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMsgsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            <AnimatePresence>
            {showMessages && (
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 flex flex-col gap-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">Mensagens</h3>
                      <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full">{unreadMsgsCount} novas</span>
                    </div>
                    <button 
                      onClick={() => setShowMessages(false)}
                      className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {messages.length > 0 && (
                    <button 
                      onClick={deleteAllMessages}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center justify-center gap-1 w-full bg-white hover:bg-rose-50 py-1.5 rounded-lg transition-colors border border-slate-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      Apagar todas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`p-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 ${!msg.read ? 'bg-amber-50/30' : ''}`}
                      >
                        <div className="flex-1">
                          <p className="text-xs font-bold text-secondary mb-0.5">De: {msg.sender_name}</p>
                          <p className={`text-xs ${!msg.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                            {msg.content}
                          </p>
                          {msg.project_name && (
                            <p className="text-[11px] text-secondary mt-1 font-medium">Projeto: {msg.project_name}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          {!msg.read && (
                            <button 
                              onClick={() => markMsgAsRead(msg.id)}
                              className="text-amber-600 hover:bg-amber-100 p-1 rounded-md transition-colors"
                              title="Marcar como lido"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors"
                            title="Excluir mensagem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                      Nenhuma mensagem no momento.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 flex flex-col gap-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">Notificações</h3>
                      <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full">{unreadNotifsCount} novas</span>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={deleteAllNotifications}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center justify-center gap-1 w-full bg-white hover:bg-rose-50 py-1.5 rounded-lg transition-colors border border-slate-200"
                  >
                    <Trash2 className="w-3 h-3" />
                    Apagar todas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => {
                    const isRead = notification.read_by?.includes(user?.uid);
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 ${!isRead ? 'bg-amber-50/30' : ''}`}
                      >
                        <div className="flex-1">
                          <p className={`text-xs ${!isRead ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          {!isRead && (
                            <button 
                              onClick={() => markNotifAsRead(notification.id, notification.read_by)}
                              className="text-amber-600 hover:bg-amber-100 p-1 rounded-md transition-colors"
                              title="Marcar como lido"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors"
                            title="Excluir notificação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">
                    Nenhuma notificação no momento.
                  </div>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        
        <div className="flex items-center gap-2.5 p-1 text-left">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'User'}`} 
            alt="User" 
            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div className="hidden md:block">
            <p className="text-xs font-bold text-slate-900">{user?.displayName || user?.email?.split('@')[0] || 'Usuário'}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{profile?.role || 'Membro'}</p>
          </div>
        </div>
        
        <button 
          onClick={signOut}
          title="Sair"
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors relative ml-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
    </div>
  );
}
