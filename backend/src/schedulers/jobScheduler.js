import cron from 'node-cron';
import { runJobIngestionPipeline } from '../services/aggregationService.js';
import { deleteOldJobs } from '../services/deduplicateService.js';
import { config } from '../config/index.js';

/**
 * Job Scheduler
 * Handles periodic job ingestion using cron jobs
 */

let scheduledJob = null;
let cleanupJob = null;

/**
 * Start the job ingestion scheduler
 * Runs based on FETCH_INTERVAL_HOURS from configuration
 * Also starts a weekly cleanup job (Sundays at 2 AM) for Atlas free tier
 * 
 * @returns {boolean} True if scheduler was started
 */
export const startScheduler = () => {
  try {

    // Use INGEST_CRON_EXPRESSION from env if provided, else fallback to interval-based scheduling
    let cronExpression = config.ingestCronExpression;
    let scheduleMsg = '';
    if (!cronExpression) {
      const intervalHours = config.fetchIntervalHours || 3;
      cronExpression = `0 0 */${intervalHours} * * *`;
      scheduleMsg = `every ${intervalHours} hour(s)`;
    } else {
      scheduleMsg = `custom cron: ${cronExpression}`;
    }

    console.log(`\n⏰ Scheduling job ingestion (${scheduleMsg})`);
    console.log(`📋 Cron expression: ${cronExpression}\n`);

    scheduledJob = cron.schedule(cronExpression, async () => {
      console.log(`[${new Date().toISOString()}] 🔄 Scheduled job ingestion triggered`);
      // Fetch jobs posted in last 3 days to maximize new records
      await runJobIngestionPipeline({ timePeriod: '3days' });
    });

    // Weekly cleanup: Sunday at 2 AM (for Atlas free tier storage management)
    console.log(`\n🗑️  Scheduling cleanup job every Sunday at 2:00 AM (delete jobs 20+ days old)`);
    cleanupJob = cron.schedule('0 2 * * 0', async () => {
      console.log(`[${new Date().toISOString()}] 🧹 Weekly cleanup triggered`);
      try {
        const result = await deleteOldJobs(20);
        console.log(`✓ Cleanup completed: Deleted ${result.deletedCount} jobs, freed ${result.freedMB}MB`);
      } catch (error) {
        console.error(`✗ Cleanup error: ${error.message}`);
      }
    });

    console.log('✓ Job scheduler initialized');
    console.log('✓ Cleanup scheduler initialized (Sunday 2 AM UTC)\n');

    return true;
  } catch (error) {
    console.error('✗ Scheduler initialization error:', error.message);
    return false;
  }
};

/**
 * Stop the job ingestion scheduler
 */
export const stopScheduler = () => {
  if (scheduledJob) {
    scheduledJob.stop();
    if (scheduledJob.destroy) {
      scheduledJob.destroy();
    }
    scheduledJob = null;
    console.log('✓ Job scheduler stopped');
  }
  if (cleanupJob) {
    cleanupJob.stop();
    if (cleanupJob.destroy) {
      cleanupJob.destroy();
    }
    cleanupJob = null;
    console.log('✓ Cleanup scheduler stopped');
  }
};

/**
 * Get scheduler status
 * @returns {object} Scheduler status information
 */
export const getSchedulerStatus = () => {
  return {
    isRunning: scheduledJob !== null && !scheduledJob._destroyed,
    intervalHours: config.fetchIntervalHours,
    nextRun: scheduledJob ? 'Check logs for next run' : 'Not scheduled',
  };
};
