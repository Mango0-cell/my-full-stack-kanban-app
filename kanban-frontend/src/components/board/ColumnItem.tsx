'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CardItem } from './CardItem';
import type { Column, Card } from '@/lib/types/api';

interface ColumnItemProps {
  column: Column;
  cards: Card[];
  onCardClick: (card: Card) => void;
  onAddCard: (columnId: number) => void;
  onDeleteColumn: (column: Column) => void;
  onRenameColumn: (columnId: number, name: string) => void;
  onMoveColumn?: (columnId: number, direction: 'left' | 'right') => void;
  isFirst?: boolean;
  isLast?: boolean;
  commentCounts?: Record<number, number>;
}

export function ColumnItem({
  column,
  cards,
  onCardClick,
  onAddCard,
  onDeleteColumn,
  onRenameColumn,
  onMoveColumn,
  isFirst = false,
  isLast = false,
  commentCounts = {},
}: ColumnItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.column_id}`,
    data: { type: 'column', column },
  });

  const cardIds = cards.map((c) => c.card_id);

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== column.name) {
      onRenameColumn(column.column_id, trimmed);
    }
    setIsRenaming(false);
  }

  return (
    <div
      className={`flex flex-col w-[280px] shrink-0 kf-column ${isOver ? 'kf-column--drop-active' : ''}`}
      role="region"
      aria-label={`${column.name}, ${cards.length} cards`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
           style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="text-[13px] font-semibold px-1.5 py-0.5 rounded-md outline-none w-full"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                border: '1px solid var(--color-brand-500)',
                color: 'var(--color-text-primary)',
              }}
            />
          ) : (
            <span className="text-[13px] font-semibold uppercase tracking-widest truncate"
                  style={{ color: 'var(--color-text-secondary)' }}>
              {column.name}
            </span>
          )}
          <span className="shrink-0 px-1.5 py-0.5 rounded-sm text-[11px] font-medium"
                style={{
                  backgroundColor: 'var(--color-surface-3)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}>
            {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onAddCard(column.column_id)}
            className="p-1.5 rounded-md transition-colors duration-150"
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
            <Plus className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-md transition-colors duration-150"
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
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-50 min-w-[160px]"
              style={{
                backgroundColor: '#0d1017',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <DropdownMenuItem
                className="text-sm cursor-pointer"
                onClick={() => { setRenameValue(column.name); setIsRenaming(true); }}
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              {!isFirst && onMoveColumn && (
                <DropdownMenuItem
                  className="text-sm cursor-pointer"
                  onClick={() => onMoveColumn(column.column_id, 'left')}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                  Move left
                </DropdownMenuItem>
              )}
              {!isLast && onMoveColumn && (
                <DropdownMenuItem
                  className="text-sm cursor-pointer"
                  onClick={() => onMoveColumn(column.column_id, 'right')}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-2" />
                  Move right
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                onClick={() => onDeleteColumn(column)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-3 p-3 min-h-[80px] overflow-y-auto kanban-scroll transition-colors"
        style={{ maxHeight: 'calc(100vh - 14rem)' }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem
              key={card.card_id}
              card={card}
              onClick={onCardClick}
              commentCount={commentCounts[card.card_id]}
            />
          ))}
        </SortableContext>

        {/* Empty column CTA */}
        {cards.length === 0 && (
          <div
            className="border border-dashed rounded-lg p-6 flex flex-col items-center gap-2 mt-2 cursor-pointer transition-colors duration-200"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={() => onAddCard(column.column_id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
              e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Plus className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Add a card</span>
          </div>
        )}
      </div>

      {/* Add card button */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={() => onAddCard(column.column_id)}
          className="w-full flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors duration-150"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)';
            e.currentTarget.style.color = 'var(--color-brand-400)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add card
        </button>
      </div>
    </div>
  );
}
