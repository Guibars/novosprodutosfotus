import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, BarChart2, Target, Palmtree, Settings, LogOut, Package, MessagesSquare } from "lucide-react";
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

  const renderItem = (item: { icon: any; label: string; path: string }) => (
    <NavLink
      key={item.path}
      to={item.path}
      title={!isOpen ? item.label : undefined}
      className={({ isActive }) => cn(
        "group relative flex items-center gap-3 rounded-xl text-xs font-bold overflow-hidden",
        "transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
        isOpen ? "px-3 py-2.5" : "p-2.5 justify-center",
        isActive
          ? "text-white shadow-[0_8px_20px_-8px_rgba(13,81,142,0.6)]"
          : "text-slate-500 hover:text-slate-900 hover:translate-x-0.5"
      )}
    >
      {({ isActive }) => (
        <>
          {/* Fundo do item ativo: gradiente da marca + halo que pulsa */}
          {isActive && (
            <>
              <span className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-accent rounded-xl" />
              <span className="absolute -inset-2 bg-secondary/40 blur-lg rounded-full glow-pulse pointer-events-none" />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary" />
            </>
          )}
          {/* Fundo sutil no hover dos inativos */}
          {!isActive && (
            <span className="absolute inset-0 bg-slate-100/0 group-hover:bg-slate-100/80 rounded-xl transition-colors duration-300" />
          )}

          <item.icon className={cn(
            "w-4 h-4 shrink-0 relative z-10 transition-colors duration-300",
            isActive ? "text-primary" : "text-slate-400 group-hover:text-secondary"
          )} />
          {isOpen && <span className="truncate relative z-10">{item.label}</span>}
          {isActive && isOpen && (
            <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary live-dot z-10" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside className={cn(
      "fixed left-4 top-4 bottom-4 transition-all duration-300 z-30",
      isOpen ? "w-64" : "w-[4.5rem]"
    )}>
      <div className="glass-panel bg-white/85 backdrop-blur-xl h-full rounded-2xl border border-white/90 flex flex-col shadow-sm overflow-hidden">
        {/* Cabeçalho com brilho de marca sutil atrás do logo */}
        <div className="relative p-4 flex items-center justify-center border-b border-slate-100 h-[64px] shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <img
            src="https://res.cloudinary.com/dsctpzqvy/image/upload/v1776688852/Design_sem_nome_2_hx7e0j.png"
            alt="Fotus Logo"
            className={cn("object-contain transition-all duration-300 shrink-0 relative z-10", isOpen ? "h-7" : "h-6")}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col gap-5">
          <div>
            <p className={cn("text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest", isOpen ? "px-3 text-left" : "text-center")}>
              {isOpen ? "Menu" : "•"}
            </p>
            <nav className="flex flex-col gap-1">
              {menuItems.map(renderItem)}
            </nav>
          </div>

          <div>
            <p className={cn("text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest", isOpen ? "px-3 text-left" : "text-center")}>
              {isOpen ? "Geral" : "•"}
            </p>
            <nav className="flex flex-col gap-1">
              {generalItems.map(renderItem)}
              <button
                onClick={signOut}
                title={!isOpen ? "Sair" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl text-xs font-bold text-rose-500 mt-1 overflow-hidden",
                  "transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:text-rose-600",
                  isOpen ? "px-3 py-2.5" : "p-2.5 justify-center"
                )}
              >
                <span className="absolute inset-0 bg-rose-50/0 group-hover:bg-rose-50 rounded-xl transition-colors duration-300" />
                <LogOut className="w-4 h-4 shrink-0 relative z-10" />
                {isOpen && <span className="truncate relative z-10">Sair</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
