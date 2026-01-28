'use client';

import { usePrivy } from '@privy-io/react-auth';

interface AuthGateProps {
  ownerId: string;
  onAccessDenied?: () => void;
}

export default function AuthGate({ ownerId, onAccessDenied }: AuthGateProps) {
  const { login, ready, authenticated, user } = usePrivy();

  const isOwner = authenticated && user?.id === ownerId;

  // Access denied state
  if (authenticated && !isOwner) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Subtle background pattern */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ background: 'var(--error)' }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ background: 'var(--warning)' }}
          />
        </div>

        <div className="relative w-full max-w-md animate-fade-in">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--error-subtle)', border: '1px solid var(--error)' }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--error)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Card */}
          <div
            className="p-8 rounded-2xl"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="text-center">
              <h1
                className="text-2xl font-display font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Access Denied
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Only the template owner can access this page. You are signed in as a different user.
              </p>

              <div
                className="p-4 rounded-xl mb-6"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Signed in as
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user?.email?.address || user?.wallet?.address || user?.id}
                </p>
              </div>

              <button
                onClick={onAccessDenied}
                className="btn btn-secondary w-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login screen
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Subtle background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'var(--accent-primary)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'var(--accent-secondary)' }}
        />
        {/* Grid pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.015]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                style={{ color: 'var(--text-primary)' }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent-primary)' }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-2xl"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-display font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Welcome
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to access your product documents
            </p>
          </div>

          {/* Sign in button */}
          <button
            onClick={login}
            disabled={!ready}
            className="btn btn-primary w-full py-4 text-base"
            style={{
              opacity: !ready ? 0.6 : 1,
            }}
          >
            {!ready ? (
              <>
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border-primary)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              or continue with
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-primary)' }} />
          </div>

          {/* Alternative methods */}
          <div className="flex justify-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Email
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Wallet
              </span>
            </div>
          </div>

          {/* Footer note */}
          <p
            className="mt-6 text-center text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Only the template owner can access this page
          </p>
        </div>

        {/* Powered by */}
        <p
          className="mt-6 text-center text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Secured by Privy
        </p>
      </div>
    </div>
  );
}
