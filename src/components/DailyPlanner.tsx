/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2,
  Edit3,
  Coffee, 
  Briefcase, 
  Brain, 
  Clock, 
  ArrowRight,
  Sparkles,
  Zap,
  Layout,
  Calendar as CalendarIcon,
  CheckCircle2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Task, ScheduleItem, UserProfile, Priority } from '../types';

interface DailyPlannerProps {
  tasks: Task[];
  profile: UserProfile | null;
}

export default function DailyPlanner({ tasks, profile }: DailyPlannerProps) {
  const [usePomodoro, setUsePomodoro] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [syncedEvents, setSyncedEvents] = useState<ScheduleItem[]>([]);
  const [calendarId, setCalendarId] = useState('primary');
  const [showGCalSettings, setShowGCalSettings] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '', endTime: '', type: 'work' as const });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;
    
    if ((newEvent as any).id) {
      setSyncedEvents(syncedEvents.map(ev => ev.id === (newEvent as any).id ? { ...newEvent } as ScheduleItem : ev));
    } else {
      setSyncedEvents([...syncedEvents, { ...newEvent, id: `manual-event-${Date.now()}` }]);
    }
    
    setNewEvent({ title: '', startTime: '', endTime: '', type: 'work' });
    setShowAddEvent(false);
  };

  const openAddEvent = () => {
    const now = new Date();
    const nextSlot = new Date(Math.ceil(now.getTime() / (30 * 60000)) * (30 * 60000));
    const endSlot = new Date(nextSlot.getTime() + 60 * 60000);
    
    const format = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    
    setNewEvent({ title: '', startTime: format(nextSlot), endTime: format(endSlot), type: 'work' });
    setShowAddEvent(true);
  };

  const handleEditEvent = (ev: ScheduleItem) => {
    setNewEvent({ ...ev });
    setShowAddEvent(true);
  };

  const handleDeleteEvent = (id: string) => {
    setSyncedEvents(syncedEvents.filter(ev => ev.id !== id));
  };

  const calendars = [
    { id: 'primary', name: 'Personal (Primary)', color: 'bg-blue-500' },
    { id: 'work', name: 'Work / Projects', color: 'bg-purple-500' },
    { id: 'shared', name: 'Team Collaborative', color: 'bg-emerald-500' }
  ];

  // Push notifications logic
  useEffect(() => {
    if (Notification.permission === 'granted' && tasks.length > 0) {
      const pending = tasks.filter(t => !t.completed && t.priority === 'High');
      if (pending.length > 0) {
        // Notification simulation
        const timer = setTimeout(() => {
          new Notification("WorkFlow AI: High Priority Alert", {
            body: `Approaching focus block for: ${pending[0].title}. Check your planner.`,
            icon: "/favicon.ico",
            tag: "task-alarm"
          });
        }, 5000); 
        return () => clearTimeout(timer);
      }
    }
  }, [tasks]);

  // Event specific notifications
  useEffect(() => {
    if (Notification.permission === 'granted' && syncedEvents.length > 0) {
      const checkEvents = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        syncedEvents.forEach(event => {
          if (event.startTime === currentTime) {
            new Notification("Event Starting Now", {
              body: `${event.title} is starting. Switch to ${event.type} mode.`,
              icon: "/favicon.ico",
              tag: `event-start-${event.id}`
            });
          }
        });
      }, 60000);
      return () => clearInterval(checkEvents);
    }
  }, [syncedEvents]);

  const handleGoalSync = () => {
    setIsSyncing(true);
    // Real Goal Sync: Turn the top 2 high-priority tasks into fixed 'Focus Goals' in the schedule
    setTimeout(() => {
      setIsSyncing(false);
      setCalendarSynced(true);
      
      const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === Priority.HIGH);
      const goalEvents: ScheduleItem[] = highPriorityTasks.slice(0, 2).map((t, index) => ({
        id: `goal-${t.id}`,
        title: `FOCUS GOAL: ${t.title}`,
        startTime: index === 0 ? '09:00' : '11:00',
        endTime: index === 0 ? '10:30' : '12:00',
        type: 'work'
      }));

      // No more hardcoded dummy 'Client Sync' strings
      setSyncedEvents([...syncedEvents, ...goalEvents]);
    }, 1200);
  };

  // Algorithmic schedule generator based on real task data
  const generatedSchedule = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => {
      // Prioritize High -> Medium -> Low
      const pMap = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
      return pMap[a.priority] - pMap[b.priority];
    });

    let schedule: ScheduleItem[] = [...syncedEvents];
    let currentHour = 9;
    let currentMinute = 0;

    const addTime = (mins: number) => {
      currentMinute += mins;
      while (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
      }
    };

    const formatTime = (h: number, m: number) => {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // If we have no synced events and no tasks, show a default empty state or basic structure
    if (schedule.length === 0 && activeTasks.length === 0) {
      return [
        { id: 'empty-1', title: 'Plan Your Day', startTime: '09:00', endTime: '09:30', type: 'work' },
        { id: 'empty-2', title: 'Focus Block', startTime: '10:00', endTime: '11:30', type: 'work' }
      ];
    }

    // Attempt to fit tasks into the schedule
    activeTasks.forEach((task, index) => {
      // Prioritize tasks with user-defined startTime
      if (task.startTime && task.endTime) {
        schedule.push({
          id: `manual-${task.id}`,
          title: task.title,
          startTime: task.startTime,
          endTime: task.endTime,
          type: 'work'
        });
        
        // Adjust the "pointer" for auto-scheduling to follow this manual task
        const [h, m] = task.endTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          // Move pointer and add a small buffer
          currentHour = h;
          currentMinute = m;
          addTime(5); 
        }
        return;
      }

      // Check if this time slot is already taken by a synced event or manual task
      let startTimeStr = formatTime(currentHour, currentMinute);
      const duration = task.estimatedTime || 60;
      
      // Basic overlap prevention
      while (schedule.some(s => s.startTime === startTimeStr)) {
        addTime(30); 
        startTimeStr = formatTime(currentHour, currentMinute);
      }

      const start = formatTime(currentHour, currentMinute);
      addTime(duration);
      const end = formatTime(currentHour, currentMinute);

      schedule.push({
        id: `task-${task.id}`,
        title: task.title,
        startTime: start,
        endTime: end,
        type: 'work'
      });

      // Add a break after every 2 tasks or if a task is long
      if ((index + 1) % 2 === 0 || duration >= 90) {
        const bStart = formatTime(currentHour, currentMinute);
        addTime(15);
        const bEnd = formatTime(currentHour, currentMinute);
        schedule.push({
          id: `break-${index}`,
          title: 'Cognitive Recharge',
          startTime: bStart,
          endTime: bEnd,
          type: 'break'
        });
      }
    });
    
    // Add lunch if we pass 12:00
    if (currentHour >= 12 && !schedule.some(s => s.title.toLowerCase().includes('lunch'))) {
      schedule.push({ id: 'lunch', title: 'Nutritional Fueling', startTime: '12:00', endTime: '13:00', type: 'break' });
    }

    // Sort by time
    return schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, syncedEvents]);

  const adherenceScore = useMemo(() => {
    const completedTasksInSchedule = tasks.filter(t => t.completed).length;
    const totalTasksSuggested = tasks.length;
    if (totalTasksSuggested === 0) return 100;
    return Math.round((completedTasksInSchedule / totalTasksSuggested) * 100);
  }, [tasks]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter">Daily Planner</h1>
          <p className="text-neutral-500 mt-2 font-medium">Precision scheduling powered by your Cognitive OS.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openAddEvent}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-white rounded-full text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
          >
            <RefreshCw size={14} className={showAddEvent ? 'rotate-45' : ''} />
            Add Event
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowGCalSettings(!showGCalSettings)}
              className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
            >
              <Settings size={20} />
            </button>
            <AnimatePresence>
              {showGCalSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-6 z-[100]"
                >
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Goal & Task Sync</h4>
                  <div className="space-y-3">
                    {calendars.map(cal => (
                      <button 
                        key={cal.id}
                        onClick={() => setCalendarId(cal.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${calendarId === cal.id ? 'bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${cal.color}`} />
                          <span className="text-xs font-bold">{cal.name}</span>
                        </div>
                        {calendarId === cal.id && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                        handleGoalSync();
                        setShowGCalSettings(false);
                    }}
                    className="w-full mt-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={12} /> Sync Now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleGoalSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              calendarSynced 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' 
                : 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg shadow-neutral-900/10'
            }`}
          >
            {isSyncing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : calendarSynced ? (
              <CheckCircle2 size={14} />
            ) : (
              <CalendarIcon size={14} />
            )}
            {calendarSynced ? 'Calendar Integrated' : 'Integrate Goals'}
          </button>
          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-full w-fit">
          <button 
            onClick={() => setUsePomodoro(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!usePomodoro ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            Time Blocks
          </button>
          <button 
            onClick={() => setUsePomodoro(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${usePomodoro ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            Pomodoro
          </button>
        </div>
      </div>
    </header>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-[2.5rem] p-10 border border-neutral-100 dark:border-neutral-800 shadow-2xl"
            >
              <h3 className="text-2xl font-display font-black mb-8 tracking-tighter">
                {(newEvent as any).id ? 'Edit Scheduled Block' : 'Schedule Custom Block'}
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Event Title</label>
                  <input 
                    type="text"
                    placeholder="e.g., Deep Focus / Gym / Team Sync"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-neutral-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Start</label>
                      <input 
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 px-6 py-4 rounded-2xl outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">End</label>
                      <input 
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 px-6 py-4 rounded-2xl outline-none"
                      />
                   </div>
                </div>
                <div className="flex gap-2">
                   {(['work', 'break', 'personal'] as const).map(t => (
                     <button
                       key={t}
                       onClick={() => setNewEvent({ ...newEvent, type: t })}
                       className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${newEvent.type === t ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'bg-transparent text-neutral-400 border-neutral-100 dark:border-neutral-800'}`}
                     >
                       {t}
                     </button>
                   ))}
                </div>
                <div className="flex gap-4 pt-4">
                   <button 
                    onClick={() => {
                      setShowAddEvent(false);
                      setNewEvent({ title: '', startTime: '', endTime: '', type: 'work' });
                    }}
                    className="flex-1 py-4 text-xs font-bold text-neutral-400"
                   >
                     Cancel
                   </button>
                   <button 
                    onClick={handleAddEvent}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-emerald-500/20"
                   >
                     {(newEvent as any).id ? 'Update Slot' : 'Confirm Slot'}
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Flow Advisory Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-neutral-900 dark:bg-white p-8 rounded-[2.5rem] text-white dark:text-black mb-12 relative overflow-hidden shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-800 dark:bg-neutral-100 rounded-xl">
              <Sparkles size={20} className="text-emerald-400 dark:text-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Cognitive Load Predictor</span>
          </div>
          <h3 className="text-2xl font-display font-medium leading-tight mb-6 tracking-tighter max-w-2xl">
            {tasks.filter(t => !t.completed).length > 5 
              ? "Your task velocity suggests a multi-context switch. Offload low-cpu chores to protect your focus window."
              : `Optimal momentum, ${profile?.name || 'User'}. Data aligns with elite 'Deep Work' targets for the next 90 minutes.`}
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 dark:bg-neutral-100 rounded-full text-[10px] font-bold">
              <Zap size={12} fill="currentColor" className="text-yellow-400" />
              Next Focus: {generatedSchedule.find(s => s.type === 'work')?.startTime || 'ASAP'}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 dark:bg-neutral-100 rounded-full text-[10px] font-bold">
              <Layout size={12} className="text-blue-400" />
              State: {tasks.filter(t => t.completed).length > tasks.filter(t => !t.completed).length ? 'Aggressive Pull' : 'Steady Flow'}
            </div>
          </div>
        </div>
        
        {/* Animated Background */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 blur-[100px] -z-0"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {generatedSchedule.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-6 group"
            >
              <div className="w-16 pt-1">
                <span className="text-xs font-bold text-neutral-400 font-mono">{item.startTime}</span>
              </div>
              <div className="relative flex-1 pb-8">
                {/* Connector line */}
                {i < generatedSchedule.length - 1 && (
                  <div className="absolute top-8 left-6 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800" />
                )}
                
                <div className={`p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 transition-all group-hover:shadow-xl group-hover:scale-[1.01] ${
                  item.type === 'work' ? 'bg-white dark:bg-neutral-900 border-l-4 border-l-neutral-900 dark:border-l-white' : 
                  item.type === 'break' ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500' : 
                  'bg-amber-50/30 dark:bg-amber-900/10 border-l-4 border-l-amber-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl bg-neutral-50 dark:bg-black text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors`}>
                        {item.type === 'work' ? <Briefcase size={18} /> : 
                         item.type === 'break' ? <Coffee size={18} /> : 
                         <Brain size={18} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{item.title}</h4>
                        <p className="text-xs text-neutral-400 font-medium">{item.startTime} — {item.endTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.id.startsWith('manual-event') && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                          <button 
                            onClick={() => handleEditEvent(item)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(item.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {item.type === 'work' && (
                      <div className="flex items-center gap-1 bg-neutral-900 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
                        <Clock size={10} /> Focus
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        </div>

        {/* Focus & Insights */}
        <div className="space-y-8">
          <section className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800">
             <div className="flex items-center gap-2 text-blue-600 mb-6">
                <Layout size={20} />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">Schedule Adherence</h3>
             </div>
             <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-display font-medium">{adherenceScore}%</span>
                <span className={`text-xs font-bold mb-1 ${adherenceScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {adherenceScore >= 80 ? 'Excellent' : 'Needs Focus'}
                </span>
             </div>
             <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${adherenceScore}%` }}
                  className="h-full bg-blue-600 rounded-full"
                />
             </div>
             <p className="text-sm text-neutral-500 leading-relaxed">
               {adherenceScore >= 80 
                 ? "You're sticking to your plan with remarkable discipline. This consistency is your superpower."
                 : "A bit off-track? It's fine. Re-align your next block or slim down the subtasks to regain control."}
             </p>
          </section>

          <section className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800">
             <div className="flex items-center gap-2 text-blue-600 mb-6">
                <Sparkles size={20} />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">AI Insight</h3>
             </div>
             <h4 className="text-xl font-display font-medium mb-4">
               {profile?.workType === 'Creative/Design' ? 'Morning Creative Block' : 
                profile?.workType === 'Software/Engineering' ? 'Optimal Debugging Window' : 
                'Strategic Planning Window'}
             </h4>
             <p className="text-sm text-neutral-500 leading-relaxed mb-6">
               {profile?.workType === 'Creative/Design' 
                 ? `Hey ${profile?.name}, data suggests your deepest creative state peaks between 09:00 and 11:30. We've optimized your schedule to protect this window.`
                 : profile?.workType === 'Software/Engineering' 
                 ? `${profile?.name}, your high-intensity technical blocks are aligned for the morning. Afternoon sessions are reserved for maintenance and syncs.`
                 : `Strategic alignment time, ${profile?.name}. Focus on your top outcomes during the morning sprint to ensure a clean evening disconnect.`}
             </p>
             <ul className="space-y-3">
               <li className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                 <div className="p-1 bg-white dark:bg-black rounded-md"><Zap size={14} /></div>
                 Peak focus for {profile?.workType || 'your role'}: 09:00 - 11:30
               </li>
               <li className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                 <div className="p-1 bg-white dark:bg-black rounded-md"><ArrowRight size={14} /></div>
                 Suggested break: 10 min movement
               </li>
             </ul>
          </section>

          <section className="p-8 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
            <h4 className="font-bold mb-4">Focus Mode</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-silence notifications</span>
                <div className="w-10 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer relative">
                    <div className="absolute top-1 left-1 w-3 h-3 bg-white dark:bg-neutral-500 rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ambience music</span>
                <div className="w-10 h-5 bg-neutral-900 dark:bg-white rounded-full cursor-pointer relative">
                    <div className="absolute top-1 right-1 w-3 h-3 bg-white dark:bg-neutral-900 rounded-full" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <p className="text-xs text-neutral-400">Next step: Review your progress at 16:30 for a clean wrap-up.</p>
      </div>
    </div>
  );
}
