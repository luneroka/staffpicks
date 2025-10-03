import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import ListsClient from './ListsClient';
import { Suspense } from 'react';

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

  if (session.role === UserRole.CompanyAdmin) {
    // CompanyAdmin sees all lists in the company
    // No additional filters needed
  } else if (session.role === UserRole.StoreAdmin) {
    // StoreAdmin sees only lists from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (session.role === UserRole.Librarian) {
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

  const listsData = lists.map((list: any) => ({
    _id: list._id.toString(),
    coverImage:
      list.coverImage ||
      'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075480/rentr%C3%A9e_litt%C3%A9raire_ac1clu.png',
    title: list.title,
    visibility: list.visibility,
    items: (list.items || []).map((item: any) => ({
      bookId: item.bookId?.toString() || item.bookId,
      position: item.position,
      addedAt: item.addedAt,
    })),
    createdBy: list.createdBy
      ? {
          _id: list.createdBy._id?.toString(),
          firstName: list.createdBy.firstName,
          lastName: list.createdBy.lastName,
          email: list.createdBy.email,
        }
      : null,
    updatedAt: list.updatedAt,
  }));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListsClient initialLists={listsData} userRole={session.role} />
    </Suspense>
  );
};

export default Lists;
