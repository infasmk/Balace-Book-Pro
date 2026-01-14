
import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { format, startOfYear, eachMonthOfInterval, isSameMonth, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('INR', CURRENCY_SYMBOL);
};

const Reports: React.FC<ReportsProps> = ({ transactions, categories }) => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthData = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const filtered = transactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
    
    const income = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

    const categorySpend: Record<string, number> = {};
    filtered.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      categorySpend[t.categoryId] = (categorySpend[t.categoryId] || 0) + t.amount;
    });

    const pieData = Object.keys(categorySpend).map(id => ({
      name: categories.find(c => c.id === id)?.name || 'Unknown',
      value: categorySpend[id],
      color: categories.find(c => c.id === id)?.color || '#64748b'
    })).sort((a, b) => b.value - a.value);

    return { 
      income, 
      expense, 
      savings: income - expense,
      pieData,
      barData: [{ name: 'Cashflow', income, expense }]
    };
  }, [transactions, selectedDate, categories]);

  const yearData = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    const months = eachMonthOfInterval({ start: yearStart, end: new Date(yearStart.getFullYear(), 11, 31) });
    
    const data = months.map(month => {
      const filtered = transactions.filter(t => isSameMonth(parseISO(t.date), month));
      const income = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expense = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      return {
        name: format(month, 'MMM'),
        income,
        expense,
        savings: income - expense
      };
    });

    return data;
  }, [transactions, selectedDate]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financial Reports</h1>
          <p className="text-slate-500 font-medium">Visual breakdown of your income and spending.</p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl w-fit shadow-sm">
          <button 
            onClick={() => setReportType('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${reportType === 'monthly' ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'text-slate-400'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setReportType('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${reportType === 'yearly' ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'text-slate-400'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <input 
          type={reportType === 'monthly' ? 'month' : 'number'}
          {...(reportType === 'yearly' ? { min: 2000, max: 2100 } : {})}
          value={reportType === 'monthly' ? format(selectedDate, 'yyyy-MM') : selectedDate.getFullYear()}
          onChange={(e) => {
            if (reportType === 'monthly') {
              setSelectedDate(new Date(e.target.value));
            } else {
              setSelectedDate(new Date(parseInt(e.target.value), 0, 1));
            }
          }}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-800 dark:text-white shadow-sm"
        />
      </div>

      {reportType === 'monthly' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-black mb-8 text-slate-900 dark:text-white uppercase tracking-wider text-xs">Income vs Expense</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData.barData} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e140" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }} 
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[12, 12, 0, 0]} name="Income" barSize={40} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[12, 12, 0, 0]} name="Expense" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl">
                <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mb-1">Income</p>
                <p className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(monthData.income)}</p>
              </div>
              <div className="p-3 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl">
                <p className="text-[10px] text-rose-600 uppercase font-black tracking-widest mb-1">Expense</p>
                <p className="font-black text-rose-700 dark:text-rose-400">{formatCurrency(monthData.expense)}</p>
              </div>
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl">
                <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest mb-1">Savings</p>
                <p className={`font-black ${monthData.savings >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700'}`}>{formatCurrency(monthData.savings)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-black mb-8 text-slate-900 dark:text-white uppercase tracking-wider text-xs">Expense Split</h3>
            {monthData.pieData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthData.pieData}
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {monthData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 800 }} 
                      formatter={(val: number) => formatCurrency(val)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400 italic font-bold">No data available</div>
            )}
            <div className="mt-4 max-h-32 overflow-y-auto hide-scrollbar space-y-3">
              {monthData.pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-black mb-8 text-slate-900 dark:text-white tracking-tight">{selectedDate.getFullYear()} Performance</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e140" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 800 }} 
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontWeight: 700 }} />
                  <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
