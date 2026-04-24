'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare } from 'lucide-react';
import type { Card } from '@/lib/types/api';

interface CardItemProps {
  card: Card;
  onClick: (card: Card) => void;
  commentCount?: number;
  userRole?: string;
}

const priorityConfig = {
  low:    { border: 'border-l-emerald-500', label: 'LOW',    labelClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  medium: { border: 'border-l-indigo-500',  label: 'MED',    labelClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' },
  high:   { border: 'border-l-amber-500',   label: 'HIGH',   labelClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  urgent: { border: 'border-l-red-500',     label: 'URGENT', labelClass: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

export function CardItem({ card, onClick, commentCount = 0, userRole }: CardItemProps) {
  const isViewer = userRole === 'viewer';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.card_id, data: { type: 'card', card }, disabled: isViewer });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = priorityConfig[card.priority as keyof typeof priorityConfig] ?? {
    border: 'border-l-purple-500',
    label: card.priority.toUpperCase().slice(0, 8),
    labelClass: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  };
  const isOverdue = card.due_date && new Date(card.due_date) < new Date();
  const isDueToday = card.due_date && !isOverdue &&
    new Date(card.due_date).toDateString() === new Date().toDateString();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(card)}
      className={`kf-card select-none group border-l-[3px] ${priority.border} ${isDragging ? 'kf-card--active' : ''}`}
      role="article"
      aria-label={card.title}
      tabIndex={0}
    >
      {/* Title */}
      <h3 className="text-[14px] font-medium leading-snug mb-3 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
        {card.title}
      </h3>

      {/* Footer: priority badge + due date + comments */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <span className={`inline-flex items-center text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-sm border ${priority.labelClass}`}
                style={{ fontFamily: 'var(--font-mono)' }}
                aria-label={`Priority: ${card.priority}`}>
            {priority.label}
          </span>

          {/* Due date chip */}
          {card.due_date && (
            <span
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${
                isOverdue
                  ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                  : isDueToday
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-500 bg-[var(--color-surface-4)]'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Calendar className="h-2.5 w-2.5" />
              {isOverdue
                ? 'OVERDUE'
                : isDueToday
                  ? 'TODAY'
                  : new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
            </span>
          )}
        </div>

        {/* Comments */}
        {commentCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500"
                style={{ fontFamily: 'var(--font-mono)' }}>
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </span>
        )}
      </div>
    </div>
  );
}

export function CardDragOverlay({ card }: { card: Card }) {
  const priority = priorityConfig[card.priority as keyof typeof priorityConfig] ?? {
    border: 'border-l-purple-500',
    label: card.priority.toUpperCase().slice(0, 8),
    labelClass: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  };
  return (
    <div className={`w-[280px] rotate-[1.5deg] scale-[1.03] select-none kf-card kf-card--active border-l-[3px] ${priority.border}`}
         style={{ opacity: 0.95 }}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-sm border ${priority.labelClass}`}
              style={{ fontFamily: 'var(--font-mono)' }}>
          {priority.label}
        </span>
      </div>
      <h3 className="text-[14px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
        {card.title}
      </h3>
    </div>
  );
}
