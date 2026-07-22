import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, BarChart2, Target, Palmtree, Settings, HelpCircle, LogOut, Package, MessagesSquare } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { icon: BarChart2, label: "Cockpit Novos Produtos", path: "/analytics" },
  { icon: Target, label: "Métricas", path: "/metrics" },
  { icon: CheckSquare, label: "Projetos", path: "/projects" },
  { icon: LayoutDashboard, label: "Visão Projetos", path: "/dashboard" },
  { icon: Package, label: "Quadro de Transferência", path: "/transfer-board" },
  { icon: Package, label: "Estoque", path: "/inventory" },
  { icon: MessagesSquare, label: "Follow-Up de Reuniões", path: "/follow-up" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: Palmtree, label: "Férias e Voos", path: "/vacations" },
];

const generalItems = [
  { icon: Settings, label: "Configurações", path: "/settings" },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { signOut } = useAuth();

  return (
    <aside className={cn(
      "fixed left-4 top-4 bottom-4 transition-all duration-300 z-30",
      isOpen ? "w-64" : "w-[4.5rem]"
    )}>
      <div className="glass-panel bg-white/85 backdrop-blur-xl h-full rounded-2xl border border-white/90 flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 flex items-center justify-center border-b border-slate-100 h-[64px] shrink-0">
          <img 
            src="https://res.cloudinary.com/dsctpzqvy/image/upload/v1776688852/Design_sem_nome_2_hx7e0j.png" 
            alt="Fotus Logo" 
            className={cn("object-contain transition-all duration-300 shrink-0", isOpen ? "h-7" : "h-6")}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col gap-5">
          <div>
            <p className={cn("text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest text-center", isOpen ? "px-3 text-left" : "px-0")}>
              {isOpen ? "Menu" : "•"}
            </p>
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isOpen ? item.label : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-xl text-xs font-bold transition-all duration-150 relative",
                    isOpen ? "px-3 py-2.5" : "p-2.5 justify-center",
                    isActive 
                      ? "bg-secondary text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-slate-400")} />
                      {isOpen && <span className="truncate">{item.label}</span>}
                      {isActive && isOpen && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-primary"></span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            <p className={cn("text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest text-center", isOpen ? "px-3 text-left" : "px-0")}>
              {isOpen ? "Geral" : "•"}
            </p>
            <nav className="flex flex-col gap-1">
              {generalItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isOpen ? item.label : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-xl text-xs font-bold transition-all duration-150 relative",
                    isOpen ? "px-3 py-2.5" : "p-2.5 justify-center",
                    isActive 
                      ? "bg-secondary text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-slate-400")} />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
              <button 
                onClick={signOut}
                title={!isOpen ? "Sair" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/80 transition-all mt-1",
                  isOpen ? "px-3 py-2.5" : "p-2.5 justify-center"
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {isOpen && <span className="truncate">Sair</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
