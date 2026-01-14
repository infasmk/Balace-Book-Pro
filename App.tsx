
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import TransactionModal from './components/TransactionModal';
import Auth from './components/Auth';
import { ConfirmModal, Toast } from './components/CustomModals';
import { Transaction, Category, AppSettings } from './types';
import { storageService } from './services/storageService';
import { DEFAULT_CATEGORIES } from './constants';
import { Download, X, Smartphone, Zap } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(storageService.getUser());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings() as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // PWA Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // UI Feedback
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'primary';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Initial Sync
  useEffect(() => {
    const syncData = async () => {
      if (user?.isLoggedIn) {
        setLoading(true);
        try {
          const [txs, cats, sett] = await Promise.all([
            storageService.getTransactions(),
            storageService.getCategories(),
            storageService.getSettings()
          ]);
          setTransactions(txs);
          setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
          setSettings(sett);
        } catch (err) {
          console.error("Sync failed", err);
          showToast('Sync error. Using local data.', 'info');
        } finally {
          setLoading(false);
        }
      }
    };
    syncData();
  }, [user]);

  // PWA Event Listeners
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user hasn't ignored it in this session
      if (!sessionStorage.getItem('install_reminded')) {
        setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('BalanceBook Pro Installed!', 'success');
      }
      setDeferredPrompt(null);
      setShowInstallModal(false);
    }
  };

  const handleRemindLater = () => {
    sessionStorage.setItem('install_reminded', 'true');
    setShowInstallModal(false);
  };

  const handleLogin = (name: string, sessionUser?: any) => {
    const newUser = { name, isLoggedIn: true, ...sessionUser };
    setUser(newUser);
    storageService.saveUser(newUser);
    showToast(`Welcome, ${name}!`);
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setConfirmState({
        isOpen: true,
        title: 'Confirm Edit',
        message: 'Apply changes to this record?',
        type: 'primary',
        onConfirm: async () => {
          const { error } = await storageService.updateTransaction(editingTransaction.id, data);
          if (!error) {
            setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...data, id: t.id } : t));
            showToast('Record Updated');
          } else {
            console.error(error);
            showToast('Update Failed', 'error');
          }
          setConfirmState(s => ({ ...s, isOpen: false }));
        }
      });
    } else {
      const { data: newTx, error } = await storageService.saveTransaction(data);
      if (!error && newTx) {
        setTransactions([newTx[0], ...transactions]);
        showToast('Record Saved');
      } else {
        console.error(error);
        showToast('Save Failed: Check database schema.', 'error');
      }
    }
    setEditingTransaction(undefined);
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Record',
      message: 'This action is irreversible. Proceed?',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await storageService.deleteTransaction(id);
        if (!error) {
          setTransactions(prev => prev.filter(t => t.id !== id));
          showToast('Record Removed', 'info');
        } else {
          showToast('Delete Failed', 'error');
        }
        setConfirmState(s => ({ ...s, isOpen: false }));
      }
    });
  };

  if (!user?.isLoggedIn) return <Auth onLogin={handleLogin} />;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onAddClick={() => { setEditingTransaction(undefined); setIsModalOpen(true); }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl mb-4" />
           <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Encrypting Vault...</p>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} categories={categories} settings={settings} />}
          {activeTab === 'history' && <TransactionHistory transactions={transactions} categories={categories} onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }} onDelete={handleDeleteTransaction} />}
          {activeTab === 'reports' && <Reports transactions={transactions} categories={categories} />}
          {activeTab === 'settings' && <Settings settings={settings} updateSettings={setSettings} categories={categories} setCategories={setCategories} transactions={transactions} onImport={() => {}} onToast={showToast} />}
        </>
      )}

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Install App?</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Add BalanceBook Pro to your home screen for lightning-fast access and offline usage.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleInstallApp}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                Install App
              </button>
              <button 
                onClick={handleRemindLater}
                className="w-full py-4 text-slate-500 font-bold hover:text-slate-300 transition-colors"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(undefined); }}
        onSave={handleSaveTransaction}
        categories={categories}
        initialData={editingTransaction}
        existingTransactions={transactions}
      />

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, isOpen: false }))}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
};

export default App;
