import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, BarChart2, Target, Palmtree, Settings, HelpCircle, LogOut, Package, TrendingUp, MessagesSquare } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { icon: BarChart2, label: "Cockpit Novos Produtos", path: "/analytics" },
  { icon: Target, label: "Métricas", path: "/metrics" },
  { icon: CheckSquare, label: "Projetos", path: "/projects" },
  { icon: LayoutDashboard, label: "Visão Projetos", path: "/dashboard" },
  { icon: Package, label: "Quadro de Transferência", path: "/transfer-board" },
  { icon: MessagesSquare, label: "Follow-Up de Reuniões", path: "/follow-up" },
  { icon: TrendingUp, label: "Inteligência de Mercado", path: "/market-intelligence" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: Palmtree, label: "Férias", path: "/vacations" },
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
      <div className="glass h-full rounded-[2rem] border border-white/50 flex flex-col shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-6 flex items-center justify-center border-b border-white/10 h-[76px] overflow-hidden">
          <img 
            src="https://res.cloudinary.com/dsctpzqvy/image/upload/v1776688852/Design_sem_nome_2_hx7e0j.png" 
            alt="Fotus Logo" 
            className={cn("object-contain transition-all duration-300 shrink-0", isOpen ? "h-7" : "h-6")}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-3 flex flex-col gap-8">
          <div>
            <p className={cn("text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] text-center", isOpen ? "px-3 text-left" : "px-0")}>
              {isOpen ? "Menu" : "•"}
            </p>
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isOpen ? item.label : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200",
                    isOpen ? "px-4 py-3" : "p-3 justify-center",
                    isActive 
                      ? "bg-secondary text-white shadow-lg shadow-secondary/30 scale-[1.02]" 
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-gray-500")} />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            <p className={cn("text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] text-center", isOpen ? "px-3 text-left" : "px-0")}>
              {isOpen ? "Geral" : "•"}
            </p>
            <nav className="flex flex-col gap-1.5">
              {generalItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isOpen ? item.label : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200",
                    isOpen ? "px-4 py-3" : "p-3 justify-center",
                    isActive 
                      ? "bg-secondary text-white shadow-lg shadow-secondary/30 scale-[1.02]" 
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-gray-500")} />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
              <button 
                onClick={signOut}
                title={!isOpen ? "Sair" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50/50 transition-all mt-2",
                  isOpen ? "px-4 py-3" : "p-3 justify-center"
                )}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {isOpen && <span className="truncate">Sair</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
