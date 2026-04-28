import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Zap, ChevronRight, Briefcase, User as UserIcon } from 'lucide-react';

interface ProfileSetupProps {
  user: User;
}

export default function ProfileSetup({ user }: ProfileSetupProps) {
  const [name, setName] = useState(user.displayName || '');
  const [workType, setWorkType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workType) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        workType
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const workTypes = [
    'Software Engineer',
    'Designer',
    'Product Manager',
    'Marketing',
    'Founder',
    'Freelancer',
    'Student',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-neutral-900 p-12 rounded-[3.5rem] shadow-2xl border border-neutral-100 dark:border-neutral-800"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black shadow-lg">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h1 className="text-2xl font-display font-black tracking-tighter">WorkFlow AI</h1>
               <span className="text-[8px] font-black uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400">Setup</span>
            </div>
            <p className="text-neutral-500 text-sm">Personalize your Cognitive OS for peak performance.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <UserIcon size={12} /> Full Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?"
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 rounded-2xl text-lg font-medium outline-none focus:ring-2 ring-neutral-200 dark:ring-neutral-700 transition-all"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <Briefcase size={12} /> Work Specialization
            </label>
            <div className="grid grid-cols-2 gap-3">
              {workTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWorkType(type)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    workType === type 
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-lg' 
                      : 'bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !name.trim() || !workType}
            className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 mt-8"
          >
            {isSubmitting ? 'Finalizing...' : 'Initialize Experience'}
            <ChevronRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
