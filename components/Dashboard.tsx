
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, AppSettings } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { isToday, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays, getDaysInMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Zap, Target, Heart, X, Sparkles, BellRing, Instagram, ShieldCheck, HelpCircle, ChevronRight, Info } from 'lucide-react';
import { storageService } from '../services/storageService';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  onNavigateToSettings: () => void;
  isConnected: boolean | null;
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
  <div className="bg-slate-900/50 p-4 md:p-5 rounded-[24px] border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-all shrink-0">
    <div className="space-y-1 overflow-hidden">
      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{title}</p>
      <h3 className="text-lg md:text-xl font-black text-white truncate">{formatCurrency(amount)}</h3>
    </div>
    <div className={`p-2 md:p-2.5 rounded-xl shrink-0 ${bgColorClass}`}>
      <Icon className={`w-3.5 h-3.5 md:w-4 h-4 ${colorClass}`} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, settings, onNavigateToSettings, isConnected }) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourStep, setTourStep] = useState(0); // 0: Welcome, 1: DB Info, 2: Tour Guide, 3+: Specific items
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

  const nextStep = () => setTourStep(prev => prev + 1);

  const tourContent = [
    {
      title: "Welcome to BalanceBook Pro",
      subtitle: "Created by Infas & Team AWT",
      description: "Team AWT offers premium, high-performance web tools for free with 100% privacy and no data tracking. Your vault is locally encrypted and secure.",
      icon: <Zap className="w-8 h-8 text-white" />,
      color: "bg-indigo-600"
    },
    {
      title: "⚠️ Important: Connection",
      subtitle: "Database Status Guide",
      description: "In the header, look for the ⚡ icon. If it's GREEN, you are ready to save. If it's RED, please do NOT add transactions; reload the page until it turns green to ensure data sync.",
      icon: <Zap className="w-8 h-8 text-white" />,
      color: "bg-rose-600"
    },
    {
      title: "Quick Tour: Features",
      subtitle: "Navigating your Finance Hub",
      description: "BalanceBook is divided into 4 key zones: Home (Insights), History (All logs), Stats (Visual charts), and Config (Backups & Settings).",
      icon: <HelpCircle className="w-8 h-8 text-white" />,
      color: "bg-emerald-600"
    }
  ];

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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500 max-w-full overflow-x-hidden pb-32 md:pb-12 min-h-full">
      {/* Header section */}
      <div className="px-1 flex justify-between items-end gap-2 shrink-0">
        <div className="overflow-hidden">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">{greeting}, {user?.name || 'Guest'}!</h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-bold truncate">Status Secure</p>
        </div>
        {criticalIssues.length > 0 && (
          <div className="relative shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
              <BellRing className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
            </div>
          </div>
        )}
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-md w-full relative animate-in zoom-in-95 shadow-2xl">
            <button onClick={closeWelcome} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            
            <div className={`w-16 h-16 ${tourContent[tourStep]?.color || 'bg-indigo-600'} rounded-[24px] flex items-center justify-center mb-6 shadow-xl transition-colors duration-500`}>
              {tourContent[tourStep]?.icon}
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-white leading-tight">{tourContent[tourStep]?.title}</h2>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">{tourContent[tourStep]?.subtitle}</p>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {tourContent[tourStep]?.description}
              </p>
            </div>

            <div className="space-y-3">
              {tourStep < tourContent.length - 1 ? (
                <button 
                  onClick={nextStep}
                  className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Continue Tour <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={closeWelcome}
                  className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-white hover:bg-indigo-700 transition-all"
                >
                  Start Management
                </button>
              )}
              
              <a 
                href="https://instagram.com/infaaze" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-slate-800 border border-slate-700 rounded-2xl font-black text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Instagram className="w-5 h-5 text-rose-500" />
                Follow Infas (@infaaze)
              </a>
            </div>

            <div className="flex justify-center gap-1.5 mt-6">
              {tourContent.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === tourStep ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Balance Card */}
      <div className="p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden transition-all duration-700 border-2 shrink-0 bg-indigo-600 border-indigo-400/20 shadow-indigo-900/20">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Wallet className="w-16 h-16 md:w-24 md:h-24 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-3 md:space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
            Available Balance
          </p>
          
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter break-all text-white">
            {formatCurrency(summary.balance)}
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-2">
             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border bg-white/10 border-white/10 shrink-0">
                <Sparkles className="w-3 h-3 text-white/70" />
                <span className="text-[9px] md:text-[10px] font-bold text-white">
                  Out: {formatCurrency(summary.monthExpense)}
                </span>
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border bg-white/10 border-white/10 shrink-0">
                <TrendingUp className="w-3 h-3 text-white/70" />
                <span className="text-[9px] md:text-[10px] font-bold text-white">
                  Net: {formatCurrency(summary.monthIncome - summary.monthExpense)}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 shrink-0">
        <StatCard title="Today In" amount={summary.todayIncome} icon={TrendingUp} colorClass="text-emerald-400" bgColorClass="bg-emerald-500/10" />
        <StatCard title="Today Out" amount={summary.todayExpense} icon={TrendingDown} colorClass="text-rose-400" bgColorClass="bg-rose-500/10" />
      </div>

      {/* Critical Budget Breaches */}
      {criticalIssues.length > 0 && (
        <div className="space-y-2 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Monitor</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {criticalIssues.map(b => (
              <div key={b.id} className="p-3 md:p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest truncate">Budget Breached</p>
                    <p className="text-[11px] font-bold text-slate-300 truncate">{b.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Pulse Monitor */}
      <div className="bg-slate-900/50 border border-slate-800/60 p-5 md:p-6 rounded-[32px] space-y-5 md:space-y-6 shadow-xl relative overflow-hidden flex-1 min-h-[300px]">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <Target className="w-24 h-24 md:w-32 md:h-32" />
        </div>
        <div className="flex items-center justify-between relative z-10 shrink-0">
          <div className="overflow-hidden">
            <h3 className="font-black text-base md:text-lg">Budget Pulse</h3>
            <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Performance Tracking</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded-xl shrink-0 ml-2">
             <Target className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div className="flex flex-col gap-6 relative z-10 overflow-y-auto pr-1 pb-4">
          {budgetHealth.length > 0 ? budgetHealth.map((item) => (
            <div key={item.id} className="space-y-2 shrink-0">
              <div className="flex justify-between items-end gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="overflow-hidden">
                    <span className="text-xs md:text-sm font-black text-white block truncate">{item.name}</span>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate">
                      {item.remaining > 0 ? `${formatCurrency(item.remaining)} remaining` : 'Limit Exhausted'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] md:text-xs font-black ${
                    item.status === 'critical' ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {Math.round(item.percent)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden p-[2px] border border-slate-700/30">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                    item.status === 'critical' ? 'bg-rose-500 shadow-rose-900/20' : 'bg-emerald-500 shadow-emerald-900/20'
                  }`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                />
              </div>
            </div>
          )) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-600 text-[10px] font-bold italic">No budgets configured.</p>
              <button 
                onClick={onNavigateToSettings}
                className="mt-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-400/20 px-4 py-2 rounded-xl active:bg-indigo-400/10 transition-colors"
              >
                Configure Settings
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-center pt-4 opacity-30 shrink-0">
        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
          Handcrafted with <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> by Infas
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
