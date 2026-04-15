import React, { createContext, useContext, useState } from 'react';

export type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasks: number;
  dueDate: string;
  color: string;
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'progress' | 'tasks'>) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([
    { id: "eletroposto", name: "Eletroposto", status: "Em Progresso", progress: 65, tasks: 12, dueDate: "15 Dez, 2024", color: "bg-primary" }
  ]);

  const addProject = (projectData: Omit<Project, 'id' | 'progress' | 'tasks'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      progress: 0,
      tasks: 0,
    };
    setProjects([...projects, newProject]);
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used within ProjectProvider");
  return context;
};
