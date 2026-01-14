
import { Transaction, Category, AppSettings } from '../types';
import { supabase } from './supabaseClient';
import { DEFAULT_CATEGORIES } from '../constants';

const KEYS = {
  TRANSACTIONS: 'bbpro_transactions',
  CATEGORIES: 'bbpro_categories',
  SETTINGS: 'bbpro_settings',
  USER: 'bbpro_user_info'
};

const ensureValidUUID = (id: string): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  
  const legacyMap: Record<string, string> = {
    'cat_1': '00000000-0000-0000-0000-000000000001',
    'cat_2': '00000000-0000-0000-0000-000000000002',
    'cat_3': '00000000-0000-0000-0000-000000000003',
    'cat_4': '00000000-0000-0000-0000-000000000004',
    'cat_5': '00000000-0000-0000-0000-000000000005',
    'cat_6': '00000000-0000-0000-0000-000000000006',
  };
  
  return legacyMap[id] || '00000000-0000-0000-0000-000000000005';
};

export const storageService = {
  getUser: () => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  saveUser: (user: any) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  
  // New: Sync default categories to DB so foreign keys don't fail
  syncCategories: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Upsert default categories into the database
      const categoriesToSync = DEFAULT_CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        type: cat.type,
        user_id: null // System defaults have no user_id
      }));

      await supabase.from('categories').upsert(categoriesToSync, { onConflict: 'id' });
    } catch (e) {
      console.error("Category Sync Error:", e);
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) throw error;

      if (data) {
        const mapped = data.map(t => ({
          ...t,
          categoryId: t.category_id 
        }));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn("Using local cache");
    }
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return { data: null, error: "Auth session missing." };

      const validCatId = ensureValidUUID(transaction.categoryId);

      // Verify category exists in DB first to avoid FK error
      const { data: catCheck } = await supabase.from('categories').select('id').eq('id', validCatId).single();
      
      if (!catCheck) {
        // If missing (rare), try to sync first
        await storageService.syncCategories();
      }

      const dbPayload = {
        user_id: session.user.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        category_id: validCatId, 
        date: transaction.date,
        note: transaction.note || ''
      };

      const { data, error } = await supabase.from('transactions').insert(dbPayload).select();

      if (error) {
        console.error("Supabase Save Error:", error.message);
        return { data: null, error: error.message };
      }

      if (data && data.length > 0) {
        const mapped = { ...data[0], categoryId: data[0].category_id };
        const local = localStorage.getItem(KEYS.TRANSACTIONS);
        const localData = local ? JSON.parse(local) : [];
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([mapped, ...localData]));
        return { data: [mapped], error: null };
      }
    } catch (e: any) {
      return { data: null, error: e.message || "Network error" };
    }
    return { data: null, error: 'Database record not returned.' };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.categoryId) {
        dbUpdates.category_id = ensureValidUUID(updates.categoryId);
        delete dbUpdates.categoryId;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data: data ? data.map(t => ({ ...t, categoryId: t.category_id })) : null, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      return { error: error?.message || null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (data && !error && data.length > 0) return data;
    } catch (e) {}
    const local = localStorage.getItem(KEYS.CATEGORIES);
    return local ? JSON.parse(local) : DEFAULT_CATEGORIES;
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
