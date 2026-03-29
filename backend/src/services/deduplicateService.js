import Job from '../models/Job.js';
import { generateJobHash } from '../utils/scoring.js';
import { createNotification } from './notificationService.js';

/**
 * Deduplication Service
 * Removes duplicate jobs from the database based on title + company + location hash
 */

/**
 * Check if a job already exists based on hash
 * @param {string} hash - Deduplication hash
 * @returns {Promise<object>} Job object or null
 */
export const findJobByHash = async (hash) => {
  return await Job.findOne({ hash });
};

/**
 * Deduplicate jobs and identify which are new vs existing
 * Returns both new jobs to insert and existing jobs to update
 * 
 * @param {Array} jobs - Array of job objects from fetchers
 * @returns {Promise<object>} { newJobs: [], existingJobs: [] }
 */
export const deduplicateJobs = async (jobs) => {
  const newJobs = [];
  const existingJobs = [];
  const seenHashes = new Set();

  console.log(`🔍 Deduplicating ${jobs.length} jobs...`);

  for (const job of jobs) {
    const hash = generateJobHash(job.title, job.company, job.location);

    // Skip if we've already processed this hash in this batch
    if (seenHashes.has(hash)) {
      console.log(`   ⏭️  Skipped (batch duplicate): ${job.title}`);
      continue;
    }

    // Check if this job already exists in database
    const existingJob = await Job.findOne({ hash });
    if (existingJob) {
      console.log(`   🔄 Update: ${job.title} (existing ID: ${existingJob._id})`);
      existingJobs.push({
        hash,
        data: job,
        id: existingJob._id,
      });
    } else {
      console.log(`   ✅ New: ${job.title} (hash: ${hash.substring(0, 8)}...)`);
      newJobs.push({
        ...job,
        hash,
      });
    }

    seenHashes.add(hash);
  }

  console.log(`✓ Deduplicated: ${jobs.length} → ${newJobs.length} new + ${existingJobs.length} updates`);

  return { newJobs, existingJobs };
};

/**
 * Mark old jobs as inactive (optional archiving)
 * Keeps database clean by soft-deleting stale jobs
 * 
 * @param {number} daysOld - Mark jobs older than this many days as inactive
 * @returns {Promise<number>} Number of jobs archived
 */
export const archiveOldJobs = async (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Job.updateMany(
    {
      postedAt: { $lt: cutoffDate },
      isActive: true,
    },
    { isActive: false }
  );

  console.log(`📦 Archived ${result.modifiedCount} jobs older than ${daysOld} days`);

  return result.modifiedCount;
};

/**
 * HARD DELETE old jobs (MongoDB Free Tier Cleanup)
 * Permanently removes jobs older than N days to save storage
 * Use this for Atlas free tier to stay under 512MB limit
 * 
 * @param {number} daysOld - Delete jobs older than this many days (default: 60)
 * @returns {Promise<object>} {deletedCount, freedMB}
 */
export const deleteOldJobs = async (daysOld = 60) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Count total size before deletion (approximate)
    const jobsToDelete = await Job.find({
      postedAt: { $lt: cutoffDate }
    });

    const deletedCount = jobsToDelete.length;
    const estimatedMB = (deletedCount * 0.008).toFixed(2); // Rough estimate: 8KB per job

    // Perform hard delete
    const result = await Job.deleteMany({
      postedAt: { $lt: cutoffDate }
    });

    console.log(`🗑️  DELETED ${result.deletedCount} jobs older than ${daysOld} days (freed ~${estimatedMB}MB)`);

    // Notification: Only if jobs were deleted
    if (result.deletedCount > 0) {
      const now = new Date();
      const dedupKey = `cleanup-${now.toISOString().slice(0,10)}`; // day granularity
      await createNotification({
        message: `${result.deletedCount} old jobs deleted`,
        type: 'warning',
        meta: { deletedCount: result.deletedCount, freedMB: estimatedMB, cutoffDate: cutoffDate.toISOString() },
        dedupKey,
      });
    }

    return {
      deletedCount: result.deletedCount,
      freedMB: estimatedMB,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error('❌ Error deleting old jobs:', error.message);
    throw error;
  }
};
