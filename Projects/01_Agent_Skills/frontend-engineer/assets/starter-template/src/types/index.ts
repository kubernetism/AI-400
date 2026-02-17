/**
 * Common type definitions
 */

/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * User type
 */
export interface User extends BaseEntity {
  email: string
  name: string
  avatar?: string
}

/**
 * Server action result
 */
export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

/**
 * Navigation item
 */
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  external?: boolean
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  title: string
  href?: string
}

/**
 * Toast notification
 */
export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}
