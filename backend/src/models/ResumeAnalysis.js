import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    locationPreference: {
      type: String,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
    },
    summary: String,
    extractedSkills: [String],
    fixes: [
      {
        section: String,
        issue: String,
        suggestion: String,
        priority: String,
      },
    ],
    matchedJobs: [
      {
        jobId: String,
        title: String,
        company: String,
        matchScore: Number,
        reason: String,
      },
    ],
    provider: String,
    modelUsed: String,
    modelTier: String,
    tokensUsed: Number,
    analysisTime: Number,
  },
  {
    timestamps: true,
  }
);

// Limit saved analyses per user (max 20)
resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
