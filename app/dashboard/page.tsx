'use client';

import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useModifyDashboardMutation } from '@/store/api/dashboard';
import {
  addVersion,
  undo,
  redo,
  jumpToVersion,
  reset,
  setShareId,
  selectCurrentVersion,
  selectCanUndo,
  selectCanRedo,
  selectAllVersions,
  selectCurrentIndex,
} from '@/store/dashboardSlice';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as d3 from 'd3';
import { motion as frameMotion } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Code2,
  History,
  Share2,
  Download,
  GitCompare,
  X,
  Check,
  Clock,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Camera,
  Loader2
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';

// Scope for react-live
const scope = {
  React,
  useState,
  useEffect,
  useRef,
  motion: frameMotion,
  d3,
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const currentVersion = useSelector(selectCurrentVersion);
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);
  const allVersions = useSelector(selectAllVersions);
  const currentIndex = useSelector(selectCurrentIndex);

  const [prompt, setPrompt] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [compareIndex, setCompareIndex] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // New State for Enhancements
  const [isZenMode, setIsZenMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [isRecording, setIsRecording] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [modifyDashboard, { isLoading, error }] = useModifyDashboardMutation();

  // Voice Input Handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // Export to PNG Handler
  const handleExportImage = async () => {
    if (previewRef.current) {
      try {
        const dataUrl = await toPng(previewRef.current, { cacheBust: true });
        const link = document.createElement('a');
        link.download = `dashboard-preview-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to export image:', err);
        alert('Failed to export image. Please try again.');
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    try {
      const result = await modifyDashboard({
        currentCode: currentVersion.code,
        userPrompt: prompt,
      }).unwrap();

      dispatch(addVersion({
        code: result.newCode,
        prompt: prompt,
      }));

      setPrompt('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to modify dashboard:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentVersion.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${currentVersion.id}.tsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareId = `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch(setShareId(shareId));
    const shareUrl = `${window.location.origin}/dashboard/${shareId}`;
    await navigator.clipboard.writeText(shareUrl);
    alert(`Share URL copied to clipboard!\n${shareUrl}\n\n(Note: Sharing requires backend storage - coming soon!)`);
  };

  const handleReset = () => {
    if (confirm('Reset to initial dashboard? This will clear all history.')) {
      dispatch(reset());
    }
  };

  return (
    <div className="relative min-h-screen pb-32 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* Top Control Bar (Hidden in Zen Mode) */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="sticky top-16 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              {/* Left: History Controls */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch(undo())}
                  disabled={!canUndo}
                  className="group relative p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch(redo())}
                  disabled={!canRedo}
                  className="group relative p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </motion.button>

                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="group p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                </motion.button>
              </div>

              {/* Center: Version Info */}
              <motion.div
                className="text-center px-6 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Version {currentIndex + 1} of {allVersions.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium truncate max-w-[200px]">
                  {currentVersion.prompt}
                </div>
              </motion.div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsZenMode(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  title="Enter Zen Mode"
                >
                  <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>

                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                <Tooltip content="View version history" position="bottom">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                  >
                    <History className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  </motion.button>
                </Tooltip>

                <Tooltip content="View source code" position="bottom">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCode(!showCode)}
                    className="p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                  >
                    <Code2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </motion.button>
                </Tooltip>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-bold hidden sm:inline">Share</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zen Mode Exit Button */}
      <AnimatePresence>
        {isZenMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => setIsZenMode(false)}
            className="fixed top-24 right-6 z-50 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
            title="Exit Zen Mode"
          >
            <Minimize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Dashboard Render */}
      <div className={`relative transition-all duration-500 ${isZenMode ? 'pt-4' : 'pt-0'}`}>
        <div className="max-w-7xl mx-auto px-4">

          {/* Technical Guide Panel */}
          <AnimatePresence>
            {!isZenMode && (
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {showInfo ? 'Hide' : 'Show'} Technical Guide ℹ️
                  </button>
                </div>

                {showInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 shadow-xl overflow-hidden"
                  >
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-500" /> React Live
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Enables <strong>real-time code compilation</strong> in the browser. The code you see in the editor is actually running live in the preview window, allowing for instant feedback loops.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <History className="w-4 h-4 text-purple-500" /> Redux Time-Travel
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Every generation creates a new state snapshot. We use <strong>Redux Toolkit</strong> to manage this history, allowing you to Undo/Redo changes instantly without reloading.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Maximize2 className="w-4 h-4 text-green-500" /> Framer Motion
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Powers the <strong>smooth layout transitions</strong> and entrance animations. Notice how the UI elements stagger in? That's Framer Motion's <code>AnimatePresence</code> at work.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-orange-500" /> AI Generation
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Your prompts are sent to our LLM backend, which returns <strong>executable React code</strong>. We parse this response and inject it directly into the live preview environment.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>

          {/* Preview Controls */}
          <div className="flex justify-end gap-2 mb-2">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
              <button
                onClick={() => setPreviewTheme('light')}
                className={`p-1.5 rounded-md transition-colors ${previewTheme === 'light' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Light Preview"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`p-1.5 rounded-md transition-colors ${previewTheme === 'dark' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                title="Dark Preview"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExportImage}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors"
              title="Export to PNG"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Live Preview Area */}
          <Tooltip content="Real-time React Live preview. Code is compiled in your browser!" position="top" className="w-full">
            <div
              ref={previewRef}
              className={`relative rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl transition-colors duration-300 ${previewTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                }`}
              style={{ minHeight: '600px' }}
            >
              {isLoading && (
                <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <span className="text-lg font-semibold text-blue-600 animate-pulse">
                      Generating UI...
                    </span>
                  </div>
                </div>
              )}

              <LiveProvider code={currentVersion.code} scope={scope} noInline={false}>
                <LiveError className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white p-4 text-sm font-mono max-h-32 overflow-auto backdrop-blur-md" />
                <LivePreview className="p-8 h-full w-full" />
              </LiveProvider>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Prompt Bar (Hidden in Zen Mode) */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-2xl z-40"
          >
            <div className="max-w-6xl mx-auto p-4">
              {/* Theme Suggestions */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { name: 'Cyberpunk', prompt: 'Make it cyberpunk style with neon colors, dark background, and glowing effects', color: 'from-pink-500 to-purple-500' },
                  { name: 'Minimalist', prompt: 'Make it ultra minimalist, clean white background, black text, lots of whitespace', color: 'from-gray-200 to-gray-400' },
                  { name: 'Corporate', prompt: 'Professional corporate style, blue branding, clean cards, trustworthy look', color: 'from-blue-400 to-blue-600' },
                  { name: 'Retro', prompt: 'Retro 80s vaporwave style, pastel gradients, pixel fonts if possible', color: 'from-yellow-400 to-pink-400' },
                  { name: 'Nature', prompt: 'Nature inspired, organic shapes, green color palette, soft shadows', color: 'from-green-400 to-emerald-600' },
                ].map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setPrompt(theme.prompt)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 flex-shrink-0"
                  >
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.color}`} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{theme.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder={isRecording ? "Listening..." : "✨ Describe your vision..."}
                    className={`w-full px-5 py-4 pr-24 rounded-xl border-2 ${isRecording ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base`}
                    disabled={isLoading}
                  />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {prompt && !isLoading && (
                      <button
                        onClick={() => setPrompt('')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-lg transition-all ${isRecording
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600'
                        }`}
                      title="Voice Input"
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none text-base"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      ✨ Generate
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History & Code Drawers (Same as before, simplified for brevity) */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: -400 }}
              animate={{ x: 0 }}
              exit={{ x: -400 }}
              className="fixed left-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">History</h3>
                <button onClick={() => setShowHistory(false)}><X className="w-5 h-5 dark:text-white" /></button>
              </div>
              <div className="p-4 space-y-2">
                {allVersions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => dispatch(jumpToVersion(index))}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${index === currentIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    <div className="font-semibold dark:text-white">Version {index + 1}</div>
                    <div className="text-xs text-gray-500 truncate">{version.prompt}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCode(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: 800 }}
              animate={{ x: 0 }}
              exit={{ x: 800 }}
              className="fixed right-0 top-0 bottom-0 w-[800px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">Code</h3>
                <button onClick={() => setShowCode(false)}><X className="w-5 h-5 dark:text-white" /></button>
              </div>
              <div className="p-4">
                <SyntaxHighlighter language="tsx" style={oneDark} customStyle={{ margin: 0, borderRadius: '0.5rem' }}>
                  {currentVersion.code}
                </SyntaxHighlighter>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span className="font-bold">Generated Successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}