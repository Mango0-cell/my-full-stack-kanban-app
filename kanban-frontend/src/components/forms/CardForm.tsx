'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateCardMutation } from '@/lib/store/api/cardsApi';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  priority: z.string().min(1),
  due_date: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface CardFormProps {
  open: boolean;
  onClose: () => void;
  columnId: number;
  projectId: number;
}

export function CardForm({ open, onClose, columnId, projectId }: CardFormProps) {
  const [createCard, { isLoading }] = useCreateCardMutation();
  const [customPriorityMode, setCustomPriorityMode] = useState(false);
  const [customPriorityValue, setCustomPriorityValue] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  const priority = watch('priority');

  useEffect(() => {
    if (open) {
      reset({ priority: 'medium', title: '', due_date: '' });
      setCustomPriorityMode(false);
      setCustomPriorityValue('');
    }
  }, [open, reset]);

  async function onSubmit(data: FormData) {
    try {
      await createCard({
        columnId,
        projectId,
        title: data.title,
        priority: data.priority,
        due_date: data.due_date || undefined,
      }).unwrap();
      toast.success('Card created');
      onClose();
    } catch {
      toast.error('Failed to create card');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-sm"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--color-text-primary)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--color-text-primary)' }}>New card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label htmlFor="card-title" className="text-[11px] font-medium uppercase tracking-widest block"
                   style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Title
            </label>
            <input
              id="card-title"
              placeholder="Card title"
              autoFocus
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
              }}
              {...register('title')}
            />
            {errors.title && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-widest block"
                   style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Priority
            </label>
            {customPriorityMode ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={customPriorityValue}
                  onChange={e => setCustomPriorityValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = customPriorityValue.trim();
                      if (trimmed) setValue('priority', trimmed);
                      setCustomPriorityMode(false);
                    }
                    if (e.key === 'Escape') setCustomPriorityMode(false);
                  }}
                  placeholder="e.g. blocker"
                  className="flex-1 h-8 px-2 rounded-md text-xs outline-none"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = customPriorityValue.trim();
                    if (trimmed) setValue('priority', trimmed);
                    setCustomPriorityMode(false);
                  }}
                  className="h-8 px-2 rounded-md text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
                >OK</button>
              </div>
            ) : (
              <select
                value={['low','medium','high','urgent'].includes(priority) ? priority : '__custom__'}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '__custom_edit__' || val === '__custom__') {
                    setCustomPriorityMode(true);
                    setCustomPriorityValue(!['low','medium','high','urgent'].includes(priority) ? priority : '');
                  } else {
                    setValue('priority', val);
                  }
                }}
                className="w-full h-9 px-2 rounded-md text-sm outline-none capitalize"
                style={{
                  backgroundColor: 'var(--color-surface-4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                {!['low','medium','high','urgent'].includes(priority) && (
                  <option value="__custom__">{priority}</option>
                )}
                <option value="__custom_edit__">{!['low','medium','high','urgent'].includes(priority) ? 'Edit custom...' : 'Custom...'}</option>
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="due-date" className="text-[11px] font-medium uppercase tracking-widest block"
                   style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Due date <span style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <input
              id="due-date"
              type="date"
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
                colorScheme: 'dark',
              }}
              {...register('due_date')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-brand-500)',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(99,102,241,0.2)',
              }}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
