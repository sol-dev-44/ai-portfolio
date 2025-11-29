'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { MessageSquare, Sparkles, ArrowRight, Github, Linkedin, Mail, ExternalLink, Code, Cpu, Zap, Globe, FileText } from 'lucide-react';
import { useRef } from 'react';

const techStack = [
  { name: 'TypeScript', icon: '⚡' },
  { name: 'React', icon: '⚛️' },
  { name: 'Next.js', icon: '▲' },
  { name: 'Node.js', icon: '🟢' },
  { name: 'Python', icon: '🐍' },
  { name: 'FastAPI', icon: '⚙️' },
  { name: 'PyTorch', icon: '🔥' },
  { name: 'TensorFlow', icon: '🧠' },
  { name: 'Tailwind', icon: '🎨' },
  { name: 'Docker', icon: '🐳' },
  { name: 'PostgreSQL', icon: '🐘' },
  { name: 'GraphQL', icon: '🕸️' },
];

// Infinite Marquee Component
const TechTicker = () => {
  return (
    <div className="relative flex overflow-hidden py-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-y border-gray-200 dark:border-gray-800">
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-white via-transparent to-white dark:from-gray-950 dark:via-transparent dark:to-gray-950" />
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 20,
        }}
      >
        {[...techStack, ...techStack, ...techStack].map((tech, i) => (
          <div key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium text-lg">
            <span className="text-2xl">{tech.icon}</span>
            {tech.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <main ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-blue-500/30">

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse delay-1000" />
          <div className="absolute -bottom-[30%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse delay-2000" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-blue-200 dark:border-blue-900/50 shadow-lg shadow-blue-500/10"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Available for new projects
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Building
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-x">
              Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Staff Engineer merging full-stack architecture with advanced machine learning.
            Crafting the next generation of AI-powered web applications.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center pt-8"
          >
            <Link href="/agent">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-amber-500/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Try Agent Demo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Explore Studio
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tech Ticker */}
      <TechTicker />

      {/* Featured Projects */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Work
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl">
                Interactive playgrounds demonstrating core AI concepts through modern web interfaces.
              </p>
            </div>
            <Link href="https://github.com/sol-dev-44" target="_blank" className="group flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              View GitHub <ExternalLink className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Project 1: Tool-Calling Agent - FEATURED */}
            <Link href="/agent" className="md:col-span-2">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative h-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-3xl border border-amber-200 dark:border-amber-800 overflow-hidden hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg shadow-amber-500/30">
                          <Cpu className="w-8 h-8" />
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                            FEATURED
                          </span>
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                            Claude
                          </span>
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                            Open Source
                          </span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Tool-Calling Agent
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
                        Watch AI reasoning in real-time. Compare Claude vs Open Source models as they decide which tools to use,
                        execute API calls, and synthesize responses. Full pipeline visualization shows exactly what happens under the hood.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">ReAct Pattern</span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">Function Calling</span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">HuggingFace</span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">Compare Mode</span>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <Globe className="w-4 h-4 text-cyan-500" />
                        <span>Weather API</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <Globe className="w-4 h-4 text-green-500" />
                        <span>Web Search</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span>Calculator</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Project 2: Contract Auditor - NEW */}
            <Link href="/contract-auditor">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                      NEW
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Contract Auditor
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                    AI-powered legal risk analysis. Uses RAG to learn from feedback and identify risky clauses with severity scoring.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">RAG</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">Legal Tech</span>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Project 3: Dashboard Studio */}
            <Link href="/dashboard">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Dashboard Studio
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                    Generative UI platform powered by Claude Sonnet. Describe your interface in natural language and watch it build in real-time.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">Generative UI</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">Claude 3.5</span>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Project 3: LLM Arena */}
            <Link href="/llm-playground">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                      <Zap className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    LLM Arena
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                    Compare 5 different language models side-by-side. Visualize performance metrics with D3.js and analyze token generation speeds.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">Performance</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">D3.js</span>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Project 4: Tokenizer */}
            <Link href="/tokenizer">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                      <Code className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Tokenizer Visualizer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                    Deep dive into how LLMs process text. Compare GPT-4, GPT-3.5, and GPT-2 tokenization strategies with real-time visualization.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">NLP</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">TikToken</span>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Project 5: RAG Chat */}
            <Link href="/rag-chat">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-2xl text-teal-600 dark:text-teal-400">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    RAG Chat
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                    Chat with an AI that knows about my work. Retrieval-Augmented Generation with Supabase pgvector and semantic search.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">RAG</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">pgvector</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact / Footer Section */}
      <section className="py-24 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Ready to collaborate?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              I'm always open to discussing new projects, opportunities, or just geeking out over AI.
            </p>
            <div className="flex justify-center gap-6">
              <Link href="https://github.com/sol-dev-44" target="_blank" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white">
                <Github className="w-6 h-6" />
              </Link>
              <Link href="https://www.linkedin.com/in/alan-james-campbell/" target="_blank" className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-blue-600 dark:text-blue-400">
                <Linkedin className="w-6 h-6" />
              </Link>
              <Link href="mailto:alancampbell4444@gmail.com" className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-purple-600 dark:text-purple-400">
                <Mail className="w-6 h-6" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating RAG Chat Button */}
      <Link href="/rag-chat">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-shadow group"
          title="Ask AI about my work"
        >
          <MessageSquare className="w-6 h-6 relative z-10" />
          <motion.span
            className="absolute -inset-1 rounded-full bg-gray-400/30 dark:bg-white/30"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0.5, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 dark:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      </Link>
    </main >
  );
}