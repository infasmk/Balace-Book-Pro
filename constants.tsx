
import { Category, TransactionType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Salary', color: '#10b981', type: TransactionType.INCOME },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Food', color: '#ef4444', type: TransactionType.EXPENSE, budget: 15000 },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Travel', color: '#f59e0b', type: TransactionType.EXPENSE, budget: 5000 },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Rent', color: '#3b82f6', type: TransactionType.EXPENSE, budget: 25000 },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Other', color: '#64748b', type: TransactionType.EXPENSE },
  { id: '00000000-0000-0000-0000-000000000006', name: 'Freelance', color: '#8b5cf6', type: TransactionType.INCOME },
];

export const CURRENCY_SYMBOL = '₹';
