import {
  isCompanyAdmin,
  isLibrarian,
  isStoreAdmin,
  requireAuth,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { Types } from 'mongoose';
import ListsClient from './ListsClient';
import { Suspense } from 'react';
import { transformListForCard } from '@/app/lib/utils/listUtils';

const Lists = async () => {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database and fetch lists with role-based filtering
  await connectDB();

  // Build query based on user role
  let query: any = {
    companyId: new Types.ObjectId(session.companyId!),
    deletedAt: { $exists: false },
  };

  if (isCompanyAdmin(session)) {
    // CompanyAdmin sees all lists in the company
    // No additional filters needed
  } else if (isStoreAdmin(session)) {
    // StoreAdmin sees only lists from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (isLibrarian(session)) {
    // Librarian sees only lists they created or are assigned to
    query.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  const lists = await ListModel.find(query)
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
