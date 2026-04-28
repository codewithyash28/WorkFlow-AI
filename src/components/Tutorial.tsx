/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, ArrowRight } from 'lucide-react';
import { TUTORIAL_STEPS } from '../constants';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function Tutorial({ onComplete, onSkip }: TutorialProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-xl p-6"
    >
      <button 
        onClick={onSkip}
        className="absolute top-8 right-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
      >
        Skip Tutorial <X size={16} />
      </button>

      <div className="max-w-lg w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-400 mb-4 block">
              Step {step + 1} of {TUTORIAL_STEPS.length}
            </span>
            <h2 className="text-4xl font-display font-medium mb-6 leading-tight">
              {TUTORIAL_STEPS[step].title}
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed mb-12">
              {TUTORIAL_STEPS[step].content}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={nextStep}
            className="group relative px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-semibold flex items-center gap-2 overflow-hidden"
          >
            <span className="relative z-10">
              {step === TUTORIAL_STEPS.length - 1 ? "Get Started" : "Continue"}
            </span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform relative z-10" />
            <motion.div 
              className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
            />
          </button>

          <div className="flex gap-2">
            {TUTORIAL_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === step ? 'w-8 bg-neutral-900 dark:bg-white' : 'w-2 bg-neutral-200 dark:bg-neutral-800'
                }`} 
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
