'use client';

import { use, useState, useRef, useEffect } from 'react';
import { notFound } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings, Trash2, Loader2, Filter, Search, X, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BoardDnD } from '@/components/board/BoardDnD';
import { CardForm } from '@/components/forms/CardForm';
import { ColumnForm } from '@/components/forms/ColumnForm';
import { CardDetailModal } from '@/components/board/CardDetailModal';
import { CanceledView } from '@/components/board/CanceledView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetProjectQuery, useDeleteProjectMutation } from '@/lib/store/api/projectsApi';
import { useDeleteColumnMutation } from '@/lib/store/api/columnsApi';
import { useListCardsQuery } from '@/lib/store/api/cardsApi';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { useRouter } from 'next/navigation';
import type { Card, Column } from '@/lib/types/api';

type FilterMode = 'all' | 'today' | 'week' | 'month';

const FILTER_LABELS: Record<FilterMode, string> = {
  all: 'All',
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
};

interface CanceledEntry {
  columnName: string;
  canceledAt: string;
  cards: Card[];
}

interface Props {
  params: Promise<{ projectId: string }>;
}

export default function BoardPage({ params }: Props) {
  const { projectId: projectIdStr } = use(params);
  const projectId = parseInt(projectIdStr, 10);

  const router = useRouter();
  const { data, isLoading, isError } = useGetProjectQuery(projectId);
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;
  const [deleteProject, { isLoading: deletingProject }] = useDeleteProjectMutation();
  const [deleteColumn] = useDeleteColumnMutation();
  const { data: cardsData } = useListCardsQuery(projectId);

  // Modal state
  const [cardFormColumnId, setCardFormColumnId] = useState<number | null>(null);
  const [columnFormOpen, setColumnFormOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [cancelColumnTarget, setCancelColumnTarget] = useState<Column | null>(null);
  const [canceledViewOpen, setCanceledViewOpen] = useState(false);

  // Filter & search state
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const archivedKey = `kanban_archived_projects:${me?.user_id ?? 'guest'}`;
  const canceledKey = `kanban_canceled_cards:${me?.user_id ?? 'guest'}:${projectId}`;

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (isError || !data) {
    notFound();
  }

  const project = data.data;

  function handleArchiveProject() {
    try {
      const storedScoped = localStorage.getItem(archivedKey);
      const archived: number[] = storedScoped ? JSON.parse(storedScoped) : [];
      if (!archived.includes(projectId)) {
        archived.push(projectId);
        localStorage.setItem(archivedKey, JSON.stringify(archived));
      }
      toast.success('Project archived');
      router.push('/board');
    } catch {
      toast.error('Failed to archive project');
    }
  }

  async function confirmDeleteProject() {
    try {
      await deleteProject(projectId).unwrap();
      toast.success('Project deleted');
      setDeleteProjectOpen(false);
      router.push('/board');
    } catch {
      toast.error('Failed to delete project');
    }
  }

  function handleCancelColumn(column: Column) {
    setCancelColumnTarget(column);
  }

  async function confirmCancelColumn() {
    if (!cancelColumnTarget) return;
    try {
      // Collect all cards for this column
      const allCards: Card[] = cardsData?.data ?? [];
      const columnCards = allCards.filter((c) => c.column_id === cancelColumnTarget.column_id);

      // Archive to localStorage
      const existing: CanceledEntry[] = JSON.parse(
        localStorage.getItem(canceledKey) || '[]',
      );
      existing.push({
        columnName: cancelColumnTarget.name,
        canceledAt: new Date().toISOString(),
        cards: columnCards,
      });
      localStorage.setItem(canceledKey, JSON.stringify(existing));

      // Delete the column
      await deleteColumn({ projectId, columnId: cancelColumnTarget.column_id }).unwrap();
      toast.success('Column canceled, cards archived');
      setCancelColumnTarget(null);
    } catch {
      toast.error('Failed to cancel column');
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div
        className="flex items-center justify-between px-8 py-6 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <h1
            className="text-[22px] font-semibold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {project.project_name}
          </h1>
          {project.description && (
            <p
              className="text-[11px] mt-1.5 uppercase tracking-widest"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
            >
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search input (expandable) */}
          {searchOpen && (
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }
                }}
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
                placeholder="Search cards..."
                className="h-8 w-48 rounded-md px-3 pr-8 text-sm outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'var(--color-surface-4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                className="absolute right-1.5 p-0.5 rounded-sm"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="kf-icon-btn relative">
                <Filter className="h-4 w-4" />
                {filterMode !== 'all' && (
                  <span
                    className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-brand-400)' }}
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-50 min-w-[140px]"
              style={{
                backgroundColor: '#0d1017',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {(Object.entries(FILTER_LABELS) as [FilterMode, string][]).map(([mode, label]) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className="text-sm cursor-pointer"
                  style={{
                    color: filterMode === mode ? 'var(--color-brand-400)' : undefined,
                  }}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search toggle */}
          <button
            className="kf-icon-btn"
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (searchOpen) setSearchQuery('');
            }}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="kf-icon-btn">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--color-surface-0)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-sm"
                onSelect={(e) => { e.preventDefault(); handleArchiveProject(); }}
              >
                <Archive className="h-4 w-4" />
                Archive project
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                onSelect={() => setDeleteProjectOpen(true)}
                disabled={deletingProject}
              >
                <Trash2 className="h-4 w-4" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Board canvas */}
      <div className="flex-1 overflow-hidden p-6">
        <BoardDnD
          projectId={projectId}
          onAddCard={(columnId) => setCardFormColumnId(columnId)}
          onCardClick={(card) => setSelectedCard(card)}
          onAddColumn={() => { setEditingColumn(null); setColumnFormOpen(true); }}
          onEditColumn={(column) => { setEditingColumn(column); setColumnFormOpen(true); }}
          onCancelColumn={handleCancelColumn}
          filterMode={filterMode}
          searchQuery={searchQuery}
        />
      </div>

      {/* Fixed Canceled button */}
      <button
        onClick={() => setCanceledViewOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 z-40 hover:opacity-90 active:scale-[0.97]"
        style={{
          backgroundColor: 'rgba(245,158,11,0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245,158,11,0.3)',
          boxShadow: '0 0 20px rgba(245,158,11,0.08)',
        }}
      >
        <Archive className="h-4 w-4" />
        Canceled
      </button>

      {/* Modals */}
      <CardForm
        open={cardFormColumnId !== null}
        onClose={() => setCardFormColumnId(null)}
        columnId={cardFormColumnId ?? 0}
        projectId={projectId}
      />

      <ColumnForm
        open={columnFormOpen}
        onClose={() => { setColumnFormOpen(false); setEditingColumn(null); }}
        projectId={projectId}
        column={editingColumn ?? undefined}
      />

      <CardDetailModal
        card={selectedCard}
        projectId={projectId}
        onClose={() => setSelectedCard(null)}
      />

      <CanceledView
        open={canceledViewOpen}
        onClose={() => setCanceledViewOpen(false)}
        projectId={projectId}
      />

      {/* Delete Project Confirmation */}
      <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent
          className="sm:max-w-sm"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-primary)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete &quot;{project.project_name}&quot;? This action cannot be undone and all columns and cards will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeleteProjectOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                color: 'var(--color-text-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteProject}
              disabled={deletingProject}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              {deletingProject ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Column Confirmation */}
      <Dialog open={!!cancelColumnTarget} onOpenChange={(v) => !v && setCancelColumnTarget(null)}>
        <DialogContent
          className="sm:max-w-sm"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-primary)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Cancel Column</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Archive all cards in &quot;{cancelColumnTarget?.name}&quot; and remove the column? Cards will be saved in the Canceled view.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setCancelColumnTarget(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                color: 'var(--color-text-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCancelColumn}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              Cancel Column
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
