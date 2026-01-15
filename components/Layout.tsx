
import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  PieChart, 
  Settings as SettingsIcon, 
  Plus, 
  Wallet,
  Zap,
  PlusCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddClick: () => void;
  isConnected: boolean | null;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onAddClick,
  isConnected
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'Stats', icon: PieChart },
    { id: 'settings', label: 'Config', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <style>
        {`
          @keyframes wave-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2); opacity: 0; }
          }
          .status-wave {
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            pointer-events: none;
            animation: wave-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}
      </style>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full flex items-center justify-between px-6 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">BalanceBook</span>
        </div>
        
        <div className="relative">
          {isConnected !== null && (
            <div className={`status-wave ${isConnected ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`} />
          )}
          <div className={`relative z-10 w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border transition-colors duration-500 ${
            isConnected === null ? 'border-slate-700/50' : 
            isConnected ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}>
            <Zap className={`w-4 h-4 transition-colors duration-500 ${
              isConnected === null ? 'text-slate-500' : 
              isConnected ? 'text-emerald-400' : 'text-rose-400'
            }`} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 h-[calc(100vh-64px)] sticky top-16 border-r border-slate-800 bg-slate-900/50">
          <div className="px-6 py-8">
            <button
              onClick={onAddClick}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group"
            >
              <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span>New Entry</span>
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-slate-800 text-indigo-400 font-bold border border-slate-700 shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-400' : ''}`} />
                <span className="text-[15px]">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-8 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Vault Secure</p>
            <p className="text-[8px] text-slate-600 font-bold italic">© Infas • Team AWT</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8 pb-32 md:pb-12 bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-[28px] py-2 px-4 flex justify-between items-center shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-3 transition-all ${
              activeTab === item.id ? 'text-indigo-400 scale-110 nav-active' : 'text-slate-500'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
        <div className="w-px h-8 bg-slate-700 mx-2" />
        <button
          onClick={onAddClick}
          className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/40 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
};

export default Layout;
