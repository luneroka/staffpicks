import Link from 'next/link';
import ListCard from '@/app/components/lists/ListCard';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { UserModel } from '@/app/lib/models/User';
import { Types } from 'mongoose';

const Lists = async () => {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database and fetch lists
  await connectDB();
  const lists = await ListModel.find({
    companyId: new Types.ObjectId(session.companyId!),
    deletedAt: { $exists: false },
  })
    .populate('createdBy', 'firstName lastName') // Populate user data
    .sort({ updatedAt: -1 })
    .lean();

  const listsData = lists.map((list: any) => {
    const createdByUser = list.createdBy;
    const createdByName =
      createdByUser && createdByUser.firstName && createdByUser.lastName
        ? `${createdByUser.firstName} ${createdByUser.lastName}`
        : 'Utilisateur inconnu';

    return {
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
      createdBy: createdByName,
      updatedAt: list.updatedAt,
    };
  });

  return (
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/lists/new'}>
        <div className='btn btn-primary btn-soft w-fit'>Ajouter une liste</div>
      </Link>

      <div id='list-display' className='flex flex-wrap gap-8 mt-[-16px]'>
        {listsData.length === 0 ? (
          <p className='text-base-content/60'>Aucune liste créée</p>
        ) : (
          listsData.map((list: any) => (
            <ListCard key={list._id} listData={list} />
          ))
        )}
      </div>
    </div>
  );
};

export default Lists;
