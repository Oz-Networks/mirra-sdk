'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AuthGate from '../components/AuthGate';
import Dashboard from '../components/Dashboard';
import { useTheme } from '../providers/ThemeProvider';

const API_BASE_URL = 'https://api.fxn.world/api/sdk/v1';

// Helper to convert hex to HSL values for generating color variants
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Generate color variants from a base color
function generateColorVariants(primaryHex: string, secondaryHex: string) {
  const primary = hexToHSL(primaryHex);
  const secondary = hexToHSL(secondaryHex);

  return {
    // Light theme
    light: {
      accentPrimary: primaryHex,
      accentSecondary: secondaryHex,
      accentTertiary: `hsl(${primary.h}, ${Math.min(primary.s + 20, 100)}%, 85%)`,
      accentSubtle: `hsl(${primary.h}, ${Math.min(primary.s + 10, 100)}%, 97%)`,
    },
    // Dark theme - brighter versions
    dark: {
      accentPrimary: secondaryHex,
      accentSecondary: `hsl(${secondary.h}, ${secondary.s}%, ${Math.min(secondary.l + 10, 70)}%)`,
      accentTertiary: `hsl(${primary.h}, ${Math.max(primary.s - 30, 20)}%, 25%)`,
      accentSubtle: `hsl(${primary.h}, ${Math.max(primary.s - 40, 10)}%, 8%)`,
    },
  };
}

export default function ProductDocumentManager() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { setTheme } = useTheme();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [colorsApplied, setColorsApplied] = useState(false);

  // Configuration from environment
  const maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAXFILESIZE || '10', 10);
  const allowedTypes = process.env.NEXT_PUBLIC_ALLOWEDFILETYPES || 'all';
  const welcomeMessage = process.env.NEXT_PUBLIC_WELCOMEMESSAGE || 'Manage your product documentation';
  const primaryColor = process.env.NEXT_PUBLIC_PRIMARYCOLOR || '#c2410c';
  const secondaryColor = process.env.NEXT_PUBLIC_SECONDARYCOLOR || '#ea580c';
  const defaultTheme = process.env.NEXT_PUBLIC_COLORTHEME || 'system';

  // Apply custom colors to CSS variables
  useEffect(() => {
    const colors = generateColorVariants(primaryColor, secondaryColor);

    // Create style element for custom colors
    const styleId = 'custom-brand-colors';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      :root {
        --accent-primary: ${colors.light.accentPrimary};
        --accent-secondary: ${colors.light.accentSecondary};
        --accent-tertiary: ${colors.light.accentTertiary};
        --accent-subtle: ${colors.light.accentSubtle};
      }
      .dark {
        --accent-primary: ${colors.dark.accentPrimary};
        --accent-secondary: ${colors.dark.accentSecondary};
        --accent-tertiary: ${colors.dark.accentTertiary};
        --accent-subtle: ${colors.dark.accentSubtle};
      }
    `;

    // Apply default theme preference
    if (defaultTheme !== 'system') {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(defaultTheme as 'light' | 'dark');
      }
    }

    setColorsApplied(true);
  }, [primaryColor, secondaryColor, defaultTheme, setTheme]);

  // Fetch owner's Privy ID from template installation
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
        setOwnerId(data.data.ownerPrivyId);
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
  if (!ready || ownerLoading || !colorsApplied) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center animate-fade-in">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-pulse-subtle"
            style={{ background: 'var(--accent-primary, #c2410c)' }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Show error if owner ID couldn't be fetched
  if (ownerError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center animate-fade-in">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--error-subtle)', border: '1px solid var(--error)' }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--error)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--error)' }}>{ownerError}</p>
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
