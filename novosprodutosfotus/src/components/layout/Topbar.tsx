import { Search, Bell, Mail } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-20 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Pesquisar tarefa..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
            <span className="text-xs">⌘</span>F
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
          <Mail className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        
        <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-colors text-left">
          <img 
            src="https://picsum.photos/seed/user1/100/100" 
            alt="User" 
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            referrerPolicy="no-referrer"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900">Guilherme Barbosa</p>
            <p className="text-xs text-gray-500">guilhermebarbosars@gmail.com</p>
          </div>
        </button>
      </div>
    </header>
  );
}
