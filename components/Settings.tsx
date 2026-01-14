
import React, { useState } from 'react';
import { AppSettings, Category, TransactionType, Transaction } from '../types';
import { Plus, Trash2, Download, Upload, ShieldCheck, Palette, LogOut, Info, Globe, Users, Heart, Bell, Save } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  settings, updateSettings, categories, setCategories, transactions, onImport, onToast
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isNotifEnabled, setIsNotifEnabled] = useState(notificationService.hasPermission());
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleNotifications = async () => {
    if (isNotifEnabled) {
      onToast("Disable notifications in browser settings if needed.", "info");
    } else {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setIsNotifEnabled(true);
        onToast("Notifications Enabled", "success");
      } else {
        onToast("Permission Denied", "error");
      }
    }
  };

  const saveThreshold = async (val: number) => {
    setIsSaving(true);
    const newSettings = { ...settings, lowBalanceWarning: val };
    updateSettings(newSettings);
    const { error } = await storageService.updateSettings(newSettings);
    if (!error) {
      onToast('Limit Updated', 'success');
    } else {
      onToast('Sync Failed', 'error');
    }
    setIsSaving(false);
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    const newCat: Category = {
      id: generateUUID(),
      name: newCatName,
      color: newCatColor,
      type: newCatType
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    onToast('Category added', 'success');
  };

  const handleDeleteCategory = (id: string) => {
    const isUsed = transactions.some(t => t.categoryId === id);
    if (isUsed) {
      onToast("Category is being used", "error");
      return;
    }
    setCategories(categories.filter(c => c.id !== id));
    onToast('Category removed', 'info');
  };

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
        <p className="text-slate-500 font-bold">Preferences & System Tools</p>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">Thresholds</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
               <div>
                  <p className="font-bold text-sm">Low Balance Warning</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Global Wallet Alert</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 font-black text-white text-lg">
                    <span className="text-indigo-400">{CURRENCY_SYMBOL}</span>
                    <input 
                      type="number" 
                      value={settings.lowBalanceWarning} 
                      onChange={e => updateSettings({ ...settings, lowBalanceWarning: parseInt(e.target.value) || 0 })}
                      onBlur={e => saveThreshold(parseInt(e.target.value) || 0)}
                      className="w-24 bg-transparent text-right outline-none border-b border-transparent focus:border-indigo-500/30 transition-all"
                    />
                  </div>
                  <button 
                    disabled={isSaving}
                    onClick={() => saveThreshold(settings.lowBalanceWarning)}
                    className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-all"
                  >
                    <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  </button>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">Categories</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-1.5 bg-slate-800 rounded-2xl flex flex-col md:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Name" 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-xl outline-none font-bold text-sm"
              />
              <div className="flex gap-2">
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-12 h-12 bg-transparent border-none p-1 cursor-pointer" />
                <button onClick={handleAddCategory} className="bg-indigo-600 px-5 rounded-xl text-white active:scale-95 transition-all"><Plus className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto hide-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50 group hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-bold text-sm">{cat.name}</span>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          <button 
            onClick={handleToggleNotifications}
            className="w-full flex items-center justify-between bg-slate-800/30 p-5 rounded-2xl border border-slate-800 hover:bg-slate-800/50 transition-colors"
          >
             <div className="text-left">
                <p className="font-bold text-sm">System Alerts</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{isNotifEnabled ? 'Enabled' : 'Disabled'}</p>
             </div>
             <div className={`w-12 h-6 rounded-full transition-colors relative ${isNotifEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isNotifEnabled ? 'left-7' : 'left-1'}`} />
             </div>
          </button>
        </div>

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
