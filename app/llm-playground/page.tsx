'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as d3 from 'd3';
import { useLLMStream } from '@/hooks/useLLMStream';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
  tokensPerSecond?: number;
  totalTime?: number;
}

interface PerformanceMetric {
  model: string;
  tokensPerSecond: number;
  totalTime: number;
  tokenCount: number;
}

// Inline Tooltip Component
function Tooltip({ content, children, position = 'center' }: { content: string; children: React.ReactNode; position?: 'center' | 'right' | 'left' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses =
    position === 'right' ? 'top-full right-0 mt-2' :
      position === 'left' ? 'top-full left-0 mt-2' :
        'top-full left-1/2 transform -translate-x-1/2 mt-2';

  const arrowClasses =
    position === 'right' ? 'bottom-full right-4 mb-1' :
      position === 'left' ? 'bottom-full left-4 mb-1' :
        'bottom-full left-1/2 transform -translate-x-1/2 mb-1';

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none ${positionClasses}`}
            style={{ minWidth: 'max-content', maxWidth: '320px', whiteSpace: 'normal' }}
          >
            {content}
            <div className={`absolute ${arrowClasses}`}>
              <div className="border-4 border-transparent border-b-gray-900 dark:border-b-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MODELS = [
  {
    id: 'gemma-2b',
    name: 'Gemma 2B',
    fullName: 'google/gemma-2-2b-it',
    desc: 'Tiny & Fast',
    fullDesc: 'Ultra-small instruction-tuned model. Lightning fast for simple tasks, casual chat, and quick queries.',
    icon: '⚡',
    color: '#4285F4'
  },
  {
    id: 'qwen-7b',
    name: 'Qwen 7B',
    fullName: 'Qwen/Qwen2.5-7B-Instruct-1M',
    desc: 'Long Context',
    fullDesc: 'Supports extremely long instructions (1M tokens). Perfect for analyzing long documents or conversations.',
    icon: '📜',
    color: '#7C3AED'
  },
  {
    id: 'gpt-oss',
    name: 'GPT-OSS 120B',
    fullName: 'openai/gpt-oss-120b',
    desc: 'Tool Calling',
    fullDesc: 'Excellent at function calling and structured outputs. Best for integrations and API interactions.',
    icon: '🔧',
    color: '#10B981'
  },
  {
    id: 'qwen-coder',
    name: 'Qwen Coder 480B',
    fullName: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
    desc: 'Code Expert',
    fullDesc: 'Specialized for code generation, debugging, and technical explanations. Top choice for programming tasks.',
    icon: '💻',
    color: '#F59E0B'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek R1',
    fullName: 'deepseek-ai/DeepSeek-R1',
    desc: 'Reasoning',
    fullDesc: 'Advanced reasoning model. Excels at complex logic, multi-step problem solving, and mathematical reasoning.',
    icon: '🧠',
    color: '#EF4444'
  },
];

// Example prompts
const EXAMPLE_PROMPTS = [
  { label: '💡 Creative', prompt: 'Write a haiku about artificial intelligence' },
  { label: '🧮 Math', prompt: 'Explain the quadratic formula and solve: x² + 5x + 6 = 0' },
  { label: '💻 Code', prompt: 'Write a Python function to check if a string is a palindrome' },
  { label: '🤔 Reasoning', prompt: 'If I have 3 apples and buy 2 more, then give away 1, how many do I have?' },
];

// D3 Performance Chart Component
function PerformanceChart({ metrics }: { metrics: PerformanceMetric[] }) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || metrics.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const width = chartRef.current.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    const x = d3.scaleBand()
      .domain(metrics.map(d => d.model))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(metrics, d => d.tokensPerSecond) || 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Bars
    svg.selectAll('.bar')
      .data(metrics)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.model) || 0)
      .attr('y', d => y(d.tokensPerSecond))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.tokensPerSecond))
      .attr('fill', (d, i) => MODELS.find(m => m.name === d.model)?.color || '#6366f1')
      .attr('rx', 4);

    // Values on bars
    svg.selectAll('.label')
      .data(metrics)
      .join('text')
      .attr('class', 'label')
      .attr('x', d => (x(d.model) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.tokensPerSecond) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => `${d.tokensPerSecond.toFixed(1)} t/s`);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .attr('color', 'currentColor');

    // Y axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'currentColor');

    // Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '12px')
      .text('Tokens/Second');

  }, [metrics]);

  return (
    <svg
      ref={chartRef}
      className="w-full text-gray-700 dark:text-gray-300"
      style={{ height: '200px' }}
    />
  );
}

export default function ImprovedPlayground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-oss');
  const [compareMode, setCompareMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { streamGenerate, streamingText, isLoading: loading, error } = useLLMStream();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);



  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    // loading state is handled by hook
    // streamingText state is handled by hook

    const newMetrics: PerformanceMetric[] = [];

    try {
      if (compareMode) {
        // Compare mode: run all models
        for (const model of MODELS) {
          const startTime = Date.now();
          const fullText = await streamGenerate({
            prompt: userMessage.content,
            model_id: model.id,
            strategy: 'top_k' // Default strategy
          });

          const totalTime = (Date.now() - startTime) / 1000; // seconds
          const tokenCount = Math.ceil(fullText.length / 4); // Rough estimate
          const tokensPerSecond = tokenCount / totalTime;

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: fullText,
              model: model.name,
              timestamp: new Date(),
              tokensPerSecond,
              totalTime,
            },
          ]);

          newMetrics.push({
            model: model.name,
            tokensPerSecond,
            totalTime,
            tokenCount,
          });
        }
        setPerformanceMetrics(newMetrics);
      } else {
        // Single model
        const startTime = Date.now();
        const fullText = await streamGenerate({
          prompt: userMessage.content,
          model_id: selectedModel,
          strategy: 'top_k'
        });

        const totalTime = (Date.now() - startTime) / 1000; // seconds
        const tokenCount = Math.ceil(fullText.length / 4); // Rough estimate
        const tokensPerSecond = tokenCount / totalTime;

        const modelInfo = MODELS.find((m) => m.id === selectedModel);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fullText,
            model: modelInfo?.name,
            timestamp: new Date(),
            tokensPerSecond,
            totalTime,
          },
        ]);

        newMetrics.push({
          model: modelInfo?.name || 'Unknown',
          tokensPerSecond,
          totalTime,
          tokenCount,
        });
        setPerformanceMetrics(newMetrics);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Failed to generate response',
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LLM Arena
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Compare language models •
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showInfo ? 'Hide' : 'Show'} Guide
            </button>
          </p>
        </motion.div>

        {/* Compact Educational Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800 text-sm"
            >
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <div>
                  <Tooltip content="Single mode lets you focus on one model's behavior. Compare mode runs ALL models simultaneously so you can see how they differ!" position="left">
                    <span className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                      <strong>Single Mode:</strong> Test one model.
                    </span>
                  </Tooltip>{' '}
                  <Tooltip content="Perfect for A/B testing! Send the same prompt to all models and compare speed, quality, style, and accuracy." position="right">
                    <span className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                      <strong>Compare Mode:</strong> See all models side-by-side!
                    </span>
                  </Tooltip>
                </div>
                <div className="pt-1">
                  <strong>Model Guide:</strong>
                  <div className="ml-3 mt-1 space-y-1">
                    <Tooltip content="Only 2 billion parameters! Fastest response time, lowest latency. Great for testing streaming and simple queries." position="left">
                      <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                        ⚡ <strong>Gemma 2B:</strong> Speed demon
                      </div>
                    </Tooltip>
                    <br />
                    <Tooltip content="Supports 1 million token context window! Can process entire books, long documents, or extensive conversation history." position="left">
                      <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                        📜 <strong>Qwen 7B:</strong> Massive context (1M tokens!)
                      </div>
                    </Tooltip>
                    <br />
                    <Tooltip content="Excellent at function calling and structured outputs. Best for API integrations, JSON responses, and tool use." position="left">
                      <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                        🔧 <strong>GPT-OSS 120B:</strong> Tool calling expert
                      </div>
                    </Tooltip>
                    <br />
                    <Tooltip content="480B parameter mixture-of-experts model specifically trained on code. Best for programming, debugging, and technical docs." position="left">
                      <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                        💻 <strong>Qwen Coder 480B:</strong> Programming specialist
                      </div>
                    </Tooltip>
                    <br />
                    <Tooltip content="Advanced reasoning model using chain-of-thought. Excels at math, logic puzzles, and multi-step problem solving." position="left">
                      <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                        🧠 <strong>DeepSeek R1:</strong> Reasoning powerhouse
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Controls */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3 flex-wrap">

            {/* Model Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Tooltip content="Each model has different strengths! Gemma is fast, Qwen 7B handles long context, GPT-OSS excels at tool calling, Qwen Coder is best for programming, and DeepSeek R1 is the reasoning champion.">
                  <span className="border-b border-dashed border-gray-400 dark:border-gray-500">Model Selection</span>
                </Tooltip>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={compareMode}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.icon} {model.name} • {model.desc}
                  </option>
                ))}
              </select>
              {!compareMode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-xs text-gray-600 dark:text-gray-400"
                >
                  <Tooltip content={`Full model path: ${MODELS.find(m => m.id === selectedModel)?.fullName}`} position="left">
                    <span className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                      {MODELS.find(m => m.id === selectedModel)?.fullDesc}
                    </span>
                  </Tooltip>
                </motion.div>
              )}
            </div>

            {/* Compare Toggle */}
            <Tooltip content="Test ALL models at once to compare outputs!" position="right">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 
                            dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 
                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                            after:bg-white after:border-gray-300 after:border after:rounded-full 
                            after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                            peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 border-b border-dashed border-gray-400 dark:border-gray-500">
                  Compare
                </span>
              </label>
            </Tooltip>

            {/* Clear */}
            <Tooltip content="Clear all messages">
              <button
                onClick={() => {
                  setMessages([]);
                  setPerformanceMetrics([]);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 
                       dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Example Prompts - Compact */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-3 mb-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-medium">Try these:</span>
              <Tooltip content="Each example tests different model strengths. Try them in Compare Mode to see how models differ in creativity, reasoning, coding, and math!">
                <span className="text-gray-400 dark:text-gray-500 border-b border-dashed border-current cursor-help">ℹ️ Why these examples?</span>
              </Tooltip>
            </div>
            <div className="flex gap-2 flex-wrap">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Tooltip
                  key={index}
                  content={
                    index === 0 ? "Tests creative writing - see how models handle poetry and artistic expression" :
                      index === 1 ? "Tests math reasoning - compare how models solve equations and explain concepts" :
                        index === 2 ? "Tests code generation - Qwen Coder should excel here!" :
                          "Tests logical reasoning - DeepSeek R1's specialty!"
                  }
                  position="center"
                >
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInput(example.prompt)}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 
                             text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 
                             dark:hover:bg-gray-600 transition-colors border-b border-dashed border-transparent hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    {example.label}
                  </motion.button>
                </Tooltip>
              ))}
            </div>
          </motion.div>
        )}

        {/* Performance Chart */}
        {performanceMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                📊 Performance
              </h3>
              <Tooltip content="Tokens per second = speed of generation. Higher is faster! This chart uses D3.js to visualize real-time performance data from each model.">
                <span className="text-xs text-gray-500 dark:text-gray-400 border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                  Speed Comparison (D3)
                </span>
              </Tooltip>
            </div>
            <PerformanceChart metrics={performanceMetrics} />
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {performanceMetrics.map((metric) => (
                <div key={metric.model} className="flex justify-between">
                  <Tooltip content={`${MODELS.find(m => m.name === metric.model)?.fullDesc}`} position="left">
                    <span className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                      {MODELS.find(m => m.name === metric.model)?.icon} {metric.model}
                    </span>
                  </Tooltip>
                  <Tooltip content={`Total tokens: ${metric.tokenCount} | Total time: ${metric.totalTime.toFixed(2)}s | Speed: ${metric.tokensPerSecond.toFixed(1)} tokens/second`} position="right">
                    <span className="font-mono border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                      {metric.tokenCount} tokens • {metric.totalTime.toFixed(2)}s • {metric.tokensPerSecond.toFixed(1)} t/s
                    </span>
                  </Tooltip>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Tooltip content="Notice the trade-offs: smaller models (Gemma 2B) are faster but less capable, while larger models (Qwen Coder 480B, DeepSeek R1) are slower but better at complex tasks!">
                <p className="text-xs text-gray-600 dark:text-gray-400 italic border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                  💡 Key insight: Speed vs Capability trade-off in action
                </p>
              </Tooltip>
            </div>
          </motion.div>
        )}

        {/* Messages - Compact */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-xl 
                      border border-gray-200/50 dark:border-gray-700/50 mb-4 
                      h-[450px] overflow-y-auto p-4 space-y-3">

          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                >
                  {message.model && (
                    <Tooltip content={MODELS.find(m => m.name === message.model)?.fullDesc || 'AI response'}>
                      <div className="text-xs font-semibold mb-1 opacity-70 flex items-center gap-1 border-b border-dashed border-current pb-0.5">
                        {MODELS.find(m => m.name === message.model)?.icon} {message.model}
                        {message.tokensPerSecond && (
                          <span className="ml-auto text-[10px] opacity-60">
                            {message.tokensPerSecond.toFixed(1)} t/s
                          </span>
                        )}
                      </div>
                    </Tooltip>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming */}
          {loading && streamingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-xl px-3 py-2 bg-gray-100 dark:bg-gray-700">
                <Tooltip content="Server-Sent Events (SSE) allow real-time streaming! Tokens are generated one at a time and sent immediately. This is how ChatGPT achieves that 'typing' effect.">
                  <div className="text-xs font-semibold mb-1 opacity-70 flex items-center gap-1 border-b border-dashed border-gray-400 pb-0.5 cursor-help">
                    ⚡ Streaming via SSE...
                  </div>
                </Tooltip>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
                <Tooltip content="This blinking cursor indicates new tokens are still being generated and sent from the server!">
                  <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1 cursor-help" />
                </Tooltip>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {loading && !streamingText && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">👋</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Ready to compare LLMs!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Try the examples above or ask anything
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 max-w-md mx-auto">
                <Tooltip content="Enable Compare Mode and ask a coding question. Watch Qwen Coder excel while Gemma struggles!" position="center">
                  <p className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                    💡 Tip: Try comparing models on the same coding question
                  </p>
                </Tooltip>
                <br />
                <Tooltip content="The D3 chart will show you exactly how much faster smaller models are vs larger ones. Typical range: 30-120 tokens/second!" position="center">
                  <p className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                    📊 Tip: Watch the performance chart after each query
                  </p>
                </Tooltip>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Compact Input */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-3 shadow-xl 
                      border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border-0 bg-gray-100 dark:bg-gray-900 
                       text-gray-900 dark:text-white placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500"
            />
            <Tooltip content={loading ? 'Generating...' : 'Send (or press Enter)'}>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-700 hover:to-purple-700 
                         disabled:from-gray-400 disabled:to-gray-400
                         text-white rounded-lg font-semibold transition-all text-sm
                         disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? '⏳' : '🚀'}
              </button>
            </Tooltip>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center justify-between">
            <span>Press Enter to send</span>
            <span>
              {compareMode ? '🔄 Comparing all models' : `${MODELS.find(m => m.id === selectedModel)?.icon} ${MODELS.find(m => m.id === selectedModel)?.name}`}
            </span>
          </div>
        </div>

        {/* Compact Educational Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-blue-200 dark:border-gray-700"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>🎯</span>
            <span>What This Demonstrates</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
            <Tooltip content="Server-Sent Events (SSE) allow the server to push data to the client in real-time. Watch tokens appear as they're generated, not all at once!" position="left">
              <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                <strong>🔄 Streaming:</strong> Real-time SSE token generation
              </div>
            </Tooltip>
            <Tooltip content="D3.js creates dynamic, interactive data visualizations. This bar chart shows performance metrics using scalable vector graphics (SVG)." position="right">
              <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                <strong>📊 Performance:</strong> D3 visualizations of speed metrics
              </div>
            </Tooltip>
            <Tooltip content="Compare 5 different LLMs: tiny (2B), medium (7B, 120B), and massive (480B) models. Each specializes in different tasks - see the trade-offs!" position="left">
              <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                <strong>🤖 Model Variety:</strong> 5 models with different strengths
              </div>
            </Tooltip>
            <Tooltip content="HuggingFace Inference API provides serverless access to 100+ AI models. No GPU needed - they handle the infrastructure!" position="right">
              <div className="border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help">
                <strong>📡 API:</strong> HuggingFace Inference integration
              </div>
            </Tooltip>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Tooltip content="This project demonstrates: API integration, real-time streaming, data visualization with D3, performance measurement, and building educational tools. Perfect for showcasing full-stack AI engineering skills!">
              <p className="text-xs text-gray-600 dark:text-gray-400 italic border-b border-dashed border-gray-400 dark:border-gray-500 cursor-help inline-block">
                💼 Portfolio highlight: Full-stack AI app with real-time data viz
              </p>
            </Tooltip>
          </div>
        </motion.div>
      </div>
    </div>
  );
}