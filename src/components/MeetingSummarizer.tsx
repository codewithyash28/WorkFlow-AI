/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw,
  Clock,
  Briefcase,
  AlertCircle,
  Share2
} from 'lucide-react';
import { summarizeMeeting } from '../services/geminiService';

interface MeetingSummarizerProps {
  onComplete?: () => void;
}

export default function MeetingSummarizer({ onComplete }: MeetingSummarizerProps) {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    const result = await summarizeMeeting(inputText);
    setSummary(result);
    setIsLoading(false);
    onComplete?.();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meeting Summary',
          text: summary,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight">Meeting Summarizer</h1>
        <p className="text-neutral-500 mt-2">Convert messy notes into professional action items.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Input Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Meeting Notes / Transcript</label>
            <span className="text-[10px] text-neutral-400">{inputText.length} characters</span>
          </div>
          <div className="relative group">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your rough meeting notes, transcript, or bullet points here..."
              className="w-full h-[400px] p-6 bg-neutral-50 dark:bg-[#0d0d0d] rounded-3xl border border-neutral-100 dark:border-neutral-800 outline-none focus:border-neutral-900 dark:focus:border-white transition-all text-sm leading-relaxed resize-none font-mono"
            />
            {!inputText && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <FileText size={48} />
              </div>
            )}
          </div>
          <button 
            onClick={handleSummarize}
            disabled={isLoading || !inputText.trim()}
            className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isLoading || !inputText.trim() 
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed' 
                : 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               >
                 <Sparkles size={18} />
               </motion.div>
               AI is Processing...
              </>
            ) : (
              <>
                Summarize Notes <Sparkles size={18} />
              </>
            )}
          </button>
        </section>

        {/* Output Section */}
        <section className="space-y-6 relative">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Professional Summary</label>
            {summary && (
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 text-neutral-400 hover:text-blue-500 transition-colors"
                  title="Share"
                >
                  <Share2 size={18} />
                </button>
                <button 
                  onClick={() => setSummary('')}
                  className="p-2 text-neutral-400 hover:text-orange-500 transition-colors"
                  title="Clear"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="h-[464px] overflow-y-auto bg-white dark:bg-[#0d0d0d] rounded-3xl border border-neutral-100 dark:border-neutral-800 p-8 relative">
            <AnimatePresence mode="wait">
              {summary ? (
                <motion.div 
                   key="summary"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="whitespace-pre-wrap text-sm leading-relaxed space-y-6 text-neutral-700 dark:text-neutral-300"
                >
                  {summary.split('\n\n').map((block, i) => {
                    if (block.startsWith('#') || block.toUpperCase().includes('ACTION ITEMS') || block.toUpperCase().includes('DECISIONS')) {
                        return <h3 key={i} className="text-lg font-bold text-neutral-900 dark:text-white mt-4 first:mt-0">{block.replace(/^#+\s*/, '')}</h3>;
                    }
                    return <p key={i}>{block}</p>;
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 text-neutral-300"
                >
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-full">
                    <Sparkles size={32} />
                  </div>
                  <p className="max-w-[200px] text-sm font-medium">Your AI-generated summary will appear here.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="w-16 h-16 border-t-2 border-neutral-900 dark:border-white rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="animate-pulse text-blue-500" size={24} />
                    </div>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest animate-pulse">Analyzing context...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl flex items-start gap-4">
            <AlertCircle size={18} className="text-neutral-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
              AI summaries are generated based on the provided text. Always review key items before sharing with your team. Next step: Add action items directly to your Task Manager.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
