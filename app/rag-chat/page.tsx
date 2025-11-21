// components/RAGChat.tsx - Educational RAG Chat with Tooltips
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Database,
  Zap,
  Brain,
  Search,
  Info,
  TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    similarity: number;
    category: string;
  }>;
  metadata?: {
    responseTime?: number;
    tokensUsed?: number;
    cost?: number;
  };
  steps?: {
    embedding: boolean;
    search: boolean;
    generation: boolean;
  };
}

interface Tooltip {
  id: string;
  show: boolean;
}

export default function RAGChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'idle' | 'embedding' | 'search' | 'generation'>('idle');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    { icon: '💼', text: 'What projects has Alan built?', gradient: 'from-blue-500 to-cyan-500' },
    { icon: '⚡', text: 'What technologies does Alan use?', gradient: 'from-purple-500 to-pink-500' },
    { icon: '🎓', text: 'Tell me about Alan\'s experience', gradient: 'from-orange-500 to-red-500' },
    { icon: '🤖', text: 'How does this RAG system work?', gradient: 'from-green-500 to-teal-500' },
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // Visual feedback for RAG steps
    setCurrentStep('embedding');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg: Message = { 
        role: 'assistant', 
        content: '',
        steps: { embedding: true, search: false, generation: false }
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'sources') {
                  setCurrentStep('search');
                  assistantMsg.sources = data.sources;
                  assistantMsg.steps = { embedding: true, search: true, generation: false };
                } else if (data.type === 'text') {
                  setCurrentStep('generation');
                  assistantMsg.content += data.text;
                  assistantMsg.steps = { embedding: true, search: true, generation: true };
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                    return newMsgs;
                  });
                } else if (data.type === 'done') {
                  const endTime = Date.now();
                  assistantMsg.metadata = {
                    responseTime: endTime - startTime,
                    tokensUsed: data.metadata?.tokensUsed,
                    cost: data.metadata?.cost
                  };
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                    return newMsgs;
                  });
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg: Message = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setCurrentStep('idle');
    }
  };

  const Tooltip = ({ id, children, content }: { id: string; children: React.ReactNode; content: string }) => (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setActiveTooltip(id)}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      {children}
      <AnimatePresence>
        {activeTooltip === id && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header with Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              AI Portfolio Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Powered by RAG (Retrieval-Augmented Generation)
            </p>
          </div>
          
          {/* How It Works Toggle */}
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span className="font-medium">How it Works</span>
            {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* How It Works Panel */}
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  RAG Pipeline Architecture
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  {/* Step 1: Embedding */}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">1</div>
                      <Database className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold">Embedding</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your question is converted to a 1536-dimensional vector using OpenAI's <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">text-embedding-3-small</code>
                    </p>
                  </div>

                  {/* Step 2: Vector Search */}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold">2</div>
                      <Search className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold">Vector Search</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Supabase's <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">pgvector</code> finds the top 5 most similar documents using cosine similarity
                    </p>
                  </div>

                  {/* Step 3: Generation */}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-pink-200 dark:border-pink-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center font-bold">3</div>
                      <Zap className="w-5 h-5 text-pink-600" />
                      <h4 className="font-semibold">Generation</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Claude Sonnet 4 generates a response using the retrieved context, with source citations
                    </p>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    OpenAI Embeddings
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                    Supabase pgvector
                  </span>
                  <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium">
                    Claude Sonnet 4
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                    Next.js 14
                  </span>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                    TypeScript
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[600px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Ask me anything!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                I can answer questions about Alan's projects, skills, experience, and this RAG implementation.
              </p>
              
              {/* Suggested Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedQuestions.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSuggestedQuestion(q.text)}
                    className="group p-4 text-left bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{q.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        {q.text}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {/* Message Bubble */}
                    <div className={`relative group ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm'
                    } px-5 py-4 shadow-lg`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-sm">AI Assistant</span>
                          
                          {/* Step Indicators */}
                          {msg.steps && (
                            <div className="flex items-center gap-1 ml-auto">
                              <Tooltip id={`step-emb-${i}`} content="Embedding generated">
                                <div className={`w-2 h-2 rounded-full ${msg.steps.embedding ? 'bg-green-500' : 'bg-gray-400'}`} />
                              </Tooltip>
                              <Tooltip id={`step-search-${i}`} content="Vector search completed">
                                <div className={`w-2 h-2 rounded-full ${msg.steps.search ? 'bg-green-500' : 'bg-gray-400'}`} />
                              </Tooltip>
                              <Tooltip id={`step-gen-${i}`} content="Response generated">
                                <div className={`w-2 h-2 rounded-full ${msg.steps.generation ? 'bg-green-500' : 'bg-gray-400'}`} />
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`prose prose-sm max-w-none ${
                        msg.role === 'user' 
                          ? 'prose-invert' 
                          : 'dark:prose-invert'
                      }`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => copyToClipboard(msg.content, i)}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                          msg.role === 'user'
                            ? 'bg-white/20 hover:bg-white/30'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 ml-2">
                        <button
                          onClick={() => setExpandedSources(expandedSources === i ? null : i)}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{msg.sources.length} sources</span>
                          {expandedSources === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedSources === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-2 space-y-2 overflow-hidden"
                            >
                              {msg.sources.map((source, j) => (
                                <a
                                  key={j}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {source.title}
                                    </span>
                                    <Tooltip id={`similarity-${i}-${j}`} content="Cosine similarity score">
                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                        <TrendingUp className="w-3 h-3" />
                                        {(source.similarity * 100).toFixed(1)}%
                                      </div>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{source.category}</span>
                                  </div>
                                </a>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Metadata */}
                    {msg.metadata && (
                      <div className="mt-2 ml-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {msg.metadata.responseTime && (
                          <Tooltip id={`time-${i}`} content="Total response time">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {(msg.metadata.responseTime / 1000).toFixed(2)}s
                            </span>
                          </Tooltip>
                        )}
                        {msg.metadata.tokensUsed && (
                          <Tooltip id={`tokens-${i}`} content="Tokens used in generation">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {msg.metadata.tokensUsed} tokens
                            </span>
                          </Tooltip>
                        )}
                        {msg.metadata.cost && (
                          <Tooltip id={`cost-${i}`} content="Estimated API cost">
                            <span className="flex items-center gap-1">
                              💰 ${msg.metadata.cost.toFixed(4)}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading Indicator with Steps */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%]">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-sm">AI Assistant</span>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-auto" />
                      </div>
                      
                      {/* Processing Steps */}
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 text-sm ${currentStep === 'embedding' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentStep === 'embedding' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            {currentStep === 'embedding' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                          </div>
                          <span>Generating embedding...</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${currentStep === 'search' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-500'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentStep === 'search' ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            {currentStep === 'search' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                          </div>
                          <span>Searching documents...</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${currentStep === 'generation' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-500'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentStep === 'generation' ? 'bg-pink-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            {currentStep === 'generation' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          </div>
                          <span>Generating response...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Alan's work..."
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={loading}
              maxLength={500}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>Send</span>
            </motion.button>
          </form>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{input.length}/500 characters</span>
            {/* <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Hover over elements for more info
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
}