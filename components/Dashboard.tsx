
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, AppSettings } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { isToday, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Zap, Target, Heart, ExternalLink, X, AlertOctagon, Sparkles, BellRing } from 'lucide-react';
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
  <div className="bg-slate-900/50 p-6 rounded-[24px] border border-slate-800 flex items-center justify-between group">
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-white">{formatCurrency(amount)}</h3>
    </div>
    <div className={`p-3 rounded-2xl ${bgColorClass}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
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
        const percent = (spent / (c.budget || 1)) * 100;
        return {
          id: c.id,
          name: c.name,
          spent,
          budget: c.budget as number,
          percent,
          color: c.color,
          status: percent >= 100 ? 'critical' : percent >= 85 ? 'warning' : 'healthy'
        };
      })
      .sort((a, b) => b.percent - a.percent); 
  }, [transactions, categories]);

  const criticalIssues = budgetHealth.filter(h => h.status === 'critical');
  const warningIssues = budgetHealth.filter(h => h.status === 'warning');
  const isLowBalance = summary.balance < settings.lowBalanceWarning;

  // Trigger Native Push Notifications
  useEffect(() => {
    if (isLowBalance) {
      notificationService.send(
        "Low Balance Warning", 
        `Your balance ${formatCurrency(summary.balance)} is below your ${formatCurrency(settings.lowBalanceWarning)} limit.`
      );
    }
    
    if (criticalIssues.length > 0) {
      const highestBreach = criticalIssues[0];
      notificationService.send(
        "Budget Limit Exceeded", 
        `You have spent ${formatCurrency(highestBreach.spent)} on ${highestBreach.name}, exceeding your limit.`
      );
    }
  }, [summary.balance, criticalIssues, isLowBalance, settings.lowBalanceWarning]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {user?.name || 'Guest'}!</h1>
          <p className="text-slate-500 text-sm font-bold">Smart tracking for smart savings.</p>
        </div>
        {(criticalIssues.length > 0 || isLowBalance) && (
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 animate-pulse">
              <BellRing className="w-5 h-5 text-rose-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-slate-950" />
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
              <br/><br/>
              Created by <span className="font-bold text-indigo-400">Infas from Web Bits</span>.
              Powered by <span className="font-bold text-white uppercase tracking-widest text-[10px]">AWT Team</span>.
            </p>
            <div className="space-y-3">
              <a 
                href="https://webbits.space" 
                target="_blank" 
                className="flex items-center justify-between w-full py-4 px-6 bg-indigo-600 rounded-2xl font-black text-white hover:bg-indigo-700 transition-colors"
              >
                Follow Developer <ExternalLink className="w-4 h-4" />
              </a>
              <button 
                onClick={closeWelcome}
                className="w-full py-4 px-6 bg-slate-800 rounded-2xl font-black text-slate-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Balance Card */}
      <div className={`p-8 rounded-[32px] shadow-2xl relative overflow-hidden transition-colors duration-500 ${isLowBalance ? 'bg-rose-600 shadow-rose-600/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}>
        <div className="absolute top-0 right-0 p-4 opacity-20">
          {isLowBalance ? <AlertOctagon className="w-24 h-24 rotate-12" /> : <Wallet className="w-24 h-24 rotate-12" />}
        </div>
        <div className="relative z-10 space-y-2">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest">Available Balance</p>
          <h2 className="text-4xl font-black text-white">{formatCurrency(summary.balance)}</h2>
          <div className="flex items-center gap-2 pt-4">
             <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-white/70" />
                <span className="text-[10px] font-bold text-white">Monthly Expense: {formatCurrency(summary.monthExpense)}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Daily In" amount={summary.todayIncome} icon={TrendingUp} colorClass="text-emerald-400" bgColorClass="bg-emerald-500/10" />
        <StatCard title="Daily Out" amount={summary.todayExpense} icon={TrendingDown} colorClass="text-rose-400" bgColorClass="bg-rose-500/10" />
      </div>

      {/* Smart Alerts Center */}
      {(isLowBalance || criticalIssues.length > 0 || warningIssues.length > 0) && (
        <div className="space-y-3 animate-in slide-in-from-right duration-500">
          <div className="flex items-center gap-2 px-1 mb-1">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Alerts</span>
          </div>
          
          {isLowBalance && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Critical Balance</p>
                <p className="text-xs font-bold text-slate-300">Wallet balance is below your {formatCurrency(settings.lowBalanceWarning)} threshold.</p>
              </div>
            </div>
          )}
          
          {criticalIssues.map(b => (
            <div key={b.id} className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Limit Exceeded</p>
                <p className="text-xs font-bold text-slate-300">You've spent {formatCurrency(b.spent)} on {b.name}, which is {Math.round(b.percent)}% of budget.</p>
              </div>
            </div>
          ))}

          {warningIssues.map(b => (
            <div key={b.id} className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Near Budget</p>
                <p className="text-xs font-bold text-slate-300">{b.name} spending is at {Math.round(b.percent)}%. Watch your expenses.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Pulse Monitor */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-6 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg">Budget Pulse</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase">{budgetHealth.length} Tracked</span>
            <Target className="w-4 h-4 text-slate-500" />
          </div>
        </div>
        <div className="space-y-6">
          {budgetHealth.length > 0 ? budgetHealth.map((item) => (
            <div key={item.id} className="space-y-3 group">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-sm font-black text-white block leading-none mb-1">{item.name}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                      {formatCurrency(item.spent)} of {formatCurrency(item.budget)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black ${
                    item.status === 'critical' ? 'text-rose-500' : 
                    item.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {Math.round(item.percent)}%
                  </span>
                  {item.status === 'critical' && <AlertCircle className="w-3 h-3 text-rose-500 inline ml-1 animate-pulse" />}
                </div>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30 p-[2px]">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    item.status === 'critical' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 
                    item.status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                />
              </div>
            </div>
          )) : (
            <div className="text-center py-8 space-y-3 border-2 border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-600 text-sm font-bold italic">No active budget limits.</p>
              <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest">Enable in Settings (Config)</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center pt-8 opacity-20">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
          Made with <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> by Infas
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
