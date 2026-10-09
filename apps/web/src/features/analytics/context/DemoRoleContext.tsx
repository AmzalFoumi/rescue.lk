'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { DemoRole } from '@rescue-lk/shared/analytics/report.types';

interface DemoRoleContextValue {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
}

const DemoRoleContext = createContext<DemoRoleContextValue | null>(null);

export function DemoRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>('DMC_ADMIN');
  return (
    <DemoRoleContext.Provider value={{ role, setRole }}>
      {children}
    </DemoRoleContext.Provider>
  );
}

export function useDemoRole(): DemoRoleContextValue {
  const ctx = useContext(DemoRoleContext);
  if (!ctx) throw new Error('useDemoRole must be used inside DemoRoleProvider');
  return ctx;
}
