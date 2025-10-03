'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaUserCircle } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { themeChange } from 'theme-change';
import { UserRole } from '@/app/lib/types/user';
import Image from 'next/image';

interface NavBarProps {
  companyName?: string;
  userName?: string;
  userRole?: UserRole;
  storeName?: string;
  storeCity?: string;
}

interface CompanyData {
  name: string;
  logoUrl?: string;
}

interface UserData {
  firstName: string;
  avatarUrl?: string;
}

const NavBar = ({
  companyName,
  userName,
  userRole,
  storeName,
  storeCity,
}: NavBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Initialize with prop data to avoid flash
  const [company, setCompany] = useState<CompanyData | null>(
    companyName ? { name: companyName } : null
  );
  const [user, setUser] = useState<UserData | null>(
    userName ? { firstName: userName } : null
  );

  // Close dropdown when clicking on a link
  const closeDropdown = () => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem.blur();
    }
  };

  useEffect(() => {
    themeChange(false);
    // 👆 false parameter is required for react project
  }, []);

  // Fetch company data to get the latest name and logo
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch('/api/company');
        if (response.ok) {
          const data = await response.json();
          setCompany({
            name: data.name,
            logoUrl: data.logoUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        // Keep the initial prop data on error
      }
    };

    // Only fetch if user is authenticated (not on public pages)
    if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
      fetchCompanyData();
    }
  }, [pathname]);

  // Fetch user data to get the latest name and avatar
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUser({
            firstName: data.firstName,
            avatarUrl: data.avatarUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Keep the initial prop data on error
      }
    };

    // Only fetch if user is authenticated (not on public pages)
    if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
      fetchUserData();
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        router.push('/login');
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Public pages (no auth required)
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return (
      <nav className='flex justify-between items-center px-16 py-2 border-b border-b-neutral-content/40'>
        {/* LEFT */}
        <Link href={'/'}>
          <div className='flex items-center gap-2 home-link'>
            <FaHome />
          </div>
        </Link>

        {/* RIGHT */}
        <ul className='menu menu-horizontal p-0'>
          <li>
            <Link href={'/login'}>Se connecter</Link>
          </li>
          <li>
            <Link href={'/signup'}>S'inscrire</Link>
          </li>
        </ul>
      </nav>
    );
  }

  // Dashboard navbar
  return (
    <nav className='flex justify-between items-center px-16 py-2 border-b border-b-neutral-content/40'>
      {/* LEFT */}
      <Link href={'/dashboard'}>
        <div className='flex items-center gap-2'>
          {company?.logoUrl ? (
            <div className='avatar'>
              <div className='w-8 h-8 rounded'>
                <Image
                  src={company.logoUrl}
                  alt='Logo entreprise'
                  width={32}
                  height={32}
                  className='object-cover'
                />
              </div>
            </div>
          ) : (
            <FaHome />
          )}
          {/* Show store info for storeAdmin and librarians, company name for others */}
          {userRole === UserRole.StoreAdmin ||
          userRole === UserRole.Librarian ? (
            <h3 className='hover:text-primary'>
              {company?.name || companyName}
              {storeCity && ` ${storeCity}`}
              {storeName && ` - ${storeName}`}
            </h3>
          ) : (
            <h3 className='hover:text-primary'>
              {company?.name || companyName}
            </h3>
          )}
        </div>
      </Link>

      {/* MIDDLE */}
      <div role='tablist' className='tabs tabs-border'>
        <Link
          href='/dashboard/lists'
          role='tab'
          className={`tab  ${
            pathname === '/dashboard/lists' ? 'tab-active' : ''
          }`}
        >
          Mes listes
        </Link>
        <Link
          href='/dashboard/books'
          role='tab'
          className={`tab  ${
            pathname === '/dashboard/books' ? 'tab-active' : ''
          }`}
        >
          Mes livres
        </Link>
      </div>

      {/* RIGHT */}
      <div className='flex gap-2 items-center '>
        <h3>{user?.firstName || userName}</h3>
        <div className='dropdown dropdown-end'>
          <div
            tabIndex={0}
            role='button'
            className='btn btn-ghost btn-circle avatar'
          >
            <div className='w-10 rounded-full'>
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt='Avatar utilisateur'
                  width={40}
                  height={40}
                  className='object-cover'
                />
              ) : (
                <div className='flex items-center justify-center w-full h-full bg-base-200'>
                  <FaUserCircle className='text-3xl text-base-content opacity-60' />
                </div>
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className='menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow'
          >
            <li>
              <Link href={'/dashboard/profile'} onClick={closeDropdown}>
                Profil
              </Link>
            </li>
            {/* Settings - Only visible for Admin, CompanyAdmin, and StoreAdmin */}
            {userRole && userRole !== UserRole.Librarian && (
              <li>
                <Link href={'/dashboard/settings'} onClick={closeDropdown}>
                  Réglages
                </Link>
              </li>
            )}
            <li>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className='w-full text-left'
              >
                {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
