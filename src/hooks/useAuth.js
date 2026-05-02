'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const USERS = {
  'م.فواز': { password: '123', color: '#2563eb' },
  'أ.خالد':   { password: '123', color: '#7c3aed' },
  'د.محمد': { password: '123', color: '#059669' },
  'م.احمد': { password: '123', color: '#d97706' },
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('frame_user_v2');
    if (cached) {
      setUser(JSON.parse(cached));
    }
    setIsLoaded(true);
  }, []);

  const login = (name, password, mode) => {
    const userConf = USERS[name];
    if (!userConf) return { ok: false, error: 'المستخدم غير موجود' };
    if (userConf.password !== password) return { ok: false, error: 'كلمة السر غير صحيحة' };
    const userData = { name, mode, color: userConf.color };
    localStorage.setItem('frame_user_v2', JSON.stringify(userData));
    setUser(userData);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem('frame_user_v2');
    setUser(null);
  };

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      canEdit: user?.mode === 'edit',
      userNames: Object.keys(USERS),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
