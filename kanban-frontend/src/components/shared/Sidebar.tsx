'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Plus,
  FolderKanban,
  Users,
  Terminal,
  Brain,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { useListProjectsQuery } from '@/lib/store/api/projectsApi';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { CreateProjectDialog } from '@/components/forms/CreateProjectDialog';

const navItems = [
  { label: 'All Projects', icon: FolderKanban, href: '/board' },
  { label: 'Members',      icon: Users,        href: '/members' },
  { label: 'Integrations', icon: Terminal,      href: '/integrations' },
  { label: 'Code Optimizer', icon: Brain,       href: '/optimizer' },
  { label: 'Archive',      icon: Archive,       href: '/archive' },
];

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const activeProjectId = params?.projectId ? String(params.projectId) : null;
  const { data: projectsData, isLoading } = useListProjectsQuery();
  const { data: meData } = useGetMeQuery();
  const projects = projectsData?.data ?? [];
  const user = meData?.data;

  // Filter out archived projects
  const archivedIds: number[] = (() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('kanban_archived_projects');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  })();
  const visibleProjects = projects.filter(p => !archivedIds.includes(p.project_id));

  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const avatarColors = ['bg-violet-500','bg-indigo-500','bg-teal-500','bg-rose-500','bg-amber-500','bg-emerald-500'];
  const avatarBg = user?.user_id ? avatarColors[user.user_id % avatarColors.length] : 'bg-indigo-500';

  return (
    <aside
      className="w-60 flex flex-col shrink-0 h-full"
      style={{
        backgroundColor: 'var(--color-surface-0)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* User profile header */}
      <div className="px-5 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0 ${avatarBg}`}>
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {user?.display_name ?? 'User'}
            </span>
            <span className="text-[10px] uppercase tracking-wide truncate"
                  style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Product Engineer
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto space-y-0.5 kanban-scroll">
        {navItems.map((item) => {
          const isActive = item.href === '/board'
            ? pathname?.startsWith('/board')
            : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-2 transition-colors duration-150"
              style={{
                color: isActive ? 'var(--color-brand-400)' : 'var(--color-text-muted)',
                borderRight: isActive ? '2px solid var(--color-brand-500)' : '2px solid transparent',
                backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : undefined,
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Projects sub-list */}
        {pathname?.startsWith('/board') && (
          <div className="px-3 pt-4 pb-1 space-y-0.5">
            <span className="px-2 text-[10px] font-medium uppercase tracking-widest block mb-2"
                  style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Projects
            </span>

            {isLoading && (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-full rounded-md shimmer" />
                ))}
              </>
            )}

            {visibleProjects.map((p) => {
              const isActive = String(p.project_id) === activeProjectId;
              return (
                <Link
                  key={p.project_id}
                  href={`/board/${p.project_id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors duration-150',
                    isActive ? 'font-medium' : '',
                  )}
                  style={{
                    color: isActive ? 'var(--color-brand-400)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : undefined,
                    borderLeft: isActive ? '2px solid var(--color-brand-500)' : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{p.project_name}</span>
                </Link>
              );
            })}

            {!isLoading && visibleProjects.length === 0 && (
              <p className="text-xs px-3 py-3" style={{ color: 'var(--color-text-muted)' }}>
                No projects yet.
              </p>
            )}
          </div>
        )}
      </nav>

      {/* New Project button */}
      <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <CreateProjectDialog>
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-[11px] font-medium uppercase tracking-[0.1em] transition-all duration-150 active:scale-[0.97]"
            style={{
              backgroundColor: 'var(--color-brand-500)',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-brand-600)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-brand-500)')}
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
        </CreateProjectDialog>
      </div>

      {/* Bottom status */}
      <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }} />
          <span className="text-[11px] uppercase"
                style={{ color: 'var(--color-success)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
}
