'use client';

import { Bell, Moon, Sun, User, X, Briefcase, Users, Eye, RefreshCw, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useTheme } from './AppWrapper';
import { useData } from '@/hooks/useData';
import { useState } from 'react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { notifications, isConnected, isSyncing } = useData();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const handleRefresh = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'var(--card-bg)',
      borderBottom: '2px solid var(--border-color)',
      padding: '0 20px',
      height: '70px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      {/* LEFT: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => window.location.reload()} style={{ background: '#fee2e2', border: 'none', width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={18} />
        </button>

        <button onClick={toggleTheme} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#64748b" />}
        </button>

        <div style={{ height: '30px', width: '1px', background: 'var(--border-color)', margin: '0 5px' }} />

        <button 
          onClick={handleRefresh} 
          style={{ 
            background: '#2563eb', color: 'white', border: 'none', 
            padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', 
            fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> تحديث
        </button>

        <div style={{ marginLeft: '5px' }}>
          {!isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', fontWeight: 800, background: '#fee2e2', padding: '5px 10px', borderRadius: '8px' }}>
              <WifiOff size={13} /> انقطع الاتصال
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 800 }}>
              <Wifi size={13} /> متصل
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Logo & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
            <Bell size={24} color="var(--text-main)" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: 'white', fontSize: '10px',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, border: '2px solid var(--card-bg)'
              }}>{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '45px', left: 0,
              width: '300px', maxHeight: '450px', overflowY: 'auto',
              background: 'var(--card-bg)', border: '1px solid var(--border-color)',
              borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              padding: '12px', zIndex: 1001
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontWeight: 900, fontSize: '15px' }}>الإشعارات</span>
                <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNotifs(false)} />
              </div>
              {/* ... notifications mapping ... */}
              {notifications?.length > 0 ? notifications.map(n => (
                <div key={n.id} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{n.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد تنبيهات</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRight: '2px solid var(--border-color)', paddingRight: '15px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>م. فواز</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>● مدير النظام</div>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '12px', 
            background: '#2563eb', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '18px'
          }}>م</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--text-main)' }}>فريم</span>
          <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>F</div>
        </div>
      </div>
    </header>
  );
}
