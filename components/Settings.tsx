
import React from 'react';
import { AppSettings, Category, Transaction } from '../types';
import { Download, Upload, LogOut, Info, Globe, Users, Heart } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white">Config</h1>
        <p className="text-slate-500 font-bold">Data & System Preferences</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
           <button onClick={handleExport} className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-slate-800/50">
              <Download className="w-6 h-6 text-indigo-400" />
              <span className="font-black text-[10px] uppercase tracking-widest">Backup</span>
           </button>
           <label className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-all cursor-pointer hover:bg-slate-800/50">
              <Upload className="w-6 h-6 text-emerald-400" />
              <span className="font-black text-[10px] uppercase tracking-widest">Restore</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
           </label>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">About</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-400">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Created by <span className="text-white">Infas</span></span>
              </div>
              <a href="https://webbits.space" target="_blank" className="flex items-center gap-3 p-3 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 hover:bg-indigo-600/20 transition-colors">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400">Visit webbits.space</span>
              </a>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-5 bg-rose-600/10 border border-rose-500/20 rounded-[32px] flex items-center justify-center gap-3 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-600/20 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Settings;
