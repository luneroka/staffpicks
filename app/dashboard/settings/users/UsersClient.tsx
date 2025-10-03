'use client';

import Link from 'next/link';
import BackButton from '@/app/components/BackButton';
import {
  FaPlus,
  FaUser,
  FaStore,
  FaSort,
  FaSortUp,
  FaSortDown,
} from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface UsersClientProps {
  users: any[];
  userRole: string;
}

type SortField = 'name' | 'email' | 'role' | 'store';
type SortDirection = 'asc' | 'desc' | null;

const UsersClient = ({ users, userRole }: UsersClientProps) => {
  const searchParams = useSearchParams();
  const [hasShownToast, setHasShownToast] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    const addedUserName = searchParams.get('added');

    if (addedUserName && !hasShownToast) {
      toast.success(`Utilisateur "${addedUserName}" ajouté avec succès`, {
        duration: 4000,
      });
      setHasShownToast(true);

      // Clean URL without reloading
      window.history.replaceState({}, '', '/dashboard/settings/users');
    }
  }, [searchParams, hasShownToast]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortField || !sortDirection) {
      return users;
    }

    return [...users].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'store':
          aValue = (a.storeName || '').toLowerCase();
          bValue = (b.storeName || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <FaSort className='inline ml-1 text-base-content/30' />;
    }
    if (sortDirection === 'asc') {
      return <FaSortUp className='inline ml-1 text-primary' />;
    }
    return <FaSortDown className='inline ml-1 text-primary' />;
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-error';
      case 'companyAdmin':
        return 'badge-warning';
      case 'storeAdmin':
        return 'badge-info';
      case 'librarian':
        return 'badge-ghost';
      default:
        return 'badge-ghost';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'companyAdmin':
        return 'Admin Entreprise';
      case 'storeAdmin':
        return 'Admin Magasin';
      case 'librarian':
        return 'Libraire';
      default:
        return role;
    }
  };

  return (
    <div className='space-y-6'>
      <BackButton />
      {/* Header */}
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold flex items-center gap-2'>
          <FaUser />
          Utilisateurs
        </h1>
        <Link
          href='/dashboard/settings/users/new'
          className='btn btn-soft btn-primary btn-sm'
        >
          <FaPlus /> Nouvel utilisateur
        </Link>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className='card bg-base-200'>
          <div className='card-body items-center text-center'>
            <HiExclamationCircle className='text-6xl text-base-content/30' />
            <h2 className='card-title'>Aucun utilisateur</h2>
            <p className='text-base-content/60'>
              Créez votre premier utilisateur pour commencer
            </p>
            <Link
              href='/dashboard/settings/users/new'
              className='btn btn-primary mt-4'
            >
              <FaPlus /> Créer un utilisateur
            </Link>
          </div>
        </div>
      ) : (
        <div className='card bg-base-200 shadow-lg'>
          <div className='card-body'>
            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th
                      className='cursor-pointer hover:bg-base-300 select-none'
                      onClick={() => handleSort('name')}
                    >
                      Nom {getSortIcon('name')}
                    </th>
                    <th
                      className='cursor-pointer hover:bg-base-300 select-none'
                      onClick={() => handleSort('email')}
                    >
                      Email {getSortIcon('email')}
                    </th>
                    <th
                      className='cursor-pointer hover:bg-base-300 select-none'
                      onClick={() => handleSort('role')}
                    >
                      Rôle {getSortIcon('role')}
                    </th>
                    <th
                      className='cursor-pointer hover:bg-base-300 select-none'
                      onClick={() => handleSort('store')}
                    >
                      Magasin {getSortIcon('store')}
                    </th>
                    <th>Rayons</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user: any) => (
                    <tr key={user._id} className='hover'>
                      <td>
                        <div className='flex items-center gap-3'>
                          {user.avatarUrl ? (
                            <div className='avatar'>
                              <div className='w-10 h-10 rounded-full'>
                                <img
                                  src={user.avatarUrl}
                                  alt={`${user.firstName} ${user.lastName}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className='avatar placeholder'>
                              <div
                                className='bg-primary text-primary-content w-10 h-10 rounded-full'
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <span className='text-xs font-bold uppercase'>
                                  {user.firstName[0]}
                                  {user.lastName[0]}
                                </span>
                              </div>
                            </div>
                          )}
                          <div>
                            <div className='font-semibold'>
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${getRoleBadgeClass(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        {user.storeName ? (
                          <div className='flex items-center gap-1 text-sm'>
                            <FaStore className='text-base-content/60' />
                            <span>{user.storeName}</span>
                          </div>
                        ) : (
                          <span className='text-base-content/40'>-</span>
                        )}
                      </td>
                      <td>
                        {user.sections && user.sections.length > 0 ? (
                          <div className='flex flex-wrap gap-1'>
                            {user.sections
                              .slice(0, 2)
                              .map((section: string) => (
                                <span key={section} className='badge badge-sm'>
                                  {section}
                                </span>
                              ))}
                            {user.sections.length > 2 && (
                              <span className='badge badge-sm badge-ghost'>
                                +{user.sections.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className='text-base-content/40'>-</span>
                        )}
                      </td>
                      <td>
                        <span className='badge badge-success badge-sm'>
                          Actif
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/settings/users/${user._id}`}
                          className='btn btn-ghost btn-xs'
                        >
                          Détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stats */}
            <div className='divider'></div>
            <div className='stats stats-horizontal shadow'>
              <div className='stat'>
                <div className='stat-title'>Total utilisateurs</div>
                <div className='stat-value text-primary'>{users.length}</div>
              </div>
              <div className='stat'>
                <div className='stat-title'>Libraires</div>
                <div className='stat-value text-secondary'>
                  {users.filter((u: any) => u.role === 'librarian').length}
                </div>
              </div>
              <div className='stat'>
                <div className='stat-title'>Admins</div>
                <div className='stat-value text-accent'>
                  {
                    users.filter(
                      (u: any) =>
                        u.role === 'storeAdmin' ||
                        u.role === 'companyAdmin' ||
                        u.role === 'admin'
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersClient;
