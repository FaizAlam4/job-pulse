/**
 * Shared JSON Schemas for Fastify route validation & Swagger documentation.
 *
 * Fastify uses these schemas for:
 *   1. Request/response validation (automatic 400 on invalid input)
 *   2. OpenAPI spec generation via @fastify/swagger
 *
 * Schemas are added to Fastify with `fastify.addSchema()` and referenced
 * via `$ref` in route definitions.
 */

// ─── Reusable building blocks ───────────────────────────────────────────────

export const paginationSchema = {
  $id: 'Pagination',
  type: 'object',
  properties: {
    currentPage: { type: 'integer', example: 1 },
    totalPages: { type: 'integer', example: 5 },
    totalCount: { type: 'integer', example: 100 },
    limit: { type: 'integer', example: 20 },
    hasNextPage: { type: 'boolean' },
    hasPrevPage: { type: 'boolean' },
  },
};

export const errorResponseSchema = {
  $id: 'ErrorResponse',
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

// ─── Job schemas ────────────────────────────────────────────────────────────

export const jobSchema = {
  $id: 'Job',
  type: 'object',
  properties: {
    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
    title: { type: 'string', example: 'Senior Backend Developer' },
    company: { type: 'string', example: 'Google' },
    location: { type: 'string', example: 'San Francisco, CA, USA' },
    description: { type: 'string' },
    source: { type: 'string', enum: ['google-jobs', 'remotive', 'manual'] },
    externalId: { type: 'string' },
    sourceUrl: { type: 'string', format: 'uri' },
    postedAt: { type: 'string', format: 'date-time' },
    fetchedAt: { type: 'string', format: 'date-time' },
    hash: { type: 'string' },
    score: { type: 'number', example: 0.85 },
    freshnessScore: { type: 'number' },
    relevanceScore: { type: 'number' },
    keywords: { type: 'array', items: { type: 'string' } },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const jobSummarySchema = {
  $id: 'JobSummary',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    title: { type: 'string' },
    company: { type: 'string' },
    location: { type: 'string' },
    score: { type: 'number' },
    postedAt: { type: 'string', format: 'date-time' },
  },
};

// ─── Auth schemas ───────────────────────────────────────────────────────────

export const userPublicSchema = {
  $id: 'UserPublic',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    profileType: { type: 'string', enum: ['job-seeker', 'recruiter'] },
    skills: { type: 'array', items: { type: 'string' } },
    experience: { type: 'number' },
    location: { type: 'string' },
    bio: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

export const registerBodySchema = {
  $id: 'RegisterBody',
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    password: { type: 'string', minLength: 6, example: 'Secret@123' },
    name: { type: 'string', example: 'Jane Doe' },
  },
};

export const loginBodySchema = {
  $id: 'LoginBody',
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' },
  },
};

// ─── Tracking schemas ───────────────────────────────────────────────────────

export const jobSnapshotSchema = {
  $id: 'JobSnapshot',
  type: 'object',
  properties: {
    title: { type: 'string' },
    company: { type: 'string' },
    location: { type: 'string' },
    description: { type: 'string' },
    sourceUrl: { type: 'string' },
    source: { type: 'string' },
    postedAt: { type: 'string', format: 'date-time' },
    fetchedAt: { type: 'string', format: 'date-time' },
    salary: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
        currency: { type: 'string' },
      },
    },
    keywords: { type: 'array', items: { type: 'string' } },
    score: { type: 'number' },
  },
};

const trackingStatusEnum = ['saved', 'applied', 'phone-screen', 'interview', 'offer', 'rejected'];

export const trackingSchema = {
  $id: 'Tracking',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    userId: { type: 'string' },
    jobId: { type: 'string' },
    jobSnapshot: { $ref: 'JobSnapshot#' },
    status: { type: 'string', enum: trackingStatusEnum },
    appliedAt: { type: 'string', format: 'date-time', nullable: true },
    statusHistory: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
    reminder: { type: 'string', format: 'date-time', nullable: true },
    interviews: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'other'] },
          notes: { type: 'string' },
          duration: { type: 'integer', description: 'Duration in minutes' },
          interviewer: { type: 'string' },
        },
      },
    },
    contacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string' },
          linkedIn: { type: 'string' },
        },
      },
    },
    priority: { type: 'integer', minimum: 1, maximum: 5 },
    color: { type: 'string' },
    applicationSource: { type: 'string' },
    resumeVersion: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const trackJobBodySchema = {
  $id: 'TrackJobBody',
  type: 'object',
  required: ['jobId'],
  properties: {
    jobId: { type: 'string', example: '507f1f77bcf86cd799439011' },
    status: { type: 'string', enum: trackingStatusEnum, default: 'saved' },
    notes: { type: 'string' },
    priority: { type: 'integer', minimum: 1, maximum: 5, default: 3 },
    applicationSource: { type: 'string', example: 'linkedin' },
  },
};

export const updateTrackingBodySchema = {
  $id: 'UpdateTrackingBody',
  type: 'object',
  properties: {
    status: { type: 'string', enum: trackingStatusEnum },
    notes: { type: 'string' },
    reminder: { type: 'string', format: 'date-time' },
    priority: { type: 'integer', minimum: 1, maximum: 5 },
    color: { type: 'string' },
    applicationSource: { type: 'string' },
    resumeVersion: { type: 'string' },
    statusChangeNotes: { type: 'string' },
    interviews: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'other'] },
          notes: { type: 'string' },
          duration: { type: 'integer' },
          interviewer: { type: 'string' },
        },
      },
    },
    contacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string' },
          linkedIn: { type: 'string' },
        },
      },
    },
  },
};

export const addInterviewBodySchema = {
  $id: 'AddInterviewBody',
  type: 'object',
  required: ['date', 'type'],
  properties: {
    date: { type: 'string', format: 'date-time' },
    type: { type: 'string', enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'other'] },
    notes: { type: 'string' },
    duration: { type: 'integer', description: 'Duration in minutes' },
    interviewer: { type: 'string' },
  },
};

export const addContactBodySchema = {
  $id: 'AddContactBody',
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    role: { type: 'string' },
    linkedIn: { type: 'string' },
  },
};

// ─── Notification schemas ───────────────────────────────────────────────────

export const notificationSchema = {
  $id: 'Notification',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    message: { type: 'string' },
    type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
    meta: { type: 'object', additionalProperties: true },
    dedupKey: { type: 'string' },
    isRead: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

export const createNotificationBodySchema = {
  $id: 'CreateNotificationBody',
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' },
    type: { type: 'string', enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    meta: { type: 'object', additionalProperties: true },
    dedupKey: { type: 'string' },
  },
};

// ─── Collect all schemas for registration ───────────────────────────────────

export const allSchemas = [
  paginationSchema,
  errorResponseSchema,
  jobSchema,
  jobSummarySchema,
  userPublicSchema,
  registerBodySchema,
  loginBodySchema,
  jobSnapshotSchema,
  trackingSchema,
  trackJobBodySchema,
  updateTrackingBodySchema,
  addInterviewBodySchema,
  addContactBodySchema,
  notificationSchema,
  createNotificationBodySchema,
];
