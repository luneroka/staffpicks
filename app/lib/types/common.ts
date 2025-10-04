/**
 * Common type definitions used across the application
 */

/**
 * User reference for populated fields
 */
export interface UserReference {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Store reference
 */
export interface StoreReference {
  _id?: string;
  name?: string;
  code?: string;
}

/**
 * Company reference
 */
export interface CompanyReference {
  _id?: string;
  name?: string;
}

/**
 * Generic component props
 */
export interface WithUserRole {
  userRole?: string;
}

export interface WithClassName {
  className?: string;
}
