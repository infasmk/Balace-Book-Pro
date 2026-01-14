
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
        // Map snake_case from DB to camelCase for App
        const mapped = data.map(t => ({
          ...t,
          categoryId: t.category_id // Map DB column to internal type
        }));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.error("Supabase fetch error", e);
    }
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    // Get user id from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const dbPayload = {
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.categoryId, // Map to DB column
      date: transaction.date,
      note: transaction.note,
      user_id: user.id
    };

    const { data, error } = await supabase.from('transactions').insert([dbPayload]).select();
    
    // Map response back to camelCase
    const mappedData = data ? data.map(t => ({ ...t, categoryId: t.category_id })) : null;
    return { data: mappedData, error };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const dbUpdates: any = { ...updates };
    if (updates.categoryId) {
      dbUpdates.category_id = updates.categoryId;
      delete dbUpdates.categoryId;
    }
    const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
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
