
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, AppSettings } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { isToday, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays, getDaysInMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Zap, Target, Heart, ExternalLink, X, AlertOctagon, Sparkles, BellRing, ArrowRight } from 'lucide-react';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('INR', CURRENCY_SYMBOL);
};

const StatCard = ({ title, amount, icon: Icon, colorClass, bgColorClass }: any) => (
  <div className="bg-slate-900/50 p-5 rounded-[24px] border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-all">
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-black text-white">{formatCurrency(amount)}</h3>
    </div>
    <div className={`p-2.5 rounded-xl ${bgColorClass}`}>
      <Icon className={`w-4 h-4 ${colorClass}`} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, settings }) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const user = storageService.getUser();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('bbpro_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('bbpro_welcome_seen', 'true');
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const summary = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    let balance = 0;
    let todayIncome = 0;
    let todayExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(t => {
      const tDate = parseISO(t.date);
      if (t.type === TransactionType.INCOME) {
        balance += t.amount;
        if (isToday(tDate)) todayIncome += t.amount;
        if (isWithinInterval(tDate, { start: monthStart, end: monthEnd })) monthIncome += t.amount;
      } else {
        balance -= t.amount;
        if (isToday(tDate)) todayExpense += t.amount;
        if (isWithinInterval(tDate, { start: monthStart, end: monthEnd })) monthExpense += t.amount;
      }
    });

    return { balance, todayIncome, todayExpense, monthIncome, monthExpense };
  }, [transactions]);

  const budgetHealth = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysPassed = differenceInDays(today, monthStart) + 1;
    const totalDays = getDaysInMonth(today);
    
    const categorySpending: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
      .forEach(t => {
        categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + t.amount;
      });

    return categories
      .filter(c => c.budget && c.budget > 0)
      .map(c => {
        const spent = categorySpending[c.id] || 0;
        const budget = c.budget as number;
        const percent = (spent / budget) * 100;
        
        // Predictive Logic: Are you spending too fast?
        const expectedPercent = (daysPassed / totalDays) * 100;
        const isSpendingTooFast = percent > expectedPercent + 15 && percent < 100;

        return {
          id: c.id,
          name: c.name,
          spent,
          remaining: Math.max(0, budget - spent),
          budget,
          percent,
          color: c.color,
          isSpendingTooFast,
          status: percent >= 100 ? 'critical' : percent >= 85 ? 'warning' : isSpendingTooFast ? 'fast' : 'healthy'
        };
      })
      .sort((a, b) => b.percent - a.percent); 
  }, [transactions, categories]);

  const criticalIssues = budgetHealth.filter(h => h.status === 'critical');
  const warningIssues = budgetHealth.filter(h => h.status === 'warning' || h.status === 'fast');
  const isLowBalance = summary.balance < settings.lowBalanceWarning;

  useEffect(() => {
    if (isLowBalance) {
      notificationService.send(
        "Low Balance Warning", 
        `Your balance ${formatCurrency(summary.balance)} is below your threshold.`
      );
    }
    
    if (criticalIssues.length > 0) {
      const highestBreach = criticalIssues[0];
      notificationService.send(
        "Budget Limit Exceeded", 
        `Limit reached for ${highestBreach.name}.`
      );
    }
  }, [summary.balance, criticalIssues.length, isLowBalance, settings.lowBalanceWarning]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <style>{`
        @keyframes ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
        .animate-ring-pulse {
          animation: ring-pulse 2s infinite;
        }
      `}</style>

      <div className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {user?.name || 'Guest'}!</h1>
          <p className="text-slate-500 text-sm font-bold">Financial Vault: {isLowBalance ? 'Attention Required' : 'Status Secure'}</p>
        </div>
        {(criticalIssues.length > 0 || isLowBalance) && (
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 animate-ring-pulse">
              <BellRing className="w-5 h-5 text-rose-500" />
            </div>
          </div>
        )}
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-md w-full relative animate-in zoom-in-95">
            <button onClick={closeWelcome} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Welcome to BalanceBook Pro</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Track your daily spends, manage budgets, and take control of your savings effortlessly. 
            </p>
            <div className="space-y-3">
              <button 
                onClick={closeWelcome}
                className="w-full py-4 px-6 bg-indigo-600 rounded-2xl font-black text-white hover:bg-indigo-700 transition-colors"
              >
                Launch Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Balance Card */}
      <div className={`p-8 rounded-[32px] shadow-2xl relative overflow-hidden transition-all duration-700 border-2 ${
        isLowBalance 
        ? 'bg-slate-900 border-rose-500/50 shadow-rose-900/20' 
        : 'bg-indigo-600 border-indigo-400/20 shadow-indigo-900/20'
      }`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          {isLowBalance ? <AlertOctagon className="w-24 h-24 rotate-12" /> : <Wallet className="w-24 h-24 rotate-12" />}
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <p className={`text-xs font-black uppercase tracking-widest ${isLowBalance ? 'text-rose-400' : 'text-white/70'}`}>
              Available Balance
            </p>
            {isLowBalance && (
              <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                Low Balance
              </span>
            )}
          </div>
          
          <h2 className={`text-5xl font-black tracking-tighter ${isLowBalance ? 'text-rose-500' : 'text-white'}`}>
            {formatCurrency(summary.balance)}
          </h2>
          
          <div className="flex items-center gap-3 pt-2">
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border ${
               isLowBalance ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/10 border-white/10'
             }`}>
                <Sparkles className={`w-3 h-3 ${isLowBalance ? 'text-rose-400' : 'text-white/70'}`} />
                <span className={`text-[10px] font-bold ${isLowBalance ? 'text-rose-300' : 'text-white'}`}>
                  Monthly Out: {formatCurrency(summary.monthExpense)}
                </span>
             </div>
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border ${
               isLowBalance ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/10 border-white/10'
             }`}>
                <TrendingUp className={`w-3 h-3 ${isLowBalance ? 'text-rose-400' : 'text-white/70'}`} />
                <span className={`text-[10px] font-bold ${isLowBalance ? 'text-rose-300' : 'text-white'}`}>
                  Savings: {formatCurrency(summary.monthIncome - summary.monthExpense)}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Today's Earnings" amount={summary.todayIncome} icon={TrendingUp} colorClass="text-emerald-400" bgColorClass="bg-emerald-500/10" />
        <StatCard title="Today's Spend" amount={summary.todayExpense} icon={TrendingDown} colorClass="text-rose-400" bgColorClass="bg-rose-500/10" />
      </div>

      {/* Smart Alerts Center */}
      {(isLowBalance || criticalIssues.length > 0 || warningIssues.length > 0) && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Monitor</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {isLowBalance && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Global Limit Breached</p>
                    <p className="text-xs font-bold text-slate-300">Balance below {formatCurrency(settings.lowBalanceWarning)}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-500/50" />
              </div>
            )}
            
            {criticalIssues.map(b => (
              <div key={b.id} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Budget Exhausted</p>
                    <p className="text-xs font-bold text-slate-300">{b.name} is over {formatCurrency(b.budget)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-rose-500">+{formatCurrency(b.spent - b.budget)}</span>
              </div>
            ))}

            {warningIssues.map(b => (
              <div key={b.id} className={`p-4 border rounded-2xl flex items-center gap-3 ${
                b.status === 'fast' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  b.status === 'fast' ? 'bg-amber-500/20' : 'bg-slate-800'
                }`}>
                  <Zap className={`w-4 h-4 ${b.status === 'fast' ? 'text-amber-500' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${
                    b.status === 'fast' ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {b.status === 'fast' ? 'Velocity Warning' : 'Near Limit'}
                  </p>
                  <p className="text-xs font-bold text-slate-300">
                    {b.status === 'fast' ? `${b.name} spending is too high for this month.` : `${b.name} is at ${Math.round(b.percent)}%.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Pulse Monitor */}
      <div className="bg-slate-900/50 border border-slate-800/60 p-6 rounded-[32px] space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
          <Target className="w-32 h-32" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="font-black text-lg">Budget Pulse</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Tracking • {budgetHealth.length} Enforced</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded-xl">
             <Target className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 relative z-10">
          {budgetHealth.length > 0 ? budgetHealth.map((item) => (
            <div key={item.id} className="space-y-2.5">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-sm font-black text-white block">{item.name}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                      {item.remaining > 0 ? `${formatCurrency(item.remaining)} left` : 'Limit Breached'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black ${
                    item.status === 'critical' ? 'text-rose-500' : 
                    item.status === 'warning' ? 'text-amber-500' : 
                    item.status === 'fast' ? 'text-amber-400' : 'text-emerald-500'
                  }`}>
                    {Math.round(item.percent)}%
                  </span>
                </div>
              </div>
              
              <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden p-[2px] border border-slate-700/30">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                    item.status === 'critical' ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
                    item.status === 'warning' ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                    item.status === 'fast' ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 
                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                />
              </div>
              
              {item.status === 'fast' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest">
                    Spending faster than usual
                  </span>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-600 text-xs font-bold italic">No budgets configured yet.</p>
              <button className="mt-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-400/20 px-4 py-2 rounded-xl">
                Set Limits in Settings
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center pt-8 opacity-20 group cursor-default">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all group-hover:opacity-100">
          Handcrafted with <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500 animate-pulse" /> by Infas
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
