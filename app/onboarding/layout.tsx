// app/onboarding/layout.tsx
import React, { ReactNode, Suspense } from 'react';
// No need to import OnboardingLayout here as it's applied through page structure
// Forcing Suspense boundary for child pages if they use useSearchParams
export default function Layout({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}