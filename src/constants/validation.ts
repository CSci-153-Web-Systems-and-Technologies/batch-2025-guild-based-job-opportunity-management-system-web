/**
 * Validation constants for forms and API inputs.
 * These values are used across components and API routes to ensure
 * consistency in validation rules.
 */

export const PARTY_VALIDATION = {
  NAME_MIN: 3,
  NAME_MAX: 50,
  DESCRIPTION_MAX: 500,
} as const

/**
 * Pagination constants for API responses.
 * DEFAULT_LIMIT is used when no limit is provided in query params.
 * MAX_LIMIT is the upper bound to prevent performance issues.
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const
