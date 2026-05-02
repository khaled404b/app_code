'use client';

import { useAuth } from '@/hooks/useAuth';
import Login from './Login';
import BottomNav from './BottomNav';

export default function AppWrapper({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <main style={{ paddingBottom: '90px' }}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
