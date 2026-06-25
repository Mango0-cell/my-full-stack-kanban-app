import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { ShaderBackground } from '@/components/shared/ShaderBackground';
import { RouteTransition } from '@/components/providers/RouteTransition';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-surface-0)' }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Shader aurora background — behind everything */}
        <ShaderBackground />

        {/* Sidebar: hidden on mobile, visible on md+ */}
        <div className="hidden md:flex relative z-10">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto relative z-10">
          <RouteTransition>{children}</RouteTransition>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
