
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import TransactionModal from './components/TransactionModal';
import Auth from './components/Auth';
import InstallPromptModal from './components/InstallPromptModal';
import { ConfirmModal, Toast } from './components/CustomModals';
import { Transaction, Category, AppSettings } from './types';
import { storageService } from './services/storageService';
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
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'primary';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('transactions').select('id', { count: 'exact', head: true }).limit(1);
        if (error && error.message.includes('fetch')) {
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
      } catch (e) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncData = async () => {
      if (user?.isLoggedIn) {
        setLoading(true);
        try {
          await storageService.syncCategories();
          const [txs, cats, sett] = await Promise.all([
            storageService.getTransactions(),
            storageService.getCategories(),
            storageService.getSettings()
          ]);
          setTransactions(txs);
          setCategories(cats);
          setSettings(sett);
        } catch (err) {
          showToast('Sync error.', 'info');
        } finally {
          setLoading(false);
        }
      }
    };
    syncData();
  }, [user]);

  const handleLogin = (name: string, sessionUser?: any) => {
    const newUser = { name, isLoggedIn: true, ...sessionUser };
    setUser(newUser);
    storageService.saveUser(newUser);
    showToast(`Welcome, ${name}!`);
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      const { error } = await storageService.updateTransaction(editingTransaction.id, data);
      if (!error) {
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...data, id: t.id } : t));
        showToast('Updated');
      }
      setEditingTransaction(undefined);
    } else {
      const { data: newTx, error } = await storageService.saveTransaction(data);
      if (!error && newTx) {
        setTransactions([newTx[0], ...transactions]);
        showToast('Saved');
      } else {
        showToast(error || 'Failed', 'error');
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Record',
      message: 'Delete this transaction?',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await storageService.deleteTransaction(id);
        if (!error) {
          setTransactions(prev => prev.filter(t => t.id !== id));
          showToast('Deleted', 'info');
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
      isConnected={isConnected}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl mb-4" />
           <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              categories={categories} 
              settings={settings} 
              onNavigateToSettings={() => setActiveTab('settings')}
              isConnected={isConnected}
            />
          )}
          {activeTab === 'history' && (
            <TransactionHistory 
              transactions={transactions} 
              categories={categories} 
              onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }} 
              onDelete={handleDeleteTransaction} 
            />
          )}
          {activeTab === 'reports' && <Reports transactions={transactions} categories={categories} />}
          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              updateSettings={setSettings} 
              categories={categories} 
              setCategories={setCategories} 
              transactions={transactions} 
              onImport={() => {}} 
              onToast={showToast} 
            />
          )}
        </>
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
