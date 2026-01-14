
import { Transaction, Category, AppSettings } from '../types';
import { supabase } from './supabaseClient';

const KEYS = {
  TRANSACTIONS: 'bbpro_transactions',
  CATEGORIES: 'bbpro_categories',
  SETTINGS: 'bbpro_settings',
  USER: 'bbpro_user_info'
};

// Helper to generate IDs when DB fails
const generateId = () => Math.random().toString(36).substr(2, 9);

export const storageService = {
  getUser: () => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  saveUser: (user: any) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  
  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    let remoteData: Transaction[] = [];
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
        
      if (data && !error) {
        remoteData = data.map(t => ({
          ...t,
          categoryId: t.category_id || t.categoryId // Support both schemas
        }));
      }
    } catch (e) {
      console.error("Fetch exception", e);
    }

    // Merge with local storage to ensure no data is lost
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    const localData: Transaction[] = local ? JSON.parse(local) : [];
    
    // Combine and remove duplicates based on ID
    const combined = [...remoteData, ...localData];
    const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    // Keep local storage updated
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(unique));
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    const tempId = generateId();
    const newTransaction: Transaction = { ...transaction, id: tempId };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const dbPayload = {
        type: transaction.type,
        amount: Number(transaction.amount),
        category_id: transaction.categoryId, 
        date: transaction.date,
        note: transaction.note || '',
        user_id: user?.id || null
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbPayload])
        .select();

      if (error) {
        console.error("DATABASE SCHEMA ERROR:", error.message);
        console.warn("Falling back to Local Storage save.");
        // Fallback: Save to local storage if DB fails
        const local = localStorage.getItem(KEYS.TRANSACTIONS);
        const localData = local ? JSON.parse(local) : [];
        const updatedLocal = [newTransaction, ...localData];
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updatedLocal));
        return { data: [newTransaction], error: null }; // Return success so UI updates
      }

      if (data) {
        const mappedData = data.map(t => ({ ...t, categoryId: t.category_id }));
        // Update local storage too
        const local = localStorage.getItem(KEYS.TRANSACTIONS);
        const localData = local ? JSON.parse(local) : [];
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([mappedData[0], ...localData]));
        return { data: mappedData, error: null };
      }
    } catch (e: any) {
      console.error("Save exception, saving locally:", e);
      const local = localStorage.getItem(KEYS.TRANSACTIONS);
      const localData = local ? JSON.parse(local) : [];
      const updatedLocal = [newTransaction, ...localData];
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updatedLocal));
      return { data: [newTransaction], error: null };
    }
    return { data: null, error: 'Critical failure' };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    // Update locally first
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    if (local) {
      const localData: Transaction[] = JSON.parse(local);
      const updatedLocal = localData.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updatedLocal));
    }

    const dbUpdates: any = { ...updates };
    if (updates.categoryId) {
      dbUpdates.category_id = updates.categoryId;
      delete dbUpdates.categoryId;
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      const mappedData = data ? data.map(t => ({ ...t, categoryId: t.category_id })) : null;
      return { data: mappedData, error };
    } catch (e) {
      return { data: null, error: e };
    }
  },

  deleteTransaction: async (id: string) => {
    // Delete locally
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    if (local) {
      const localData: Transaction[] = JSON.parse(local);
      const updatedLocal = localData.filter(t => t.id !== id);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updatedLocal));
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      return { error };
    } catch (e) {
      return { error: e };
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (data && !error) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.error("Categories fetch error", e);
    }
    const local = localStorage.getItem(KEYS.CATEGORIES);
    return local ? JSON.parse(local) : [];
  },
  
  getSettings: async (): Promise<AppSettings> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').single();
      if (data && !error) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.error("Settings fetch error", e);
    }
    const local = localStorage.getItem(KEYS.SETTINGS);
    return local ? JSON.parse(local) : {
      darkMode: true,
      currency: 'INR',
      dailySpendingLimit: 1000,
      lowBalanceWarning: 2000
    };
  }
};
