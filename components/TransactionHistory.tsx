
import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { format, parseISO } from 'date-fns';
import { Search, Filter, ArrowUpDown, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('INR', CURRENCY_SYMBOL);
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  transactions, 
  categories, 
  onEdit, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {} as Record<string, Category>);
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.note?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            categoryMap[t.categoryId]?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || t.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
      });
  }, [transactions, searchTerm, filterType, sortBy, sortOrder, categoryMap]);

  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const toggleSort = (key: 'date' | 'amount') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Transaction History</h1>
        <p className="text-slate-500 font-medium">Manage and track your previous transactions.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search category or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${filterType === 'ALL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType(TransactionType.INCOME)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${filterType === TransactionType.INCOME ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType(TransactionType.EXPENSE)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${filterType === TransactionType.EXPENSE ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}
            >
              Expense
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-2">Date <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 hidden md:table-cell">Note</th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => toggleSort('amount')}>
                  <div className="flex items-center gap-2">Amount <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedTransactions.length > 0 ? paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900 dark:text-white">{format(parseISO(t.date), 'MMM dd, yyyy')}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{format(parseISO(t.date), 'hh:mm a')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: categoryMap[t.categoryId]?.color || '#cbd5e1' }}
                      />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{categoryMap[t.categoryId]?.name || 'Uncategorized'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-sm font-medium">
                    <span className="text-slate-500 truncate max-w-xs block">{t.note || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(t)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <Filter className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-bold text-slate-300">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
