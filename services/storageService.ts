import { Transaction, Category, AppSettings } from '../types';
import { supabase } from './supabaseClient';

const KEYS = {
  TRANSACTIONS: 'bbpro_transactions',
  CATEGORIES: 'bbpro_categories',
  SETTINGS: 'bbpro_settings',
  USER: 'bbpro_user_info'
};

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
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (data && !error) {
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.error("Supabase fetch error", e);
    }
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    const { data, error } = await supabase.from('transactions').insert([transaction]).select();
    return { data, error };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id);
    return { data, error };
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    return { error };
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (data && !error) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.error("Supabase categories error", e);
    }
    const local = localStorage.getItem(KEYS.CATEGORIES);
    return local ? JSON.parse(local) : [];
  },
  
  // Settings
  getSettings: async (): Promise<AppSettings> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').single();
      if (data && !error) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.error("Supabase settings error", e);
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
