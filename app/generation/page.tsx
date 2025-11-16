'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLazyGetProbabilitiesQuery } from '@/store/api/generation';
import * as d3 from 'd3';
import { Info } from 'lucide-react';

// Comprehensive tooltip component
function InfoTooltip({ title, children, position = 'right' }: { title: string; children: React.ReactNode; position?: 'right' | 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = position === 'top' 
    ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    : 'left-6 top-0';

  const maxHeightClass = position === 'top' 
    ? 'max-h-[600px]'  // Shorter for top-positioned tooltips
    : 'max-h-[600px]';

  return (
    <div 
      className="relative inline-block ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[9999] w-96 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 ${positionClasses} ${maxHeightClass} overflow-y-auto`}
          >
            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h4>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Strategy selection helpers
const getGreedySelection = (tokens: any[]) => tokens[0];

const getTopKSelection = (tokens: any[], k: number) => {
  const topK = tokens.slice(0, k);
  const selectedIndex = Math.floor(Math.random() * topK.length);
  return topK[selectedIndex];
};

const getTopPSelection = (tokens: any[], p: number) => {
  let cumulativeProb = 0;
  const topP = [];
  
  for (const token of tokens) {
    cumulativeProb += token.probability;
    topP.push({ ...token, cumulative: cumulativeProb });
    if (cumulativeProb >= p) break;
  }
  
  const rand = Math.random() * cumulativeProb;
  return topP.find(t => rand <= t.cumulative) || topP[0];
};

export default function GenerationPage() {
  const [prompt, setPrompt] = useState('The future of AI is');
  const [debouncedPrompt, setDebouncedPrompt] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(10);
  const [topP, setTopP] = useState(0.9);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Lazy query for probabilities
  const [triggerProbabilities, { data, isFetching, error }] = useLazyGetProbabilitiesQuery();

  // Debounce prompt with trimming
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trim whitespace before setting debounced prompt
      setDebouncedPrompt(prompt.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [prompt]);

  // Trigger API call when debounced prompt changes
  useEffect(() => {
    if (debouncedPrompt) {
      triggerProbabilities({
        prompt: debouncedPrompt, // Already trimmed
        top_k: 20,
      });
    }
  }, [debouncedPrompt, triggerProbabilities]);

  // Apply temperature scaling and get strategy selections
  const getScaledData = () => {
    if (!data) return null;
    
    // Apply temperature to logits (approximation)
    const scaledTokens = data.top_tokens.map(token => {
      const scaledLogit = token.log_probability / temperature;
      return { ...token, scaledLogit };
    });
    
    // Recompute softmax
    const maxLogit = Math.max(...scaledTokens.map(t => t.scaledLogit));
    const expSum = scaledTokens.reduce((sum, t) => sum + Math.exp(t.scaledLogit - maxLogit), 0);
    
    const normalized = scaledTokens.map(token => ({
      ...token,
      probability: Math.exp(token.scaledLogit - maxLogit) / expSum,
    }));
    
    // Calculate strategy selections
    const greedy = getGreedySelection(normalized);
    const topKSel = getTopKSelection(normalized, topK);
    const topPSel = getTopPSelection(normalized, topP);
    
    return {
      tokens: normalized,
      selections: { greedy, topK: topKSel, topP: topPSel }
    };
  };

  const scaledData = getScaledData();

  // D3 visualization with strategy highlights
  useEffect(() => {
    if (!scaledData || !svgRef.current) return;

    const { tokens, selections } = scaledData;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Dimensions
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Only show top 15 for clarity
    const displayTokens = tokens.slice(0, 15);

    // Scales
    const x = d3
      .scaleBand()
      .domain(displayTokens.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(displayTokens, d => d.probability) || 1])
      .nice()
      .range([height, 0]);

    // X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((_, i) => displayTokens[i].token.trim() || '∅'))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '11px');

    // Y axis
    svg
      .append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d * 100).toFixed(0)}%`))
      .style('font-size', '12px');

    // Y axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Probability');

    // Bars with strategy coloring
    svg
      .selectAll('.bar')
      .data(displayTokens)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => x(i.toString()) || 0)
      .attr('y', d => y(d.probability))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.probability))
      .attr('fill', (d, i) => {
        if (d.token_id === selections.greedy.token_id) return '#F94C9B';
        if (i < topK && d.token_id === selections.topK.token_id) return '#00B8D4';
        if (d.token_id === selections.topP.token_id) return '#9333EA';
        if (i < topK) return '#60A5FA';
        return '#9CA3AF';
      })
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8);
      });

    // Probability labels
    svg
      .selectAll('.label')
      .data(displayTokens)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (_, i) => (x(i.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.probability) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => `${(d.probability * 100).toFixed(1)}%`);

  }, [scaledData, topK]);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-bold gradient-miami-text">
            Generation Strategies
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Visualize how different text generation strategies select the next token
          </p>
        </motion.div>

        {/* Educational Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                How This Works
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                This tool shows real probability distributions from GPT-2. After tokenizing your prompt, 
                the model outputs logits (raw scores) for all 50,257 tokens in its vocabulary. We apply 
                <span className="font-semibold"> softmax normalization</span> to convert these to probabilities, 
                then show how different <span className="font-semibold">sampling strategies</span> would select 
                the next token. Hover over the <Info className="w-3 h-3 inline" /> icons below for detailed mathematical explanations!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Enter a prompt:
            </h2>
            <InfoTooltip title="Prompt Processing">
              <p>
                Your prompt is tokenized using GPT-2's tokenizer, then fed through the model's 
                transformer layers to produce logits (unnormalized scores) for the next token.
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2 font-mono text-xs">
                <div>Input: "{prompt.trim()}"</div>
                <div>→ Tokenize → [token_ids]</div>
                <div>→ GPT-2 Forward Pass</div>
                <div>→ Output Logits [50257 values]</div>
                <div>→ Softmax → Probabilities</div>
              </div>
              <p className="mt-2">
                <strong>Note:</strong> Whitespace is automatically trimmed for better results.
              </p>
            </InfoTooltip>
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a prompt..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isFetching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2"
            >
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
              Analyzing probabilities...
            </motion.div>
          )}
        </motion.div>

        {/* Controls */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Strategy Parameters:
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Temperature */}
              <div>
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Temperature: {temperature.toFixed(2)}
                  </label>
                  <InfoTooltip title="Temperature Scaling">
                    <p>
                      Temperature (τ) controls randomness by scaling the logits before softmax:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded my-2 font-mono text-xs">
                      <div>z'ᵢ = zᵢ / τ</div>
                      <div>P(token_i) = exp(z'ᵢ) / Σ exp(z'ⱼ)</div>
                    </div>
                    <p>
                      <strong>τ → 0:</strong> Distribution becomes "sharper" - highest probability 
                      token approaches 100%, others approach 0%. Nearly deterministic.
                    </p>
                    <p className="mt-2">
                      <strong>τ = 1:</strong> Original distribution from the model. Balanced randomness.
                    </p>
                    <p className="mt-2">
                      <strong>τ → ∞:</strong> Distribution becomes "flatter" - all tokens approach 
                      equal probability. Maximum randomness (uniform distribution).
                    </p>
                    <p className="mt-2 text-xs italic">
                      In practice: 0.7-0.9 for factual text, 1.0-1.5 for creative writing.
                    </p>
                  </InfoTooltip>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              {/* Top-k */}
              <div>
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Top-k: {topK}
                  </label>
                  <InfoTooltip title="Top-k Sampling">
                    <p>
                      Top-k sampling restricts the sampling pool to the k most probable tokens:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded my-2 font-mono text-xs">
                      <div>1. Sort tokens by probability</div>
                      <div>2. Keep top k tokens</div>
                      <div>3. Renormalize: P'(tᵢ) = P(tᵢ) / Σᵏ P(tⱼ)</div>
                      <div>4. Sample from P'</div>
                    </div>
                    <p>
                      <strong>Benefits:</strong> Prevents sampling from the "long tail" of unlikely 
                      tokens that might be nonsensical.
                    </p>
                    <p className="mt-2">
                      <strong>Drawback:</strong> Fixed k doesn't adapt to distribution shape. 
                      Sometimes top-10 is too restrictive, sometimes too permissive.
                    </p>
                    <p className="mt-2">
                      <strong>Example:</strong> If k=5, even if the 5th token has only 0.1% probability, 
                      it can still be sampled. If the top 3 tokens have 99% combined probability, 
                      we're still considering 2 more.
                    </p>
                  </InfoTooltip>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sample from top {topK} tokens
                </p>
              </div>

              {/* Top-p */}
              <div>
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Top-p (Nucleus): {topP.toFixed(2)}
                  </label>
                  <InfoTooltip title="Top-p (Nucleus) Sampling">
                    <p>
                      Top-p (nucleus) sampling dynamically selects tokens based on cumulative probability:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded my-2 font-mono text-xs">
                      <div>1. Sort tokens by probability</div>
                      <div>2. Compute cumulative sum</div>
                      <div>3. Find smallest set where Σ P(tᵢ) ≥ p</div>
                      <div>4. Renormalize and sample</div>
                    </div>
                    <p>
                      <strong>Adaptive:</strong> The number of tokens included varies based on the 
                      distribution shape. Sharp distributions (model is confident) include fewer tokens. 
                      Flat distributions (model is uncertain) include more.
                    </p>
                    <p className="mt-2">
                      <strong>Example (p=0.9):</strong> If top 3 tokens have probabilities [0.6, 0.2, 0.15], 
                      we include all 3 (sum = 0.95 ≥ 0.9). If top 1 has 0.92, we only include that one.
                    </p>
                    <p className="mt-2">
                      <strong>Benefit over top-k:</strong> Automatically adapts to model confidence. 
                      When the model is sure, sample from fewer tokens. When uncertain, consider more options.
                    </p>
                    <p className="mt-2 text-xs italic">
                      Introduced in "The Curious Case of Neural Text Degeneration" (Holtzman et al., 2019)
                    </p>
                  </InfoTooltip>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sample until cumulative prob reaches {(topP * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Visualization */}
        {scaledData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Token Probability Distribution
                </h2>
                <InfoTooltip title="Understanding the Visualization">
                  <p>
                    Each bar represents a token's probability after temperature scaling and softmax normalization.
                  </p>
                  <p className="mt-2">
                    <strong>Bar Colors:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong className="text-pink-600">Pink:</strong> What greedy would select (highest prob)</li>
                    <li><strong className="text-cyan-600">Cyan:</strong> What top-k randomly selected</li>
                    <li><strong className="text-purple-600">Purple:</strong> What top-p randomly selected</li>
                    <li><strong className="text-blue-600">Light Blue:</strong> Within top-k range but not selected</li>
                    <li><strong className="text-gray-600">Gray:</strong> Outside top-k range</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Mathematical Foundation:</strong>
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 font-mono text-xs">
                    <div>Softmax: P(token_i) = exp(zᵢ/τ) / Σⱼ exp(zⱼ/τ)</div>
                    <div>where zᵢ = logits from GPT-2</div>
                    <div>      τ = temperature</div>
                  </div>
                </InfoTooltip>
              </div>
              <div className="flex gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-500 rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Greedy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-500 rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Top-k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Top-p</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Top-k range</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center overflow-x-auto">
              <svg ref={svgRef} className="max-w-full" />
            </div>
          </motion.div>
        )}

        {/* Strategy Comparison */}
        {scaledData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Greedy */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl p-6 border-2 border-pink-500 dark:border-pink-400">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-pink-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Greedy</h3>
                <InfoTooltip title="Greedy Decoding" position="top">
                  <p>
                    Greedy decoding always selects the token with highest probability:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded my-2 font-mono text-xs">
                    token = argmax P(token_i)
                  </div>
                  <p>
                    <strong>Pros:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    <li>Deterministic (same output every time)</li>
                    <li>Fast (no sampling needed)</li>
                    <li>Often produces coherent text</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Cons:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    <li>Can lead to repetitive text</li>
                    <li>Gets stuck in loops ("is is is...")</li>
                    <li>Short-sighted (doesn't consider future tokens)</li>
                    <li>No diversity in generation</li>
                  </ul>
                  <p className="mt-2 text-xs italic">
                    Best for: Translation, summarization, short completions
                  </p>
                </InfoTooltip>
              </div>
              <p className="text-3xl font-bold gradient-miami-text mb-2">
                "{scaledData.selections.greedy.token}"
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Always picks highest probability
              </p>
              <p className="text-lg font-semibold text-pink-600 dark:text-pink-400 mt-2">
                {(scaledData.selections.greedy.probability * 100).toFixed(2)}%
              </p>
            </div>

            {/* Top-k */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-2xl p-6 border-2 border-cyan-500 dark:border-cyan-400">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top-k (k={topK})</h3>
                <InfoTooltip title="Top-k Sampling Algorithm" position="top">
                  <p>
                    Top-k randomly samples from the k most likely tokens:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded my-2 font-mono text-xs">
                    <div>1. Sort: tokens by P(token_i) desc</div>
                    <div>2. Filter: keep top k tokens</div>
                    <div>3. Renormalize probabilities</div>
                    <div>4. Sample: token ~ Categorical(P')</div>
                  </div>
                  <p>
                    <strong>Key Insight:</strong> Cuts off the "long tail" of unlikely tokens. 
                    The model assigns some probability to nonsensical tokens; top-k prevents sampling them.
                  </p>
                  <p className="mt-2">
                    <strong>Tuning k:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    <li>k=1: Equivalent to greedy</li>
                    <li>k=3-10: Conservative, safe</li>
                    <li>k=20-50: More diverse</li>
                    <li>k→∞: Uniform sampling (chaos)</li>
                  </ul>
                  <p className="mt-2 text-xs italic">
                    Limitation: Doesn't adapt to distribution shape. Fixed k for all timesteps.
                  </p>
                </InfoTooltip>
              </div>
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                "{scaledData.selections.topK.token}"
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Samples from top {topK} tokens
              </p>
              <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mt-2">
                {(scaledData.selections.topK.probability * 100).toFixed(2)}%
              </p>
            </div>

            {/* Top-p */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-purple-600 dark:border-purple-400">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-purple-600 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top-p (p={topP})</h3>
                <InfoTooltip title="Top-p (Nucleus) Sampling Algorithm" position="top">
                  <p>
                    Top-p dynamically determines how many tokens to consider:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded my-2 font-mono text-xs">
                    <div>1. Sort: tokens by P(token_i) desc</div>
                    <div>2. Compute: cumsum = [P₁, P₁+P₂, ...]</div>
                    <div>3. Find: min set where cumsum ≥ p</div>
                    <div>4. This is the "nucleus"</div>
                    <div>5. Renormalize & sample</div>
                  </div>
                  <p>
                    <strong>Adaptive Behavior:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    <li>Peaked distribution → Few tokens (model confident)</li>
                    <li>Flat distribution → Many tokens (model uncertain)</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Example with p=0.9:</strong>
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded mt-1 font-mono text-xs">
                    <div>P = [0.7, 0.15, 0.08, 0.03, ...]</div>
                    <div>Cumsum = [0.7, 0.85, 0.93, ...]</div>
                    <div>→ Include first 3 tokens (0.93 ≥ 0.9)</div>
                  </div>
                  <p className="mt-2 text-xs italic">
                    Paper: "The Curious Case of Neural Text Degeneration" (Holtzman+ 2019). 
                    Shows top-p produces more human-like, diverse text than top-k.
                  </p>
                </InfoTooltip>
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                "{scaledData.selections.topP.token}"
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nucleus sampling (cumulative)
              </p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-2">
                {(scaledData.selections.topP.probability * 100).toFixed(2)}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p className="text-red-800 dark:text-red-200">
              Error loading probabilities. Make sure the backend is running!
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}