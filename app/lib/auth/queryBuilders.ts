/**
 * Query builder utilities for role-based access control
 * Centralized functions for building MongoDB queries with role-based filtering
 */

import { Types } from 'mongoose';
import { isCompanyAdmin, isStoreAdmin, isLibrarian } from './helpers';
import { SessionData } from './session';

/**
 * Build a MongoDB query with role-based filtering for books/lists
 *
 * Role-based filtering rules:
 * - CompanyAdmin: Sees all items in the company (no additional filters)
 * - StoreAdmin: Sees only items from their store
 * - Librarian: Sees only items they created or are assigned to
 *
 * @param session - User session with role information
 * @param baseQuery - Optional base query to extend (e.g., { deletedAt: { $exists: false } })
 * @returns MongoDB query object with role-based filters
 *
 * @example
 * // Simple usage
 * const query = buildRoleBasedQuery(session);
 *
 * @example
 * // With base query filters
 * const query = buildRoleBasedQuery(session, { deletedAt: { $exists: false } });
 */
export function buildRoleBasedQuery(
  session: SessionData,
  baseQuery: Record<string, any> = {}
): Record<string, any> {
  const query: any = {
    ...baseQuery,
    companyId: new Types.ObjectId(session.companyId!),
  };

  if (isCompanyAdmin(session)) {
    // CompanyAdmin sees all items in the company
    // No additional filters needed
  } else if (isStoreAdmin(session)) {
    // StoreAdmin sees only items from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (isLibrarian(session)) {
    // Librarian sees only items they created or are assigned to
    query.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  return query;
}
