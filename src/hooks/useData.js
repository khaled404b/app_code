import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, get, update, push, goOnline, goOffline } from 'firebase/database';
import { db } from '../lib/firebase';

export function useData() {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('frame_app_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });
  const [error, setError] = useState(null);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    goOnline(db);

    const timer = setTimeout(() => {
      if (!dataRef.current) setIsTimedOut(true);
    }, 6000);

    const connectedRef = ref(db, '.info/connected');
    const unsubConn = onValue(connectedRef, (snap) => {
      const connected = snap.val() === true;
      setIsConnected(connected);
      if (connected) setIsTimedOut(false);
    });

    const dbRefValue = ref(db, '/');
    const unsubscribe = onValue(dbRefValue, (snapshot) => {
      clearTimeout(timer);
      const val = snapshot.val();
      setIsSyncing(false);
      setIsTimedOut(false);
      
      if (val) {
        setData(val);
        setError(null);
        try {
          const cacheData = { ...val };
          delete cacheData.attachments;
          localStorage.setItem('frame_app_cache', JSON.stringify(cacheData));
        } catch (e) {}
        
        const rawNotifs = val.notifications || {};
        const notifList = Object.values(rawNotifs).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
        setNotifications(notifList);
      }
    }, (err) => {
      console.error('Firebase Error:', err);
      setError(err);
      setIsSyncing(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      unsubConn();
      clearTimeout(timer);
    };
  }, []);

  const updateData = useCallback(async (entity, action, payload, id = null) => {
    const current = dataRef.current || {};
    // Helper: strip undefined values Firebase rejects
    const clean = (obj) => JSON.parse(JSON.stringify(obj));
    try {
      if (entity === 'settings') {
        await update(ref(db, '/'), { settings: clean({ ...(current.settings || {}), ...payload }) });
      } else {
        const arr = Array.isArray(current[entity]) ? current[entity] : Object.values(current[entity] || {});
        let newArr;
        if (action === 'add') newArr = [...arr, payload];
        else if (action === 'update') newArr = arr.map(item => item.id === id ? { ...item, ...payload } : item);
        else if (action === 'delete') newArr = arr.filter(item => item.id !== id);
        else newArr = arr;

        // Clean entire array before saving — removes nulls, undefineds, circular refs
        const cleanArr = clean(newArr.filter(Boolean));
        setData(prev => ({ ...prev, [entity]: cleanArr }));
        await update(ref(db, '/'), { [entity]: cleanArr });
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('فشل الحفظ: ' + err.message);
    }
  }, []);

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

  return { 
    data, 
    isLoading: !data && !isTimedOut && !error, 
    isError: error, 
    updateData, 
    addNotification,
    getAttachment,
    notifications, 
    isConnected, 
    isSyncing 
  };
}
