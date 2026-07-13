import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Mail, Shield, User } from "lucide-react";

export function Team() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Time</h1>
        <p className="text-gray-500 mt-1">Conheça os membros da sua equipe e seus respectivos setores.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5 hover:bg-white/60 transition-colors group">
              <div className="flex items-start gap-4">
                <img 
                  src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.email}`} 
                  alt={member.full_name} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{member.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    {member.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    {member.role || 'Membro'}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {teamMembers.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem]">
              Nenhum membro encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
