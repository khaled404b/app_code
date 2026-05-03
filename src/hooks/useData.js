import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, get, update } from 'firebase/database';
import { db } from '../lib/firebase';

// Strip any fields containing large base64/attachment data from an object
function stripLargeData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && val.length > 50000) continue;
    result[key] = val;
  }
  return result;
}

function cleanEntityArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(stripLargeData);
}

export function useData() {
  const [data, setData] = useState(() => {
    // Load from cache SYNCHRONOUSLY on first render — no flash
    try {
      const cached = localStorage.getItem('frame_app_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });
  const [error, setError] = useState(null);
  // Keep a ref to latest data for optimistic updates without stale closures
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    // Monitor connection status
    const connectedRef = ref(db, '.info/connected');
    const unsubConn = onValue(connectedRef, (snap) => {
      setIsConnected(snap.val() === true);
    });

    const dbRefValue = ref(db, '/');
    const unsubscribe = onValue(dbRefValue, (snapshot) => {
      const val = snapshot.val();
      setIsSyncing(false);
      if (val) {
        setData(val);
        setError(null);
        try {
          const cacheData = { ...val };
          delete cacheData.attachments;
          localStorage.setItem('frame_app_cache', JSON.stringify(cacheData));
        } catch (e) { console.error('Cache error', e); }

        // Handle Notifications separately
        const rawNotifs = val.notifications || {};
        const notifList = Object.values(rawNotifs).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
        setNotifications(notifList);
      } else {
        const initialData = {
          clients: [], tasks: [], invoices: [], offers: [], notifications: {},
          settings: {
            companyName: 'مكتب فريم الهندسي',
            services: ['تصميم معماري', 'إشراف هندسي', 'رفع مساحي', 'استشارات هندسية', 'تقرير فني']
          }
        };
        set(dbRefValue, initialData);
      }
    }, (err) => {
      console.error('Firebase fetch error:', err);
      setError(err);
      setIsSyncing(false);
    });

    return () => {
      unsubscribe();
      unsubConn();
    };
  }, []);

  const addNotification = useCallback(async (type, title, message) => {
    const id = Date.now().toString();
    const notif = {
      id,
      type, // 'client', 'task', 'supervision'
      title,
      message,
      timestamp: Date.now(),
      read: false
    };
    try {
      await update(ref(db, `notifications/${id}`), notif);
    } catch (e) { console.error("Failed to add notification", e); }
  }, []);

  const getAttachment = async (id) => {
    try {
      const snap = await get(ref(db, `attachments/${id}`));
      return snap.val();
    } catch (e) { return null; }
  };

  const updateData = useCallback(async (entity, action, payload, id = null) => {
    const current = dataRef.current;

    // ── Settings ──────────────────────────────────────────────
    if (entity === 'settings') {
      const newSettings = { ...(current?.settings || {}), ...payload };
      // Optimistic
      setData(prev => ({ ...prev, settings: newSettings }));
      try { await update(ref(db, '/'), { settings: newSettings }); } catch (e) { console.error(e); }
      return;
    }

    // ── Bulk ──────────────────────────────────────────────────
    if (entity === 'bulk') {
      const updates = {};
      for (const key of Object.keys(payload)) {
        if (key === 'attachments') continue;
        updates[key] = payload[key];
      }
      // Optimistic
      setData(prev => ({ ...prev, ...updates }));
      try { await update(ref(db, '/'), updates); } catch (e) { console.error(e); }
      return;
    }

    // ── Array entities (clients, tasks, invoices, offers…) ────
    const arr = Array.isArray(current?.[entity])
      ? current[entity]
      : Object.values(current?.[entity] || {});

    let newArr;
    if (action === 'add') newArr = [...arr, payload];
    else if (action === 'update') newArr = arr.map(item => item.id === id ? { ...item, ...payload } : item);
    else if (action === 'delete') newArr = arr.filter(item => item.id !== id);
    else newArr = arr;

    // ── OPTIMISTIC UPDATE — instant UI response ───────────────
    setData(prev => ({ ...prev, [entity]: newArr }));

    // Update cache immediately too
    try {
      const cacheData = { ...(current || {}), [entity]: newArr };
      delete cacheData.attachments;
      localStorage.setItem('frame_app_cache', JSON.stringify(cacheData));
    } catch (e) { /* ignore */ }

    // ── Write to Firebase in the background ───────────────────
    try {
      await update(ref(db, '/'), { [entity]: cleanEntityArray(newArr) });
    } catch (err) {
      console.error('Error updating Firebase:', err);
      // Rollback optimistic update on failure
      setData(current);
    }
  }, []);

  return { data, isLoading: !error && !data, isError: error, updateData, getAttachment, notifications, addNotification, isConnected, isSyncing };
}
