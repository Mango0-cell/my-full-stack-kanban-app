'use client';

import { useRouter } from 'next/navigation';
import { useListProjectsQuery } from '@/lib/store/api/projectsApi';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { PixelDino } from '@/components/shared/PixelDino';
import AnimatedList from '@/components/ui/animated-list';
import { FolderKanban, Calendar, ChevronRight } from 'lucide-react';

export default function BoardIndexPage() {
  const router = useRouter();
  const { data, isLoading } = useListProjectsQuery();
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;
  const archivedIds: number[] = (() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`kanban_archived_projects:${me?.user_id ?? 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  })();
  const projects = (data?.data ?? []).filter(p => !archivedIds.includes(p.project_id));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Projects
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          All your kanban boards in one place.
        </p>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="flex flex-col items-center text-center max-w-xs">
          <PixelDino size={220} />
          <h3 className="text-xl md:text-2xl font-semibold mt-1 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Nothing here yet
          </h3>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Create a project using the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  /* ── Project list ── */
  const projectNames = projects.map((p) => p.project_name);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Projects
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        All your kanban boards in one place.
      </p>

      <AnimatedList
        items={projectNames}
        onItemSelect={(_item, index) => {
          router.push(`/board/${projects[index].project_id}`);
        }}
        showGradients
        enableArrowNavigation
        displayScrollbar
        className="w-full"
        renderItem={(_item, index, isSelected) => {
          const project = projects[index];
          const date = new Date(project.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          return (
            <div
              className="group flex items-center justify-between p-5 md:p-6 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: isSelected ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                border: isSelected
                  ? '1px solid rgba(99,102,241,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <FolderKanban
                    className="h-5 w-5 md:h-6 md:w-6"
                    style={{ color: isSelected ? 'var(--color-brand-400)' : 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {project.project_name}
                  </h3>
                  {project.description && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3 w-3" style={{ color: 'var(--color-text-muted)' }} />
                    <span
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
                    >
                      {date}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 transition-transform duration-200"
                style={{
                  color: isSelected ? 'var(--color-brand-400)' : 'var(--color-text-muted)',
                  transform: isSelected ? 'translateX(2px)' : 'none',
                }}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
