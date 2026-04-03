/**
 * User Model
 * Handles user authentication and profile data
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Authentication fields
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    
    // Profile data
    profileType: {
      type: String,
      enum: ['job-seeker', 'recruiter'],
      default: 'job-seeker',
    },
    skills: [String],
    experience: Number,
    location: String,
    bio: String,
    
    // Job-related data
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    
    applications: [
      {
        // Reference to Job (optional, may be null if job deleted)
        jobId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Job',
        },
        
        // Job Snapshot: Full job details embedded for persistence
        // This ensures tracking data persists even after job is deleted
        jobSnapshot: {
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
        },
        
        // Tracking metadata
        status: {
          type: String,
          enum: ['saved', 'applied', 'phone-screen', 'interview', 'offer', 'rejected'],
          default: 'saved',
        },
        
        // Timeline tracking
        appliedAt: Date,
        statusHistory: [
          {
            status: String,
            date: { type: Date, default: Date.now },
            notes: String,
          }
        ],
        
        // Notes and reminders
        notes: String,
        reminder: Date,
        
        // Interview details
        interviews: [
          {
            date: Date,
            type: { type: String, enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'other'] },
            notes: String,
            duration: Number, // in minutes
            interviewer: String,
          }
        ],
        
        // Contacts
        contacts: [
          {
            name: String,
            email: String,
            phone: String,
            role: String,
            linkedIn: String,
          }
        ],
        
        // Additional metadata
        priority: { type: Number, min: 1, max: 5, default: 3 }, // 1-5 stars
        color: String, // Custom tag color
        applicationSource: String, // Where applied: 'company-website', 'linkedin', 'indeed', etc.
        resumeVersion: String, // Which resume version was used
        
        // Timestamps
        trackedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    
    savedSearches: [
      {
        name: String,
        filters: mongoose.Schema.Types.Mixed,
        notifyOnNew: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // Preferences
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      salaryMin: Number,
      salaryMax: Number,
      preferredLocations: [String],
      jobTypes: [String],
    },
    
    // Stats
    reviewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    profileType: this.profileType,
    skills: this.skills,
    experience: this.experience,
    location: this.location,
    bio: this.bio,
    preferences: this.preferences,
    savedJobsCount: this.savedJobs.length,
    applicationsCount: this.applications.length,
    reviewsCount: this.reviewsCount,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
