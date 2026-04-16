'use client';

import dynamic from 'next/dynamic';

const AnimatedShaderBackground = dynamic(
  () => import('@/components/ui/animated-shader-background'),
  { ssr: false }
);

export function ShaderBackground() {
  return (
    <div className="absolute inset-0 z-0 opacity-40">
      <AnimatedShaderBackground />
    </div>
  );
}
