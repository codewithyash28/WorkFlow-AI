/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw,
  Send,
  User,
  Coffee,
  Briefcase,
  Heart,
  Share2
} from 'lucide-react';
import { draftEmail } from '../services/geminiService';

interface EmailWriterProps {
  onComplete?: () => void;
}

export default function EmailWriter({ onComplete }: EmailWriterProps) {
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState<'Formal' | 'Semi-formal' | 'Friendly'>('Semi-formal');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDraft = async () => {
    if (!brief.trim()) return;
    setIsLoading(true);
    const result = await draftEmail(brief, tone);
    setDraft(result);
    setIsLoading(false);
    onComplete?.();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Email Draft',
          text: draft,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const tones = [
    { label: 'Formal', icon: Briefcase, color: 'text-blue-500' },
    { label: 'Semi-formal', icon: User, color: 'text-amber-500' },
    { label: 'Friendly', icon: Heart, color: 'text-pink-500' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight">Email Intelligence</h1>
        <p className="text-neutral-500 mt-2">Write impactful emails with the perfect tone, instantly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Input Section */}
        <section className="space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Describe what you want to say</label>
            <textarea 
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g., Ask Sarah for the Q3 report and apologize for the late reminder."
              className="w-full h-48 p-6 bg-neutral-50 dark:bg-[#0d0d0d] rounded-3xl border border-neutral-100 dark:border-neutral-800 outline-none focus:border-neutral-900 dark:focus:border-white transition-all text-lg leading-relaxed resize-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Select Tone</label>
            <div className="grid grid-cols-3 gap-3">
              {tones.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setTone(t.label as any)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    tone === t.label 
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-lg' 
                      : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:border-neutral-200'
                  }`}
                >
                  <t.icon size={20} className={tone === t.label ? 'text-current' : t.color} />
                  <span className="text-xs font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleDraft}
            disabled={isLoading || !brief.trim()}
            className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isLoading || !brief.trim() 
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed' 
                : 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isLoading ? 'Drafting...' : 'Generate Draft'} <Sparkles size={18} />
          </button>
        </section>

        {/* Output Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Generated Email</label>
            {draft && (
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  title="Copy"
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
                  onClick={() => setDraft('')}
                  className="p-2 text-neutral-400 hover:text-orange-500 transition-colors"
                  title="Reset"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-[400px] bg-neutral-900 text-neutral-100 rounded-3xl p-8 relative overflow-hidden">
            {/* Fake Email Envelope Design */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
            
            <AnimatePresence mode="wait">
              {draft ? (
                <motion.div 
                   key="draft"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="whitespace-pre-wrap text-sm leading-relaxed"
                >
                  {draft}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-neutral-600">
                  <Mail size={48} className="opacity-20" />
                  <p className="max-w-[200px] text-sm font-medium">Ready to write. Just give me a brief and pick your tone.</p>
                </div>
              )}
            </AnimatePresence>

            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-neutral-700 border-t-neutral-100 rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Polishing Draft...</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-400">Next step: Copy this draft and send it via your preferred email client.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
