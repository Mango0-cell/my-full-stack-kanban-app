'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateProjectMutation } from '@/lib/store/api/projectsApi';

const schema = z.object({
  project_name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

interface CreateProjectDialogProps {
  children: React.ReactNode;
}

export function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [createProject, { isLoading }] = useCreateProjectMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const result = await createProject(data).unwrap();
      toast.success('Project created!');
      setOpen(false);
      reset();
      router.push(`/board/${result.data.project_id}`);
    } catch {
      toast.error('Failed to create project');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--color-text-primary)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--color-text-primary)' }}>New project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label htmlFor="project_name" className="text-[11px] font-medium uppercase tracking-widest block"
                   style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Project Name
            </label>
            <input
              id="project_name"
              placeholder="My Kanban Board"
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
              }}
              {...register('project_name')}
            />
            {errors.project_name && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{errors.project_name.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-[11px] font-medium uppercase tracking-widest block"
                   style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Description <span style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <input
              id="description"
              placeholder="What is this project about?"
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
              }}
              {...register('description')}
            />
            {errors.description && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{errors.description.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
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
