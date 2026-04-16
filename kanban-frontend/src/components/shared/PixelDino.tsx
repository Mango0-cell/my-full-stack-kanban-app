'use client';

export function PixelDino({ size = 120 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: Math.round(size * 0.46),
        WebkitMaskImage:
          'radial-gradient(ellipse 95% 95% at 50% 50%, black 80%, transparent 100%)',
        maskImage:
          'radial-gradient(ellipse 95% 95% at 50% 50%, black 80%, transparent 100%)',
      }}
    >
      <img
        src="/dinosaur.png"
        alt=""
        width={size}
        height={Math.round(size * 0.46)}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
