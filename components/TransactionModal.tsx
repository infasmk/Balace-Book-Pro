
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertCircle, AlertOctagon } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { CURRENCY_SYMBOL } from '../constants';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  initialData?: Transaction;
  existingTransactions?: Transaction[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  categories,
  initialData,
  existingTransactions = []
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId || '');
  const [date, setDate] = useState<string>(initialData?.date ? initialData.date.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState<string>(initialData?.note || '');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setDate(initialData.date.split('T')[0]);
      setNote(initialData.note || '');
    } else {
      setType(TransactionType.EXPENSE);
      setAmount('');
      setCategoryId('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setNote('');
    }
    setErrorToast(null);
  }, [initialData, isOpen]);

  const budgetOutlook = useMemo(() => {
    const val = parseFloat(amount);
    if (type !== TransactionType.EXPENSE || !categoryId || isNaN(val) || val <= 0) return null;
    
    const cat = categories.find(c => c.id === categoryId);
    if (!cat || !cat.budget) return null;

    const currentMonthStart = startOfMonth(new Date(date));
    const currentMonthEnd = endOfMonth(new Date(date));

    const spentThisMonth = existingTransactions
      .filter(t => 
        t.categoryId === categoryId && 
        t.id !== initialData?.id &&
        isWithinInterval(parseISO(t.date), { start: currentMonthStart, end: currentMonthEnd })
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const projectedTotal = spentThisMonth + val;
    const percent = (projectedTotal / cat.budget) * 100;
    
    return {
      current: spentThisMonth,
      projected: projectedTotal,
      budget: cat.budget,
      percent,
      isOver: projectedTotal > cat.budget,
      isApproaching: projectedTotal > cat.budget * 0.8
    };
  }, [type, categoryId, amount, date, categories, existingTransactions, initialData]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setErrorToast("Please enter a valid amount");
      return;
    }

    if (!categoryId) {
      setErrorToast("Please choose a category first");
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    if (!date) {
      setErrorToast("Please select a date");
      return;
    }

    onSave({
      type,
      amount: parseFloat(amount),
      categoryId,
      date: new Date(date).toISOString(),
      note: note.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      {errorToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[70] bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-4">
          {errorToast}
        </div>
      )}
      
      <div className="bg-slate-900 w-full h-[90vh] md:h-auto md:max-w-md rounded-t-[40px] md:rounded-[40px] border-t md:border border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-8 border-b border-slate-800 shrink-0">
          <h2 className="text-2xl font-black text-white">{initialData ? 'Edit' : 'New'} Entry</h2>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl active:scale-90 transition-transform">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 hide-scrollbar pb-32">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => { setType(TransactionType.EXPENSE); setCategoryId(''); }}
              className={`py-3 rounded-xl text-xs font-black transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType(TransactionType.INCOME); setCategoryId(''); }}
              className={`py-3 rounded-xl text-xs font-black transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500'}`}
            >
              Income
            </button>
          </div>

          <div className="space-y-1 text-center py-4">
             <span className="text-4xl font-black text-slate-400">{CURRENCY_SYMBOL}</span>
             <input
                autoFocus
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-center text-5xl font-black text-white outline-none placeholder:opacity-20"
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Category</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full px-4 py-4 bg-slate-800 border ${!categoryId && errorToast ? 'border-rose-500/50' : 'border-slate-700'} rounded-2xl outline-none font-bold text-sm text-white focus:ring-2 focus:ring-indigo-500 transition-all appearance-none`}
              >
                <option value="">Choose</option>
                {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {budgetOutlook && (budgetOutlook.isApproaching || budgetOutlook.isOver) && (
            <div className={`p-5 rounded-3xl border animate-in zoom-in-95 duration-200 ${budgetOutlook.isOver ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {budgetOutlook.isOver ? <AlertOctagon className="w-4 h-4 text-rose-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  <span className={`text-[10px] font-black uppercase tracking-tight ${budgetOutlook.isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                    {budgetOutlook.isOver ? 'Over Monthly Limit' : 'Approaching Limit'}
                  </span>
                </div>
                <span className={`text-[10px] font-black ${budgetOutlook.isOver ? 'text-rose-500' : 'text-amber-500'}`}>{Math.round(budgetOutlook.percent)}% Used</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-500 ${budgetOutlook.isOver ? 'bg-rose-500' : 'bg-amber-500'}`} 
                  style={{ width: `${Math.min(100, budgetOutlook.percent)}%` }} 
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold">
                Limit: {CURRENCY_SYMBOL}{budgetOutlook.budget.toLocaleString()} 
                <span className="mx-2 opacity-30">|</span> 
                New Total: {CURRENCY_SYMBOL}{Math.round(budgetOutlook.projected).toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Note (Optional)</label>
            <input
              placeholder="What was this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-medium text-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </form>

        <div className="p-8 absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSubmit}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
              type === TransactionType.INCOME 
                ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-500' 
                : budgetOutlook?.isOver 
                ? 'bg-rose-700 shadow-rose-700/20' 
                : 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-500'
            } text-white`}
          >
            {initialData ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
