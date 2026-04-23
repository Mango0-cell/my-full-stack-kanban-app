'use client';

export function ShaderBackground() {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.12) 0%, transparent 60%),' +
          'radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 55%),' +
          'radial-gradient(ellipse 50% 40% at 55% 45%, rgba(16,185,129,0.04) 0%, transparent 50%)',
      }}
    />
  );
}
