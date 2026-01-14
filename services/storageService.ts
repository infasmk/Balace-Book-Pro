
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

      // Fetch existing categories for this user
      const { data: existing, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId);
      
      if (fetchError) {
        console.error("Failed to check categories:", fetchError.message);
        return;
      }

      const existingIds = new Set((existing || []).map(e => e.id));
      
      // Map defaults to include the current user_id to satisfy DB constraint
      const missing = DEFAULT_CATEGORIES.filter(c => !existingIds.has(c.id)).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        type: cat.type,
        user_id: userId
      }));
      
      if (missing.length > 0) {
        const { error: insertError } = await supabase.from('categories').insert(missing);
        if (insertError) {
          console.error("Insert Categories Error:", insertError.message);
        } else {
          console.log("Categories synced for user:", userId);
        }
      }
    } catch (e) {
      console.error("Category Sync Logic Error:", e);
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

      if (error) {
        // Self-healing: If FK violation occurs, attempt to insert the specific category with the user_id and retry
        if (error.message.includes('foreign key constraint')) {
          const cat = DEFAULT_CATEGORIES.find(c => c.id === validCatId);
          if (cat) {
            await supabase.from('categories').insert({
              id: cat.id,
              name: cat.name,
              color: cat.color,
              type: cat.type,
              user_id: userId
            });
            // Final retry
            const retry = await supabase.from('transactions').insert(dbPayload).select();
            if (!retry.error && retry.data) {
               return { data: retry.data.map(t => ({ ...t, categoryId: t.category_id })), error: null };
            }
          }
        }
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
