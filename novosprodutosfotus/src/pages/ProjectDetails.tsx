import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Users, Tag, Link as LinkIcon, MessageSquare, ExternalLink, Trash2, Edit2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useProjects, Task, ProjectLink } from "../contexts/ProjectContext";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const sectors = ["Gerência", "Coordenação", "Desenvolvimento", "Novos Produtos", "Marketing", "Pricing", "TI"];
const phases = ["Fase 1 - Pré-Lançamento", "Fase 2 - Lançamento", "Fase 3 - Aceleração", "Fase 4 - Escala e Transição"];

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProjectTasks, updateProjectLinks } = useProjects();
  const { user } = useAuth();
  
  const project = projects.find(p => p.id === id);
  const tasks = project?.tasks || [];
  const links = project?.links || [];

  const setTasks = (newTasks: Task[]) => {
    if (id) updateProjectTasks(id, newTasks);
  };

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskSector, setNewTaskSector] = useState(sectors[0]);
  const [newTaskDate, setNewTaskDate] = useState("");
  const [addingTaskPhase, setAddingTaskPhase] = useState<string | null>(null);
  
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [isMessaging, setIsMessaging] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageRecipientEmail, setMessageRecipientEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [expandedObservationTaskId, setExpandedObservationTaskId] = useState<string | null>(null);
  const [observationText, setObservationText] = useState("");

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [taskDeletePassword, setTaskDeletePassword] = useState("");
  const [taskDeleteError, setTaskDeleteError] = useState("");

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskSector, setEditTaskSector] = useState("");
  const [editTaskDate, setEditTaskDate] = useState("");

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'profiles'));
        setTeamMembers(querySnapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Erro ao buscar time:", error);
      }
    };
    fetchTeam();
  }, []);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeName || !assigneeEmail || !assigningTask) return;
    setTasks(tasks.map(t => t.id === assigningTask ? { ...t, assignee: `${assigneeName} (${assigneeEmail})` } : t));
    setAssigningTask(null);
    setAssigneeName("");
    setAssigneeEmail("");
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const saveObservation = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, observation: observationText } : t));
    setExpandedObservationTaskId(null);
  };

  const confirmDeleteTask = () => {
    if (taskDeletePassword === "Fotus" || taskDeletePassword === "fotus") {
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
      setTaskDeletePassword("");
      setTaskDeleteError("");
    } else {
      setTaskDeleteError("Senha incorreta!");
    }
  };

  const saveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setTasks(tasks.map(t => t.id === editingTask.id ? { 
      ...t, 
      title: editTaskTitle,
      sector: editTaskSector,
      dueDate: editTaskDate
    } : t));
    setEditingTask(null);
  };

  const addTask = (phase: string) => {
    if (!newTaskTitle || !newTaskDate) return;
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      sector: newTaskSector,
      dueDate: newTaskDate,
      completed: false,
      phase: phase
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskDate("");
    setAddingTaskPhase(null);
  };

  const addLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl || !id) return;
    const newLink: ProjectLink = {
      id: `link-${Date.now()}`,
      title: newLinkTitle,
      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`
    };
    updateProjectLinks(id, [...links, newLink]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setIsAddingLink(false);
  };

  const removeLink = (linkId: string) => {
    if (!id) return;
    updateProjectLinks(id, links.filter(l => l.id !== linkId));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent || !messageRecipientEmail || !user) return;
    try {
      await addDoc(collection(db, 'messages'), {
        content: messageContent,
        recipient_email: messageRecipientEmail,
        sender_email: user.email,
        sender_name: user.displayName || user.email,
        project_id: id,
        project_name: project?.name,
        created_at: new Date().toISOString(),
        read: false
      });
      setIsMessaging(false);
      setMessageContent("");
      setMessageRecipientEmail("");
      alert("Mensagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 capitalize">{project?.name || 'Projeto'}</h1>
            <p className="text-gray-500 mt-1">Visão geral e tarefas do projeto.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMessaging(true)}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Enviar Mensagem
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Progresso Geral</h3>
              <span className="font-bold text-secondary">{progress}%</span>
            </div>
            <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {phases.map(phase => {
            const phaseTasks = tasks.filter(t => t.phase === phase || (!t.phase && phase === phases[0]));
            const phaseProgress = phaseTasks.length > 0 
              ? Math.round((phaseTasks.filter(t => t.completed).length / phaseTasks.length) * 100) 
              : 0;

            return (
              <div key={phase} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
                <div className="p-6 border-b border-white/50 flex items-center justify-between bg-white/20">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{phase}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-24 bg-white/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${phaseProgress}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{phaseProgress}% concluído</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAddingTaskPhase(phase)}
                    className="flex items-center gap-2 bg-white/50 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                <div className="divide-y divide-white/30">
                  {addingTaskPhase === phase && (
                    <div className="p-4 bg-white/40 flex flex-wrap gap-4 items-center">
                      <input 
                        type="text" 
                        placeholder="Título da tarefa..." 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.currentTarget.value)}
                        className="flex-1 min-w-[200px] px-3 py-2 glass-input rounded-lg text-sm"
                      />
                      <select 
                        value={newTaskSector}
                        onChange={(e) => setNewTaskSector(e.currentTarget.value)}
                        className="min-w-[150px] px-3 py-2 glass-input rounded-lg text-sm"
                      >
                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input 
                        type="date" 
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.currentTarget.value)}
                        className="min-w-[150px] px-3 py-2 glass-input rounded-lg text-sm"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => addTask(phase)} className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-hover shadow-sm">Salvar</button>
                        <button onClick={() => setAddingTaskPhase(null)} className="px-4 py-2 bg-white/50 border border-white/50 text-gray-700 rounded-lg text-sm font-medium hover:bg-white/80">Cancelar</button>
                      </div>
                    </div>
                  )}

                  {phaseTasks.length === 0 && addingTaskPhase !== phase && (
                    <div className="p-6 text-center text-sm text-gray-500">Nenhuma tarefa nesta fase.</div>
                  )}

                  {phaseTasks.map((task) => (
                    <div key={task.id} className="group relative border-b border-white/10 last:border-0 rounded-2xl overflow-hidden transition-all">
                      <div className={cn("p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white/50 transition-colors z-10 relative", task.completed && "bg-white/30")}>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <button onClick={() => toggleTask(task.id)} className="shrink-0 text-gray-400 hover:text-secondary transition-colors">
                            {task.completed ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Circle className="w-6 h-6" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-gray-900 truncate", task.completed && "text-gray-500 line-through")}>
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {task.sector}</span>
                              <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {task.dueDate}</span>
                              {task.observation && (
                                <span className="flex items-center gap-1 text-primary"><FileText className="w-3 h-3" /> Com observação</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                          {task.assignee ? (
                            <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-white/50">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                {task.assignee.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{task.assignee.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setAssigningTask(task.id)}
                              className="text-sm font-medium text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Atribuir
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              if (expandedObservationTaskId === task.id) {
                                setExpandedObservationTaskId(null);
                              } else {
                                setExpandedObservationTaskId(task.id);
                                setObservationText(task.observation || "");
                              }
                            }}
                            className={cn("p-2 rounded-lg transition-colors ml-2", expandedObservationTaskId === task.id ? "bg-primary text-white" : "text-gray-400 hover:text-primary hover:bg-white/50")}
                            title="Observação"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              setEditingTask(task);
                              setEditTaskTitle(task.title);
                              setEditTaskSector(task.sector);
                              setEditTaskDate(task.dueDate);
                            }}
                            className="p-2 text-gray-400 hover:text-primary rounded-lg transition-colors hover:bg-white/50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => setTaskToDelete(task.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedObservationTaskId === task.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white/20 backdrop-blur-md border-t border-white/20 relative">
                              <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none"></div>
                              <textarea
                                value={observationText}
                                onChange={(e) => setObservationText(e.target.value)}
                                placeholder="Adicione uma observação para esta tarefa..."
                                className="w-full glass-input p-3 rounded-xl text-sm min-h-[80px] resize-y mb-3 relative z-10 bg-white/50"
                              />
                              <div className="flex justify-end gap-2 relative z-10">
                                <button
                                  onClick={() => setExpandedObservationTaskId(null)}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => saveObservation(task.id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20 rounded-lg transition-colors"
                                >
                                  Salvar Observação
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* Links Section */}
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
            <div className="p-6 border-b border-white/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Links e Documentos</h3>
              </div>
              <button 
                onClick={() => setIsAddingLink(true)}
                className="p-1.5 bg-white/50 hover:bg-white text-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {isAddingLink && (
                <form onSubmit={addLink} className="bg-white/50 p-3 rounded-xl space-y-3 border border-white/50">
                  <input 
                    type="text" 
                    required
                    placeholder="Título (ex: Apresentação Canva)" 
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                  />
                  <input 
                    type="url" 
                    required
                    placeholder="URL (https://...)" 
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">Adicionar</button>
                    <button type="button" onClick={() => setIsAddingLink(false)} className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              )}

              {links.length === 0 && !isAddingLink ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum link adicionado.</p>
              ) : (
                links.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-white/40 hover:bg-white/60 rounded-xl transition-colors group border border-white/30">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate hover:text-primary transition-colors">{link.title}</span>
                    </a>
                    <button 
                      onClick={() => removeLink(link.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Task Modal */}
      {assigningTask && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Atribuir Tarefa</h2>
            <form onSubmit={handleAssign} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membro da Equipe</label>
                <select 
                  required
                  value={assigneeEmail}
                  onChange={(e) => {
                    const member = teamMembers.find(m => m.email === e.target.value);
                    if (member) {
                      setAssigneeEmail(member.email);
                      setAssigneeName(member.displayName || member.email.split('@')[0]);
                    }
                  }}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                >
                  <option value="">Selecione um membro...</option>
                  {teamMembers.map(m => (
                    <option key={m.uid} value={m.email}>{m.displayName || m.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setAssigningTask(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/30"
                >
                  Atribuir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {isMessaging && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enviar Mensagem</h2>
            <form onSubmit={sendMessage} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatário</label>
                <select 
                  required
                  value={messageRecipientEmail}
                  onChange={(e) => setMessageRecipientEmail(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                >
                  <option value="">Selecione um membro...</option>
                  {teamMembers.filter(m => m.email !== user?.email).map(m => (
                    <option key={m.uid} value={m.email}>{m.displayName || m.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea 
                  required
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl resize-none"
                  placeholder="Digite sua mensagem sobre este projeto..."
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsMessaging(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/30"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Excluir Tarefa</h2>
            <p className="text-sm text-gray-600 mb-6">Digite a senha para confirmar a exclusão desta tarefa.</p>
            
            <div className="space-y-5">
              <div>
                <input 
                  type="password" 
                  value={taskDeletePassword}
                  onChange={(e) => setTaskDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:ring-red-500/30"
                  placeholder="Senha"
                />
                {taskDeleteError && <p className="text-red-500 text-xs mt-2">{taskDeleteError}</p>}
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteTask}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Tarefa</h2>
            <form onSubmit={saveEditTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título da tarefa</label>
                <input 
                  type="text" 
                  required
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                  placeholder="Título"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                <select 
                  required
                  value={editTaskSector}
                  onChange={(e) => setEditTaskSector(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                >
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de conclusão</label>
                <input 
                  type="date" 
                  required
                  value={editTaskDate}
                  onChange={(e) => setEditTaskDate(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setEditingTask(null)}
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
