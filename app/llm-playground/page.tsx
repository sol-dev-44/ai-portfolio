'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetLLMModelsQuery, useGenerateTextMutation } from '@/store/api/llm';

// Inline Tooltip Component
function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

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
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap"
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Example prompts for quick testing
const EXAMPLE_PROMPTS = [
  { label: 'Story (GPT-2)', text: 'Once upon a time, in a small village by the sea, there lived a', model: 'gpt2' },
  { label: 'Code (GPT-2)', text: 'def fibonacci(n):\n    """Calculate fibonacci numbers"""\n    if n <= 1:\n        return n\n    else:', model: 'gpt2' },
  { label: 'Question (Qwen)', text: 'Q: What is the capital of France?\nA:', model: 'qwen' },
  { label: 'Instruction (Qwen)', text: 'Write a short poem about the ocean:', model: 'qwen' },
];

// Strategy descriptions
const STRATEGY_INFO = {
  greedy: 'Always picks the most likely next token. Consistent but can be repetitive.',
  top_k: 'Samples from the top K most likely tokens. Adds controlled randomness.',
  top_p: 'Samples from tokens whose cumulative probability exceeds P. Dynamic vocabulary.',
  beam: 'Explores multiple paths simultaneously and picks the best sequence.',
};

export default function LLMPlaygroundPage() {
  const [selectedModel, setSelectedModel] = useState<'gpt2' | 'qwen'>('gpt2');
  const [strategy, setStrategy] = useState<'greedy' | 'top_k' | 'top_p' | 'beam'>('greedy');
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(128);
  const [topK, setTopK] = useState(50);
  const [topP, setTopP] = useState(0.9);
  const [numBeams, setNumBeams] = useState(4);
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');

  // Fetch available models
  const { data: models, isLoading } = useGetLLMModelsQuery();

  // Generate text mutation
  const [generateText, { isLoading: isGenerating }] = useGenerateTextMutation();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    try {
      const result = await generateText({
        prompt,
        model_id: selectedModel,
        strategy,
        max_new_tokens: maxTokens,
        temperature,
        top_k: topK,
        top_p: topP,
        num_beams: numBeams,
      }).unwrap();

      setGeneratedText(result.generated_text);
    } catch (error) {
      console.error('Generation failed:', error);
      setGeneratedText('Error generating text. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl text-gray-900 dark:text-white"
        >
          Loading models...
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
            LLM Playground
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experiment with language models using different decoding strategies
          </p>
          
          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Tips:</strong> GPT-2 is a <em>completion</em> model (continues text), 
              while Qwen is <em>instruction-tuned</em> (answers questions). 
              Try <strong>Top-P sampling</strong> with <strong>temperature 0.7-0.9</strong> for best results!
            </p>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Model Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                <Tooltip content="Choose between completion (GPT-2) or instruction-tuned (Qwen) model">
                  <span className="border-b border-dashed border-gray-400 dark:border-gray-500">Model</span>
                </Tooltip>
              </h2>
              <div className="space-y-3">
                {models?.map((model) => (
                  <label
                    key={model.id}
                    className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="model"
                      checked={selectedModel === model.id}
                      onChange={() => setSelectedModel(model.id as 'gpt2' | 'qwen')}
                      className="mt-1 w-5 h-5"
                    />
                    <div className="flex-1">
                      <Tooltip content={model.id === 'gpt2' ? 'Best for: completing text, stories, code' : 'Best for: answering questions, following instructions'}>
                        <div className="font-medium text-gray-900 dark:text-white border-b border-dashed border-transparent hover:border-gray-400 dark:hover:border-gray-500 inline-block">
                          {model.name}
                        </div>
                      </Tooltip>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {model.description} ({model.parameters})
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                <Tooltip content="How the model chooses the next token">
                  <span className="border-b border-dashed border-gray-400 dark:border-gray-500">Decoding Strategy</span>
                </Tooltip>
              </h2>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="greedy">Greedy</option>
                <option value="top_k">Top-K Sampling</option>
                <option value="top_p">Top-P (Nucleus)</option>
                <option value="beam">Beam Search</option>
              </select>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {STRATEGY_INFO[strategy]}
              </p>
            </div>

            {/* Parameters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Parameters
              </h2>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tooltip content="Controls randomness: lower = focused, higher = creative">
                    <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                      Temperature: {temperature.toFixed(1)}
                    </span>
                  </Tooltip>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>More Focused</span>
                  <span>More Random</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tooltip content="Maximum length of generated text (roughly 1 token = 0.75 words)">
                    <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                      Max Tokens: {maxTokens}
                    </span>
                  </Tooltip>
                </label>
                <input
                  type="range"
                  min="16"
                  max="512"
                  step="16"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Strategy-specific parameters */}
              {strategy === 'top_k' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tooltip content="Sample from the K most likely tokens (higher = more variety)">
                      <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                        Top-K: {topK}
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {strategy === 'top_p' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tooltip content="Sample from tokens with cumulative probability P (0.9 = top 90%)">
                      <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                        Top-P: {topP.toFixed(2)}
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {strategy === 'beam' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tooltip content="Number of paths to explore (higher = better quality, slower)">
                      <span className="border-b border-dashed border-gray-400 dark:border-gray-500">
                        Num Beams: {numBeams}
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={numBeams}
                    onChange={(e) => setNumBeams(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Prompt Input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                <Tooltip content="Tip: Use continuation prompts for GPT-2, questions for Qwen">
                  <span className="border-b border-dashed border-gray-400 dark:border-gray-500">Prompt</span>
                </Tooltip>
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                maxLength={2000}
                className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {prompt.length} / 2,000 characters
                </div>
              </div>

              {/* Example Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-wrap">
                  <Tooltip content="These prompts auto-select the best model for the task">
                    <span className="text-sm text-gray-600 dark:text-gray-400 border-b border-dashed border-gray-400 dark:border-gray-500">
                      Examples:
                    </span>
                  </Tooltip>
                  {EXAMPLE_PROMPTS.map((example) => (
                    <motion.button
                      key={example.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setPrompt(example.text);
                        setSelectedModel(example.model as 'gpt2' | 'qwen');
                      }}
                      className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {example.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full mt-6 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </span>
                ) : (
                  'Generate Text'
                )}
              </motion.button>
            </div>

            {/* Generated Output */}
            <AnimatePresence>
              {generatedText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Generated Text
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        navigator.clipboard.writeText(generatedText);
                      }}
                      className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Copy
                    </motion.button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                      {generatedText}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!generatedText && !isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500 dark:text-gray-400"
              >
                Enter a prompt and click "Generate Text" to see the model's output
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}