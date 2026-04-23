'use client';

import dynamic from 'next/dynamic';
import { RouteTransition } from '@/components/providers/RouteTransition';

const GradientBlinds = dynamic(() => import('@/components/shared/GradientBlinds'), { ssr: false });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="h-screen w-full relative overflow-hidden"
      style={{ backgroundColor: '#08090a', fontFamily: "'Inter', sans-serif", color: 'var(--kf-on-surface)' }}
    >
      {/* WebGL background — rendered once, never re-renders on form events */}
      <div className="absolute inset-0 z-0">
        <GradientBlinds
          gradientColors={['#FF9FFC', '#5227FF']}
          angle={0}
          noise={0.3}
          blindCount={12}
          blindMinWidth={50}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>

      {/* Page content sits above the background */}
      <main className="relative z-10 w-full h-full overflow-y-auto flex items-center justify-center p-6 sm:p-10">
        <RouteTransition>{children}</RouteTransition>
      </main>
    </div>
  );
}
