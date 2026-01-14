
import { Category, TransactionType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Salary', color: '#10b981', type: TransactionType.INCOME },
  { id: 'cat_2', name: 'Food', color: '#ef4444', type: TransactionType.EXPENSE, budget: 15000 },
  { id: 'cat_3', name: 'Travel', color: '#f59e0b', type: TransactionType.EXPENSE, budget: 5000 },
  { id: 'cat_4', name: 'Rent', color: '#3b82f6', type: TransactionType.EXPENSE, budget: 25000 },
  { id: 'cat_5', name: 'Other', color: '#64748b', type: TransactionType.EXPENSE },
  { id: 'cat_6', name: 'Freelance', color: '#8b5cf6', type: TransactionType.INCOME },
];

export const CURRENCY_SYMBOL = '₹';
