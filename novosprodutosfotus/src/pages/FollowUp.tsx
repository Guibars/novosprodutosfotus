import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, onSnapshot, setDoc, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessagesSquare, Plus, X, Search, Zap, Calendar as CalendarIcon, Clock, Building2, User2, AlignLeft, Hash, Trash2, Phone, MapPin, HelpCircle, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface FollowUpMeeting {
  id: string;
  clientName: string;
  companyName: string;
  orderNumber: string;
  chargerPower: string;
  date: string;
  time: string;
  observations: string;
  createdAt: any;
  createdBy: string;
  hasInstalledChargers: boolean;
  responsible: string;
  phone: string;
  state: string;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function FollowUp() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<FollowUpMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<FollowUpMeeting | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    clientName: '',
    companyName: '',
    orderNumber: '',
    chargerPower: '60',
    date: '',
    time: '',
    observations: '',
    hasInstalledChargers: false,
    responsible: '',
    phone: '',
    state: 'SP'
  });

  useEffect(() => {
    const q = query(collection(db, 'meeting_followups'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: FollowUpMeeting[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as FollowUpMeeting);
      });
      setMeetings(data);
      setLoading(false);
    });
    
    const unsubTeam = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(members);
    });
    
    return () => {
      unsub();
      unsubTeam();
    };
  }, []);

  const openNewModal = () => {
    setForm({
      clientName: '',
      companyName: '',
      orderNumber: '',
      chargerPower: '60',
      date: new Date().toISOString().split('T')[0],
      time: '09:00 - 10:00',
      observations: '',
      hasInstalledChargers: false,
      responsible: user?.name || user?.email || '',
      phone: '',
      state: 'SP'
    });
    setEditingMeeting(null);
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: FollowUpMeeting) => {
    setForm({
      clientName: meeting.clientName || '',
      companyName: meeting.companyName || '',
      orderNumber: meeting.orderNumber || '',
      chargerPower: meeting.chargerPower || '60',
      date: meeting.date || '',
      time: meeting.time || '',
      observations: meeting.observations || '',
      hasInstalledChargers: meeting.hasInstalledChargers || false,
      responsible: meeting.responsible || '',
      phone: meeting.phone || '',
      state: meeting.state || 'SP'
    });
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setMeetingToDelete(id);
  };

  const confirmDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await deleteDoc(doc(db, 'meeting_followups', meetingToDelete));
      setMeetingToDelete(null);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!form.clientName || !form.companyName) {
      alert('Preencha o nome do cliente e empresa.');
      return;
    }

    try {
      const id = editingMeeting ? editingMeeting.id : doc(collection(db, 'meeting_followups')).id;
      const payload = {
        ...form,
        createdAt: editingMeeting ? editingMeeting.createdAt : serverTimestamp(),
        createdBy: user?.name || user?.email || 'Unknown'
      };

      await setDoc(doc(db, 'meeting_followups', id), payload, { merge: true });
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar reunião: ' + err.message);
    }
  };

  const filteredMeetings = meetings.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const insights = useMemo(() => {
    const totalMeetings = meetings.length;
    
    const stateCounts = meetings.reduce((acc, m) => {
      const st = m.state || 'SP';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sortedStates = Object.entries(stateCounts).sort((a, b) => (b[1] as number) - (a[1] as number));

    const powerCounts = meetings.reduce((acc, m) => {
      const p = m.chargerPower || '60';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sortedPowers = Object.entries(powerCounts).sort((a, b) => (b[1] as number) - (a[1] as number));

    const installedCounts = meetings.reduce((acc, m) => {
      if (m.hasInstalledChargers) acc.yes++;
      else acc.no++;
      return acc;
    }, { yes: 0, no: 0 });

    return { totalMeetings, sortedStates, sortedPowers, installedCounts };
  }, [meetings]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando painel de reuniões...</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex justify-between items-end shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <MessagesSquare className="w-8 h-8 text-secondary" />
            Follow-Up de Reuniões
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhamento de reuniões e negociações de carregadores elétricos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente ou empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 shadow-sm focus:ring-2 focus:ring-secondary outline-none w-[260px] hover:border-gray-300 transition-colors"
            />
          </div>

          <button 
            onClick={() => setIsInsightsOpen(true)}
            className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all shrink-0 hover:border-gray-300"
          >
            <BarChart3 className="w-4 h-4" />
            Insights Gerais
          </button>

          <button 
            onClick={openNewModal}
            className="bg-secondary text-white px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-bold shadow-md hover:bg-secondary/90 transition-all shrink-0 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Nova Reunião
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMeetings.length > 0 ? filteredMeetings.map(meeting => (
          <div 
            key={meeting.id} 
            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group overflow-hidden"
          >
            <div className="p-6 pb-5 flex-1 flex flex-col relative">
              <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => openEditModal(meeting)} className="p-1.5 bg-gray-50 text-gray-600 hover:text-secondary rounded-lg hover:bg-secondary/10 transition-colors">
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(meeting.id)} className="p-1.5 bg-gray-50 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                    <Zap className="w-5 h-5 fill-secondary/20" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-80">Potência Oferecida</span>
                    <div className="text-xl font-black text-gray-900 leading-none">{meeting.chargerPower} <span className="text-sm font-bold text-gray-500">kW</span></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                    <MapPin className="w-3 h-3" /> {meeting.state || 'SP'}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-1 leading-tight pr-12 line-clamp-2">{meeting.companyName}</h3>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                <User2 className="w-3.5 h-3.5" /> {meeting.clientName}
              </p>
              {meeting.phone && (
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-2">
                  <Phone className="w-3.5 h-3.5" /> {meeting.phone}
                </p>
              )}
              
              <div className="mb-4">
                 {meeting.hasInstalledChargers ? (
                   <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 mt-1 py-0.5 rounded-full">
                     <CheckCircle2 className="w-3 h-3" /> Já possui carregadores
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 mt-1 py-0.5 rounded-full">
                     <XCircle className="w-3 h-3" /> Não possui carregadores
                   </span>
                 )}
              </div>

              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  {meeting.date.split('-').reverse().join('/')}
                  <div className="w-1 h-1 rounded-full bg-gray-300 mx-1"></div>
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {meeting.time}
                </div>
                {meeting.responsible && (
                   <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 mt-2 px-1">
                     Responsável: <span className="text-gray-800">{meeting.responsible}</span>
                   </div>
                )}
                {meeting.orderNumber && (
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-blue-800">
                      <Hash className="w-3.5 h-3.5 text-blue-400" />
                      Pedido: {meeting.orderNumber}
                   </div>
                )}
              </div>
            </div>
            
            {meeting.observations && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-600 line-clamp-3 relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Observações</span>
                <p className="font-medium leading-relaxed pb-1">{meeting.observations}</p>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent"></div>
              </div>
            )}
            {!meeting.observations && (
               <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs font-medium text-gray-400 italic">
                 Nenhuma observação registrada.
               </div>
            )}
          </div>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <MessagesSquare className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-black text-gray-800">Nenhuma reunião encontrada</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">Adicione o follow-up da sua primeira reunião sobre carregadores elétricos clicando no botão acima.</p>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 md:p-8">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-[100] bg-white border border-gray-100 shadow-sm">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
              <div className="flex items-center gap-4 mb-8">
               <div className="p-3.5 rounded-2xl bg-secondary/10 text-secondary shadow-inner border border-secondary/20">
                  <MessagesSquare className="w-8 h-8" />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-gray-900">{editingMeeting ? 'Editar Reunião' : 'Nova Reunião Mapeada'}</h2>
                 <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1 uppercase tracking-wider">
                   Follow-Up Carregadores Elétricos
                 </p>
               </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User2 className="w-3.5 h-3.5 text-gray-400" /> Nome do Cliente
                    </label>
                    <input 
                      type="text" 
                      value={form.clientName} 
                      onChange={e => setForm({...form, clientName: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors" 
                      placeholder="Ex: João Silva" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" /> Nome da Empresa
                    </label>
                    <input 
                      type="text" 
                      value={form.companyName} 
                      onChange={e => setForm({...form, companyName: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors" 
                      placeholder="Ex: Eletro Engenharia" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Telefone Contato
                    </label>
                    <input 
                      type="text" 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors" 
                      placeholder="(11) 99999-9999" 
                    />
                  </div>
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> Estado
                    </label>
                    <select 
                      value={form.state} 
                      onChange={e => setForm({...form, state: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors bg-white hover:border-gray-300" 
                    >
                      {BRAZIL_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-gray-400" /> Potência Oferecida
                    </label>
                    <select 
                      value={form.chargerPower} 
                      onChange={e => setForm({...form, chargerPower: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors bg-white appearance-none cursor-pointer" 
                    >
                      <option value="40">40 kW</option>
                      <option value="60">60 kW</option>
                      <option value="80">80 kW</option>
                      <option value="120">120 kW</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User2 className="w-3.5 h-3.5 text-gray-400" /> Responsável pela Reunião
                    </label>
                    <select 
                      value={form.responsible} 
                      onChange={e => setForm({...form, responsible: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors bg-white hover:border-gray-300" 
                    >
                      <option value="">Selecione o responsável</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.full_name || member.email}>
                          {member.full_name || member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-gray-400" /> Número do Pedido <span className="text-gray-400 font-normal normal-case">(Opcional)</span>
                    </label>
                    <input 
                      type="text" 
                      value={form.orderNumber} 
                      onChange={e => setForm({...form, orderNumber: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors" 
                      placeholder="Ex: 1234567-98" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400" /> Data da Reunião
                    </label>
                    <input 
                      type="date" 
                      value={form.date} 
                      onChange={e => setForm({...form, date: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Horário
                    </label>
                    <input 
                      type="text" 
                      value={form.time} 
                      onChange={e => setForm({...form, time: e.target.value})} 
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold text-gray-900 transition-colors text-sm" 
                      placeholder="Ex: 09:00 as 10:00" 
                    />
                  </div>
                </div>
                
                <div>
                   <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" /> Cliente já possui carregadores instalados?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl flex-1 hover:border-emerald-300 hover:bg-emerald-50 transition-colors" onClick={() => setForm({...form, hasInstalledChargers: true})}>
                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", form.hasInstalledChargers ? "border-emerald-500" : "border-gray-300")}>
                          {form.hasInstalledChargers && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                        </div>
                        <span className={cn("font-bold text-sm", form.hasInstalledChargers ? "text-emerald-700" : "text-gray-600")}>Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl flex-1 hover:border-gray-300 hover:bg-gray-50 transition-colors" onClick={() => setForm({...form, hasInstalledChargers: false})}>
                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", !form.hasInstalledChargers ? "border-gray-500" : "border-gray-300")}>
                          {!form.hasInstalledChargers && <div className="w-2.5 h-2.5 bg-gray-500 rounded-full" />}
                        </div>
                        <span className={cn("font-bold text-sm", !form.hasInstalledChargers ? "text-gray-800" : "text-gray-600")}>Não</span>
                      </label>
                    </div>
                </div>

                <div>
                   <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-gray-400" /> Observações e Alinhamentos
                    </label>
                    <textarea 
                      value={form.observations}
                      onChange={e => setForm({...form, observations: e.target.value})}
                      className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-medium text-gray-900 transition-colors resize-none h-32"
                      placeholder="Anote aqui os detalhes da reunião, próximos passos e acordos..."
                    />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border-t border-gray-100 flex justify-end shrink-0">
               <button 
                 onClick={handleSave} 
                 className="bg-secondary text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:bg-secondary/90 transition-colors flex items-center gap-2 w-full sm:w-auto"
               >
                 <Plus className="w-5 h-5" />
                 Salvar Reunião
               </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isInsightsOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 md:p-8">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            <button onClick={() => setIsInsightsOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-[100] bg-white border border-gray-100 shadow-sm">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
              <div className="flex items-center gap-4 mb-8">
               <div className="p-3.5 rounded-2xl bg-secondary/10 text-secondary shadow-inner border border-secondary/20">
                  <BarChart3 className="w-8 h-8" />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-gray-900">Insights de Reuniões</h2>
                 <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1 uppercase tracking-wider">
                   Visão Geral de Desempenho
                 </p>
               </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total de Reuniões</span>
                  <div className="text-5xl font-black text-gray-900">{insights.totalMeetings}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Com Carregadores</span>
                  <div className="text-5xl font-black text-emerald-900">{insights.installedCounts.yes}</div>
                  <span className="text-xs font-medium text-emerald-600 mt-2">Desses clientes</span>
                </div>
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider mb-2">Sem Carregadores</span>
                  <div className="text-5xl font-black text-orange-900">{insights.installedCounts.no}</div>
                  <span className="text-xs font-medium text-orange-600 mt-2">Mercado potencial</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-6">
                    <MapPin className="w-4 h-4 text-secondary" />
                    Estados com mais reuniões
                  </h3>
                  <div className="space-y-4">
                    {insights.sortedStates.slice(0, 5).map(([st, count]) => (
                      <div key={st}>
                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                          <span>{st}</span>
                          <span>{count} reuniões</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${(count / (insights.sortedStates[0]?.[1] || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                    {insights.sortedStates.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">Sem dados suficientes</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-6">
                    <Zap className="w-4 h-4 text-secondary" />
                    Potência mais oferecida
                  </h3>
                  <div className="space-y-4">
                    {insights.sortedPowers.map(([p, count]) => (
                      <div key={p}>
                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                          <span>{p} kW</span>
                          <span>{count} vezes</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(count / (insights.sortedPowers[0]?.[1] || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                    {insights.sortedPowers.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">Sem dados suficientes</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {meetingToDelete && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Excluir Reunião</h3>
            <p className="text-sm text-gray-500 mb-8">Tem certeza que deseja excluir este registro de follow-up? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setMeetingToDelete(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
