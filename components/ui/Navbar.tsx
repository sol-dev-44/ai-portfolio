'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { name: 'Home', path: '/', enabled: true },
  { name: 'Tokenizer', path: '/tokenizer', enabled: true },
  { name: 'Generation', path: '/generation', enabled: true },
  { name: 'Dashboard', path: '/dashboard', enabled: true },
  { name: 'Arena', path: '/llm-playground', enabled: true },
];

export function Navbar() {
  const pathname = usePathname();

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

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-gray-200/50 dark:bg-gray-800/50 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/rag-chat">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium text-sm shadow-lg hover:shadow-blue-500/25 transition-shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}