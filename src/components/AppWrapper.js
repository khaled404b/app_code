'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Login from './Login';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export default function AppWrapper({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Locked to light mode
  };

  if (!user) {
    return <Login />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === 'dark' ? 'dark-theme-wrapper' : ''}>
        {/* NEW GLOBAL TOP BAR (AS REQUESTED) */}
        <TopBar />
        
        <main style={{ paddingBottom: '90px' }}>
          {children}
        </main>
        
        <BottomNav />
      </div>
    </ThemeContext.Provider>
  );
}
