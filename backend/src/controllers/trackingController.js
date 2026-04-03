/**
 * Tracking Controller
 * Handles job application tracking operations
 * Uses separate Tracking collection for better scalability
 */

import Tracking from '../models/Tracking.js';
import Job from '../models/Job.js';
import mongoose from 'mongoose';

/**
 * Track a new job (add to tracking)
 * POST /api/tracking
 */
export const trackJob = async (request, reply) => {
  try {
    const { jobId, status = 'saved', notes, priority, applicationSource } = request.body;
    const userId = request.user.userId;

    // Validate jobId
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: 'Valid job ID is required',
      });
    }

    // Find the job to create snapshot
    const job = await Job.findById(jobId);
    if (!job) {
      return reply.status(404).send({
        success: false,
        error: 'Job not found',
      });
    }

    // Check if already tracking this job
    const existingTracking = await Tracking.findOne({ userId, jobId });
    if (existingTracking) {
      return reply.status(400).send({
        success: false,
        error: 'Job is already being tracked',
        trackingId: existingTracking._id,
      });
    }

    // Create job snapshot
    const jobSnapshot = {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      sourceUrl: job.sourceUrl,
      source: job.source,
      postedAt: job.postedAt,
      fetchedAt: job.fetchedAt,
      salary: job.salary || {},
      keywords: job.keywords || [],
      score: job.score,
    };

    // Create tracking entry
    const tracking = new Tracking({
      userId,
      jobId: job._id,
      jobSnapshot,
      status,
      notes,
      priority: priority || 3,
      applicationSource,
      statusHistory: [
        {
          status,
          date: new Date(),
          notes: `Job added to tracker${notes ? ': ' + notes : ''}`,
        }
      ],
      appliedAt: status === 'applied' ? new Date() : null,
    });

    await tracking.save();

    return reply.status(201).send({
      success: true,
      message: 'Job tracked successfully',
      data: {
        trackingId: tracking._id,
        tracking,
      },
    });

  } catch (error) {
    console.error('Error tracking job:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to track job',
      message: error.message,
    });
  }
};

/**
 * Get all tracked jobs for current user
 * GET /api/tracking
 * Supports pagination: ?page=1&limit=20
 */
export const getTrackedJobs = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const { 
      status, 
      sortBy = 'updatedAt', 
      order = 'desc',
      page = 1,
      limit = 1000, // Default high limit for backward compatibility
    } = request.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Convert to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Calculate skip
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalCount = await Tracking.countDocuments(query);

    // Fetch paginated data
    const applications = await Tracking.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);

    return reply.send({
      success: true,
      count: applications.length,
      data: applications,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching tracked jobs:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch tracked jobs',
      message: error.message,
    });
  }
};

/**
 * Get single tracked job
 * GET /api/tracking/:trackingId
 */
export const getTrackedJob = async (request, reply) => {
  try {
    const { trackingId } = request.params;
    const userId = request.user.userId;

    const tracking = await Tracking.findOne({ _id: trackingId, userId });
    if (!tracking) {
      return reply.status(404).send({
        success: false,
        error: 'Tracking not found',
      });
    }

    return reply.send({
      success: true,
      data: tracking,
    });

  } catch (error) {
    console.error('Error fetching tracked job:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch tracked job',
      message: error.message,
    });
  }
};

/**
 * Update tracked job
 * PATCH /api/tracking/:trackingId
 */
export const updateTrackedJob = async (request, reply) => {
  try {
    const { trackingId } = request.params;
    const userId = request.user.userId;
    const updates = request.body;

    const tracking = await Tracking.findOne({ _id: trackingId, userId });
    if (!tracking) {
      return reply.status(404).send({
        success: false,
        error: 'Tracking not found',
      });
    }

    // Track status changes in history
    if (updates.status && updates.status !== tracking.status) {
      tracking.statusHistory.push({
        status: updates.status,
        date: new Date(),
        notes: updates.statusChangeNotes || `Status changed to ${updates.status}`,
      });

      // Set appliedAt when status changes to 'applied'
      if (updates.status === 'applied' && !tracking.appliedAt) {
        tracking.appliedAt = new Date();
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'status', 'notes', 'reminder', 'priority', 
      'color', 'applicationSource', 'resumeVersion'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        tracking[field] = updates[field];
      }
    });

    // Handle nested updates
    if (updates.interviews) {
      tracking.interviews = updates.interviews;
    }
    if (updates.contacts) {
      tracking.contacts = updates.contacts;
    }

    await tracking.save();

    return reply.send({
      success: true,
      message: 'Tracking updated successfully',
      data: tracking,
    });

  } catch (error) {
    console.error('Error updating tracked job:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update tracked job',
      message: error.message,
    });
  }
};

/**
 * Add interview to tracked job
 * POST /api/tracking/:trackingId/interviews
 */
export const addInterview = async (request, reply) => {
  try {
    const { trackingId } = request.params;
    const userId = request.user.userId;
    const { date, type, notes, duration, interviewer } = request.body;

    if (!date || !type) {
      return reply.status(400).send({
        success: false,
        error: 'Interview date and type are required',
      });
    }

    const tracking = await Tracking.findOne({ _id: trackingId, userId });
    if (!tracking) {
      return reply.status(404).send({
        success: false,
        error: 'Tracking not found',
      });
    }

    tracking.interviews.push({
      date: new Date(date),
      type,
      notes,
      duration,
      interviewer,
    });

    await tracking.save();

    return reply.send({
      success: true,
      message: 'Interview added successfully',
      data: tracking,
    });

  } catch (error) {
    console.error('Error adding interview:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to add interview',
      message: error.message,
    });
  }
};

/**
 * Add contact to tracked job
 * POST /api/tracking/:trackingId/contacts
 */
export const addContact = async (request, reply) => {
  try {
    const { trackingId } = request.params;
    const userId = request.user.userId;
    const { name, email, phone, role, linkedIn } = request.body;

    if (!name) {
      return reply.status(400).send({
        success: false,
        error: 'Contact name is required',
      });
    }

    const tracking = await Tracking.findOne({ _id: trackingId, userId });
    if (!tracking) {
      return reply.status(404).send({
        success: false,
        error: 'Tracking not found',
      });
    }

    tracking.contacts.push({
      name,
      email,
      phone,
      role,
      linkedIn,
    });

    await tracking.save();

    return reply.send({
      success: true,
      message: 'Contact added successfully',
      data: tracking,
    });

  } catch (error) {
    console.error('Error adding contact:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to add contact',
      message: error.message,
    });
  }
};

/**
 * Delete tracked job
 * DELETE /api/tracking/:trackingId
 */
export const deleteTrackedJob = async (request, reply) => {
  try {
    const { trackingId } = request.params;
    const userId = request.user.userId;

    const tracking = await Tracking.findOneAndDelete({ _id: trackingId, userId });
    if (!tracking) {
      return reply.status(404).send({
        success: false,
        error: 'Tracking not found',
      });
    }

    return reply.send({
      success: true,
      message: 'Tracking deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting tracked job:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete tracked job',
      message: error.message,
    });
  }
};

/**
 * Get tracking analytics
 * GET /api/tracking/analytics
 */
export const getTrackingAnalytics = async (request, reply) => {
  try {
    const userId = request.user.userId;

    const applications = await Tracking.find({ userId });

    // Count by status
    const byStatus = {
      saved: 0,
      applied: 0,
      'phone-screen': 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach(app => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    });

    // Calculate response rate
    const appliedCount = byStatus.applied + byStatus['phone-screen'] + 
                         byStatus.interview + byStatus.offer + byStatus.rejected;
    const respondedCount = byStatus['phone-screen'] + byStatus.interview + 
                           byStatus.offer + byStatus.rejected;
    const responseRate = appliedCount > 0 ? 
                         ((respondedCount / appliedCount) * 100).toFixed(1) : 0;

    // Calculate conversion rates
    const interviewRate = appliedCount > 0 ? 
                          (((byStatus.interview + byStatus.offer) / appliedCount) * 100).toFixed(1) : 0;
    const offerRate = appliedCount > 0 ? 
                      ((byStatus.offer / appliedCount) * 100).toFixed(1) : 0;

    // Group by company
    const byCompany = {};
    applications.forEach(app => {
      const company = app.jobSnapshot.company;
      byCompany[company] = (byCompany[company] || 0) + 1;
    });

    // Group by location
    const byLocation = {};
    applications.forEach(app => {
      const location = app.jobSnapshot.location;
      byLocation[location] = (byLocation[location] || 0) + 1;
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentApplications = applications.filter(app => 
      app.createdAt >= thirtyDaysAgo
    ).length;

    // Average time in each stage
    const stageTimes = {
      applied: [],
      'phone-screen': [],
      interview: [],
    };

    applications.forEach(app => {
      if (app.statusHistory && app.statusHistory.length > 1) {
        for (let i = 1; i < app.statusHistory.length; i++) {
          const prevStatus = app.statusHistory[i - 1].status;
          const currentDate = new Date(app.statusHistory[i].date);
          const prevDate = new Date(app.statusHistory[i - 1].date);
          const days = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          
          if (stageTimes[prevStatus]) {
            stageTimes[prevStatus].push(days);
          }
        }
      }
    });

    const avgStageTimes = {};
    Object.keys(stageTimes).forEach(stage => {
      const times = stageTimes[stage];
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        avgStageTimes[stage] = Math.round(avg);
      }
    });

    return reply.send({
      success: true,
      data: {
        total: applications.length,
        byStatus,
        responseRate: parseFloat(responseRate),
        interviewRate: parseFloat(interviewRate),
        offerRate: parseFloat(offerRate),
        byCompany,
        byLocation,
        recentApplications,
        avgStageTimes,
      },
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message,
    });
  }
};

/**
 * Check if a job is being tracked
 * GET /api/tracking/check/:jobId
 */
export const checkJobTracking = async (request, reply) => {
  try {
    const { jobId } = request.params;
    const userId = request.user.userId;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid job ID',
      });
    }

    const tracking = await Tracking.findOne({ userId, jobId });

    return reply.send({
      success: true,
      isTracked: !!tracking,
      tracking: tracking || null,
    });

  } catch (error) {
    console.error('Error checking job tracking:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to check job tracking',
      message: error.message,
    });
  }
};
