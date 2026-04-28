/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  Plus,
  FileText,
  Mail,
  ExternalLink,
  Bell,
  Timer,
  Layout
} from 'lucide-react';
import { Task, AppView, AppStats, UserProfile } from '../types';

interface DashboardProps {
  tasks: Task[];
  stats: AppStats;
  profile: UserProfile | null;
  setActiveView: (view: AppView) => void;
}

export default function Dashboard({ tasks, stats, profile, setActiveView }: DashboardProps) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Calculate schedule adherence based on completed vs total tasks today
  const adherenceRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const pendingReminders = useMemo(() => {
    return tasks
      .filter(t => t.reminder && !t.completed && new Date(t.reminder) > new Date())
      .sort((a, b) => new Date(a.reminder!).getTime() - new Date(b.reminder!).getTime());
  }, [tasks]);

  const highPriorityCount = tasks.filter(t => t.priority === 'High' && !t.completed).length;

  const proactiveAdvice = useMemo(() => {
    if (tasks.length === 0) return `You're clear for takeoff, ${profile?.name || 'Professional'}! Start by adding your first big goal for today.`;
    
    const highIntensity = highPriorityCount > 2;
    const morning = new Date().getHours() < 12;
    const isCreative = profile?.workType === 'Creative/Design';
    const isTechnical = profile?.workType === 'Software/Engineering';
    const hours = new Date().getHours();

    if (hours >= 10 && hours <= 12) {
      return `Peak Cognitive Flow detected, ${profile?.name}. Data shows you complete complex logic 40% faster during this window. I've shielded this time for your High-Priority tasks.`;
    }
    if (hours > 15 && hours < 17) {
      return "The 'Afternoon Dip' is approaching. Switch to low-cpu tasks like meeting summaries or email drafts to maintain output without burnout.";
    }
    if (highIntensity && morning) {
      return `Critical overload detected for a ${profile?.workType || 'Professional'}. Tackle 'Eat the Frog' - your hardest task first before your energy dips at lunch.`;
    }
    if (isCreative && completionRate < 30) {
      return "Creative flow detected. Try the 'Pomodoro' technique to break through initial resistance and find your rhythm.";
    }
    if (isTechnical && highPriorityCount > 0) {
      return "Deep work suggested. Block out 90 minutes of undistracted time to solve your highest priority technical challenge.";
    }
    if (completionRate > 70) {
      return `Exceptional momentum, ${profile?.name || 'Professional'}! You're in the elite 10% of productivity today. Consider wrapping up early or planning for a great tomorrow.`;
    }
    if (pendingTasks > 5) {
      return "Backlog alert. Try the 2-minute rule: if a task takes less than 2 mins, do it now to clear the visual clutter.";
    }
    return "Steady progress. Remember to take a 5-minute movement break every 50 minutes to maintain cognitive clarity.";
  }, [tasks, highPriorityCount, completionRate, pendingTasks, profile]);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
                <Zap size={22} fill="currentColor" />
             </div>
             <div className="flex flex-col">
                <span className="text-xl font-display font-black tracking-tighter leading-none">WorkFlow AI</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-400">Cognitive OS</span>
             </div>
          </div>
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-neutral-400 font-medium mb-1"
          >
            {greeting()}, {profile?.name || 'Professional'}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-display font-medium tracking-tight"
          >
            Performance Hub
          </motion.h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveView('tasks')}
            className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={18} /> New Task
          </button>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Adherence', value: `${adherenceRate}%`, icon: Clock, color: 'text-blue-500' },
          { label: 'AI Summaries', value: stats.summariesGenerated, icon: FileText, color: 'text-purple-500' },
          { label: 'Emails Drafted', value: stats.emailsDrafted, icon: Mail, color: 'text-pink-500' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800"
          >
            <div className={`p-2 w-fit rounded-lg bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 mb-4 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-medium">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Progress Motivation Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 p-10 rounded-[3rem] text-white dark:text-black"
      >
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-display font-medium mb-4 leading-tight">
             {completionRate >= 90 ? "You've reached peak mastery." : "Consistency is the bridge between goals and accomplishment."}
          </h2>
          <p className="text-neutral-400 dark:text-neutral-500 mb-8 leading-relaxed">
            {proactiveAdvice}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveView('planner')}
              className="bg-white dark:bg-neutral-900 text-black dark:text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Optimize Flow
            </button>
            <a 
              href="http://yash-choubey-student-developer-port.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-neutral-700 dark:border-neutral-300 px-6 py-3 rounded-full font-medium hover:bg-white/5 transition-colors"
            >
              Developer Portfolio <ExternalLink size={14} />
            </a>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10 pointer-events-none">
           <TrendingUp size={240} strokeWidth={1} />
        </div>
      </motion.section>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Activity */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-medium">Focus Area</h2>
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">High Priority: {highPriorityCount}</div>
          </div>
          
          <div className="space-y-3">
            {tasks.filter(t => !t.completed).slice(0, 3).map((task, i) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex items-center justify-between group cursor-pointer hover:border-neutral-900 dark:hover:border-white transition-all shadow-sm hover:shadow-md"
                onClick={() => setActiveView('tasks')}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-sm line-clamp-1">{task.title}</h4>
                    <p className="text-[10px] uppercase font-bold text-neutral-400">{task.priority} Priority</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
              </motion.div>
            ))}
            {tasks.filter(t => !t.completed).length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
                <p className="text-neutral-400 font-medium text-xs">All tasks complete!</p>
              </div>
            )}
          </div>
        </section>

        {/* Reminders Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-medium text-neutral-900 dark:text-white flex items-center gap-2">
               <Bell size={20} className="text-amber-500" /> Reminders
            </h2>
          </div>
          <div className="space-y-3">
            {pendingReminders.length > 0 ? (
              pendingReminders.slice(0, 3).map((task, i) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30"
                >
                  <div className="flex items-center gap-3">
                    <Timer size={14} className="text-amber-500" />
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{task.title}</h4>
                      <p className="text-[10px] text-amber-600 font-bold uppercase">
                        {new Date(task.reminder!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl">
                <Bell size={32} className="mx-auto text-neutral-200 dark:text-neutral-800 mb-3" />
                <p className="text-neutral-400 font-medium text-xs">No upcoming alerts.</p>
              </div>
            )}
          </div>
        </section>

        {/* Brand Accent */}
        <section className="bg-neutral-50 dark:bg-neutral-900/50 p-8 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black mb-6 shadow-2xl relative">
               <Zap size={32} />
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                 transition={{ repeat: Infinity, duration: 3 }}
                 className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-2xl blur-xl"
               />
            </div>
            <h3 className="text-xl font-bold mb-2">Code with Yash</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Precision Engineering</p>
            <a 
              href="http://yash-choubey-student-developer-port.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-blue-500 hover:underline"
            >
              VISIT PORTFOLIO
            </a>
        </section>
      </div>
    </div>
  );
}
