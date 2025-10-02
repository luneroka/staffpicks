'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUserCircle } from 'react-icons/fa';
import { useEffect } from 'react';
import { themeChange } from 'theme-change';

interface NavBarProps {
  companyName?: string;
  userName?: string;
}

const NavBar = ({ companyName, userName }: NavBarProps) => {
  useEffect(() => {
    themeChange(false);
    // 👆 false parameter is required for react project
  }, []);

  const pathname = usePathname();

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

  // Onboarding page - simplified navbar
  if (pathname === '/onboarding') {
    return (
      <nav className='flex justify-between items-center px-16 py-2 border-b border-b-neutral-content/40'>
        {/* LEFT */}
        <Link href={'/dashboard'}>
          <div className='flex items-center gap-2 home-link'>
            <FaHome />
            <h3>{companyName || 'StaffPicks'}</h3>
          </div>
        </Link>

        {/* RIGHT */}
        <div className='flex gap-2 items-center '>
          {userName && <h3>{userName}</h3>}
          <FaUserCircle className='size-8' />
        </div>
      </nav>
    );
  }

  // Dashboard navbar
  return (
    <nav className='flex justify-between items-center px-16 py-2 border-b border-b-neutral-content/40'>
      {/* LEFT */}
      <Link href={'/dashboard'}>
        <div className='flex items-center gap-2 home-link'>
          {/* TODO: Use company logo from db */}
          <FaHome />
          {/* TODO: Use store name from db */}
          <h3>Genève - Balexert</h3>
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
        <h3>{userName || 'Sarah'}</h3>
        <FaUserCircle className='size-8' />
      </div>
    </nav>
  );
};

export default NavBar;
