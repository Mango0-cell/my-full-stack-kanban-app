'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAcceptByTokenMutation } from '@/lib/store/api/inviteApi';

function AcceptInvitationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [acceptByToken, { isLoading }] = useAcceptByTokenMutation();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const kanbanToken = Cookies.get('kanban_token');
    if (!kanbanToken) {
      router.push(`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
      return;
    }
    if (!token) {
      setStatus('error');
      setErrorMsg('No invitation token provided');
      return;
    }
    acceptByToken(token)
      .unwrap()
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/board'), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.data?.message || 'Invalid or expired invitation');
      });
  }, [token]);

  return (
    <div className="p-8 rounded-xl text-center max-w-md" style={{ background: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {status === 'idle' && isLoading && (
        <>
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--color-brand-500)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--color-text-primary)' }}>Accepting invitation...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <svg className="w-6 h-6" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Invitation Accepted!</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Redirecting to your board...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <svg className="w-6 h-6" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Something went wrong</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{errorMsg}</p>
          <button onClick={() => router.push('/login')} className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer" style={{ background: 'var(--color-brand-500)', color: '#fff' }}>
            Go to Login
          </button>
        </>
      )}
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-0)' }}>
      <Suspense
        fallback={
          <div className="p-8 rounded-xl text-center max-w-md" style={{ background: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--color-brand-500)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--color-text-primary)' }}>Loading...</p>
          </div>
        }
      >
        <AcceptInvitationContent />
      </Suspense>
    </div>
  );
}
