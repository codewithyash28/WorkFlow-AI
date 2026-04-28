import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Calendar, 
  Mail, 
  FileText, 
  User, 
  CheckSquare,
  Command as CommandIcon,
  ChevronRight,
  Zap
} from 'lucide-react';
import { AppView } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (view: AppView) => void;
  onAddTask: () => void;
}

export default function CommandPalette({ isOpen, onClose, onAction, onAddTask }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  
  const actions = [
    { id: 'dash', label: 'Go to Dashboard', icon: <Zap size={16} />, view: 'dashboard' as AppView },
    { id: 'new-task', label: 'Create New Task', icon: <Plus size={16} />, view: 'tasks' as AppView, action: onAddTask },
    { id: 'tasks', label: 'Manage Tasks', icon: <CheckSquare size={16} />, view: 'tasks' as AppView },
    { id: 'planner', label: 'View Daily Planner', icon: <Calendar size={16} />, view: 'planner' as AppView },
    { id: 'summarizer', label: 'Meeting Summarizer', icon: <Sparkles size={16} />, view: 'summarizer' as AppView },
    { id: 'emails', label: 'Email Writer', icon: <Mail size={16} />, view: 'emails' as AppView },
  ];

  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null; // Logic handled in App.tsx
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          <h2 id="command-palette-title" className="sr-only">Command Palette</h2>
          <div className="flex items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <Search className="text-neutral-400 mr-3" size={20} />
            <input 
              autoFocus
              type="text" 
              placeholder="Type a command or search..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-neutral-900 dark:text-white placeholder:text-neutral-300"
            />
            <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-[10px] font-black text-neutral-400">
              <span className="text-[12px] font-sans">ESC</span>
            </div>
          </div>

          <div className="p-2 max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Quick Actions</span>
            </div>
            
            <div className="space-y-1">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onAction(action.view);
                    if ('action' in action && action.action) action.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      {action.icon}
                    </div>
                    <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{action.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
              ))}
            </div>

            {query && filteredActions.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-neutral-400">No results for "{query}"</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <CommandIcon size={10} /> + K to close
              </div>
              <div className="flex items-center gap-1">
                <ChevronRight size={10} className="rotate-90" /> to select
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold">
              v1.0.0 Alpha
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
