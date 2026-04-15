import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, BarChart2, Users, Settings, HelpCircle, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CheckSquare, label: "Projetos", path: "/projects" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Users, label: "Time", path: "/team" },
];

const generalItems = [
  { icon: Settings, label: "Configurações", path: "/settings" },
  { icon: HelpCircle, label: "Ajuda", path: "/help" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <img 
          src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1776258821/Design_sem_nome_fc7d1m.png" 
          alt="Elo e Trilha Logo" 
          className="h-8 w-8 object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="font-bold text-xl text-dark">Elo e Trilha</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-8">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-4 px-2 uppercase tracking-wider">Menu</p>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-4 px-2 uppercase tracking-wider">Geral</p>
          <nav className="flex flex-col gap-1">
            {generalItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2">
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </nav>
        </div>
      </div>
      
      <div className="p-4 mt-auto">
        <div className="bg-dark rounded-xl p-4 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-semibold mb-1">Baixe nosso App</h4>
            <p className="text-xs text-gray-300 mb-3">Tenha facilidade em outro lugar</p>
            <button className="w-full bg-success hover:bg-success/90 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              Download
            </button>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-success/20 rounded-full blur-2xl"></div>
        </div>
      </div>
    </aside>
  );
}
