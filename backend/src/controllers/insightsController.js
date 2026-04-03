/**
 * Insights Controller
 * Provides personalized analytics and stats for user's job search
 */

import Tracking from '../models/Tracking.js';
import mongoose from 'mongoose';

/**
 * Get dashboard overview stats
 * GET /api/insights/overview
 */
export const getOverviewStats = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all tracking data for user
    const trackings = await Tracking.find({ userId: userObjectId });

    if (trackings.length === 0) {
      return reply.send({
        success: true,
        data: {
          totalApplications: 0,
          statusBreakdown: {},
          responseRate: 0,
          avgTimeToResponse: null,
          thisWeekApplications: 0,
          lastWeekApplications: 0,
          weeklyGrowth: 0,
          topCompanies: [],
          priorityDistribution: {},
        },
      });
    }

    // Calculate stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Status breakdown
    const statusBreakdown = {};
    trackings.forEach((t) => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
    });

    // Response rate (applications that got past 'applied' status)
    const appliedOrBeyond = trackings.filter((t) => t.status !== 'saved');
    const gotResponse = trackings.filter((t) =>
      ['phone-screen', 'interview', 'offer', 'rejected'].includes(t.status)
    );
    const responseRate =
      appliedOrBeyond.length > 0
        ? Math.round((gotResponse.length / appliedOrBeyond.length) * 100)
        : 0;

    // Applications this week vs last week
    const thisWeekApplications = trackings.filter(
      (t) => new Date(t.createdAt) >= oneWeekAgo
    ).length;
    const lastWeekApplications = trackings.filter(
      (t) =>
        new Date(t.createdAt) >= twoWeeksAgo &&
        new Date(t.createdAt) < oneWeekAgo
    ).length;
    const weeklyGrowth =
      lastWeekApplications > 0
        ? Math.round(
            ((thisWeekApplications - lastWeekApplications) /
              lastWeekApplications) *
              100
          )
        : thisWeekApplications > 0
        ? 100
        : 0;

    // Average time to response (days between applied and next status)
    const responseTimes = [];
    trackings.forEach((t) => {
      if (t.statusHistory && t.statusHistory.length >= 2) {
        const appliedEntry = t.statusHistory.find((h) => h.status === 'applied');
        const responseEntry = t.statusHistory.find((h) =>
          ['phone-screen', 'interview', 'offer', 'rejected'].includes(h.status)
        );
        if (appliedEntry && responseEntry) {
          const days =
            (new Date(responseEntry.date) - new Date(appliedEntry.date)) /
            (1000 * 60 * 60 * 24);
          if (days > 0 && days < 365) {
            responseTimes.push(days);
          }
        }
      }
    });
    const avgTimeToResponse =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          )
        : null;

    // Top companies
    const companyCounts = {};
    trackings.forEach((t) => {
      const company = t.jobSnapshot?.company || 'Unknown';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Priority distribution
    const priorityDistribution = {};
    trackings.forEach((t) => {
      const priority = t.priority || 3;
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
    });

    return reply.send({
      success: true,
      data: {
        totalApplications: trackings.length,
        statusBreakdown,
        responseRate,
        avgTimeToResponse,
        thisWeekApplications,
        lastWeekApplications,
        weeklyGrowth,
        topCompanies,
        priorityDistribution,
      },
    });
  } catch (error) {
    console.error('Error getting overview stats:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get overview stats',
      message: error.message,
    });
  }
};

/**
 * Get application trends over time
 * GET /api/insights/trends
 */
export const getApplicationTrends = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { period = '30' } = request.query; // days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get trackings within period
    const trackings = await Tracking.find({
      userId: userObjectId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    // Group by date
    const dailyCounts = {};
    const statusByDate = {};

    for (let i = 0; i < daysAgo; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysAgo - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailyCounts[dateKey] = 0;
      statusByDate[dateKey] = {
        saved: 0,
        applied: 0,
        'phone-screen': 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      };
    }

    trackings.forEach((t) => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++;
      }
    });

    // Also track status changes by date
    trackings.forEach((t) => {
      if (t.statusHistory) {
        t.statusHistory.forEach((h) => {
          const dateKey = new Date(h.date).toISOString().split('T')[0];
          if (statusByDate[dateKey] && statusByDate[dateKey][h.status] !== undefined) {
            statusByDate[dateKey][h.status]++;
          }
        });
      }
    });

    // Format for charts
    const trendData = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      applications: count,
      ...statusByDate[date],
    }));

    // Calculate cumulative totals
    let cumulative = 0;
    const cumulativeData = trendData.map((d) => {
      cumulative += d.applications;
      return { ...d, cumulative };
    });

    return reply.send({
      success: true,
      data: {
        daily: trendData,
        cumulative: cumulativeData,
        period: daysAgo,
      },
    });
  } catch (error) {
    console.error('Error getting application trends:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get application trends',
      message: error.message,
    });
  }
};

/**
 * Get breakdown by job sources
 * GET /api/insights/sources
 */
export const getSourcesBreakdown = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const trackings = await Tracking.find({ userId: userObjectId });

    // Count by source
    const sourceCounts = {};
    const sourceSuccessRates = {};

    trackings.forEach((t) => {
      const source = t.jobSnapshot?.source || 'unknown';
      if (!sourceCounts[source]) {
        sourceCounts[source] = { total: 0, responses: 0, offers: 0 };
      }
      sourceCounts[source].total++;

      if (['phone-screen', 'interview', 'offer', 'rejected'].includes(t.status)) {
        sourceCounts[source].responses++;
      }
      if (t.status === 'offer') {
        sourceCounts[source].offers++;
      }
    });

    // Calculate success rates
    const sources = Object.entries(sourceCounts).map(([name, data]) => ({
      name: formatSourceName(name),
      total: data.total,
      responses: data.responses,
      offers: data.offers,
      responseRate: data.total > 0 ? Math.round((data.responses / data.total) * 100) : 0,
      offerRate: data.total > 0 ? Math.round((data.offers / data.total) * 100) : 0,
    }));

    // Sort by total applications
    sources.sort((a, b) => b.total - a.total);

    return reply.send({
      success: true,
      data: sources,
    });
  } catch (error) {
    console.error('Error getting sources breakdown:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get sources breakdown',
      message: error.message,
    });
  }
};

/**
 * Get skills analysis from tracked jobs
 * GET /api/insights/skills
 */
export const getSkillsAnalysis = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const trackings = await Tracking.find({ userId: userObjectId });

    // Extract keywords from all job snapshots
    const keywordCounts = {};
    const keywordByStatus = {};

    trackings.forEach((t) => {
      const keywords = t.jobSnapshot?.keywords || [];
      keywords.forEach((keyword) => {
        const kw = keyword.toLowerCase().trim();
        if (kw.length > 1) {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;

          if (!keywordByStatus[kw]) {
            keywordByStatus[kw] = { total: 0, offers: 0, interviews: 0 };
          }
          keywordByStatus[kw].total++;
          if (t.status === 'offer') keywordByStatus[kw].offers++;
          if (['interview', 'phone-screen'].includes(t.status)) {
            keywordByStatus[kw].interviews++;
          }
        }
      });
    });

    // Get top keywords with success rates
    const skills = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({
        keyword,
        count,
        offers: keywordByStatus[keyword]?.offers || 0,
        interviews: keywordByStatus[keyword]?.interviews || 0,
        successRate:
          count > 0
            ? Math.round(
                ((keywordByStatus[keyword]?.offers || 0) / count) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Group skills by category (rough categorization)
    const categories = {
      languages: [],
      frameworks: [],
      tools: [],
      soft: [],
      other: [],
    };

    const languageKeywords = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin'];
    const frameworkKeywords = ['react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring', 'nextjs', 'next.js', 'nest', 'fastify'];
    const toolKeywords = ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'ci/cd', 'jenkins', 'terraform', 'mongodb', 'postgresql', 'redis'];
    const softKeywords = ['communication', 'leadership', 'teamwork', 'problem-solving', 'agile', 'scrum'];

    skills.forEach((skill) => {
      const kw = skill.keyword.toLowerCase();
      if (languageKeywords.some((l) => kw.includes(l))) {
        categories.languages.push(skill);
      } else if (frameworkKeywords.some((f) => kw.includes(f))) {
        categories.frameworks.push(skill);
      } else if (toolKeywords.some((t) => kw.includes(t))) {
        categories.tools.push(skill);
      } else if (softKeywords.some((s) => kw.includes(s))) {
        categories.soft.push(skill);
      } else {
        categories.other.push(skill);
      }
    });

    return reply.send({
      success: true,
      data: {
        topSkills: skills,
        categories,
        totalUniqueSkills: Object.keys(keywordCounts).length,
      },
    });
  } catch (error) {
    console.error('Error getting skills analysis:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get skills analysis',
      message: error.message,
    });
  }
};

/**
 * Get goals and progress
 * GET /api/insights/goals
 */
export const getGoalsProgress = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // This week's stats
    const thisWeekTrackings = await Tracking.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: startOfWeek },
    });

    const thisWeekApplied = await Tracking.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: startOfWeek },
      status: { $ne: 'saved' },
    });

    // This month's stats
    const thisMonthTrackings = await Tracking.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: startOfMonth },
    });

    const thisMonthInterviews = await Tracking.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: startOfMonth },
      status: { $in: ['phone-screen', 'interview'] },
    });

    // Default goals (can be customized in future)
    const goals = {
      weeklyApplications: {
        target: 10,
        current: thisWeekTrackings,
        label: 'Weekly Applications',
      },
      weeklyApplied: {
        target: 5,
        current: thisWeekApplied,
        label: 'Weekly Applied',
      },
      monthlyApplications: {
        target: 30,
        current: thisMonthTrackings,
        label: 'Monthly Applications',
      },
      monthlyInterviews: {
        target: 3,
        current: thisMonthInterviews,
        label: 'Monthly Interviews',
      },
    };

    // Calculate streaks
    const allTrackings = await Tracking.find({ userId: userObjectId })
      .select('createdAt')
      .sort({ createdAt: -1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    const uniqueDates = [
      ...new Set(
        allTrackings.map((t) => new Date(t.createdAt).toDateString())
      ),
    ];

    uniqueDates.forEach((dateStr, index) => {
      const date = new Date(dateStr);
      if (index === 0) {
        tempStreak = 1;
        if (isToday(date) || isYesterday(date)) {
          currentStreak = 1;
        }
      } else {
        const prevDate = new Date(uniqueDates[index - 1]);
        const diffDays = Math.floor(
          (prevDate - date) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          tempStreak++;
          if (currentStreak > 0) currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    return reply.send({
      success: true,
      data: {
        goals,
        streaks: {
          current: currentStreak,
          longest: longestStreak,
        },
      },
    });
  } catch (error) {
    console.error('Error getting goals progress:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get goals progress',
      message: error.message,
    });
  }
};

// Helper functions
function formatSourceName(source) {
  const names = {
    'google-jobs': 'Google Jobs',
    remotive: 'Remotive',
    manual: 'Manual Entry',
    unknown: 'Unknown',
  };
  return names[source] || source.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}
