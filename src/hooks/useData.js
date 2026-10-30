'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, get, push, query, limitToLast, goOnline } from 'firebase/database';
import { db } from '../lib/firebase';

const CACHE_KEY = 'frame_app_cache_v3';

// Core business entities (excluding heavy binary nodes: attachments, stamps, receipt_signatures)
const CORE_ENTITIES = [
  'clients',
  'tasks',
  'offers',
  'supervision',
  'invoices',
  'billingInvoices',
  'contracts',
  'deliveries',
  'receipts',
  'contractors',
  'settings'
];

const normalizeEntity = (entity, val) => {
  if (val === null || val === undefined) {
    return entity === 'settings' ? {} : [];
  }
  if (entity === 'settings') return val;
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return val;
};

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // 1. Instant load from local storage cache if available
  const [data, setData] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY) || localStorage.getItem('frame_app_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        delete parsed.attachments;
        delete parsed.stamps;
        delete parsed.receipt_signatures;
        return parsed;
      }
    } catch (e) {
      console.warn('Cache read warning:', e);
    }
    return null;
  });

  const [error, setError] = useState(null);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !!(localStorage.getItem(CACHE_KEY) || localStorage.getItem('frame_app_cache'));
      } catch (e) {}
    }
    return false;
  });

  // Debounced cache saving to prevent UI stutter
  const saveTimeoutRef = useRef(null);
  const scheduleSaveCache = useCallback((newData) => {
    if (typeof window === 'undefined') return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const toCache = { ...newData };
        delete toCache.attachments;
        delete toCache.stamps;
        delete toCache.receipt_signatures;
        localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
      } catch (e) {
        console.warn('Cache save warning:', e);
      }
    }, 500);
  }, []);

  useEffect(() => {
    goOnline(db);

    // Safety timeout: Never block user for more than 3.5 seconds
    const timeoutTimer = setTimeout(() => {
      setIsTimedOut(true);
      setInitialLoaded(true);
      setIsSyncing(false);
    }, 3500);

    // Track connection status
    const connectedRef = ref(db, '.info/connected');
    const unsubConn = onValue(connectedRef, (snap) => {
      const connected = snap.val() === true;
      setIsConnected(connected);
      if (connected) setIsTimedOut(false);
    });

    const unsubs = [];
    let loadedCount = 0;
    const totalToTrack = CORE_ENTITIES.length;

    // Listen ONLY to lightweight core entity paths (never root '/' which pulls giant base64 attachments)
    CORE_ENTITIES.forEach(entity => {
      const entityRef = ref(db, entity);
      const unsub = onValue(entityRef, (snap) => {
        const rawVal = snap.val();
        const cleanVal = normalizeEntity(entity, rawVal);

        setData(prev => {
          const next = {
            ...(prev || {}),
            [entity]: cleanVal
          };
          scheduleSaveCache(next);
          return next;
        });

        loadedCount++;
        // As soon as essential entities load or all entities report once, mark initial load complete
        if (loadedCount >= Math.min(3, totalToTrack)) {
          clearTimeout(timeoutTimer);
          setInitialLoaded(true);
          setIsSyncing(false);
          setIsTimedOut(false);
        }
      }, (err) => {
        console.error(`Firebase error on [${entity}]:`, err);
        setError(err);
      });
      unsubs.push(unsub);
    });

    // Listen only to last 50 notifications
    const notifQuery = query(ref(db, 'notifications'), limitToLast(50));
    const unsubNotifs = onValue(notifQuery, (snap) => {
      const val = snap.val() || {};
      const notifList = Object.values(val).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
      setNotifications(notifList);
    }, (err) => {
      console.error('Firebase error on notifications:', err);
    });
    unsubs.push(unsubNotifs);

    return () => {
      clearTimeout(timeoutTimer);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      unsubConn();
      unsubs.forEach(u => u());
    };
  }, [scheduleSaveCache]);

  const updateData = useCallback(async (entity, action, payload, id = null) => {
    const current = dataRef.current || {};
    const clean = (obj) => JSON.parse(JSON.stringify(obj));
    try {
      if (entity === 'settings') {
        const newSettings = clean({ ...(current.settings || {}), ...payload });
        setData(prev => {
          const next = { ...prev, settings: newSettings };
          scheduleSaveCache(next);
          return next;
        });
        await set(ref(db, 'settings'), newSettings);
      } else {
        const arr = Array.isArray(current[entity]) ? current[entity] : Object.values(current[entity] || {});
        let newArr;
        if (action === 'add') newArr = [...arr, payload];
        else if (action === 'update') newArr = arr.map(item => item.id === id ? { ...item, ...payload } : item);
        else if (action === 'delete') newArr = arr.filter(item => item.id !== id);
        else newArr = arr;

        const cleanArr = clean(newArr.filter(Boolean));
        // Immediate optimistic UI update
        setData(prev => {
          const next = { ...prev, [entity]: cleanArr };
          scheduleSaveCache(next);
          return next;
        });
        await set(ref(db, entity), cleanArr);
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('فشل الحفظ: ' + err.message);
    }
  }, [scheduleSaveCache]);

  const addNotification = useCallback(async (type, title, message) => {
    try {
      const newNotif = {
        id: Date.now().toString(),
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false
      };
      await push(ref(db, 'notifications'), newNotif);
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  }, []);

  const getAttachment = useCallback(async (id) => {
    try {
      const snap = await get(ref(db, `attachments/${id}`));
      return snap.exists() ? snap.val() : null;
    } catch (err) {
      console.error('Failed to get attachment:', err);
      return null;
    }
  }, []);

  const value = {
    data,
    isLoading: !data && !initialLoaded && !isTimedOut && !error,
    isError: error,
    updateData,
    addNotification,
    getAttachment,
    notifications,
    isConnected,
    isSyncing
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context) {
    return context;
  }
  // Safe fallback if called outside provider
  return {
    data: null,
    isLoading: true,
    isError: null,
    updateData: async () => {},
    addNotification: async () => {},
    getAttachment: async () => null,
    notifications: [],
    isConnected: false,
    isSyncing: false
  };
}
