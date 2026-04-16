'use client';

import { useEffect } from 'react';
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
import { useCreateColumnMutation, useUpdateColumnMutation } from '@/lib/store/api/columnsApi';
import type { Column } from '@/lib/types/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});
type FormData = z.infer<typeof schema>;

interface ColumnFormProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  column?: Column;
}

export function ColumnForm({ open, onClose, projectId, column }: ColumnFormProps) {
  const isEdit = !!column;
  const [createColumn, { isLoading: creating }] = useCreateColumnMutation();
  const [updateColumn, { isLoading: updating }] = useUpdateColumnMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: column?.name ?? '' },
  });

  useEffect(() => {
    if (open) reset({ name: column?.name ?? '' });
  }, [open, column, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        await updateColumn({ projectId, columnId: column!.column_id, name: data.name, position: column!.position }).unwrap();
        toast.success('Column updated');
      } else {
        await createColumn({ projectId, name: data.name }).unwrap();
        toast.success('Column created');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update column' : 'Failed to create column');
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
          <DialogTitle style={{ color: 'var(--color-text-primary)' }}>
            {isEdit ? 'Rename column' : 'New column'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label htmlFor="col-name" className="text-[11px] font-medium uppercase tracking-widest block"
                   style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Column name
            </label>
            <input
              id="col-name"
              placeholder="e.g. In Progress"
              autoFocus
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
              }}
              {...register('name')}
            />
            {errors.name && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{errors.name.message}</p>}
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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
