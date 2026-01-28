'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import ChatInterface from '../components/ChatInterface';

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

function generateColorVariants(primaryHex: string, secondaryHex: string) {
  const primary = hexToHSL(primaryHex);
  const secondary = hexToHSL(secondaryHex);

  return {
    light: {
      accentPrimary: primaryHex,
      accentSecondary: secondaryHex,
      accentTertiary: `hsl(${primary.h}, ${Math.min(primary.s + 20, 100)}%, 85%)`,
      accentSubtle: `hsl(${primary.h}, ${Math.min(primary.s + 10, 100)}%, 97%)`,
    },
    dark: {
      accentPrimary: secondaryHex,
      accentSecondary: `hsl(${secondary.h}, ${secondary.s}%, ${Math.min(secondary.l + 10, 70)}%)`,
      accentTertiary: `hsl(${primary.h}, ${Math.max(primary.s - 30, 20)}%, 25%)`,
      accentSubtle: `hsl(${primary.h}, ${Math.max(primary.s - 40, 10)}%, 8%)`,
    },
  };
}

interface Config {
  companyName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  aiModel: string;
  systemPrompt: string;
  showSources: boolean;
  suggestedQuestions: string[];
}

export default function ProductKnowledgeChat() {
  const { setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);

  // Configuration from environment
  const primaryColor = process.env.NEXT_PUBLIC_PRIMARYCOLOR || '#0891b2';
  const secondaryColor = process.env.NEXT_PUBLIC_SECONDARYCOLOR || '#06b6d4';
  const defaultTheme = process.env.NEXT_PUBLIC_COLORTHEME || 'light';

  useEffect(() => {
    // Apply custom colors
    const colors = generateColorVariants(primaryColor, secondaryColor);

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

    // Apply default theme
    if (defaultTheme !== 'system') {
      const savedTheme = localStorage.getItem('kb-theme');
      if (!savedTheme) {
        setTheme(defaultTheme as 'light' | 'dark');
      }
    }

    // Parse configuration
    const suggestedQuestionsRaw = process.env.NEXT_PUBLIC_SUGGESTEDQUESTIONS || 'How do I get started?\nWhat are the main features?\nHow do I troubleshoot common issues?';
    const suggestedQuestions = suggestedQuestionsRaw
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    setConfig({
      companyName: process.env.NEXT_PUBLIC_COMPANYNAME || 'Support',
      welcomeTitle: process.env.NEXT_PUBLIC_WELCOMETITLE || 'How can we help you today?',
      welcomeSubtitle: process.env.NEXT_PUBLIC_WELCOMESUBTITLE || 'Select a product and ask any question about features, setup, or troubleshooting.',
      aiModel: process.env.NEXT_PUBLIC_AIMODEL || 'claude-3-haiku-20240307',
      systemPrompt: process.env.NEXT_PUBLIC_SYSTEMPROMPT || 'You are a helpful product support assistant. Answer questions based on the provided documentation. Be concise, accurate, and friendly. If you don\'t know the answer or the documentation doesn\'t cover the topic, say so honestly and suggest the customer contact support directly.',
      showSources: process.env.NEXT_PUBLIC_SHOWSOURCES !== 'false',
      suggestedQuestions,
    });

    setReady(true);
  }, [primaryColor, secondaryColor, defaultTheme, setTheme]);

  if (!ready || !config) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center animate-fade-in">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse-subtle"
            style={{ background: 'var(--accent-primary, #0891b2)' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      companyName={config.companyName}
      welcomeTitle={config.welcomeTitle}
      welcomeSubtitle={config.welcomeSubtitle}
      aiModel={config.aiModel}
      systemPrompt={config.systemPrompt}
      showSources={config.showSources}
      suggestedQuestions={config.suggestedQuestions}
    />
  );
}
