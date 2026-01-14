
import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, type = 'danger' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-700">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            type === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
          }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t dark:border-slate-700">
          <button 
            onClick={onCancel}
            className="flex-1 px-6 py-4 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-r dark:border-slate-700"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
              type === 'danger' ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <X className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'border-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800',
    error: 'border-rose-100 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800',
    info: 'border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
  };

  return (
    <div className={`fixed top-6 right-6 z-[110] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl animate-in slide-in-from-right duration-300 ${bgColors[type]}`}>
      {icons[type]}
      <p className="text-sm font-semibold dark:text-slate-200">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
        <X className="w-4 h-4 opacity-50" />
      </button>
    </div>
  );
};
