'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden p-1.5 rounded-md transition-colors duration-150"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-r-0" style={{ backgroundColor: 'var(--color-surface-0)' }}>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
