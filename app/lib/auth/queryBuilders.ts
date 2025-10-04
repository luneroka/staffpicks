/**
 * Query builder utilities for role-based access control
 * Centralized functions for building MongoDB queries with role-based filtering
 */

import { Types } from 'mongoose';
import { isCompanyAdmin, isStoreAdmin, isLibrarian } from './helpers';
import { SessionData } from './session';
import { UserModel } from '../models/User';

/**
 * Build a MongoDB query with role-based filtering for books/lists
 *
 * Role-based filtering rules:
 * - CompanyAdmin: Sees all items in the company (no additional filters)
 * - StoreAdmin: Sees only items from their store
 * - Librarian: Sees only items they are currently assigned to
 *
 * Content visibility rules:
 * - Books/lists from deleted users (deletedAt exists) are hidden
 * - Books/lists from inactive/suspended users remain visible
 *
 * @param session - User session with role information
 * @param baseQuery - Optional base query to extend (e.g., { genre: 'fiction' })
 * @param excludeDeletedContent - Whether to exclude content from deleted users (default: true)
 * @returns MongoDB query object with role-based filters
 *
 * @example
 * // Simple usage
 * const query = buildRoleBasedQuery(session);
 *
 * @example
 * // With base query filters
 * const query = buildRoleBasedQuery(session, { genre: 'fiction' });
 */
export async function buildRoleBasedQuery(
  session: SessionData,
  baseQuery: Record<string, any> = {},
  excludeDeletedContent: boolean = true
): Promise<Record<string, any>> {
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
    // Librarian sees only items they are currently assigned to
    query.assignedTo = new Types.ObjectId(session.userId!);
  }

  // Exclude content from deleted users by default
  if (excludeDeletedContent) {
    const deletedUserIds = await getDeletedUserIds(session.companyId!);
    if (deletedUserIds.length > 0) {
      query.createdBy = { $nin: deletedUserIds };
    }
  }

  return query;
}

/**
 * Get list of deleted user IDs to filter out their content
 * This is used to hide books/lists from deleted users while keeping
 * content from inactive/suspended users visible
 *
 * @param companyId - Company ID to scope the query
 * @returns Array of ObjectIds of deleted users
 */
export async function getDeletedUserIds(
  companyId: string
): Promise<Types.ObjectId[]> {
  const deletedUsers = await UserModel.find({
    companyId: new Types.ObjectId(companyId),
    deletedAt: { $exists: true, $ne: null },
  })
    .select('_id')
    .lean();

  return deletedUsers.map((user: any) => new Types.ObjectId(user._id));
}

/**
 * Build query that excludes content from deleted users
 * Adds filters to exclude books/lists where createdBy is a deleted user
 *
 * @param query - Base query to enhance
 * @param companyId - Company ID
 * @returns Enhanced query with deleted user filter
 */
export async function excludeDeletedUsersContent(
  query: Record<string, any>,
  companyId: string
): Promise<Record<string, any>> {
  const deletedUserIds = await getDeletedUserIds(companyId);

  if (deletedUserIds.length > 0) {
    // Add filter to exclude content from deleted users
    query.createdBy = { $nin: deletedUserIds };
  }

  return query;
}
