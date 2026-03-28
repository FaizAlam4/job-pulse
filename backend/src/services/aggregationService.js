import Job from '../models/Job.js';
import { fetchAllJobs } from './fetcherService.js';
import { deduplicateJobs, archiveOldJobs } from './deduplicateService.js';
import { scoreAllJobs } from './scoringService.js';

/**
 * Job Aggregation Service
 * Orchestrates the complete pipeline: fetch → deduplicate → score → store
 */

/**
 * Complete job ingestion pipeline with filter support
 * 1. Fetch from all sources (with filters)
 * 2. Deduplicate
 * 3. Save to database
 * 4. Score all jobs
 * 5. Archive old jobs
 * 
 * @param {object} options - Filter options for fetching
 * @param {string} options.query - Search query (default: backend developer)
 * @param {string} options.location - Location filter (city, state)
 * @param {string} options.country - Country filter (USA, UK, India, etc.)
 * @param {string} options.remote - "true" for remote jobs only
 * @param {number} options.radius - Search radius in km
 * @param {string} options.timePeriod - yesterday, 3days, week, month
 * @param {string} options.jobType - fulltime, parttime, contract, internship
 * @returns {Promise<object>} Pipeline summary
 */
export const runJobIngestionPipeline = async (options = {}) => {
  console.log('\n====================================');
  console.log('🚀 Job Ingestion Pipeline Started');
  console.log('====================================\n');
  
  // Log active filters
  const activeFilters = Object.entries(options).filter(([, v]) => v);
  if (activeFilters.length > 0) {
    console.log('🎯 Active Filters:');
    activeFilters.forEach(([k, v]) => console.log(`   ${k}: ${v}`));
    console.log('');
  }

  const startTime = Date.now();
  const summary = {
    fetched: 0,
    deduplicated: 0,
    saved: 0,
    scored: 0,
    archived: 0,
    filters: options,
    error: null,
  };

  // Set timeout to prevent hanging
  const timeoutHandle = setTimeout(() => {
    console.error('\n⚠️  TIMEOUT: Pipeline exceeded 60 seconds. Check for hanging operations.');
  }, 60000);

  try {
    // Step 1: Fetch jobs from all sources (with filters)
    console.log('Step 1: Fetching jobs...');
    const rawJobs = await fetchAllJobs(options);
    summary.fetched = rawJobs.length;
    console.log(`✓ Step 1 complete: ${rawJobs.length} raw jobs fetched\n`);

    // Step 2: Deduplicate
    console.log('Step 2: Deduplicating...');
    const dedupJobs = await deduplicateJobs(rawJobs);
    summary.deduplicated = dedupJobs.length;
    console.log(`✓ Step 2 complete: ${dedupJobs.length} jobs after dedup\n`);

    // Step 3: Save to database
    console.log('Step 3: Saving to database...');
    if (dedupJobs.length > 0) {
      try {
        // Save jobs one by one using Job.create()
        console.log(`💾 Saving ${dedupJobs.length} jobs...`);
        for (let i = 0; i < dedupJobs.length; i++) {
          const job = dedupJobs[i];
          try {
            await Job.create(job);
            summary.saved++;
            console.log(`   ✅ ${i + 1}/${dedupJobs.length}: ${job.title}`);
          } catch (jobError) {
            console.error(`   ❌ ${i + 1}/${dedupJobs.length}: ${job.title}`);
            console.error(`      ${jobError.message}`);
          }
        }
        console.log(`\n✅ Save complete: ${summary.saved}/${dedupJobs.length} jobs saved`);
      } catch (error) {
        console.error(`\n❌ SAVE ERROR:`);
        console.error(`   Name: ${error.name}`);
        console.error(`   Message: ${error.message}`);
        console.error(`   Stack:`, error.stack);
        summary.error = error.message;
      }
    }
    console.log(`✓ Step 3 complete: ${summary.saved} jobs saved\n`);

    // Step 4: Score all jobs
    console.log('Step 4: Scoring jobs...');
    if (summary.saved > 0) {
      try {
        summary.scored = await scoreAllJobs();
      } catch (scoreError) {
        console.error(`❌ Scoring error:`, scoreError.message);
        summary.error = scoreError.message;
      }
    }
    console.log(`✓ Step 4 complete: ${summary.scored} jobs scored\n`);

    // Step 5: Archive old jobs
    console.log('Step 5: Archiving old jobs...');
    try {
      summary.archived = await archiveOldJobs(30);
    } catch (archiveError) {
      console.error(`❌ Archive error:`, archiveError.message);
      summary.error = archiveError.message;
    }
    console.log(`✓ Step 5 complete: ${summary.archived} jobs archived\n`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('====================================');
    console.log('✓ Pipeline Completed Successfully');
    console.log('====================================');
    console.log(`⏱ Duration: ${duration}s`);
    console.log(`📊 Summary:`);
    console.log(`   Fetched:       ${summary.fetched}`);
    console.log(`   Deduplicated:  ${summary.deduplicated}`);
    console.log(`   Saved:         ${summary.saved}`);
    console.log(`   Scored:        ${summary.scored}`);
    console.log(`   Archived:      ${summary.archived}`);
    console.log(`   Error:         ${summary.error || 'None'}`);
    console.log('====================================\n');

    return summary;
  } catch (error) {
    summary.error = error.message;
    console.error('\n✗ Pipeline Error:', error.message);
    console.error(error.stack);
    return summary;
  } finally {
    clearTimeout(timeoutHandle);
  }
};
