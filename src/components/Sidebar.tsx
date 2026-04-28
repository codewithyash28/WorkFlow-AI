/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { 
  BarChart2, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Mail, 
  Sun, 
  Moon, 
  Command,
  LogOut,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { AppView } from '../types';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  user: User | null;
  onSignOut: () => void;
  onStartDemo: () => void;
}

export default function Sidebar({ activeView, setActiveView, toggleTheme, isDarkMode, user, onSignOut, onStartDemo }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: BarChart2 },
    { id: 'tasks' as AppView, label: 'Tasks', icon: CheckSquare },
    { id: 'planner' as AppView, label: 'Planner', icon: Calendar },
    { id: 'summarizer' as AppView, label: 'AI Summarizer', icon: FileText },
    { id: 'emails' as AppView, label: 'Email Drafts', icon: Mail },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-neutral-50 dark:bg-[#0d0d0d] border-r border-neutral-100 dark:border-neutral-900 transition-colors">
      <div className="p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-950 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black">
            <Command size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-neutral-900 dark:text-white">WorkFlow AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Personalized</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg shadow-neutral-900/10' 
                : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <item.icon size={20} className={activeView === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} />
            <span className="font-medium text-sm">{item.label}</span>
            {activeView === item.id && (
              <motion.div 
                layoutId="active-indicator" 
                className="ml-auto w-1 h-4 bg-white/20 dark:bg-black/20 rounded-full"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-neutral-100 dark:border-neutral-900 overflow-hidden">
        {user && (
          <div className="p-4 flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                <UserIcon size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-neutral-900 dark:text-white">{user.displayName}</p>
              <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={onSignOut}
              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <div className="px-4 pb-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={onStartDemo}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all group"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Live Demo Mode</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
