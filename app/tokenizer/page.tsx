'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetTokenizersQuery, useLazyTokenizeQuery } from '@/store/api/tokenizer';

// Inline Tooltip Component
function Tooltip({ content, children, position = 'center' }: { content: string; children: React.ReactNode; position?: 'center' | 'right' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = position === 'right'
    ? 'top-full right-0 mt-2'
    : 'top-full left-1/2 transform -translate-x-1/2 mt-2';

  const arrowClasses = position === 'right'
    ? 'bottom-full right-4 mb-1'
    : 'bottom-full left-1/2 transform -translate-x-1/2 mb-1';

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
            style={{ minWidth: 'max-content', maxWidth: '300px', whiteSpace: 'normal' }}
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

// Color palette for tokens
const TOKEN_COLORS = [
  'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
  'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
  'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700',
  'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
  'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700',
  'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700',
  'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700',
  'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
];

// Example sentences
const EXAMPLE_SENTENCES = [
  { label: 'Emoji', text: 'The 🌟 star-programmer implemented AGI overnight! 🚀🤖💡' },
  { label: 'Code', text: "const fetchData = async () => await fetch('https://api.example.com');" },
  { label: 'Multilingual', text: 'Hello 世界 مرحبا Привет こんにちは' },
  { label: 'Mixed', text: '🎨 AI-powered self-driving @ https://example.com costs $99.99/month in 2024!' },
];

export default function TokenizerPage() {
  const [selectedTokenizers, setSelectedTokenizers] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // Fetch available tokenizers from backend
  const { data: tokenizers, isLoading, error } = useGetTokenizersQuery();

  // Lazy query for tokenization (manual trigger)
  const [triggerTokenize, { data: tokenizeResults, isFetching: isTokenizing }] =
    useLazyTokenizeQuery();

  // Set default selected tokenizers when tokenizers load
  useEffect(() => {
    if (tokenizers && tokenizers.length > 0 && selectedTokenizers.length === 0) {
      // Default to first 2 tokenizers
      setSelectedTokenizers(tokenizers.slice(0, 2).map(t => t.id));
    }
  }, [tokenizers, selectedTokenizers.length]);

  // Debounce input text (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(inputText);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText]);

  // Trigger tokenization when debounced text or selected tokenizers change
  useEffect(() => {
    if (debouncedText && selectedTokenizers.length > 0) {
      triggerTokenize({
        text: debouncedText,
        tokenizers: selectedTokenizers,
      });
    }
  }, [debouncedText, selectedTokenizers, triggerTokenize]);

  const handleTokenizerToggle = (tokenizerId: string) => {
    setSelectedTokenizers((prev) =>
      prev.includes(tokenizerId)
        ? prev.filter((id) => id !== tokenizerId)
        : [...prev, tokenizerId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl text-gray-900 dark:text-white"
        >
          Loading tokenizers...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl text-red-600"
        >
          Error loading tokenizers. Make sure the backend is running!
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            Tokenizer Comparison
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Compare how different LLM tokenizers split text into tokens •
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showInfo ? 'Hide' : 'Show'} Guide
            </button>
          </p>
        </motion.div>

        {/* Technical Guide Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 shadow-xl overflow-hidden"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    🔤 What are Tokens?
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    LLMs don't process text character-by-character. They break it into <strong>tokens</strong> (words, subwords, or characters). Each token gets converted to a number that the model can understand.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    🧮 BPE Algorithm
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Most modern tokenizers use <strong>Byte Pair Encoding</strong> (BPE), which learns common patterns from training data. Frequently-seen words become single tokens, while rare words split into subwords.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    💰 Why It Matters
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Token count directly affects <strong>API costs</strong> and <strong>context limits</strong>. Fewer tokens = cheaper inference and more room for conversation history!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tokenizer Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Select Tokenizers:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokenizers?.map((tokenizer, index) => (
              <motion.label
                key={tokenizer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-start space-x-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTokenizers.includes(tokenizer.id)}
                  onChange={() => handleTokenizerToggle(tokenizer.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tokenizer.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tokenizer.description}
                  </div>
                </div>
              </motion.label>
            ))}
          </div>
        </motion.div>

        {/* Text Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Input Text:
          </h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text here to tokenize..."
            maxLength={10000}
            className="w-full h-40 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="mt-2 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {inputText.length} / 10,000 characters
            </div>
            {isTokenizing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2"
              >
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
                Tokenizing...
              </motion.div>
            )}
          </div>

          {/* Example Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quick examples:</span>
              {EXAMPLE_SENTENCES.map((example, index) => (
                <motion.button
                  key={example.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setInputText(example.text)}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {example.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {tokenizeResults && inputText && selectedTokenizers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Efficiency Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  📊 Efficiency Comparison
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Tokenizer
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          <Tooltip content="Total number of tokens generated">
                            <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                              Tokens
                            </span>
                          </Tooltip>
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          <Tooltip content="Higher is better! More characters per token = lower costs & more context available" position="right">
                            <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                              Chars/Token
                            </span>
                          </Tooltip>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tokenizeResults).map(([name, result], index) => {
                        const isWinner = Object.values(tokenizeResults).every(
                          r => result.count <= r.count
                        );
                        return (
                          <motion.tr
                            key={name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`border-b border-gray-100 dark:border-gray-800 ${isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''
                              }`}
                          >
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                              {tokenizers?.find(t => t.id === name)?.name || name}
                              {isWinner && (
                                <Tooltip content="Most efficient - uses fewest tokens!">
                                  <span className="ml-2">⭐</span>
                                </Tooltip>
                              )}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                              {result.count}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                              {result.char_to_token_ratio}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Token Display for Each Tokenizer */}
              {Object.entries(tokenizeResults).map(([name, result], tokenizerIndex) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + tokenizerIndex * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    {tokenizers?.find(t => t.id === name)?.name || name} ({result.count} tokens)
                    <Tooltip content="Each colored pill represents one token. Colors help visualize chunking patterns.">
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">ℹ️</span>
                    </Tooltip>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.decoded_tokens.map((token, tokenIndex) => (
                      <motion.div
                        key={tokenIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: tokenizerIndex * 0.1 + tokenIndex * 0.02 }}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-mono ${TOKEN_COLORS[tokenIndex % TOKEN_COLORS.length]
                          }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {token.replace(/ /g, '·').replace(/\n/g, '↵')}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!inputText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500 dark:text-gray-400"
          >
            Start typing to see tokenization results...
          </motion.div>
        )}
      </div>
    </main>
  );
}