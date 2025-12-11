'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AuthGate from '../components/AuthGate';
import Dashboard from '../components/Dashboard';

const API_BASE_URL = 'https://api.fxn.world/api/sdk/v1';

export default function ProductDocumentManager() {
  const { ready, authenticated, user, logout } = usePrivy();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Configuration from environment
  const maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAXFILESIZE || '10', 10);
  const allowedTypes = process.env.NEXT_PUBLIC_ALLOWEDFILETYPES || 'all';
  const welcomeMessage = process.env.NEXT_PUBLIC_WELCOMEMESSAGE || 'Manage your product documentation';

  // Fetch owner ID from template installation
  useEffect(() => {
    async function fetchOwnerId() {
      try {
        const response = await fetch(`${API_BASE_URL}/templates/installations/current`, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_TEMPLATE_API_KEY!,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch installation');
        }
        
        const data = await response.json();
        const userId = "did:privy:" + data.data.userId;
        setOwnerId(userId);
      } catch (err) {
        console.error('Failed to fetch template installation:', err);
        setOwnerError('Failed to load template configuration');
      } finally {
        setOwnerLoading(false);
      }
    }
    fetchOwnerId();
  }, []);

  // Check if current user is the owner
  const isOwner = authenticated && ownerId && user?.id === ownerId;

  // Loading state while Privy or owner ID initializes
  if (!ready || ownerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error if owner ID couldn't be fetched
  if (ownerError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 text-sm">{ownerError}</p>
        </div>
      </div>
    );
  }

  // Show auth gate if not authenticated or not the owner
  if (!authenticated || !isOwner) {
    return <AuthGate ownerId={ownerId || ''} onAccessDenied={logout} />;
  }

  // Show dashboard if authenticated as owner
  return (
    <Dashboard
      userId={user.id}
      onSignOut={logout}
      maxFileSize={maxFileSize}
      allowedTypes={allowedTypes}
      welcomeMessage={welcomeMessage}
    />
  );
}
