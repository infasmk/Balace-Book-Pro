
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
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
        
      if (data && !error) {
        const mapped = data.map(t => ({
          ...t,
          categoryId: t.category_id 
        }));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mapped));
        return mapped;
      }
      if (error) console.error("Supabase Select Error:", error.message);
    } catch (e) {
      console.error("Fetch exception", e);
    }
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Construct the database payload strictly matching snake_case columns
      const dbPayload = {
        type: transaction.type,
        amount: Number(transaction.amount),
        category_id: transaction.categoryId, 
        date: transaction.date,
        note: transaction.note || '',
        user_id: user?.id || null // Handle cases where user might not be in session
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbPayload])
        .select();

      if (error) {
        console.error("Supabase Insert Error:", error.message, error.details, error.hint);
        return { data: null, error: error.message };
      }

      if (data) {
        const mappedData = data.map(t => ({ 
          ...t, 
          categoryId: t.category_id 
        }));
        return { data: mappedData, error: null };
      }
    } catch (e: any) {
      console.error("Save exception", e);
      return { data: null, error: e.message };
    }
    return { data: null, error: 'Unknown save error' };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const dbUpdates: any = { ...updates };
    if (updates.categoryId) {
      dbUpdates.category_id = updates.categoryId;
      delete dbUpdates.categoryId;
    }
    if (updates.amount) {
      dbUpdates.amount = Number(updates.amount);
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .update(dbUpdates)
      .eq('id', id)
      .select();

    const mappedData = data ? data.map(t => ({ ...t, categoryId: t.category_id })) : null;
    return { data: mappedData, error };
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
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
      console.error("Categories fetch error", e);
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
