/**
 * Resume Analyzer Controller
 * 
 * Handles resume analysis requests.
 * Requires authentication.
 */

import { analyzeResume, getFeatureStatus } from '../services/resumeAnalyzerService.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import Job from '../models/Job.js';

/**
 * POST /resume/analyze
 * Analyze a resume PDF and match with jobs
 */
export const analyze = async (request, reply) => {
  try {
    // Parse all multipart parts (fields + file)
    const parts = request.parts();
    
    let pdfBuffer = null;
    let mimetype = null;
    const formFields = {};
    
    for await (const part of parts) {
      if (part.type === 'file') {
        // It's a file
        mimetype = part.mimetype;
        const chunks = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        pdfBuffer = Buffer.concat(chunks);
      } else {
        // It's a field
        formFields[part.fieldname] = part.value;
      }
    }
    
    if (!pdfBuffer) {
      return reply.status(400).send({
        success: false,
        error: 'No file uploaded',
      });
    }
    
    // Check file type
    if (mimetype !== 'application/pdf') {
      return reply.status(400).send({
        success: false,
        error: 'Only PDF files are allowed',
      });
    }
    
    // Get form fields
    const { targetRole, experienceLevel, locationPreference } = formFields;
    
    // Validate required fields
    if (!targetRole || !experienceLevel || !locationPreference) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: targetRole, experienceLevel, locationPreference',
      });
    }
    
    // Check file size (2MB max)
    if (pdfBuffer.length > 2 * 1024 * 1024) {
      return reply.status(400).send({
        success: false,
        error: 'File too large. Maximum size is 2MB.',
      });
    }
    
    // Analyze resume
    const result = await analyzeResume({
      pdfBuffer,
      targetRole,
      experienceLevel,
      locationPreference,
    });
    
    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Resume analysis error:', error.message);
    
    // Handle specific errors
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return reply.status(429).send({
        success: false,
        error: error.message,
      });
    }
    
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to analyze resume',
    });
  }
};

/**
 * GET /resume/status
 * Check if resume analysis feature is available
 */
export const status = async (request, reply) => {
  const featureStatus = getFeatureStatus();
  return reply.send({
    success: true,
    data: featureStatus,
  });
};

export default { analyze, status };

/**
 * POST /resume/history
 * Save an analysis result
 */
export const saveAnalysis = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const { targetRole, experienceLevel, locationPreference, analysis, resumeFileName } = request.body;

    if (!analysis || !targetRole) {
      return reply.status(400).send({ success: false, error: 'Missing analysis data' });
    }

    // Cap at 20 saved analyses per user - delete oldest if needed
    const count = await ResumeAnalysis.countDocuments({ userId });
    if (count >= 20) {
      const oldest = await ResumeAnalysis.findOne({ userId }).sort({ createdAt: 1 });
      if (oldest) await oldest.deleteOne();
    }

    const saved = await ResumeAnalysis.create({
      userId,
      targetRole,
      resumeFileName: resumeFileName || null,
      experienceLevel,
      locationPreference,
      overallScore: analysis.overallScore,
      summary: analysis.summary,
      extractedSkills: analysis.extractedSkills,
      fixes: analysis.fixes,
      matchedJobs: (analysis.matchedJobs || []).map(j => ({
        jobId: j.jobId,
        matchScore: j.matchScore,
        reason: j.reason,
      })),
      provider: analysis.provider,
      modelUsed: analysis.modelUsed,
      modelTier: analysis.modelTier,
      tokensUsed: analysis.tokensUsed,
      analysisTime: analysis.analysisTime,
    });

    return reply.send({ success: true, data: { id: saved._id, createdAt: saved.createdAt } });
  } catch (error) {
    console.error('Save analysis error:', error.message, error.stack);
    return reply.status(500).send({ success: false, error: 'Failed to save analysis: ' + error.message });
  }
};

/**
 * GET /resume/history
 * Get user's saved analyses (summary list)
 */
export const getHistory = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const analyses = await ResumeAnalysis.find({ userId })
      .sort({ createdAt: -1 })
      .select('targetRole resumeFileName experienceLevel locationPreference overallScore summary createdAt')
      .limit(20)
      .lean();

    return reply.send({ success: true, data: analyses });
  } catch (error) {
    console.error('Get history error:', error.message);
    return reply.status(500).send({ success: false, error: 'Failed to fetch history' });
  }
};

/**
 * GET /resume/history/:id
 * Get a single saved analysis
 */
export const getAnalysisById = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const { id } = request.params;
    const analysis = await ResumeAnalysis.findOne({ _id: id, userId }).lean();

    if (!analysis) {
      return reply.status(404).send({ success: false, error: 'Analysis not found' });
    }

    // Populate matched jobs with current data from Jobs collection
    if (analysis.matchedJobs && analysis.matchedJobs.length > 0) {
      const jobIds = analysis.matchedJobs.map(m => m.jobId).filter(Boolean);
      const existingJobs = await Job.find({ _id: { $in: jobIds } })
        .select('title company location')
        .lean();
      const jobMap = new Map(existingJobs.map(j => [j._id.toString(), j]));

      analysis.matchedJobs = analysis.matchedJobs
        .map(m => {
          const job = jobMap.get(m.jobId);
          if (!job) return null; // Job no longer exists
          return {
            jobId: m.jobId,
            title: job.title,
            company: job.company,
            matchScore: m.matchScore,
            reason: m.reason,
          };
        })
        .filter(Boolean);
    }

    return reply.send({ success: true, data: analysis });
  } catch (error) {
    console.error('Get analysis error:', error.message);
    return reply.status(500).send({ success: false, error: 'Failed to fetch analysis' });
  }
};

/**
 * DELETE /resume/history/:id
 * Delete a saved analysis
 */
export const deleteAnalysis = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const { id } = request.params;
    const deleted = await ResumeAnalysis.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Analysis not found' });
    }

    return reply.send({ success: true });
  } catch (error) {
    console.error('Delete analysis error:', error.message);
    return reply.status(500).send({ success: false, error: 'Failed to delete analysis' });
  }
};
