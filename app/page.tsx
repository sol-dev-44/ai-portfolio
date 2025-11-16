'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const techStack = [
  { name: 'TypeScript', icon: '⚡' },
  { name: 'React', icon: '⚛️' },
  { name: 'Next.js', icon: '▲' },
  { name: 'Node.js', icon: '🟢' },
  { name: 'Python', icon: '🐍' },
  { name: 'FastAPI', icon: '⚙️' },
  { name: 'PyTorch', icon: '🔥' },
  { name: 'TensorFlow', icon: '🧠' },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
              AI/ML Engineer
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-white tracking-tight"
          >
            Alan Campbell
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Building intelligent systems with TypeScript, Python, and modern AI frameworks. 
            Staff Engineer exploring the intersection of full-stack development and machine learning.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="flex flex-wrap gap-4 justify-center pt-4"
          >
            <Link href="/tokenizer">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl cursor-pointer"
              >
                Try Tokenizer
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </motion.div>
            </Link>
            <Link href="/generation">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl cursor-pointer"
              >
                Explore Generation
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="px-4 py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Tech Stack
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tools and technologies I work with
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer"
              >
                <div className="text-4xl mb-3">{tech.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tech.name}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Preview */}
      <section className="px-4 py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Projects
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Interactive tools for exploring AI/ML concepts
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Tokenizer Project */}
            <Link href="/tokenizer" className="h-full">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="h-full group p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl cursor-pointer flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Tokenizer Comparison
                  </h3>
                  <span className="text-2xl">🔤</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-grow text-sm">
                  Compare how different LLM tokenizers (GPT-2, GPT-3.5, GPT-4, GPT-4o) split text into tokens. Visualize tokenization patterns and efficiency metrics.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    Python
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    FastAPI
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    TikToken
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Generation Strategies */}
            <Link href="/generation" className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="h-full group p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-cyan-500 transition-all hover:shadow-xl cursor-pointer flex flex-col relative overflow-hidden"
              >
                {/* Gradient background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-transparent to-cyan-50 dark:from-pink-900/10 dark:to-cyan-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      Generation Strategies
                    </h3>
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-grow text-sm">
                    Visualize how different text generation strategies (greedy, top-k, top-p, beam search) select tokens. Interactive D3.js charts showing real GPT-2 probabilities.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200 rounded-full text-xs font-medium">
                      PyTorch
                    </span>
                    <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200 rounded-full text-xs font-medium">
                      D3.js
                    </span>
                    <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 rounded-full text-xs font-medium">
                      GPT-2
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* LLM Playground */}
            <Link href="/llm-playground" className="h-full">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="h-full group p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-xl cursor-pointer flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    LLM Arena
                  </h3>
                  <span className="text-2xl">🚀</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-grow text-sm">
                  Battle-test 5 specialized LLMs (Gemma 2B, Qwen 7B, GPT-OSS 120B, Qwen Coder 480B, DeepSeek R1). Live D3 bar charts show tokens/second, compare models side-by-side, and explore speed vs capability trade-offs.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                    5 Models
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                    D3 Perf Viz
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                    Live Metrics
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                    Compare Mode
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
          
          {/* More Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
              <span className="text-2xl">✨</span>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                More features & projects coming soon
              </p>
              <span className="text-2xl">🚧</span>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}