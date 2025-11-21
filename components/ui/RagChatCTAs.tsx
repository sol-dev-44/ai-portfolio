// components/RAGChatBanner.tsx - ADD THIS AS A BANNER ANYWHERE

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

export function RAGChatBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -z-10" />
      
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="flex items-center gap-6">
        {/* Icon */}
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Try My AI Assistant
            </h3>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
              NEW
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ask questions about my projects, skills, and experience. Powered by RAG with semantic search.
          </p>
        </div>

        {/* CTA */}
        <Link href="/rag-chat">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat Now</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}


// ============================================
// ALTERNATIVE: Floating Button (Bottom Right)
// ============================================

export function RAGChatFloatingButton() {
  return (
    <Link href="/rag-chat">
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-shadow"
        title="Ask AI about my work"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Pulse effect */}
        <motion.span
          className="absolute -inset-1 rounded-full bg-blue-400/50"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0.5, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.button>
    </Link>
  );
}


// ============================================
// HOW TO USE THESE IN YOUR PAGE:
// ============================================

/*
Option 1: Add banner at top of your dashboard page

import { RAGChatBanner } from '@/components/RAGChatBanner';

// In your DashboardPage component, add near the top:
return (
  <div className="relative min-h-screen pb-32">
    <RAGChatBanner />  // ADD THIS LINE
    
    // ... rest of your existing code
*/

/*
Option 2: Add floating button (doesn't take any space)

import { RAGChatFloatingButton } from '@/components/RAGChatBanner';

// At the very end of your page, before closing </div>:
return (
  <div className="relative min-h-screen pb-32">
    // ... all your existing code ...
    
    <RAGChatFloatingButton />  // ADD THIS LINE
  </div>
);
*/