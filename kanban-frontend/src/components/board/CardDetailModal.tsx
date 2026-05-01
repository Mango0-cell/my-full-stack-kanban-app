'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Trash2, Send, Pencil, X, Check, Archive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { useListCommentsQuery, useAddCommentMutation, useDeleteCommentMutation } from '@/lib/store/api/commentsApi';
import { useUpdateCardMutation, useDeleteCardMutation, useGetCardQuery } from '@/lib/store/api/cardsApi';
import { useCancelCardMutation } from '@/lib/store/api/canceledApi';
import { useListMembersQuery } from '@/lib/store/api/projectsApi';
import { useAppSelector } from '@/lib/hooks/redux';
import { selectCurrentUser } from '@/lib/store/slices/authSlice';
import type { Card } from '@/lib/types/api';

const commentSchema = z.object({ content: z.string().min(1) });
type CommentForm = z.infer<typeof commentSchema>;

interface CardDetailModalProps {
  card: Card | null;
  projectId: number;
  onClose: () => void;
}

const priorityOptions = ['low', 'medium', 'high', 'urgent'] as const;

export function CardDetailModal({ card, projectId, onClose }: CardDetailModalProps) {
  const currentUser = useAppSelector(selectCurrentUser);
  const [updateCard, { isLoading: updating }] = useUpdateCardMutation();
  const [deleteCard, { isLoading: deleting }] = useDeleteCardMutation();
  const [cancelCard] = useCancelCardMutation();
  const [addComment, { isLoading: addingComment }] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const { data: commentsData, isLoading: commentsLoading } = useListCommentsQuery(card?.card_id ?? 0, {
    skip: !card,
  });
  const comments = commentsData?.data ?? [];

  const { data: membersData } = useListMembersQuery(projectId, { skip: !card });
  const members = membersData?.data ?? [];

  const { data: liveCardData } = useGetCardQuery(card?.card_id ?? 0, { skip: !card });
  const liveCard = liveCardData?.data ?? card;

  // Inline edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [description, setDescription] = useState(card?.description ?? '');
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [prevCardId, setPrevCardId] = useState<number | null>(null);

  // Custom priority state
  const [customPriorityMode, setCustomPriorityMode] = useState(false);
  const [customPriorityValue, setCustomPriorityValue] = useState('');

  const { register, handleSubmit, reset } = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
  });

  // When card changes, reset local state
  if (card && card.card_id !== prevCardId) {
    setPrevCardId(card.card_id);
    setDescription(card.description ?? '');
    setDescriptionDirty(false);
    setCustomPriorityMode(false);
  }

  async function handleTitleSave() {
    if (!card || !titleValue.trim()) { setEditingTitle(false); return; }
    try {
      await updateCard({ cardId: card.card_id, projectId, title: titleValue }).unwrap();
      toast.success('Title updated');
    } catch { toast.error('Failed'); }
    setEditingTitle(false);
  }

  async function handleDescriptionSave() {
    if (!card) return;
    try {
      await updateCard({ cardId: card.card_id, projectId, description }).unwrap();
      toast.success('Description saved');
      setDescriptionDirty(false);
    } catch { toast.error('Failed'); }
  }

  async function handlePriorityChange(priority: string) {
    if (!card) return;
    try {
      await updateCard({ cardId: card.card_id, projectId, priority }).unwrap();
    } catch { toast.error('Failed to update priority'); }
  }

  async function handleDueDateChange(due_date: string) {
    if (!card) return;
    try {
      await updateCard({ cardId: card.card_id, projectId, due_date: due_date || undefined }).unwrap();
    } catch { toast.error('Failed to update due date'); }
  }

  async function handleDeleteCard() {
    if (!card) return;
    try {
      await deleteCard({ cardId: card.card_id, projectId }).unwrap();
      toast.success('Card deleted');
      onClose();
    } catch { toast.error('Failed to delete card'); }
  }

  async function handleCancelCard() {
    if (!card) return;
    try {
      await cancelCard({ projectId, cardId: card.card_id }).unwrap();
      toast.success('Card canceled');
      onClose();
    } catch { toast.error('Failed to cancel card'); }
  }

  async function onCommentSubmit(data: CommentForm) {
    if (!card) return;
    try {
      await addComment({ cardId: card.card_id, content: data.content }).unwrap();
      reset();
    } catch { toast.error('Failed to add comment'); }
  }

  async function handleDeleteComment(commentId: number) {
    if (!card) return;
    try {
      await deleteComment({ commentId, cardId: card.card_id }).unwrap();
    } catch { toast.error('Failed to delete comment'); }
  }

  const currentPriority = (liveCard?.priority ?? card?.priority) as string;
  const isCustomPriority = card ? !(priorityOptions as readonly string[]).includes(currentPriority) : false;

  return (
    <Dialog open={!!card} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--color-text-primary)',
        }}
      >
        {!card ? null : (
          <>
            <DialogHeader>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    className="flex-1 text-lg font-semibold px-3 py-1.5 rounded-md outline-none"
                    style={{
                      backgroundColor: 'var(--color-surface-4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <button
                    onClick={handleTitleSave}
                    disabled={updating}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--color-brand-400)' }}
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <DialogTitle className="flex-1 text-left leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                    {card.title}
                  </DialogTitle>
                  <button
                    className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => { setTitleValue(card.title); setEditingTitle(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {/* Main content */}
              <div className="sm:col-span-2 space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-widest block"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Description
                  </label>
                  <MarkdownEditor
                    value={description}
                    onChange={(v) => { setDescription(v); setDescriptionDirty(true); }}
                    placeholder="Add a description..."
                  />
                  {descriptionDirty && (
                    <button
                      onClick={handleDescriptionSave}
                      disabled={updating}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--color-brand-500)',
                        color: '#ffffff',
                        boxShadow: '0 0 15px rgba(99,102,241,0.2)',
                      }}
                    >
                      {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                    </button>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)' }} />

                {/* Comments */}
                <div className="space-y-4">
                  <label className="text-[11px] font-medium uppercase tracking-widest block"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Comments
                  </label>

                  {/* Comments list */}
                  {commentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-12 w-full rounded-lg animate-pulse"
                             style={{ backgroundColor: 'var(--color-surface-3)' }} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.length === 0 && (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No comments yet</p>
                      )}
                      {comments.map((comment) => (
                        <div key={comment.comment_id} className="flex items-start gap-2.5">
                          <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-medium mt-0.5"
                               style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-secondary)' }}>
                            {comment.display_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 rounded-lg px-3 py-2"
                               style={{ backgroundColor: 'var(--color-surface-3)' }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                {comment.display_name}
                              </span>
                              {currentUser?.user_id === comment.user_id && (
                                <button
                                  className="p-0.5 rounded transition-colors shrink-0"
                                  style={{ color: 'var(--color-text-muted)' }}
                                  onClick={() => handleDeleteComment(comment.comment_id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <form onSubmit={handleSubmit(onCommentSubmit)} className="flex items-center gap-2 pt-1">
                    <input
                      placeholder="Add a comment…"
                      {...register('content')}
                      className="flex-1 min-w-0 h-9 px-3 rounded-md text-sm outline-none transition-all duration-150"
                      style={{
                        backgroundColor: 'var(--color-surface-4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={addingComment}
                      className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--color-brand-500)',
                        color: '#ffffff',
                        boxShadow: '0 0 15px rgba(99,102,241,0.2)',
                      }}
                    >
                      {addingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar metadata */}
              <div className="space-y-4">
                {/* Assigned to */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-widest block"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Assigned to
                  </label>
                  <select
                    value={liveCard?.assigned_user_id ?? ''}
                    onChange={async (e) => {
                      const val = e.target.value;
                      await updateCard({
                        cardId: card.card_id,
                        projectId,
                        assigned_user_id: val ? Number(val) : null,
                      }).unwrap().catch(() => toast.error('Failed to assign'));
                    }}
                    className="w-full h-8 px-2 rounded-md text-xs outline-none"
                    style={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-widest block"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Priority
                  </label>

                  {customPriorityMode ? (
                    /* Custom text input */
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        value={customPriorityValue}
                        onChange={e => setCustomPriorityValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const trimmed = customPriorityValue.trim();
                            if (trimmed && trimmed !== currentPriority) handlePriorityChange(trimmed);
                            setCustomPriorityMode(false);
                          }
                          if (e.key === 'Escape') setCustomPriorityMode(false);
                        }}
                        placeholder="e.g. blocker"
                        className="flex-1 h-8 px-2 rounded-md text-xs outline-none"
                        style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-primary)' }}
                      />
                      <button
                        onClick={() => {
                          const trimmed = customPriorityValue.trim();
                          if (trimmed && trimmed !== currentPriority) handlePriorityChange(trimmed);
                          setCustomPriorityMode(false);
                        }}
                        className="h-8 px-2 rounded-md text-xs font-medium"
                        style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
                      >OK</button>
                    </div>
                  ) : (
                    /* Native select — reliable, consistent with Assigned To */
                    <div className="flex items-center gap-1">
                      <select
                        value={isCustomPriority ? '__custom__' : currentPriority}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__custom__' || val === '__custom_edit__') {
                            setCustomPriorityMode(true);
                            setCustomPriorityValue(isCustomPriority ? currentPriority : '');
                          } else {
                            handlePriorityChange(val);
                          }
                        }}
                        className="flex-1 h-8 px-2 rounded-md text-xs outline-none capitalize"
                        style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        {isCustomPriority && <option value="__custom__">{currentPriority}</option>}
                        <option value="__custom_edit__">{isCustomPriority ? 'Edit custom...' : 'Custom...'}</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-widest block"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Due date
                  </label>
                  <input
                    type="date"
                    className="w-full h-8 px-3 rounded-md text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--color-surface-4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-primary)',
                      colorScheme: 'dark',
                    }}
                    value={liveCard?.due_date ? liveCard.due_date.split('T')[0] : ''}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)' }} />

                <button
                  onClick={handleCancelCard}
                  disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.1)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />Cancel card
                </button>

                <button
                  onClick={handleDeleteCard}
                  disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-3.5 w-3.5" />Delete card</>}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
