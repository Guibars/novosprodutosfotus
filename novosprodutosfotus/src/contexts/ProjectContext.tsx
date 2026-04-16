import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export type Task = {
  id: string;
  title: string;
  sector: string;
  dueDate: string;
  completed: boolean;
  assignee?: string;
  project_id?: string;
  phase?: string;
  observation?: string;
};

export type ProjectLink = {
  id: string;
  title: string;
  url: string;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasks: Task[];
  dueDate: string;
  color: string;
  user_id?: string;
  links?: ProjectLink[];
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'progress' | 'tasks'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'tasks' | 'progress'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectTasks: (projectId: string, tasks: Task[]) => Promise<void>;
  updateProjectLinks: (projectId: string, links: ProjectLink[]) => Promise<void>;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    let unsubscribeTasks: () => void;

    // Listen to projects (all projects for the team)
    const unsubscribeProjects = onSnapshot(collection(db, 'projetos'), (projectsSnapshot) => {
      const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Listen to tasks (all tasks for the team)
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
      
      unsubscribeTasks = onSnapshot(collection(db, 'tarefas'), (tasksSnapshot) => {
        const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Combine projects and tasks
        const combinedProjects = projectsData.map((p: any) => {
          const projectTasks = tasksData.filter((t: any) => t.project_id === p.id);
          const progress = projectTasks.length > 0 
            ? Math.round((projectTasks.filter((t: any) => t.completed).length / projectTasks.length) * 100) 
            : 0;
          
          return {
            ...p,
            tasks: projectTasks,
            progress
          };
        });

        setProjects(combinedProjects);
      }, (error) => {
        console.error("Erro ao buscar tarefas:", error);
      });

    }, (error) => {
      console.error("Erro ao buscar projetos:", error);
    });

    return () => {
      unsubscribeProjects();
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
    };
  }, [user]);

  const notify = async (message: string, recipientEmail?: string) => {
    if (!user) return;
    try {
      await setDoc(doc(collection(db, 'notifications')), {
        message,
        recipient_email: recipientEmail || 'all',
        created_at: new Date().toISOString(),
        read_by: []
      });
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'progress' | 'tasks'>) => {
    if (user) {
      try {
        const newDocRef = doc(collection(db, 'projetos'));
        await setDoc(newDocRef, { ...projectData, user_id: user.uid });
        await notify(`${user.displayName || user.email} criou o projeto "${projectData.name}"`);
      } catch (error) {
        console.error("Erro ao criar projeto:", error);
      }
    }
  };

  const updateProject = async (id: string, updates: Partial<Omit<Project, 'id' | 'tasks' | 'progress'>>) => {
    if (user) {
      try {
        await setDoc(doc(db, 'projetos', id), updates, { merge: true });
        if (updates.name) {
          await notify(`${user.displayName || user.email} atualizou o projeto para "${updates.name}"`);
        }
      } catch (error) {
        console.error("Erro ao atualizar projeto:", error);
      }
    }
  };

  const updateProjectTasks = async (projectId: string, newTasks: Task[]) => {
    if (user) {
      try {
        const currentProject = projects.find(p => p.id === projectId);
        const currentTasks = currentProject?.tasks || [];
        const newTaskIds = newTasks.map(t => t.id);
        const tasksToDelete = currentTasks.filter(t => !newTaskIds.includes(t.id));

        const batch = writeBatch(db);

        // Delete removed tasks
        tasksToDelete.forEach(t => {
          batch.delete(doc(db, 'tarefas', t.id));
        });

        // Upsert new and existing tasks
        newTasks.forEach(t => {
          const isNew = t.id.startsWith('temp-');
          const taskRef = isNew ? doc(collection(db, 'tarefas')) : doc(db, 'tarefas', t.id);
          batch.set(taskRef, {
            title: t.title,
            sector: t.sector,
            dueDate: t.dueDate,
            completed: t.completed,
            assignee: t.assignee || null,
            project_id: projectId,
            user_id: user.uid,
            phase: t.phase || null,
            observation: t.observation || null
          }, { merge: true });

          // Check for assignment changes
          const oldTask = currentTasks.find(ct => ct.id === t.id);
          if (t.assignee && (!oldTask || oldTask.assignee !== t.assignee)) {
            // Extract email if it's in the format "Name (email@example.com)"
            const emailMatch = t.assignee.match(/\(([^)]+)\)/);
            const assigneeEmail = emailMatch ? emailMatch[1] : t.assignee;
            notify(`${user.displayName || user.email} atribuiu a tarefa "${t.title}" a você.`, assigneeEmail);
          } else if (!isNew && oldTask && oldTask.completed !== t.completed) {
            notify(`${user.displayName || user.email} marcou a tarefa "${t.title}" como ${t.completed ? 'concluída' : 'pendente'}.`);
          } else if (isNew) {
            notify(`${user.displayName || user.email} adicionou a tarefa "${t.title}" no projeto "${currentProject?.name}".`);
          }
        });

        await batch.commit();
      } catch (error) {
        console.error("Erro ao atualizar tarefas:", error);
      }
    }
  };

  const updateProjectLinks = async (projectId: string, links: ProjectLink[]) => {
    if (user) {
      try {
        await setDoc(doc(db, 'projetos', projectId), { links }, { merge: true });
      } catch (error) {
        console.error("Erro ao atualizar links:", error);
      }
    }
  };

  const deleteProject = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'projetos', id));
      } catch (error) {
        console.error("Erro ao deletar projeto:", error);
      }
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject,
      deleteProject, 
      updateProjectTasks,
      updateProjectLinks,
      isProjectModalOpen, 
      setIsProjectModalOpen,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used within ProjectProvider");
  return context;
};
