'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, Users, Archive, User } from 'lucide-react';

const navItems = [
  { label: 'Projects', icon: FolderKanban, href: '/board' },
  { label: 'Members',  icon: Users,        href: '/members' },
  { label: 'Archive',  icon: Archive,      href: '/archive' },
  { label: 'Profile',  icon: User,         href: '/profile' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 px-6"
      style={{
        backgroundColor: 'rgba(15,17,23,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.label === 'Projects' ? pathname?.startsWith('/board') :
          item.label === 'Members'  ? pathname === '/members' || pathname === '/settings' :
          item.label === 'Archive'  ? pathname === '/archive' :
          item.label === 'Profile'  ? pathname === '/profile' :
          false;

        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: active ? 'var(--color-brand-400)' : 'var(--color-text-muted)' }}
          >
            <Icon className="h-5 w-5" style={active ? { fill: 'var(--color-brand-400)', fillOpacity: 0.15 } : undefined} />
            <span className="text-[10px]" style={{ fontWeight: active ? 500 : 400 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
