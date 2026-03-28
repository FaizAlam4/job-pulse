import Job from '../models/Job.js';
import { generateJobHash } from '../utils/scoring.js';

/**
 * Deduplication Service
 * Removes duplicate jobs from the database based on title + company + location hash
 */

/**
 * Check if a job already exists based on hash
 * @param {string} hash - Deduplication hash
 * @returns {Promise<boolean>}
 */
export const jobExists = async (hash) => {
  const existing = await Job.findOne({ hash });
  return !!existing;
};

/**
 * Deduplicate jobs before saving
 * Removes duplicates from the incoming batch
 * 
 * @param {Array} jobs - Array of job objects from fetchers
 * @returns {Promise<Array>} Deduplicated jobs
 */
export const deduplicateJobs = async (jobs) => {
  const deduplicated = [];
  const seenHashes = new Set();

  console.log(`🔍 Deduplicating ${jobs.length} jobs...`);

  for (const job of jobs) {
    const hash = generateJobHash(job.title, job.company, job.location);

    // Skip if we've already processed this hash in this batch
    if (seenHashes.has(hash)) {
      console.log(`   ⏭️  Skipped (batch duplicate): ${job.title}`);
      continue;
    }

    // Skip if this job already exists in database
    const exists = await jobExists(hash);
    if (exists) {
      console.log(`   ⏭️  Skipped (DB duplicate): ${job.title}`);
      continue;
    }

    seenHashes.add(hash);
    const jobWithHash = {
      ...job,
      hash,
    };
    deduplicated.push(jobWithHash);
    console.log(`   ✅ Added: ${job.title} (hash: ${hash.substring(0, 8)}...)`);
  }

  console.log(`✓ Deduplicated: ${jobs.length} → ${deduplicated.length} jobs`);

  return deduplicated;
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
