'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FolderKanban, Calendar, ArchiveRestore } from 'lucide-react';
import { PixelDino } from '@/components/shared/PixelDino';
import { useListProjectsQuery } from '@/lib/store/api/projectsApi';
import { useGetMeQuery } from '@/lib/store/api/authApi';

export default function ArchivePage() {
  const router = useRouter();
  const { data, isLoading } = useListProjectsQuery();
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;
  const projects = data?.data ?? [];
  const archiveKey = `kanban_archived_projects:${me?.user_id ?? 'guest'}`;

  const [storageVersion, setStorageVersion] = useState(0);
  const archivedIds: number[] = (() => {
    try {
      void storageVersion;
      const stored = localStorage.getItem(archiveKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const archivedProjects = projects.filter((p) => archivedIds.includes(p.project_id));

  function handleUnarchive(projectId: number) {
    const updated = archivedIds.filter((id) => id !== projectId);
    localStorage.setItem(archiveKey, JSON.stringify(updated));
    setStorageVersion((prev) => prev + 1);
    toast.success('Project unarchived');
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Archive
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Completed and archived projects.
        </p>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Archive
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Completed and archived projects.
      </p>

      {archivedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24">
          <PixelDino size={220} />
          <h3 className="text-xl md:text-2xl font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>Nothing here yet</h3>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Projects you archive will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivedProjects.map((project) => {
            const date = new Date(project.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            return (
              <div
                key={project.project_id}
                className="group flex items-center justify-between p-5 md:p-6 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onClick={() => router.push(`/board/${project.project_id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--color-surface-4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <FolderKanban
                      className="h-5 w-5 md:h-6 md:w-6"
                      style={{ color: 'var(--color-text-primary)' }}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchive(project.project_id);
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--color-surface-4)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.15)';
                    e.currentTarget.style.color = 'var(--color-brand-400)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-4)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Unarchive
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
