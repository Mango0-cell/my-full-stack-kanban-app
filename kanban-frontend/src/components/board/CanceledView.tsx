'use client';

import { useState } from 'react';
import { Archive, X, Flag, Calendar, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PixelDino } from '@/components/shared/PixelDino';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { useListColumnsQuery } from '@/lib/store/api/columnsApi';
import { useCreateCardMutation } from '@/lib/store/api/cardsApi';
import type { Card } from '@/lib/types/api';

interface CanceledEntry {
  columnName: string;
  canceledAt: string;
  cards: Card[];
}

interface OrphanCard {
  card: Card;
  originalColumn: string;
  canceledAt: string;
}

/** New storage format with orphanCards for cards whose column group was deleted */
interface CanceledStorage {
  entries: CanceledEntry[];
  orphanCards: OrphanCard[];
}

interface CanceledViewProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

interface UnarchiveState {
  selecting: boolean;
  targetColumnId: number | null;
}

function getPriorityBadge(priority: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    low:    { label: 'Low',    color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    high:   { label: 'High',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
    urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  };
  return map[priority] ?? { label: priority, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Read localStorage, handling both old (CanceledEntry[]) and new (CanceledStorage) formats */
function readStorage(canceledKey: string): CanceledStorage {
  try {
    const raw = localStorage.getItem(canceledKey);
    if (!raw) return { entries: [], orphanCards: [] };
    const parsed = JSON.parse(raw);
    // Old format: plain array of CanceledEntry
    if (Array.isArray(parsed)) {
      return { entries: parsed as CanceledEntry[], orphanCards: [] };
    }
    // New format
    const storage = parsed as CanceledStorage;
    return {
      entries: storage.entries ?? [],
      orphanCards: storage.orphanCards ?? [],
    };
  } catch {
    return { entries: [], orphanCards: [] };
  }
}

function writeStorage(canceledKey: string, storage: CanceledStorage) {
  localStorage.setItem(canceledKey, JSON.stringify(storage));
}

/* ── Unarchive button for entry-based cards ── */
interface UnarchiveButtonProps {
  card: Card;
  storageLocation: { type: 'entry'; entryIndex: number; cardIndex: number } | { type: 'orphan'; orphanIndex: number };
  projectId: number;
  canceledKey: string;
  onSuccess: () => void;
}

function UnarchiveButton({ card, storageLocation, projectId, canceledKey, onSuccess }: UnarchiveButtonProps) {
  const [state, setState] = useState<UnarchiveState>({ selecting: false, targetColumnId: null });
  const { data: columnsData } = useListColumnsQuery(projectId);
  const [createCard, { isLoading: isCreating }] = useCreateCardMutation();

  const columns = columnsData?.data ?? [];

  async function handleConfirm() {
    if (!state.targetColumnId) return;
    try {
      await createCard({
        columnId: state.targetColumnId,
        projectId,
        title: card.title,
        description: card.description,
        priority: card.priority,
        due_date: card.due_date,
        assigned_user_id: card.assigned_user_id,
      }).unwrap();

      // Remove the card from localStorage
      try {
        const storage = readStorage(canceledKey);
        if (storageLocation.type === 'entry') {
          const { entryIndex, cardIndex } = storageLocation;
          const entry = storage.entries[entryIndex];
          const updatedCards = entry.cards.filter((_, idx) => idx !== cardIndex);
          if (updatedCards.length === 0) {
            storage.entries = storage.entries.filter((_, idx) => idx !== entryIndex);
          } else {
            storage.entries[entryIndex] = { ...entry, cards: updatedCards };
          }
        } else {
          storage.orphanCards = storage.orphanCards.filter((_, idx) => idx !== storageLocation.orphanIndex);
        }
        writeStorage(canceledKey, storage);
      } catch {
        // ignore localStorage errors
      }

      toast.success('Card restored to board');
      onSuccess();
    } catch {
      toast.error('Failed to restore card');
    }
  }

  if (!state.selecting) {
    return (
      <button
        onClick={() => setState({ selecting: true, targetColumnId: null })}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-surface-3)',
          color: 'var(--color-text-secondary)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Unarchive
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <select
        value={state.targetColumnId ?? ''}
        onChange={(e) =>
          setState((prev) => ({ ...prev, targetColumnId: e.target.value ? Number(e.target.value) : null }))
        }
        className="h-7 px-2 rounded-md text-xs outline-none cursor-pointer"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--color-text-primary)',
        }}
      >
        <option value="">Pick column</option>
        {columns.map((c) => (
          <option key={c.column_id} value={c.column_id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        disabled={!state.targetColumnId || isCreating}
        onClick={handleConfirm}
        className="h-7 px-3 rounded-md text-xs font-medium disabled:opacity-50 cursor-pointer hover:opacity-90 transition-colors"
        style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
      >
        {isCreating ? '...' : 'Send'}
      </button>
      <button
        onClick={() => setState({ selecting: false, targetColumnId: null })}
        className="h-7 px-2 rounded-md text-xs cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Shared card row component ── */
interface CardRowProps {
  card: Card;
  columnName: string;
  onDelete: () => void;
  unarchiveProps: UnarchiveButtonProps;
}

function CardRow({ card, columnName, onDelete, unarchiveProps }: CardRowProps) {
  const badge = getPriorityBadge(card.priority);
  return (
    <div
      className="flex items-start justify-between p-5 rounded-xl mb-3"
      style={{
        backgroundColor: 'var(--color-surface-2)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: icon + info */}
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            backgroundColor: badge.bg,
            border: `1px solid ${badge.color}30`,
          }}
        >
          <Flag className="h-5 w-5" style={{ color: badge.color }} />
        </div>
        <div className="min-w-0 space-y-1">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {card.title}
          </h3>
          {card.description && (
            <p
              className="text-xs line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {card.description}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-3 pt-1">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-wider"
              style={{ color: badge.color, backgroundColor: badge.bg }}
            >
              {badge.label}
            </span>
            {card.due_date && (
              <span
                className="flex items-center gap-1 text-[11px]"
                style={{
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(card.due_date)}
              </span>
            )}
            <span
              className="text-[11px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              from{' '}
              <strong style={{ color: 'var(--color-text-secondary)' }}>
                {columnName}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDelete}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer hover:opacity-80"
          style={{
            backgroundColor: 'rgba(239,68,68,0.12)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          Delete
        </button>
        <UnarchiveButton {...unarchiveProps} />
      </div>
    </div>
  );
}

export function CanceledView({ open, onClose, projectId }: CanceledViewProps) {
  const [storageVersion, setStorageVersion] = useState(0);
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;
  const canceledKey = `kanban_canceled_cards:${me?.user_id ?? 'guest'}:${projectId}`;

  void storageVersion;
  const storage = open ? readStorage(canceledKey) : { entries: [], orphanCards: [] };
  const { entries, orphanCards } = storage;

  function reloadEntries() {
    setStorageVersion((prev) => prev + 1);
  }

  function deleteCard(entryIndex: number, cardIndex: number) {
    try {
      const s = readStorage(canceledKey);
      const entry = s.entries[entryIndex];
      const updatedCards = entry.cards.filter((_, idx) => idx !== cardIndex);
      if (updatedCards.length === 0) {
        s.entries = s.entries.filter((_, idx) => idx !== entryIndex);
      } else {
        s.entries[entryIndex] = { ...entry, cards: updatedCards };
      }
      writeStorage(canceledKey, s);
      reloadEntries();
      toast.success('Card deleted from canceled list');
    } catch {
      toast.error('Failed to delete card');
    }
  }

  function deleteOrphanCard(orphanIndex: number) {
    try {
      const s = readStorage(canceledKey);
      s.orphanCards = s.orphanCards.filter((_, idx) => idx !== orphanIndex);
      writeStorage(canceledKey, s);
      reloadEntries();
      toast.success('Card deleted from canceled list');
    } catch {
      toast.error('Failed to delete card');
    }
  }

  function deleteCanceledColumn(entryIndex: number) {
    try {
      const s = readStorage(canceledKey);
      const entry = s.entries[entryIndex];
      // Move cards to orphanCards instead of deleting them
      const newOrphans: OrphanCard[] = entry.cards.map((card) => ({
        card,
        originalColumn: entry.columnName,
        canceledAt: entry.canceledAt,
      }));
      s.orphanCards = [...s.orphanCards, ...newOrphans];
      s.entries = s.entries.filter((_, idx) => idx !== entryIndex);
      writeStorage(canceledKey, s);
      reloadEntries();
      toast.success('Column group removed — cards moved to Ungrouped');
    } catch {
      toast.error('Failed to delete canceled column');
    }
  }

  const totalCards = entries.reduce((sum, e) => sum + e.cards.length, 0) + orphanCards.length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 top-14 z-[60] flex flex-col"
      style={{ backgroundColor: 'var(--color-surface-0)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0 border-b"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface-1)',
        }}
      >
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5" style={{ color: '#fbbf24' }} />
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Canceled
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-surface-3)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {entries.length} columns, {totalCards} cards
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-[var(--color-surface-3)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {entries.length === 0 && orphanCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <PixelDino size={220} />
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Nothing here yet
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Canceled cards will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            {/* Grouped entries */}
            {entries.map((entry, entryIndex) => (
              <div key={entryIndex} className="flex flex-col gap-3">
                {/* Section header */}
                <div className="flex items-center justify-between pb-1">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {entry.columnName}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {formatDate(entry.canceledAt)}
                  </span>
                  <button
                    onClick={() => deleteCanceledColumn(entryIndex)}
                    className="text-[11px] px-2 py-1 rounded-md cursor-pointer hover:opacity-80 transition-colors"
                    style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.12)' }}
                  >
                    Delete column
                  </button>
                </div>

                {entry.cards.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    No cards were in this column.
                  </p>
                ) : (
                  <div>
                    {entry.cards.map((card, cardIndex) => (
                      <CardRow
                        key={card.card_id}
                        card={card}
                        columnName={entry.columnName}
                        onDelete={() => deleteCard(entryIndex, cardIndex)}
                        unarchiveProps={{
                          card,
                          storageLocation: { type: 'entry', entryIndex, cardIndex },
                          projectId,
                          canceledKey,
                          onSuccess: reloadEntries,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Ungrouped (orphan) cards */}
            {orphanCards.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Ungrouped Cards
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {orphanCards.length} cards
                  </span>
                </div>
                <div>
                  {orphanCards.map((orphan, orphanIndex) => (
                    <CardRow
                      key={`orphan-${orphan.card.card_id}-${orphanIndex}`}
                      card={orphan.card}
                      columnName={orphan.originalColumn}
                      onDelete={() => deleteOrphanCard(orphanIndex)}
                      unarchiveProps={{
                        card: orphan.card,
                        storageLocation: { type: 'orphan', orphanIndex },
                        projectId,
                        canceledKey,
                        onSuccess: reloadEntries,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
