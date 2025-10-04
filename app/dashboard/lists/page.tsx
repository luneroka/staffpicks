import { requireAuth } from '@/app/lib/auth/helpers';
import {
  buildRoleBasedQuery,
  getDeletedUserIds,
} from '@/app/lib/auth/queryBuilders';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import ListsClient from './ListsClient';
import { Suspense } from 'react';
import { transformListForCard } from '@/app/lib/utils/listUtils';

const Lists = async () => {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database and fetch lists with role-based filtering
  await connectDB();

  // Build query based on user role (automatically excludes deleted users' content)
  const query = await buildRoleBasedQuery(session, {
    deletedAt: { $exists: false },
  });

  // Get deleted user IDs to filter books in populate
  const deletedUserIds = await getDeletedUserIds(session.companyId!);

  const lists = await ListModel.find(query)
    .populate({
      path: 'items.bookId',
      select: '_id',
      match: { createdBy: { $nin: deletedUserIds } }, // Exclude books from deleted users
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('storeId', 'name code')
    .sort({ updatedAt: -1 })
    .lean();

  // Transform lists using utility function
  const listsData = lists.map(transformListForCard);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListsClient initialLists={listsData} userRole={session.role} />
    </Suspense>
  );
};

export default Lists;
