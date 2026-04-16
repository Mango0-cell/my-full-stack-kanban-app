'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { ColumnItem } from './ColumnItem';
import { CardDragOverlay } from './CardItem';
import {
  useListColumnsQuery,
  useUpdateColumnMutation,
  useDeleteColumnMutation,
} from '@/lib/store/api/columnsApi';
import {
  useListCardsQuery,
  useMoveCardMutation,
} from '@/lib/store/api/cardsApi';
import type { Column, Card } from '@/lib/types/api';

type FilterMode = 'all' | 'today' | 'week' | 'month';

interface BoardDnDProps {
  projectId: number;
  onAddCard: (columnId: number) => void;
  onCardClick: (card: Card) => void;
  onAddColumn: () => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (column: Column) => void;
  filterMode?: FilterMode;
  searchQuery?: string;
}

export function BoardDnD({
  projectId,
  onAddCard,
  onCardClick,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  filterMode = 'all',
  searchQuery = '',
}: BoardDnDProps) {
  const { data: columnsData, isLoading: columnsLoading } = useListColumnsQuery(projectId);
  const { data: cardsData, isLoading: cardsLoading } = useListCardsQuery(projectId);
  const [updateColumn] = useUpdateColumnMutation();
  const [moveCard] = useMoveCardMutation();
  const [deleteColumn] = useDeleteColumnMutation();

  const columns: Column[] = columnsData?.data ?? [];
  const allCards: Card[] = cardsData?.data ?? [];

  const [localCards, setLocalCards] = useState<Card[] | null>(null);
  const isDraggingRef = useRef(false);

  // Reset localCards when API data changes and no drag is in progress.
  // This ensures newly created/deleted cards from RTK Query refetches
  // are always reflected, even if localCards was somehow left stale.
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalCards(null);
    }
  }, [allCards]);

  const activeCards = localCards ?? allCards;

  const filteredCards = useMemo(() => {
    let cards = activeCards;

    // Apply date filter
    if (filterMode !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cards = cards.filter((card) => {
        if (!card.due_date) return false;
        const due = new Date(card.due_date);
        switch (filterMode) {
          case 'today':
            return due >= startOfDay && due < new Date(startOfDay.getTime() + 86400000);
          case 'week': {
            const endOfWeek = new Date(startOfDay.getTime() + 7 * 86400000);
            return due >= startOfDay && due < endOfWeek;
          }
          case 'month': {
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return due >= startOfDay && due < endOfMonth;
          }
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      cards = cards.filter((card) => card.title.toLowerCase().includes(q));
    }

    return cards;
  }, [activeCards, filterMode, searchQuery]);

  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function getCardsForColumn(columnId: number) {
    return filteredCards
      .filter((c) => c.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  }

  function onDragStart({ active }: DragStartEvent) {
    if (active.data.current?.type === 'card') {
      isDraggingRef.current = true;
      setActiveCard(active.data.current.card as Card);
      setLocalCards([...allCards]);
    }
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return;
    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeCardId = active.id as number;
    const overType = over.data.current?.type;

    setLocalCards((prev) => {
      const cards = prev ?? allCards;
      const aIdx = cards.findIndex((c) => c.card_id === activeCardId);
      if (aIdx === -1) return prev;

      let targetColumnId: number;
      let overCardId: number | null = null;

      if (overType === 'column') {
        targetColumnId = (over.data.current?.column as Column).column_id;
      } else if (overType === 'card') {
        const overCard = over.data.current?.card as Card;
        targetColumnId = overCard.column_id;
        overCardId = overCard.card_id;
      } else {
        return prev;
      }

      const updated = cards.map((c) =>
        c.card_id === activeCardId ? { ...c, column_id: targetColumnId } : c,
      );

      if (overCardId !== null) {
        const newAIdx = updated.findIndex((c) => c.card_id === activeCardId);
        const oIdx = updated.findIndex((c) => c.card_id === overCardId);
        return arrayMove(updated, newAIdx, oIdx);
      }
      return updated;
    });
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    isDraggingRef.current = false;

    if (!over) {
      setLocalCards(null);
      return;
    }

    const activeType = active.data.current?.type;
    if (activeType !== 'card') {
      setLocalCards(null);
      return;
    }

    const cards = localCards ?? allCards;
    const movedCard = cards.find((c) => c.card_id === (active.id as number));
    if (!movedCard) {
      setLocalCards(null);
      return;
    }

    const columnCards = cards
      .filter((c) => c.column_id === movedCard.column_id)
      .sort((a, b) => a.position - b.position);
    const newPosition = columnCards.findIndex((c) => c.card_id === movedCard.card_id) + 1;

    try {
      await moveCard({
        cardId: movedCard.card_id,
        columnId: movedCard.column_id,
        position: newPosition,
      });
    } catch {
      // RTK Query will re-fetch from server on error
    } finally {
      setLocalCards(null);
    }
  }

  const handleRenameColumn = useCallback(
    async (columnId: number, name: string) => {
      const col = columns.find((c) => c.column_id === columnId);
      if (!col) return;
      await updateColumn({ projectId, columnId, name, position: col.position });
    },
    [columns, projectId, updateColumn],
  );

  const handleDeleteColumn = useCallback(
    (column: Column) => onDeleteColumn(column),
    [onDeleteColumn],
  );

  const handleMoveColumn = useCallback(
    async (columnId: number, direction: 'left' | 'right') => {
      const sorted = columns.slice().sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((c) => c.column_id === columnId);
      if (idx === -1) return;
      const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      const current = sorted[idx];
      const target = sorted[swapIdx];
      try {
        await Promise.all([
          updateColumn({ projectId, columnId: current.column_id, name: current.name, position: target.position }),
          updateColumn({ projectId, columnId: target.column_id, name: target.name, position: current.position }),
        ]);
      } catch {
        // RTK Query will re-fetch
      }
    },
    [columns, projectId, updateColumn],
  );

  if (columnsLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center h-full" aria-busy="true" aria-label="Loading board...">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 items-start overflow-x-auto pb-6 h-full kanban-scroll" role="main" aria-label="Kanban board">
        {columns
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((column, idx, arr) => (
            <ColumnItem
              key={column.column_id}
              column={column}
              cards={getCardsForColumn(column.column_id)}
              onCardClick={onCardClick}
              onAddCard={onAddCard}
              onDeleteColumn={handleDeleteColumn}
              onRenameColumn={handleRenameColumn}
              onMoveColumn={handleMoveColumn}
              isFirst={idx === 0}
              isLast={idx === arr.length - 1}
            />
          ))}

        <button
          onClick={onAddColumn}
          className="w-[280px] shrink-0 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            border: '1px dashed rgba(255,255,255,0.08)',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
            e.currentTarget.style.color = 'var(--color-brand-400)';
            e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-1)';
          }}
        >
          <Plus className="h-4 w-4" />
          Add Column
        </button>
      </div>

      <DragOverlay>
        {activeCard && <CardDragOverlay card={activeCard} />}
      </DragOverlay>
    </DndContext>
  );
}
