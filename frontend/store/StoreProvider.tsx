'use client';
import { ReactNode } from 'react';

// Zustand doesn't need a provider, but we keep this for future context needs
export function StoreProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
