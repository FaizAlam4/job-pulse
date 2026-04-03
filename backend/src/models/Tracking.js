/**
 * Tracking Model
 * Separate collection for job application tracking
 * Better scalability as users can have 100+ tracked applications
 */

import mongoose from 'mongoose';

/**
 * Job Snapshot Schema - Embedded copy of job details
 * Persists even after original job is deleted
 */
const jobSnapshotSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: String,
  sourceUrl: String,
  source: String, // 'google-jobs', 'remotive', 'manual'
  postedAt: Date,
  fetchedAt: Date,
  salary: {
    min: Number,
    max: Number,
    currency: String,
  },
  keywords: [String],
  score: Number,
}, { _id: false });

/**
 * Status History Entry Schema
 */
const statusHistorySchema = new mongoose.Schema({
  status: String,
  date: { type: Date, default: Date.now },
  notes: String,
}, { _id: false });

/**
 * Interview Schema
 */
const interviewSchema = new mongoose.Schema({
  date: Date,
  type: { 
    type: String, 
    enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'other'] 
  },
  notes: String,
  duration: Number, // in minutes
  interviewer: String,
});

/**
 * Contact Schema
 */
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  linkedIn: String,
});

/**
 * Tracking Schema - Main tracking document
 */
const trackingSchema = new mongoose.Schema(
  {
    // Owner reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Reference to Job (optional, may be null if job deleted)
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    
    // Job Snapshot: Full job details embedded for persistence
    jobSnapshot: {
      type: jobSnapshotSchema,
      required: true,
    },
    
    // Tracking metadata
    status: {
      type: String,
      enum: ['saved', 'applied', 'phone-screen', 'interview', 'offer', 'rejected'],
      default: 'saved',
      index: true,
    },
    
    // Timeline tracking
    appliedAt: Date,
    statusHistory: [statusHistorySchema],
    
    // Notes and reminders
    notes: String,
    reminder: Date,
    
    // Interview details
    interviews: [interviewSchema],
    
    // Contacts
    contacts: [contactSchema],
    
    // Additional metadata
    priority: { type: Number, min: 1, max: 5, default: 3 }, // 1-5 stars
    color: String, // Custom tag color
    applicationSource: String, // Where applied: 'company-website', 'linkedin', 'indeed', etc.
    resumeVersion: String, // Which resume version was used
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for common queries
trackingSchema.index({ userId: 1, status: 1 });
trackingSchema.index({ userId: 1, createdAt: -1 });
trackingSchema.index({ userId: 1, jobId: 1 }, { unique: true, sparse: true }); // One tracking per user per job

// Virtual for tracked time calculation
trackingSchema.virtual('trackedDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to get current stage duration
trackingSchema.methods.getCurrentStageDuration = function() {
  if (this.statusHistory.length === 0) return 0;
  const lastChange = this.statusHistory[this.statusHistory.length - 1].date;
  return Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
};

const Tracking = mongoose.model('Tracking', trackingSchema);

export default Tracking;
