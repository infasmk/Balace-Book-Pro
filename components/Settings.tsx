
import React from 'react';
import { AppSettings, Category, Transaction } from '../types';
import { 
  Download, 
  Upload, 
  LogOut, 
  Info, 
  Globe, 
  Users, 
  Heart, 
  ShieldCheck, 
  Zap, 
  Fingerprint, 
  Trophy,
  Github,
  Star
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
  transactions: Transaction[];
  onImport: (data: { transactions: Transaction[], categories: Category[] }) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  transactions, categories, settings, onImport, onToast
}) => {
  const handleExport = () => {
    const data = { transactions, categories, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bb-backup.json`;
    a.click();
    onToast('Backup Ready', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImport(data);
      } catch (err) {
        onToast("Invalid file", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('bbpro_user_info');
      localStorage.removeItem('bbpro_welcome_seen'); 
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-32">
      <div>
        <h1 className="text-3xl font-black text-white">Application Config</h1>
        <p className="text-slate-500 font-bold">Manage your data and learn about the platform</p>
      </div>

      <div className="space-y-6">
        {/* Data Management Section */}
        <div className="grid grid-cols-2 gap-4">
           <button onClick={handleExport} className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-slate-800/50 group">
              <Download className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[10px] uppercase tracking-widest">Backup Data</span>
           </button>
           <label className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-all cursor-pointer hover:bg-slate-800/50 group">
              <Upload className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[10px] uppercase tracking-widest">Restore Data</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
           </label>
        </div>

        {/* Extensive About Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden">
          <div className="p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <Info className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-black text-white">About BalanceBook Pro</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                BalanceBook Pro is a professional-grade personal finance utility designed to simplify wealth management. Built on the principles of speed, privacy, and precision, it empowers individuals to take full control of their financial destiny.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Privacy First</h3>
                <p className="text-[10px] text-slate-500 font-bold">Your data is yours. We use high-end encryption to ensure your financial history stays private.</p>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Instant Pulse</h3>
                <p className="text-[10px] text-slate-500 font-bold">Real-time budget tracking with low-latency updates and visual progress indicators.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-rose-400" />
                </div>
                <h2 className="text-lg font-black text-white">The Creators</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-5 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Lead Engineer</span>
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="text-lg font-black text-white">Infas</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Architect behind the BalanceBook ecosystem. Dedicated to crafting seamless user experiences with cutting-edge web technologies.
                  </p>
                </div>

                <div className="p-5 bg-slate-800/40 border border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Development Collective</span>
                    <Fingerprint className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h4 className="text-lg font-black text-white">Team AWT</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Team AWT (Advanced Web Technologies) is a boutique collective of developers and designers focused on building high-performance, utility-driven applications. Our mission is to bridge the gap between complex functionality and elegant design.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <div className="px-3 py-1 bg-slate-900 rounded-full text-[9px] font-black text-slate-500 border border-slate-700 uppercase tracking-tighter">Scalable Architecture</div>
                    <div className="px-3 py-1 bg-slate-900 rounded-full text-[9px] font-black text-slate-500 border border-slate-700 uppercase tracking-tighter">UI/UX Excellence</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <a 
                href="https://webbits.space" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 hover:bg-indigo-600/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Official Website</span>
                </div>
                <Star className="w-4 h-4 text-indigo-400 group-hover:rotate-45 transition-transform" />
              </a>
              <div className="flex items-center justify-center gap-6 py-4 opacity-50">
                <Github className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                <Globe className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                <Info className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-950 p-6 border-t border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              Built with <Heart className="w-3 h-3 text-rose-600 fill-rose-600 animate-pulse" /> by Infas & Team AWT
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-5 bg-rose-600/10 border border-rose-500/20 rounded-[32px] flex items-center justify-center gap-3 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-600/20 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out from Vault
        </button>
      </div>
    </div>
  );
};

export default Settings;
