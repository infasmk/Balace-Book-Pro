
import React from 'react';
import { Smartphone, X, Download } from 'lucide-react';

interface InstallPromptModalProps {
  onInstall: () => void;
  onClose: () => void;
}

const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ onInstall, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Install this app?</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Add BalanceBook Pro to your home screen for faster access, a full-screen experience, and offline use.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={onInstall}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-slate-500 font-bold hover:text-slate-300 transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPromptModal;
