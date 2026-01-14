
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
  
  syncCategories: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;

      const userId = session.user.id;
      const { data: existing, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId);
      
      if (fetchError) return;

      const existingIds = new Set((existing || []).map(e => e.id));
      const missing = DEFAULT_CATEGORIES.filter(c => !existingIds.has(c.id)).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        type: cat.type,
        user_id: userId
      }));
      
      if (missing.length > 0) {
        await supabase.from('categories').insert(missing);
      }
    } catch (e) {
      console.error(e);
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
        const mapped = data.map(t => ({ ...t, categoryId: t.category_id }));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {}
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  },

  saveTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return { data: null, error: "Auth session missing." };

      const userId = session.user.id;
      const validCatId = ensureValidUUID(transaction.categoryId);
      const dbPayload = {
        user_id: userId,
        type: transaction.type,
        amount: Number(transaction.amount),
        category_id: validCatId, 
        date: transaction.date,
        note: transaction.note || ''
      };

      const { data, error } = await supabase.from('transactions').insert(dbPayload).select();
      if (error && error.message.includes('foreign key constraint')) {
        const cat = DEFAULT_CATEGORIES.find(c => c.id === validCatId);
        if (cat) {
          await supabase.from('categories').insert({ ...cat, user_id: userId });
          const retry = await supabase.from('transactions').insert(dbPayload).select();
          if (!retry.error && retry.data) {
             return { data: retry.data.map(t => ({ ...t, categoryId: t.category_id })), error: null };
          }
        }
      }
      if (data && data.length > 0) {
        const mapped = { ...data[0], categoryId: data[0].category_id };
        return { data: [mapped], error: null };
      }
      return { data: null, error: error?.message || 'Error' };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.categoryId) {
        dbUpdates.category_id = ensureValidUUID(updates.categoryId);
        delete dbUpdates.categoryId;
      }
      const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id).select();
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
    return DEFAULT_CATEGORIES;
  },
  
  getSettings: async (): Promise<AppSettings> => {
    const defaultSettings = {
      darkMode: true,
      currency: 'INR',
      dailySpendingLimit: 1000
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return defaultSettings;
      
      const { data, error } = await supabase.from('app_settings').select('*').eq('user_id', session.user.id).maybeSingle();
      if (data && !error) {
        return {
          darkMode: data.dark_mode ?? true,
          currency: data.currency ?? 'INR',
          dailySpendingLimit: data.daily_spending_limit ?? 1000
        };
      }
    } catch (e) {}
    return defaultSettings;
  },

  updateSettings: async (settings: AppSettings) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { error: "No session" };

      const dbPayload = {
        user_id: session.user.id,
        dark_mode: settings.darkMode,
        currency: settings.currency,
        daily_spending_limit: settings.dailySpendingLimit
      };

      const { error } = await supabase.from('app_settings').upsert(dbPayload);
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      return { error: error?.message || null };
    } catch (e: any) {
      return { error: e.message };
    }
  }
};
