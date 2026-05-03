import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, get, update, goOnline, goOffline } from 'firebase/database';
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
    // FORCE ONLINE - Ensure Firebase doesn't go to sleep
    goOnline(db);

    const timer = setTimeout(() => {
      if (!dataRef.current) setIsTimedOut(true);
    }, 6000);

    // Monitoring the actual Firebase connection state
    const connectedRef = ref(db, '.info/connected');
    const unsubConn = onValue(connectedRef, (snap) => {
      const connected = snap.val() === true;
      setIsConnected(connected);
      if (connected) setIsTimedOut(false);
    });

    // Listening to the main data path
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
    // ... Simplified update logic for the background ...
    try {
      if (entity === 'settings') {
        await update(ref(db, '/'), { settings: { ...(current.settings || {}), ...payload } });
      } else {
        const arr = Array.isArray(current[entity]) ? current[entity] : Object.values(current[entity] || {});
        let newArr;
        if (action === 'add') newArr = [...arr, payload];
        else if (action === 'update') newArr = arr.map(item => item.id === id ? { ...item, ...payload } : item);
        else if (action === 'delete') newArr = arr.filter(item => item.id !== id);
        else newArr = arr;

        // Optimistic UI update
        setData(prev => ({ ...prev, [entity]: newArr }));
        await update(ref(db, '/'), { [entity]: newArr });
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  }, []);

  return { 
    data, 
    isLoading: !data && !isTimedOut && !error, 
    isError: error, 
    updateData, 
    notifications, 
    isConnected, 
    isSyncing 
  };
}
