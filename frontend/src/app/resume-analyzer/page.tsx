/**
 * Resume Analyzer Page
 * AI-powered resume analysis and job matching (requires authentication)
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';
import { API_BASE_URL } from '@/constants/api';

// Types
interface ResumeFix {
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reason: string;
}

interface AnalysisResult {
  overallScore: number;
  fixes: ResumeFix[];
  matchedJobs: JobMatch[];
  extractedSkills: string[];
  summary: string;
  tokensUsed: number;
  analysisTime: number;
  provider: string;
  modelUsed?: string;
  modelTier?: 'premium' | 'standard' | 'fallback';
}

interface SavedAnalysisSummary {
  _id: string;
  targetRole: string;
  resumeFileName?: string;
  experienceLevel: string;
  locationPreference: string;
  overallScore: number;
  summary: string;
  createdAt: string;
}

interface AnalysisFormMeta {
  targetRole: string;
  experienceLevel: string;
  locationPreference: string;
}

// Model tier colors
const MODEL_TIER_COLORS = {
  premium: 'text-green-600 dark:text-green-400',
  standard: 'text-blue-600 dark:text-blue-400',
  fallback: 'text-yellow-600 dark:text-yellow-400',
};

// Priority badge colors
const PRIORITY_COLORS: Record<string, { badge: string; border: string; icon: string; bg: string }> = {
  high: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-500/40',
    border: 'border-l-red-500',
    icon: '🔴',
    bg: 'bg-red-50/60 dark:bg-red-500/10',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/40',
    border: 'border-l-amber-400',
    icon: '🟡',
    bg: 'bg-amber-50/60 dark:bg-amber-500/10',
  },
  low: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/40',
    border: 'border-l-emerald-400',
    icon: '🟢',
    bg: 'bg-emerald-50/60 dark:bg-emerald-500/10',
  },
};

// Experience level options
const EXPERIENCE_LEVELS = [
  { value: '0-1', label: '0-1 years (Fresher)' },
  { value: '1-3', label: '1-3 years (Junior)' },
  { value: '3-5', label: '3-5 years (Mid-level)' },
  { value: '5+', label: '5+ years (Senior)' },
];

// Location preferences
const LOCATION_PREFERENCES = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'On-site', label: 'On-site' },
];

export default function ResumeAnalyzerPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [prefillDemo, setPrefillDemo] = useState(false);
  
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [locationPreference, setLocationPreference] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History state
  const [history, setHistory] = useState<SavedAnalysisSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<AnalysisResult | null>(null);
  const [viewingMeta, setViewingMeta] = useState<AnalysisFormMeta | null>(null);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('resumeAnalysis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.result) setResult(parsed.result);
        if (parsed.targetRole) setTargetRole(parsed.targetRole);
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.locationPreference) setLocationPreference(parsed.locationPreference);
        if (parsed.savedId) setSavedId(parsed.savedId);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Fetch history on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/resume/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setHistory(data.data);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!result || savedId) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/resume/history`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRole,
          experienceLevel,
          locationPreference,
          resumeFileName: file?.name || null,
          analysis: result,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedId(data.data.id);
        // Update sessionStorage with savedId
        try {
          const stored = sessionStorage.getItem('resumeAnalysis');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.savedId = data.data.id;
            sessionStorage.setItem('resumeAnalysis', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        fetchHistory();
      }
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewHistoryItem = async (id: string) => {
    try {
      setLoadingHistoryId(id);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/resume/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setViewingHistoryItem(data.data);
        setViewingMeta({
          targetRole: data.data.targetRole,
          experienceLevel: data.data.experienceLevel,
          locationPreference: data.data.locationPreference,
        });
        setResult(null);
      }
    } catch {
      // silent
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/resume/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(prev => prev.filter(h => h._id !== id));
      if (viewingHistoryItem && (viewingHistoryItem as any)._id === id) {
        setViewingHistoryItem(null);
        setViewingMeta(null);
      }
    } catch {
      // silent
    }
  };

  const handleBackToForm = () => {
    setViewingHistoryItem(null);
    setViewingMeta(null);
  };

  // File drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        if (droppedFile.size > 2 * 1024 * 1024) {
          setError('File too large. Maximum size is 2MB.');
          return;
        }
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('File too large. Maximum size is 2MB.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  // Submit analysis
  const handleAnalyze = async () => {
    if (!file || !targetRole || !experienceLevel || !locationPreference) {
      setError('Please fill in all fields and upload your resume');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetRole', targetRole);
      formData.append('experienceLevel', experienceLevel);
      formData.append('locationPreference', locationPreference);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/resume/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data.data);
      // Persist to sessionStorage so navigating away won't lose it
      sessionStorage.setItem('resumeAnalysis', JSON.stringify({
        result: data.data,
        targetRole,
        experienceLevel,
        locationPreference,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setTargetRole('');
    setExperienceLevel('');
    setLocationPreference('');
    setResult(null);
    setError(null);
    setSavedId(null);
    setViewingHistoryItem(null);
    setViewingMeta(null);
    sessionStorage.removeItem('resumeAnalysis');
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  // Animation variants (matching stats page)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  // Authenticated view
  if (isAuthenticated) {
    const displayResult = result || viewingHistoryItem;
    const formReady = file && targetRole && experienceLevel && locationPreference;
    const step = !file ? 1 : (!targetRole || !experienceLevel || !locationPreference) ? 2 : 3;
    
    return (
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Resume Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your resume to get AI-powered feedback and job matches
          </p>
        </motion.div>

        {/* Results View */}
        {displayResult ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Action bar */}
            <motion.div
              className="flex items-center justify-between mb-6"
              variants={itemVariants}
            >
              <button
                onClick={viewingHistoryItem ? handleBackToForm : handleReset}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {viewingHistoryItem ? 'Back to Form' : 'New Analysis'}
              </button>
              {result && !viewingHistoryItem && (
                <motion.button
                  onClick={handleSaveAnalysis}
                  disabled={isSaving || !!savedId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    savedId
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg'
                  } disabled:opacity-50`}
                  whileHover={!savedId ? { scale: 1.02 } : {}}
                  whileTap={!savedId ? { scale: 0.98 } : {}}
                >
                  {savedId ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved</>
                  ) : isSaving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save Analysis</>
                  )}
                </motion.button>
              )}
            </motion.div>

            {/* Score + Stats Summary Cards */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              variants={itemVariants}
            >
              {/* Overall Score */}
              <motion.div
                className={`bg-gradient-to-br ${getScoreBg(displayResult.overallScore)} rounded-xl p-6 text-white shadow-lg col-span-1 sm:col-span-2 lg:col-span-1`}
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -3 }}
              >
                <p className="text-white/80 text-sm font-medium mb-1">Resume Score</p>
                <motion.p
                  className="text-5xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
                >
                  {displayResult.overallScore}<span className="text-2xl">/100</span>
                </motion.p>
                <p className="text-white/70 text-xs mt-1">{getScoreLabel(displayResult.overallScore)}</p>
              </motion.div>

              {/* Skills Found */}
              <motion.div
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -3 }}
              >
                <p className="text-blue-100 text-sm font-medium mb-1">Skills Found</p>
                <motion.p
                  className="text-4xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 100 }}
                >
                  {displayResult.extractedSkills.length}
                </motion.p>
              </motion.div>

              {/* Improvements */}
              <motion.div
                className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -3 }}
              >
                <p className="text-amber-100 text-sm font-medium mb-1">Improvements</p>
                <motion.p
                  className="text-4xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, type: 'spring', stiffness: 100 }}
                >
                  {displayResult.fixes.length}
                </motion.p>
              </motion.div>

              {/* Job Matches */}
              <motion.div
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -3 }}
              >
                <p className="text-purple-100 text-sm font-medium mb-1">Job Matches</p>
                <motion.p
                  className="text-4xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 100 }}
                >
                  {displayResult.matchedJobs.length}
                </motion.p>
              </motion.div>
            </motion.div>

            {/* Summary + Role info */}
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 mb-6"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summary
                {viewingMeta && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    — {viewingMeta.targetRole} • {viewingMeta.experienceLevel} yrs • {viewingMeta.locationPreference}
                  </span>
                )}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {displayResult.summary}
              </p>

              {/* Score Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Score Breakdown</span>
                  <span>{displayResult.overallScore}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      displayResult.overallScore >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      displayResult.overallScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-rose-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${displayResult.overallScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Extracted Skills */}
            {displayResult.extractedSkills.length > 0 && (
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 mb-6"
                variants={itemVariants}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Detected Skills
                  <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {displayResult.extractedSkills.length} skills
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {displayResult.extractedSkills.map((skill, i) => (
                    <motion.span
                      key={i}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.3, type: 'spring', stiffness: 200 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Fixes */}
            <motion.div
              className="rounded-2xl shadow-xl overflow-hidden mb-6 border border-amber-200/50 dark:border-amber-900/30"
              variants={itemVariants}
            >
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Suggested Improvements
                  </h2>
                  <span className="text-sm font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {displayResult.fixes.length} found
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="bg-gray-50 dark:bg-slate-900 p-5">
                {displayResult.fixes.length > 0 ? (
                  <div className="space-y-4">
                    {displayResult.fixes.map((fix, i) => {
                      const colors = PRIORITY_COLORS[fix.priority] || PRIORITY_COLORS.medium;
                      return (
                        <motion.div
                          key={i}
                          className={`relative rounded-xl border border-gray-200 dark:border-slate-600 border-l-4 ${colors.border} overflow-hidden shadow-sm hover:shadow-lg dark:shadow-black/20 transition-all duration-300 bg-white dark:bg-slate-800`}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
                          whileHover={{ y: -2 }}
                        >
                          {/* Card Header */}
                          <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-600 text-xs font-bold text-gray-700 dark:text-gray-100">
                                {i + 1}
                              </span>
                              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${colors.badge}`}>
                                {fix.priority}
                              </span>
                              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                {fix.section}
                              </span>
                            </div>
                          </div>

                          {/* Issue */}
                          <div className="px-5 py-3">
                            <div className="flex items-start gap-2.5">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mt-0.5">
                                <svg className="w-3 h-3 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">Issue</span>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">
                                  {fix.issue}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Suggestion */}
                          <div className="mx-5 mb-4 p-3.5 bg-green-50 dark:bg-emerald-500/10 rounded-lg border border-green-200 dark:border-emerald-500/30">
                            <div className="flex items-start gap-2.5">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400">
                                  Fix
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">
                                  {fix.suggestion}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200 dark:shadow-green-900/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">Looking great!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No major improvements needed for your resume</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Matched Jobs */}
            <motion.div
              className="rounded-2xl shadow-xl overflow-hidden border border-purple-200/50 dark:border-purple-900/30"
              variants={itemVariants}
            >
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Top Matching Jobs
                  </h2>
                  <span className="text-sm font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {displayResult.matchedJobs.length} matches
                  </span>
                </div>
                <p className="text-xs text-purple-100/80 mt-2 flex items-center gap-1.5 ml-[42px]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personalized scores based on your resume analysis
                </p>
              </div>

              {/* Body */}
              <div className="bg-white dark:bg-slate-800 p-5">
                {displayResult.matchedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {displayResult.matchedJobs.map((job, i) => (
                      <motion.a
                        key={i}
                        href={`/jobs/${job.jobId}`}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group shadow-sm hover:shadow-md"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Rank badge */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white">#{i + 1}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate text-sm">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {job.company}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                              {job.reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                          <div className={`text-2xl font-extrabold ${getScoreColor(job.matchScore)}`}>
                            {job.matchScore}%
                          </div>
                          <span className="text-[9px] text-purple-500 dark:text-purple-400 font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">resume match</span>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">No matching jobs found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try broadening your target role or check back when new jobs are ingested</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Upload Form */
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Progress Steps */}
            <motion.div className="mb-8" variants={itemVariants}>
              <div className="flex items-center justify-center gap-0">
                {[
                  { num: 1, label: 'Upload' },
                  { num: 2, label: 'Details' },
                  { num: 3, label: 'Analyze' },
                ].map((s, i) => (
                  <React.Fragment key={s.num}>
                    {i > 0 && (
                      <div className={`h-0.5 w-12 sm:w-20 ${step > i ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'} transition-colors`} />
                    )}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step > s.num ? 'bg-blue-500 text-white' :
                        step === s.num ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900' :
                        'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                      }`}>
                        {step > s.num ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : s.num}
                      </div>
                      <span className={`text-xs mt-1 ${step >= s.num ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                        {s.label}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main form - takes 2 columns */}
              <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
                {/* File Upload Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Resume
                    </h2>
                  </div>
                  <div className="p-6">
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                          : file
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                          : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {file ? (
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {(file.size / 1024).toFixed(1)} KB — Click or drop to replace
                          </p>
                        </motion.div>
                      ) : (
                        <div>
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">Drop your resume here</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — PDF only, max 2MB</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                      🔒 Your resume is not stored or used for training. Only the processed analysis is saved when you choose to save it.
                    </p>
                  </div>
                </div>

                {/* Job Details Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Job Preferences
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Target Role
                      </label>
                      <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g., Backend Developer, Data Scientist"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Experience Level
                        </label>
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        >
                          <option value="">Select...</option>
                          {EXPERIENCE_LEVELS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Location Preference
                        </label>
                        <select
                          value={locationPreference}
                          onChange={(e) => setLocationPreference(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        >
                          <option value="">Select...</option>
                          {LOCATION_PREFERENCES.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !formReady}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                  whileHover={formReady && !isAnalyzing ? { scale: 1.01 } : {}}
                  whileTap={formReady && !isAnalyzing ? { scale: 0.99 } : {}}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyze Resume
                    </>
                  )}
                </motion.button>

                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                  Your resume is analyzed securely and not stored. Rate limit: 5/hour.
                </p>
              </motion.div>

              {/* Sidebar - History */}
              <motion.div className="lg:col-span-1" variants={itemVariants}>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden sticky top-8">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
                    </h2>
                    {history.length > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full">
                        {history.length}
                      </span>
                    )}
                  </div>
                  {historyLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No saved analyses yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Results will appear here after you save them</p>
                    </div>
                  ) : (
                    <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                      {history.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center gap-3 p-4 active:bg-gray-50 sm:hover:bg-gray-50 dark:active:bg-slate-700/50 sm:dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                          onClick={() => handleViewHistoryItem(item._id)}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 bg-gradient-to-br ${getScoreBg(item.overallScore)}`}>
                            {item.overallScore}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.targetRole}
                            </p>
                            {item.resumeFileName && (
                              <p className="text-xs text-blue-500 dark:text-blue-400 truncate" title={item.resumeFileName}>
                                📄 {item.resumeFileName}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {new Date(item.createdAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {loadingHistoryId === item._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent flex-shrink-0" />
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteHistoryItem(item._id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Loading state
  if (authLoading && !showLoginModal && !showSignupModal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Not authenticated - show preview
  const iconVariants = {
    locked: { scale: 1, rotate: 0 },
    shake: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  const features = [
    {
      icon: '📄',
      title: 'Smart PDF Parsing',
      description: 'AI reads your resume directly - no manual text entry',
    },
    {
      icon: '📊',
      title: 'ATS Score',
      description: 'See how well your resume passes applicant tracking systems',
    },
    {
      icon: '🔧',
      title: 'Actionable Fixes',
      description: 'Get specific suggestions to improve each section',
    },
    {
      icon: '🎯',
      title: 'Job Matching',
      description: 'Find jobs on our platform that match your profile',
    },
    {
      icon: '💡',
      title: 'Keyword Analysis',
      description: 'Identify missing keywords for your target role',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section - Compact with CTA */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-slate-700 mb-8"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <motion.div
              className="flex-shrink-0 mx-auto md:mx-0"
              variants={iconVariants}
              initial="locked"
              whileHover="shake"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl md:text-4xl">🤖</span>
              </div>
            </motion.div>
            
            {/* Title & Description */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                AI Resume Analyzer
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get AI-powered feedback on your resume and discover matching jobs
              </p>
            </div>
          </div>
          
          {/* CTA Buttons - Prominent */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <motion.button
              onClick={() => {
                setPrefillDemo(true);
                setShowLoginModal(true);
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try Demo
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => setShowLoginModal(true)}
              className="flex-1 px-6 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-semibold border-2 border-gray-200 dark:border-slate-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => setShowSignupModal(true)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up Free
              </span>
            </motion.button>
          </div>
          
          {/* Trust indicators - inline */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              100% Free
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Powered by AI
            </span>
          </div>
        </motion.div>

        {/* Features Section - Horizontal scroll */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            What you can do
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-slate-700 flex-shrink-0 w-56 snap-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -3 }}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
          {/* Scroll indicator */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="flex gap-1">
                {features.map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                ))}
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* How it works Section */}
        <motion.div
          className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-slate-700"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Upload Resume</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your PDF resume (max 2MB)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Answer Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tell us your target role and preferences
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Get Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive AI-powered feedback and job matches
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPrefillDemo(false);
        }}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setPrefillDemo(false);
          setShowSignupModal(true);
        }}
        prefillDemo={prefillDemo}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
