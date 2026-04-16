'use client';

import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform"
      style={{
        backgroundColor: 'var(--color-brand-500)',
        color: '#ffffff',
        boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
      }}
      aria-label="Add new card"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
