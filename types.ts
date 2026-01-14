
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
  budget?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // ISO String
  note?: string;
}

export interface AppSettings {
  darkMode: boolean;
  currency: string;
  dailySpendingLimit: number;
}
