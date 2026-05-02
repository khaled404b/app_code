'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Login from './Login';
import BottomNav from './BottomNav';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export default function AppWrapper({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!user) {
    return <Login />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === 'dark' ? 'dark-theme-wrapper' : ''}>
        <main style={{ paddingBottom: '90px' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </ThemeContext.Provider>
  );
}
