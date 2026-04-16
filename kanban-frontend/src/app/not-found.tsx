'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface-0)',
        color: 'var(--color-text-primary)',
        fontFamily: 'inherit',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: 'clamp(4rem, 10vw, 8rem)',
          fontWeight: 800,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        <span>4</span>
        <motion.span
          animate={{ y: [0, -14, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ display: 'inline-block' }}
          aria-hidden="true"
        >
          👻
        </motion.span>
        <span>4</span>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 700,
          marginTop: '1.5rem',
          marginBottom: '0.5rem',
        }}
      >
        Boo! Page missing!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          fontSize: '1.125rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '28rem',
          marginBottom: '2.5rem',
        }}
      >
        Whoops! This page must be a ghost - it&apos;s not here!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link
          href="/board"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--color-brand-500)',
            color: '#fff',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
          }}
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}
