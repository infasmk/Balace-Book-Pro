
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
  
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        console.error("Supabase Fetch Error:", error.message);
        throw error;
      }

      if (data) {
        const mapped = data.map(t => ({
          ...t,
          categoryId: t.category_id 
        }));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn("Using local cache due to database error");
    }
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    try {
      // Re-verify session to ensure user_id is definitely available
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error("Auth Session Error:", sessionError);
        return { data: null, error: "Authentication required to save data." };
      }

      const userId = session.user.id;

      const dbPayload = {
        type: transaction.type,
        amount: Number(transaction.amount),
        category_id: transaction.categoryId, 
        date: transaction.date,
        note: transaction.note || '',
        user_id: userId
      };

      console.log("Attempting insert with payload:", dbPayload);

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbPayload])
        .select();

      if (error) {
        // Log details to help user identify if it's RLS or missing columns
        console.error("Supabase Save Error Details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return { data: null, error: error.message };
      }

      if (data && data.length > 0) {
        const mapped = { ...data[0], categoryId: data[0].category_id };
        // Sync local storage
        const local = localStorage.getItem(KEYS.TRANSACTIONS);
        const localData = local ? JSON.parse(local) : [];
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([mapped, ...localData]));
        return { data: [mapped], error: null };
      }
    } catch (e: any) {
      console.error("Critical Save Exception:", e.message);
      return { data: null, error: e.message };
    }
    return { data: null, error: 'Database rejected the request.' };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.categoryId) {
        dbUpdates.category_id = updates.categoryId;
        delete dbUpdates.categoryId;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;

      const mappedData = data ? data.map(t => ({ ...t, categoryId: t.category_id })) : null;
      return { data: mappedData, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      return { error: error?.message || null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (data && !error) return data;
    } catch (e) {}
    const local = localStorage.getItem(KEYS.CATEGORIES);
    return local ? JSON.parse(local) : [];
  },
  
  getSettings: async (): Promise<AppSettings> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').single();
      if (data && !error) return data;
    } catch (e) {}
    const local = localStorage.getItem(KEYS.SETTINGS);
    return local ? JSON.parse(local) : {
      darkMode: true,
      currency: 'INR',
      dailySpendingLimit: 1000,
      lowBalanceWarning: 2000
    };
  }
};
