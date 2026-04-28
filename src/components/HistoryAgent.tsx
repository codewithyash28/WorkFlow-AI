import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  MessageSquare, 
  Send, 
  X, 
  Sparkles,
  Search,
  FileText
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from '../types';

interface HistoryAgentProps {
  tasks: Task[];
  onClose: () => void;
}

export default function HistoryAgent({ tasks, onClose }: HistoryAgentProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askGemini = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse('');

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const context = tasks.map(t => `${t.title} (Priority: ${t.priority}, Completed: ${t.completed})`).join('\n');
      
      const prompt = `You are the WorkFlow AI History Agent.
      User Data Context (Their Tasks):
      ${context}

      User Question: ${query}

      Provide a concise, helpful answer based ONLY on the provided context. If the answer isn't there, say you don't have that specific record but offer a productivity tip instead.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setResponse(text);
    } catch (err) {
      setResponse("I'm having trouble accessing your memory banks right now. Please try again soon.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-32 right-8 w-96 bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-neutral-800 z-[50] overflow-hidden flex flex-col max-h-[60vh]"
    >
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-900 dark:bg-white text-white dark:text-black">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-100 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <h3 className="font-bold">History Agent</h3>
        </div>
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {response ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300"
          >
            {response}
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <History size={32} className="mx-auto text-neutral-200 mb-2" />
            <p className="text-xs text-neutral-400 font-medium">Ask me about your past tasks or project decisions.</p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400">
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-100" />
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-200" />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="relative">
          <input 
            type="text"
            placeholder="Search your history..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askGemini()}
            className="w-full bg-neutral-50 dark:bg-neutral-800 px-6 py-3 rounded-full text-sm outline-none focus:ring-2 ring-neutral-200 transition-all pr-12"
          />
          <button 
            onClick={askGemini}
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
