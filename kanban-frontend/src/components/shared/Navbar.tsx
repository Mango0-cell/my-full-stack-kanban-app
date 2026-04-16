'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut, User, Users } from 'lucide-react';
import { MobileSidebarTrigger } from './MobileSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { useAppDispatch } from '@/lib/hooks/redux';
import { clearCredentials } from '@/lib/store/slices/authSlice';

export function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data } = useGetMeQuery();
  const user = data?.data;

  function handleLogout() {
    Cookies.remove('kanban_token');
    dispatch(clearCredentials());
    router.push('/login');
  }

  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 z-20"
      style={{
        backgroundColor: 'var(--color-surface-0)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: Hamburger + Logo + Nav tabs */}
      <div className="flex items-center gap-4 md:gap-8">
        <MobileSidebarTrigger />
        <Link href="/board" style={{ textDecoration: 'none' }}>
          <span className="text-sm md:text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Kanban Flow
          </span>
        </Link>
      </div>

      {/* Right: Team + Share + Profile */}
      <div className="flex items-center gap-3">
        <button
          className="hidden sm:flex p-1.5 rounded-md transition-colors duration-150"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Users className="h-4 w-4" />
        </button>

        <button
          className="hidden sm:flex items-center px-4 py-1.5 rounded-md text-xs font-medium uppercase tracking-widest transition-all duration-150 active:scale-[0.97]"
          style={{
            backgroundColor: 'rgba(99,102,241,0.1)',
            color: 'var(--color-brand-400)',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)')}
        >
          Share
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-3)] transition-colors duration-150">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                style={{
                  backgroundColor: 'rgba(99,102,241,0.2)',
                  color: 'var(--color-brand-400)',
                }}
              >
                {initials}
              </div>
              <span className="text-sm hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.display_name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-50" style={{ backgroundColor: '#0d1017', border: '1px solid rgba(255,255,255,0.08)' }}>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
