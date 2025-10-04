'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useFormState } from '@/app/lib/hooks';
import FormAlerts from '../forms/FormAlerts';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface AssignUserToStoreProps {
  storeId: string;
  assignedUserIds: string[]; // Already assigned user IDs to filter out
}

const AssignUserToStore = ({
  storeId,
  assignedUserIds,
}: AssignUserToStoreProps) => {
  const router = useRouter();
  const { error, success, setError, setSuccess } = useFormState();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available users when dropdown opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Erreur lors du chargement des utilisateurs'
        );
      }

      // The API returns { users: [...] }, so we need to access data.users
      const usersList = data.users || [];

      // Filter out already assigned users and only show active users
      const availableUsers = usersList.filter(
        (user: User) =>
          !assignedUserIds.includes(user._id) && user.status === 'active'
      );

      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      setAssigning(true);
      setError('');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: storeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'assignation");
      }

      setSuccess('Utilisateur assigné avec succès!');
      setIsOpen(false);
      setSearchQuery('');

      // Refresh the page to show updated users list
      router.refresh();
    } catch (err) {
      console.error('Error assigning user:', err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'assignation"
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setSearchQuery('');
    setError('');
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
    <div className='relative' ref={dropdownRef}>
      {/* Success and Error Messages */}
      <FormAlerts error={error} success={success} alertClassName='mb-4' />

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className='btn btn-soft btn-primary btn-sm'
        disabled={assigning}
      >
        {isOpen ? (
          <>
            <FaTimes /> Annuler
          </>
        ) : (
          <>
            <FaPlus /> Assigner un utilisateur
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-2 w-96 bg-base-100 shadow-xl rounded-lg border border-base-300 z-50'>
          <div className='p-4'>
            {/* Search Input */}
            <div className='form-control mb-4'>
              <div className='input-group'>
                <span className='bg-base-200'>
                  <FaSearch />
                </span>
                <input
                  type='text'
                  placeholder='Rechercher un utilisateur...'
                  className='input input-bordered w-full'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Users List */}
            <div className='max-h-80 overflow-y-auto'>
              {loading ? (
                <div className='flex justify-center py-8'>
                  <span className='loading loading-spinner loading-lg'></span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-base-content/60'>
                    {searchQuery
                      ? 'Aucun utilisateur trouvé'
                      : 'Aucun utilisateur disponible'}
                  </p>
                </div>
              ) : (
                <ul className='menu menu-compact'>
                  {filteredUsers.map((user) => (
                    <li key={user._id}>
                      <button
                        onClick={() => handleAssignUser(user._id)}
                        disabled={assigning}
                        className='flex items-center justify-between hover:bg-base-200'
                      >
                        <div className='flex flex-col items-start'>
                          <span className='font-semibold'>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className='text-xs text-base-content/60'>
                            {user.email}
                          </span>
                        </div>
                        <span
                          className={`badge badge-sm ${getRoleBadgeClass(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignUserToStore;
