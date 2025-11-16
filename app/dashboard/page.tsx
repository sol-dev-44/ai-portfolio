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
} from 'lucide-react';
// Simple diff viewer (no external dependency needed)

// Scope for react-live (available imports in sandbox)
const scope = {
  React,  // Full React object with createElement for JSX
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

  const [modifyDashboard, { isLoading, error }] = useModifyDashboardMutation();

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

      setPrompt(''); // Clear after success
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
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
    
    // In production, save to database here
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
    <div className="relative min-h-screen pb-32">
      {/* Top Control Bar */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: History Controls */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(undo())}
              disabled={!canUndo}
              className="group relative p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all disabled:hover:bg-transparent"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              {canUndo && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(redo())}
              disabled={!canRedo}
              className="group relative p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all disabled:hover:bg-transparent"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              {canRedo && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </motion.button>
            
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="group p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="Reset to initial dashboard"
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
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
              {currentVersion.prompt}
            </div>
          </motion.div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              title="View version history"
            >
              <History className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                History
              </span>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                {allVersions.length}
              </span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDiff(!showDiff)}
              className="p-2.5 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all group"
              title="Compare versions"
              disabled={allVersions.length < 2}
            >
              <GitCompare className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCode(!showCode)}
              className="p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
              title="View source code"
            >
              <Code2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="p-2.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              title="Download component"
            >
              <Download className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
            </motion.button>
            
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
              title="Share this dashboard"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-bold">Share</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Render (react-live) */}
      <div className="relative min-h-[calc(100vh-240px)]">
        {/* Welcome Message (only show on initial version with no prompt history) */}
        <AnimatePresence>
          {showWelcome && allVersions.length === 1 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 z-10 max-w-2xl w-full px-4"
            >
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 rounded-2xl shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🎨</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to AI Dashboard Playground!
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                        Transform this dashboard with natural language. Try the suggestions below or describe your own vision!
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                          Powered by Claude Sonnet 4
                        </span>
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold">
                          Real-time Generation
                        </span>
                        <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-xs font-semibold">
                          Unlimited Undo/Redo
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWelcome(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:scale-110 active:scale-95"
                      title="Close welcome message"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <LiveProvider code={currentVersion.code} scope={scope} noInline={false}>
          <LiveError className="fixed bottom-32 left-4 right-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 font-mono max-w-4xl mx-auto z-40 shadow-xl" />
          <LivePreview />
        </LiveProvider>
      </div>

      {/* History Panel (Slide-in from left) */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Version History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {allVersions.map((version, index) => {
                  const isActive = index === currentIndex;
                  const isFuture = index > currentIndex;
                  
                  return (
                    <motion.button
                      key={version.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => dispatch(jumpToVersion(index))}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isFuture
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-50'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Version {index + 1}
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {version.prompt}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(version.timestamp).toLocaleString()}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareIndex(index);
                          setShowDiff(true);
                          setShowHistory(false);
                        }}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Compare with current
                      </button>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Code Viewer Drawer (Slide-in from right) */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[800px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Component Code
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentVersion.code);
                      alert('Code copied to clipboard!');
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => setShowCode(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <SyntaxHighlighter
                  language="tsx"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {currentVersion.code}
                </SyntaxHighlighter>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Diff Viewer Modal */}
      <AnimatePresence>
        {showDiff && compareIndex !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiff(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GitCompare className="w-5 h-5" />
                    Compare Versions
                  </h3>
                  <button
                    onClick={() => setShowDiff(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                  <div className="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Old:</strong> Version {compareIndex + 1} - {allVersions[compareIndex].prompt}
                    </div>
                    <div>
                      <strong>New:</strong> Version {currentIndex + 1} - {currentVersion.prompt}
                    </div>
                  </div>
                  
                  {/* Simple side-by-side diff */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        Old Version
                      </div>
                      <SyntaxHighlighter
                        language="tsx"
                        style={oneDark}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          maxHeight: '60vh',
                          overflow: 'auto',
                        }}
                        showLineNumbers
                      >
                        {allVersions[compareIndex].code}
                      </SyntaxHighlighter>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        New Version
                      </div>
                      <SyntaxHighlighter
                        language="tsx"
                        style={oneDark}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          maxHeight: '60vh',
                          overflow: 'auto',
                        }}
                        showLineNumbers
                      >
                        {currentVersion.code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-32 left-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 p-1 rounded-xl shadow-2xl z-40 max-w-4xl mx-auto"
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="text-2xl">😵</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-red-900 dark:text-red-200 mb-2 text-lg">
                    Oops! Generation Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-3">
                    {(error as any)?.data?.error || 'Failed to generate. This might be a temporary issue with the AI service.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => dispatch(undo())}
                      disabled={!canUndo}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Undo to Previous
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {}}
                  className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast (show briefly after generation) */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-32 right-4 z-40"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1 rounded-xl shadow-2xl">
              <div className="bg-white dark:bg-gray-900 rounded-lg px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 animate-bounce">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-green-900 dark:text-green-200">
                    Dashboard Updated! ✨
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    "{allVersions[allVersions.length - 1].prompt}"
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Bar (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-2xl z-40">
        <div className="max-w-6xl mx-auto">
          {/* Quick Suggestions */}
          <div className="px-4 pt-3 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                ✨ Try these:
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { emoji: '🏖️', text: 'Create beach vibe theme', color: 'from-cyan-500 to-blue-500' },
                { emoji: '📊', text: 'Display charts on top', color: 'from-purple-500 to-pink-500' },
                { emoji: '🔤', text: 'I need larger font', color: 'from-orange-500 to-red-500' },
                { emoji: '🎪', text: 'Make animations more springy', color: 'from-green-500 to-emerald-500' },
                { emoji: '🌃', text: 'Cyberpunk with neon colors', color: 'from-fuchsia-500 to-purple-500' },
                { emoji: '🌴', text: 'Caribbean sunset vibes', color: 'from-yellow-500 to-orange-500' },
                { emoji: '💻', text: 'Make it look like a terminal', color: 'from-gray-500 to-gray-700' },
                { emoji: '🎨', text: 'Glassmorphism design style', color: 'from-blue-400 to-cyan-400' },
              ].map((suggestion, index) => (
                <motion.button
                  key={suggestion.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPrompt(suggestion.text)}
                  disabled={isLoading}
                  className="group relative px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-transparent bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${suggestion.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <span className="relative flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">{suggestion.emoji}</span>
                    {suggestion.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Main Input */}
          <div className="p-4">
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
                  placeholder="✨ Describe your vision... (or pick a suggestion above)"
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base"
                  disabled={isLoading}
                />
                {prompt && !isLoading && (
                  <button
                    onClick={() => setPrompt('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none text-base"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ✨ Generate
                  </span>
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Press Enter to generate • Powered by Claude Sonnet 4</span>
              <span className="font-mono">
                {allVersions.length} version{allVersions.length !== 1 ? 's' : ''} • {prompt.length} chars
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}