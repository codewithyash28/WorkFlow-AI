/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Clock,
  Flag,
  CheckSquare,
  Mic,
  MicOff,
  Bell,
  Sparkles,
  SortAsc,
  History,
  Timer,
  Users,
  GripVertical,
  Info
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { ConfettiParticle } from './Confetti';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, Task, Priority, SubTask, Team } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  userId: string;
  profile: UserProfile | null;
}

export default function TaskManager({ tasks, userId, profile }: TaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [newEstimate, setNewEstimate] = useState<string>('30');
  const [newStartTime, setNewStartTime] = useState<string>('');
  const [newEndTime, setNewEndTime] = useState<string>('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [isTeamTask, setIsTeamTask] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Sync local tasks with incoming tasks prop when it changes
  useEffect(() => {
    if (!localTasks.length || tasks.length !== localTasks.length) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const joinTeam = async () => {
    if (!teamCodeInput.trim()) return;
    try {
      const teamRef = doc(db, 'teams', teamCodeInput);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const teamData = teamSnap.data() as Team;
        if (!teamData.members.includes(userId)) {
          await updateDoc(teamRef, {
            members: [...teamData.members, userId]
          });
        }
        await updateDoc(doc(db, 'users', userId), { teamId: teamCodeInput });
        setIsJoiningTeam(false);
      } else {
        alert("Team not found.");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `teams/${teamCodeInput}`);
    }
  };

  const createTeam = async () => {
    const newTeamId = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await setDoc(doc(db, 'teams', newTeamId), {
        id: newTeamId,
        name: `${profile?.name || userId.substring(0, 5)}'s Team`,
        members: [userId]
      });
      await updateDoc(doc(db, 'users', userId), { teamId: newTeamId });
      setIsJoiningTeam(false);
      alert(`Team created! Your team code is: ${newTeamId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'teams');
    }
  };

  const leaveTeam = async () => {
    if (!profile?.teamId) return;
    try {
      const teamRef = doc(db, 'teams', profile.teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const teamData = teamSnap.data() as Team;
        const updatedMembers = teamData.members.filter(m => m !== userId);
        if (updatedMembers.length === 0) {
           await deleteDoc(teamRef);
        } else {
           await updateDoc(teamRef, { members: updatedMembers });
        }
      }
      await updateDoc(doc(db, 'users', userId), { teamId: null });
      setIsTeamTask(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${profile?.teamId}`);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewTitle(transcript);
      if (!isAdding) setIsAdding(true);
    };

    recognition.start();
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const finalIsTeam = isTeamTask && profile?.teamId;
    const taskData = {
      userId: finalIsTeam ? null : userId,
      teamId: finalIsTeam ? profile.teamId : null,
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      estimatedTime: parseInt(newEstimate) || 30,
      startTime: newStartTime || null,
      endTime: newEndTime || null,
      completed: false,
      subtasks: [],
      createdAt: Date.now(),
    };
    
    try {
      const tasksRef = finalIsTeam 
        ? collection(db, 'teams', profile.teamId!, 'tasks')
        : collection(db, 'users', userId, 'tasks');
      await addDoc(tasksRef, taskData);
      setNewTitle('');
      setNewDesc('');
      setNewStartTime('');
      setNewEndTime('');
      setIsAdding(false);
      setLocalTasks([]); // Reset local sync
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, finalIsTeam ? `teams/${profile.teamId}/tasks` : `users/${userId}/tasks`);
    }
  };

  const triggerConfetti = (e: React.MouseEvent) => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: e.clientX,
      y: e.clientY,
      color: ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-yellow-400'][Math.floor(Math.random() * 4)]
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  const toggleTask = async (task: Task, e: React.MouseEvent) => {
    if (!task.completed) {
      triggerConfetti(e);
    }
    try {
      const taskRef = task.teamId 
        ? doc(db, 'teams', task.teamId, 'tasks', task.id)
        : doc(db, 'users', userId, 'tasks', task.id);
      await updateDoc(taskRef, { completed: !task.completed });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      const taskRef = task.teamId 
        ? doc(db, 'teams', task.teamId, 'tasks', task.id)
        : doc(db, 'users', userId, 'tasks', task.id);
      await deleteDoc(taskRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${task.id}`);
    }
  };

  const addSubTask = async (task: Task, subTitle: string) => {
    if (!subTitle.trim()) return;
    try {
      const taskRef = task.teamId 
        ? doc(db, 'teams', task.teamId, 'tasks', task.id)
        : doc(db, 'users', userId, 'tasks', task.id);
      const newSubTask: SubTask = { id: crypto.randomUUID(), title: subTitle, completed: false };
      await updateDoc(taskRef, {
        subtasks: [...task.subtasks, newSubTask]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const toggleSubTask = async (task: Task, subId: string) => {
    try {
      const taskRef = task.teamId 
        ? doc(db, 'teams', task.teamId, 'tasks', task.id)
        : doc(db, 'users', userId, 'tasks', task.id);
      const updatedSubTasks = task.subtasks.map(s => 
        s.id === subId ? { ...s, completed: !s.completed } : s
      );
      await updateDoc(taskRef, { subtasks: updatedSubTasks });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const suggestOrder = () => {
    const sorted = [...tasks].sort((a, b) => {
      const priorityScore = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      if (priorityScore[b.priority] !== priorityScore[a.priority]) {
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      return (a.estimatedTime || 0) - (b.estimatedTime || 0);
    });
    setLocalTasks(sorted);
  };

  const handleReorder = async (newOrder: Task[]) => {
    setLocalTasks(newOrder);
    
    // Perist the new order to Firestore using batch update
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      newOrder.forEach((task, index) => {
        const taskRef = task.teamId 
          ? doc(db, 'teams', task.teamId, 'tasks', task.id)
          : doc(db, 'users', userId, 'tasks', task.id);
        // We use a high-precision timestamp to define order
        batch.update(taskRef, { createdAt: Date.now() - (index * 1000) });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/batch-reorder`);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Particle Render */}
      {particles.map(p => (
        <ConfettiParticle key={p.id} x={p.x} y={p.y} color={p.color} />
      ))}
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter">Task Management</h1>
          <p className="text-neutral-500 mt-2 font-medium">Coordinate your team and individual growth cycles.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsJoiningTeam(!isJoiningTeam)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${profile?.teamId ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
          >
            <Users size={14} /> {profile?.teamId ? `Team: ${profile.teamId}` : 'Join Team'}
          </button>
          <button 
            onClick={suggestOrder}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            <Sparkles size={14} /> AI Optimize
          </button>
          <button 
            onClick={startListening}
            className={`p-3 rounded-full transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <Mic size={24} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-transform shadow-lg"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>
      {/* Team Join UI */}
      <AnimatePresence>
        {isJoiningTeam && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex flex-col md:flex-row items-center gap-4"
          >
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 dark:text-blue-100">Collaborate with your team</h3>
              <p className="text-sm text-blue-600/70">Enter a team code to share tasks in real-time.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Team Code" 
                value={teamCodeInput}
                onChange={(e) => setTeamCodeInput(e.target.value)}
                className="bg-white dark:bg-neutral-800 px-4 py-2 rounded-full text-sm font-semibold outline-none focus:ring-2 ring-blue-200 flex-1 md:w-32"
              />
              <button 
                onClick={joinTeam}
                className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg"
              >
                Join
              </button>
              <button 
                onClick={createTeam}
                className="px-6 py-2 bg-white dark:bg-neutral-800 text-blue-600 rounded-full text-sm font-bold border border-blue-100 dark:border-blue-900/30"
              >
                Create
              </button>
              {profile?.teamId && (
                <button 
                  onClick={leaveTeam}
                  className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full text-sm font-bold border border-red-100 dark:border-red-900/30"
                >
                  Leave
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal-like Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="What needs to be done?" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-transparent text-xl font-medium outline-none border-b border-neutral-200 dark:border-neutral-800 pb-2 focus:border-neutral-900 dark:focus:border-white transition-colors"
                />
                <textarea 
                  placeholder="Add details (optional)..." 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none resize-none h-24 text-neutral-500"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 block">Priority</label>
                  <div className="flex gap-2">
                    {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          newPriority === p 
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' 
                            : 'bg-white dark:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 block">Est. Time (mins)</label>
                  <input 
                    type="number"
                    value={newEstimate}
                    onChange={(e) => setNewEstimate(e.target.value)}
                    className="w-24 bg-white dark:bg-neutral-800 px-4 py-2 rounded-full text-sm font-semibold outline-none focus:ring-2 ring-neutral-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Start Time</label>
                    <input 
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-800 px-4 py-2 rounded-full text-xs font-semibold outline-none focus:ring-2 ring-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">End Time</label>
                    <input 
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-800 px-4 py-2 rounded-full text-xs font-semibold outline-none focus:ring-2 ring-neutral-200"
                    />
                  </div>
                </div>
                {profile?.teamId && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 block">Assignment</label>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setIsTeamTask(false)}
                         className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${!isTeamTask ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
                       >
                         Personal
                       </button>
                       <button 
                         onClick={() => setIsTeamTask(true)}
                         className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isTeamTask ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
                       >
                         Team Task
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={addTask}
                className="px-8 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-bold shadow-lg"
              >
                Create Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <Reorder.Group axis="y" values={localTasks} onReorder={handleReorder} className="space-y-4">
        {localTasks.map((task) => (
          <Reorder.Item 
            key={task.id}
            value={task}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group relative bg-white dark:bg-[#0d0d0d] rounded-2xl border ${
              expandedTask === task.id ? 'border-neutral-900 dark:border-white ring-4 ring-neutral-900/5 shadow-2xl' : 'border-neutral-100 dark:border-neutral-800 shadow-sm'
            } transition-all overflow-visible z-[1]`}
            onMouseEnter={() => setHoveredTask(task.id)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            {/* Tooltip Overlay */}
            <AnimatePresence>
              {hoveredTask === task.id && task.description && expandedTask !== task.id && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 p-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl z-[100] pointer-events-none hidden lg:block"
                >
                  <div className="flex items-center gap-2 mb-2 text-neutral-400 dark:text-neutral-500">
                    <Info size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Detail Brief</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{task.description}</p>
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center px-6 py-5 gap-4">
              <div className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-600 transition-colors">
                <GripVertical size={18} />
              </div>
              <button 
                onClick={(e) => toggleTask(task, e)}
                className={`transition-all duration-500 scale-100 active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-neutral-300 hover:text-neutral-900 dark:hover:text-white'}`}
              >
                {task.completed ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90, filter: 'blur(10px)' }}
                    animate={{ scale: 1, rotate: 0, filter: 'blur(0px)' }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  >
                    <CheckCircle2 size={24} />
                  </motion.div>
                ) : (
                  <Circle size={24} />
                )}
              </button>
              
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                <div className="flex items-center gap-3">
                  <h3 className={`font-bold transition-all ${task.completed ? 'text-neutral-400 line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                    task.priority === Priority.HIGH ? 'bg-orange-100 text-orange-600' :
                    task.priority === Priority.MEDIUM ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {task.priority}
                  </div>
                  {task.teamId && (
                    <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                      <Users size={10} /> Team
                    </div>
                  )}
                  {(task.startTime || task.estimatedTime) && (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      {task.startTime && (
                         <div className="flex items-center gap-1 text-blue-500">
                           <Clock size={10} /> {task.startTime} - {task.endTime}
                         </div>
                      )}
                      {task.estimatedTime && (
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Timer size={10} /> {task.estimatedTime}m
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {task.description && !expandedTask && (
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => deleteTask(task)}
                  className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <button 
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                className="text-neutral-300 p-2"
              >
                {expandedTask === task.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            <AnimatePresence>
              {expandedTask === task.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-16 pb-8 border-t border-neutral-100 dark:border-neutral-900 pt-6"
                >
                  <div className="space-y-6">
                    {task.description && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Description</label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{task.description}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</label>
                      <div className="space-y-2">
                        {task.subtasks.map(sub => (
                          <div 
                            key={sub.id}
                            className="flex items-center gap-3 text-sm group/sub"
                          >
                            <button onClick={() => toggleSubTask(task, sub.id)}>
                              {sub.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-neutral-300" />}
                            </button>
                            <span className={sub.completed ? 'text-neutral-400 line-through' : ''}>{sub.title}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 max-w-sm">
                        <Plus size={16} className="text-neutral-400" />
                        <input 
                          type="text" 
                          placeholder="Add subtask..." 
                          className="bg-transparent text-sm outline-none w-full border-b border-transparent focus:border-neutral-300 transition-all"
                          onKeyDown={(e: any) => {
                            if (e.key === 'Enter' && e.target.value) {
                              addSubTask(task, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      {tasks.length === 0 && !isAdding && (
        <div className="text-center py-32 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl">
          <CheckSquare size={48} className="mx-auto text-neutral-200 dark:text-neutral-800 mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Clear for takeoff</h3>
          <p className="text-neutral-400 mt-1">Add your first task to begin your productivity journey.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-6 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-bold shadow-lg"
          >
            Get Started
          </button>
        </div>
      )}
      
      <div className="pt-8 text-center">
        <p className="text-xs text-neutral-400">Next step: Sort tasks by deadline for maximum clarity.</p>
      </div>
    </div>
  );
}
