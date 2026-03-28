import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Job Schema - Represents a single job listing
 * Includes fields for tracking, deduplication, and scoring
 */
const jobSchema = new mongoose.Schema(
  {
    // Core job information
    title: {
      type: String,
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },

    // Metadata
    source: {
      type: String,
      enum: ['google-jobs', 'remotive', 'manual'],
      default: 'google-jobs',
    },
    externalId: String,
    sourceUrl: String,

    // Dates
    postedAt: {
      type: Date,
      required: true,
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },

    // Deduplication hash (SHA256 of title + company + location)
    hash: {
      type: String,
      unique: true,
      index: true,
    },

    // Scoring
    score: {
      type: Number,
      default: 0,
      index: true,
    },
    freshnessScore: Number,
    relevanceScore: Number,
    keywords: [String], // Matched keywords for this job

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook to generate hash before saving
 */
jobSchema.pre('save', function (next) {
  if (!this.hash) {
    const hashInput = `${this.title}-${this.company}-${this.location}`.toLowerCase();
    this.hash = crypto.createHash('sha256').update(hashInput).digest('hex');
  }
  next();
});

/**
 * Index for common queries
 */
jobSchema.index({ postedAt: -1, score: -1 }); // Compound index for top jobs
jobSchema.index({ isActive: 1, postedAt: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
