import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import StoreSettingsForm from '@/app/components/forms/StoreSettingsForm';
import connectDB from '@/app/lib/mongodb';
import { StoreModel } from '@/app/lib/models/Store';
import { UserModel } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import { FaStore, FaUser, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface StoreDetailsPageProps {
  params: {
    id: string;
  };
}

const StoreDetailsPage = async ({ params }: StoreDetailsPageProps) => {
  // Require company admin access
  const session = await requireCompanyAdmin();

  await connectDB();

  // Validate ObjectId
  if (!Types.ObjectId.isValid(params.id)) {
    notFound();
  }

  // Fetch the store
  const store = await StoreModel.findOne({
    _id: new Types.ObjectId(params.id),
    companyId: new Types.ObjectId(session.companyId!),
  }).lean();

  if (!store) {
    notFound();
  }

  // Fetch assigned users
  const assignedUsers = await UserModel.find({
    storeId: new Types.ObjectId(params.id),
  })
    .select('firstName lastName email role')
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  // Transform data for the client
  const storeData = {
    _id: store._id.toString(),
    code: store.code,
    name: store.name,
    status: store.status,
    description: store.description || '',
    contact: {
      email: store.contact?.email || '',
      phone: store.contact?.phone || '',
    },
    address: {
      street: store.address?.street || '',
      city: store.address?.city || '',
      state: store.address?.state || '',
      postalCode: store.address?.postalCode || '',
      country: store.address?.country || 'France',
    },
  };

  const usersData = assignedUsers.map((user: any) => ({
    _id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  }));

  return (
    <div className='space-y-6'>
      <Link href='/dashboard/settings/stores'>
        <button className='btn btn-ghost mb-4'>
          <FaArrowLeft />
          Retour
        </button>
      </Link>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <FaStore />
            {store.name}
          </h1>
          <p className='text-base-content/60 mt-2'>
            Gérez les paramètres et les utilisateurs assignés à ce magasin
          </p>
        </div>
      </div>

      {/* Store Settings Form */}
      <StoreSettingsForm mode='edit' initialData={storeData} />

      {/* Assigned Users Panel */}
      <div className='card bg-base-200 shadow-sm'>
        <div className='card-body'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='card-title flex items-center gap-2'>
              <FaUser />
              Utilisateurs assignés ({usersData.length})
            </h2>
            <Link href={`/dashboard/settings/stores/${params.id}/users/add`}>
              <button className='btn btn-primary btn-sm'>
                Assigner un utilisateur
              </button>
            </Link>
          </div>

          {usersData.length === 0 ? (
            <div className='text-center py-8'>
              <FaUser className='text-4xl text-base-content/30 mx-auto mb-3' />
              <p className='text-base-content/60 mb-4'>
                Aucun utilisateur assigné à ce magasin
              </p>
              <Link href={`/dashboard/settings/stores/${params.id}/users/add`}>
                <button className='btn btn-primary btn-sm'>
                  Assigner un utilisateur
                </button>
              </Link>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map((user: any) => (
                    <tr key={user._id} className='hover'>
                      <td className='font-semibold'>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === 'admin'
                              ? 'badge-error'
                              : user.role === 'companyAdmin'
                              ? 'badge-warning'
                              : user.role === 'storeAdmin'
                              ? 'badge-info'
                              : 'badge-ghost'
                          }`}
                        >
                          {user.role === 'admin' && 'Admin'}
                          {user.role === 'companyAdmin' && 'Admin Entreprise'}
                          {user.role === 'storeAdmin' && 'Admin Magasin'}
                          {user.role === 'librarian' && 'Libraire'}
                        </span>
                      </td>
                      <td>
                        <div className='flex gap-2'>
                          <Link href={`/dashboard/settings/users/${user._id}`}>
                            <button className='btn btn-ghost btn-sm'>
                              Voir profil
                            </button>
                          </Link>
                          <form
                            action={`/api/stores/${params.id}/users/${user._id}`}
                            method='POST'
                          >
                            <button
                              type='submit'
                              className='btn btn-ghost btn-sm text-error'
                            >
                              <FaTrash /> Retirer
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetailsPage;
