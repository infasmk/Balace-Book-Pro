
import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  PieChart, 
  Settings as SettingsIcon, 
  Plus, 
  Wallet,
  Zap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onAddClick
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'Stats', icon: PieChart },
    { id: 'settings', label: 'Config', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Mobile-Friendly Header */}
      <header className="sticky top-0 z-40 w-full flex items-center justify-between px-6 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">BalanceBook</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
          <Zap className="w-4 h-4 text-indigo-400" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (visible only on md+) */}
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-800 bg-slate-900 transition-colors">
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-bold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[15px]">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8 pb-32">
          <div className="max-w-4xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer (Desktop Only) */}
      <footer className="hidden md:block w-full py-6 px-8 border-t border-slate-800 bg-slate-900/50 text-center text-sm">
        <p className="text-slate-500">
          Created by <span className="font-bold text-white">Infas</span> || From 
          <a href="https://webbits.space" target="_blank" rel="noopener noreferrer" className="ml-1 font-bold text-indigo-400 hover:text-indigo-300">
            Web Bits
          </a>
        </p>
      </footer>

      {/* Mobile Navigation (Floating Bottom Bar) */}
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

      {/* Mobile Footer (visible at bottom of scroll) */}
      <div className="md:hidden w-full pb-28 pt-8 px-6 text-center text-xs opacity-50">
        <p>Created by Infas || <a href="https://webbits.space" className="underline">webbits.space</a></p>
      </div>
    </div>
  );
};

export default Layout;
