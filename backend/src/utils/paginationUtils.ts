import { DEFAULTS } from '../constants'
import { PaginationParams, PaginatedResult } from '../types'

export const parsePaginationParams = (
  page?: string | number,
  limit?: string | number
): PaginationParams => {
  const parsedPage = Math.max(1, parseInt(String(page ?? DEFAULTS.PAGE), 10) || DEFAULTS.PAGE)
  const parsedLimit = Math.min(
    DEFAULTS.MAX_LIMIT,
    Math.max(1, parseInt(String(limit ?? DEFAULTS.LIMIT), 10) || DEFAULTS.LIMIT)
  )
  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  }
}

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / params.limit)
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}
