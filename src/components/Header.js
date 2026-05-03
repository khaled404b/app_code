'use client';

import { Bell, X, LogOut, Moon, Sun, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { useTheme } from './AppWrapper';
import { useState } from 'react';

export default function Header() {
  const { notifications, isConnected, isSyncing } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const handleRefresh = () => {
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
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      
      {/* LEFT: Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => window.location.reload()} style={{ background: '#fee2e2', border: 'none', width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={18} />
        </button>
        <button onClick={toggleTheme} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#475569" />}
        </button>
      </div>

      {/* CENTER: Branding */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>F</div>
        <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>فريم</span>
      </div>

      {/* RIGHT: Status & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        
        {/* Sync & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '15px', borderRight: '1px solid var(--border-color)' }}>
          <button 
            onClick={handleRefresh} 
            style={{ 
              background: '#2563eb', color: 'white', border: 'none', 
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', 
              fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '5px' 
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} /> تحديث
          </button>
          
          {!isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 900, background: '#fee2e2', padding: '5px 10px', borderRadius: '6px' }}>
              <WifiOff size={12} /> منقطع
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#059669', fontWeight: 900, background: '#f0fdf4', padding: '5px 10px', borderRadius: '6px' }}>
              <Wifi size={12} /> متصل حياً
            </div>
          )}
        </div>

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
              width: '280px', maxHeight: '400px', overflowY: 'auto',
              background: 'var(--card-bg)', border: '1px solid var(--border-color)',
              borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              padding: '12px', zIndex: 1001
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontWeight: 900 }}>الإشعارات</span>
                <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNotifs(false)} />
              </div>
              {notifications?.length > 0 ? notifications.slice(0, 10).map(n => (
                <div key={n.id} style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-main)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{n.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد تنبيهات</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>أ. خالد</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>● متصل</div>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '12px', 
            background: '#6366f1', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '18px', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
          }}>خ</div>
        </div>
      </div>
    </header>
  );
}
