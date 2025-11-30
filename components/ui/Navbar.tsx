'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ChevronDown, Menu, X } from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';

const navGroups = [
  {
    name: 'Tools',
    items: [
      { name: 'Dashboard Studio', path: '/dashboard' },
      { name: 'Dog Matcher', path: '/dog-matcher' },
      { name: 'Contract Auditor', path: '/contract-auditor' },
      { name: 'Tokenizer', path: '/tokenizer' },
    ]
  },
  {
    name: 'Demos',
    items: [
      { name: 'Agent', path: '/agent' },
      { name: 'Robot', path: '/robot' },
      { name: 'LLM Arena', path: '/llm-playground' },
      { name: 'RAG Chat', path: '/rag-chat' },
      { name: 'Generation', path: '/generation' },
    ]
  }
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/60 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/favicon.svg"
                alt="AI Portfolio Logo"
                width={32}
                height={32}
                className="w-8 h-8 relative z-10"
              />
            </motion.div>
            <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight hidden sm:block">
              AI Portfolio
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-6">
            {navGroups.map((group) => (
              <div key={group.name} className="relative group/menu">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {group.name}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown */}
                <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:translate-y-0 group-hover/menu:pointer-events-auto transition-all duration-200">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 min-w-[200px]">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${pathname === item.path
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/rag-chat" className="hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium text-sm shadow-lg hover:shadow-blue-500/25 transition-shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </motion.button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        >
          <div className="px-4 py-6 space-y-6">
            {navGroups.map((group) => (
              <div key={group.name} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group.name}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === item.path
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/rag-chat" onClick={() => setIsMobileMenuOpen(false)} className="block">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg">
                <Sparkles className="w-4 h-4" />
                Ask AI Assistant
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}