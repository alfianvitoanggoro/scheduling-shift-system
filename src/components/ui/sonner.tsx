"use client";

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-card border border-border text-foreground shadow-lg',
          title: 'text-sm font-semibold',
          description: 'text-xs text-muted-foreground',
        },
      }}
    />
  );
}
