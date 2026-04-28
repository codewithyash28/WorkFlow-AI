/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Mail, 
  Sun, 
  Moon, 
  User as UserIcon,
  ExternalLink,
  ChevronRight,
  LogIn,
  Zap,
  Layout,
  Sparkles
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy,
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, signIn, signOut, OperationType, handleFirestoreError } from './services/firebase';
import { AppView, Task, AppStats, UserProfile } from './types';
import { 
  THEME_STORAGE_KEY, 
  TASKS_STORAGE_KEY, 
  STATS_STORAGE_KEY,
  TUTORIAL_SHOWN_KEY 
} from './constants';

// Sub-components (to be implemented)
import Sidebar from './components/Sidebar';
import Tutorial from './components/Tutorial';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import DailyPlanner from './components/DailyPlanner';
import MeetingSummarizer from './components/MeetingSummarizer';
import EmailWriter from './components/EmailWriter';
import ProfileSetup from './components/ProfileSetup';
import CommandPalette from './components/CommandPalette';
import HistoryAgent from './components/HistoryAgent';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryAgentOpen, setIsHistoryAgentOpen] = useState(false);
  const [stats, setStats] = useState<AppStats>({
    summariesGenerated: 0,
    emailsDrafted: 0,
    tasksCompleted: 0
  });

  const tasks = useCallback(() => {
    return [...userTasks, ...teamTasks].sort((a, b) => b.createdAt - a.createdAt);
  }, [userTasks, teamTasks])();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Test connection to Firestore as per requirements
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync: Profile & Stats
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setStats({
          summariesGenerated: data.summariesGenerated || 0,
          emailsDrafted: data.emailsDrafted || 0,
          tasksCompleted: data.tasksCompleted || 0
        });
        
        // Sync preferences
        if (data.isDarkMode !== undefined) {
          setIsDarkMode(data.isDarkMode);
          if (data.isDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        if (data.tutorialShown !== undefined) {
          setShowTutorial(!data.tutorialShown);
        }
      } else {
        // Initialize user doc
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          summariesGenerated: 0,
          emailsDrafted: 0,
          tasksCompleted: 0,
          isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
          tutorialShown: false
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Firestore Sync: Tasks
  useEffect(() => {
    if (!user) {
      setUserTasks([]);
      setTeamTasks([]);
      return;
    }

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const qUser = query(tasksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribeUser = onSnapshot(qUser, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Task));
      setUserTasks(taskList);
      setLastSynced(new Date());
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/tasks`));

    // Team tasks sync
    let unsubscribeTeam: (() => void) | null = null;
    if (profile?.teamId) {
      const teamTasksRef = collection(db, 'teams', profile.teamId, 'tasks');
      const qTeam = query(teamTasksRef, orderBy('createdAt', 'desc'));
      unsubscribeTeam = onSnapshot(qTeam, (snapshot) => {
        const taskList = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Task));
        setTeamTasks(taskList);
        setLastSynced(new Date());
      }, (err) => handleFirestoreError(err, OperationType.LIST, `teams/${profile.teamId}/tasks`));
    } else {
      setTeamTasks([]);
    }

    return () => {
      unsubscribeUser();
      if (unsubscribeTeam) unsubscribeTeam();
    };
  }, [user, profile?.teamId]);

  // Theme Sync Logic
  const toggleTheme = useCallback(async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { isDarkMode: newMode });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  }, [isDarkMode, user]);

  const handleSkipTutorial = async () => {
    setShowTutorial(false);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { tutorialShown: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const incrementStat = async (key: keyof AppStats) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [key]: (stats[key] || 0) + 1
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };
  
  const injectDemoData = async () => {
    if (!user) return;
    const demoTasks = [
      { 
        title: 'Refactor Core AI Engine', 
        priority: 'High', 
        completed: true, 
        createdAt: Date.now() - 86400000,
        description: 'Optimizing token throughput for real-time history retrieval.'
      },
      { 
        title: 'Prepare Investor Pitch Deck', 
        priority: 'High', 
        completed: false, 
        createdAt: Date.now(),
        description: 'Highlight the 40% efficiency gains in cognitive flow sessions.'
      },
      { 
        title: 'Review System Latency Metrics', 
        priority: 'Medium', 
        completed: true, 
        createdAt: Date.now() - 43200000 
      },
      { 
        title: 'Sync with Global Engineering Team', 
        priority: 'Medium', 
        completed: false, 
        createdAt: Date.now() 
      },
      { 
        title: 'Update Proactive Advisor Logic', 
        priority: 'Low', 
        completed: false, 
        createdAt: Date.now() 
      }
    ];

    try {
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      for (const t of demoTasks) {
        const newTaskRef = doc(tasksRef);
        await setDoc(newTaskRef, {
          ...t,
          id: newTaskRef.id,
          userId: user.uid,
          estimatedTime: 30,
          subtasks: []
        });
      }
      await updateDoc(doc(db, 'users', user.uid), {
        summariesGenerated: 42,
        emailsDrafted: 156,
        tasksCompleted: 89,
        workType: 'Software/Engineering',
        name: user.displayName || 'Developer Pro',
        tutorialShown: true
      });
      alert('Demo data injected! Welcome to the High-Performance tier.');
      setActiveView('dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'demo-injection');
    }
  };

  const renderView = () => {
    if (!user || !profile) return null;
    switch (activeView) {
      case 'dashboard': return <Dashboard tasks={tasks} stats={stats} setActiveView={setActiveView} profile={profile} />;
      case 'tasks': return <TaskManager tasks={tasks} userId={user.uid} profile={profile} />;
      case 'planner': return <DailyPlanner tasks={tasks} profile={profile} />;
      case 'summarizer': return <MeetingSummarizer onComplete={() => incrementStat('summariesGenerated')} />;
      case 'emails': return <EmailWriter onComplete={() => incrementStat('emailsDrafted')} />;
      default: return <Dashboard tasks={tasks} stats={stats} setActiveView={setActiveView} profile={profile} />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-black">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black"
        >
          <Zap size={32} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-neutral-900 p-12 rounded-[3.5rem] shadow-2xl border border-neutral-100 dark:border-neutral-800 text-center"
        >
          <div className="w-20 h-20 bg-neutral-900 dark:bg-white rounded-[2rem] flex items-center justify-center text-white dark:text-black mx-auto mb-8 shadow-2xl relative">
            <Zap size={40} fill="currentColor" />
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
               transition={{ repeat: Infinity, duration: 3 }}
               className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-[2rem] blur-2xl -z-10"
            />
          </div>
          <h1 className="text-4xl font-display font-black mb-2 tracking-tighter">WorkFlow AI</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 mb-8">Cognitive Operating System</p>
          <p className="text-neutral-500 mb-12 leading-relaxed text-sm">
            The world's first AI-driven productivity ecosystem. Engineered for elite professionals who demand absolute precision.
          </p>
          <button 
            onClick={signIn}
            className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all hover:shadow-xl group"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>
          
          <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium">Made with Code with Yash</p>
            <a 
              href="http://yash-choubey-student-developer-port.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-widest text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors block mt-2"
            >
              Developer Portfolio
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (profile && (!profile.name || !profile.workType)) {
    return <ProfileSetup user={user} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onAction={setActiveView}
        onAddTask={() => {
          setActiveView('tasks');
          setIsCommandPaletteOpen(false);
        }}
      />
      
      <AnimatePresence>
        {isHistoryAgentOpen && <HistoryAgent tasks={tasks} onClose={() => setIsHistoryAgentOpen(false)} />}
      </AnimatePresence>

      <button 
        onClick={() => setIsHistoryAgentOpen(true)}
        className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Onboarding Tutorial Overflow */}
      <AnimatePresence>
        {showTutorial && (
          <Tutorial onComplete={handleSkipTutorial} onSkip={handleSkipTutorial} />
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          user={user}
          onSignOut={signOut}
          onStartDemo={injectDemoData}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative pt-8 pb-16 md:pt-0">
          {/* Top Global Bar */}
          <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isOffline ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                  {isOffline ? 'Offline' : 'Cloud Synced'}
               </div>
               {lastSynced && !isOffline && (
                 <span className="text-[10px] text-neutral-400 font-medium">Last sync: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-12">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderView()}
            </motion.div>
          </div>

          {/* Footer */}
          <footer className="mt-auto py-12 px-6 border-t border-neutral-100 dark:border-neutral-900">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-400">Made with Code with Yash</span>
                <span className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                <a 
                  href="http://yash-choubey-student-developer-port.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  Portfolio <ExternalLink size={12} />
                </a>
              </div>
              <p>&copy; {new Date().getFullYear()} WorkFlow AI. Precision productivity.</p>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Nav Overlay (simplified for now) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-3 flex gap-6 shadow-2xl z-50">
        <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'text-blue-600' : ''}><BarChart2 size={20} /></button>
        <button onClick={() => setActiveView('tasks')} className={activeView === 'tasks' ? 'text-blue-600' : ''}><CheckSquare size={20} /></button>
        <button onClick={() => setActiveView('planner')} className={activeView === 'planner' ? 'text-blue-600' : ''}><Calendar size={20} /></button>
        <button onClick={() => setActiveView('summarizer')} className={activeView === 'summarizer' ? 'text-blue-600' : ''}><FileText size={20} /></button>
        <button onClick={() => setActiveView('emails')} className={activeView === 'emails' ? 'text-blue-600' : ''}><Mail size={20} /></button>
      </div>
    </div>
  );
}
