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

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: '#ffffff', // Solid White
      borderBottom: '2px solid #e2e8f0', // Solid Border
      padding: '0 20px',
      height: '70px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      
      {/* LEFT: Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => window.location.reload()} style={{ background: '#fee2e2', border: '1px solid #fecaca', width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={18} />
        </button>
        <button onClick={toggleTheme} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#64748b" />}
        </button>
      </div>

      {/* CENTER: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/logo.png" alt="FRAME Logo" style={{ height: '55px', objectFit: 'contain' }} />
      </div>

      {/* RIGHT: Status & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '15px', borderRight: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              background: '#2563eb', color: '#ffffff', border: 'none', 
              padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', 
              fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' 
            }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> تحديث
          </button>
          
          {!isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#ef4444', fontWeight: 800, background: '#fee2e2', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px' }}>
              <WifiOff size={12} /> منقطع
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#059669', fontWeight: 800, background: '#f0fdf4', border: '1px solid #dcfce7', padding: '6px 10px', borderRadius: '6px' }}>
              <Wifi size={12} /> متصل حياً
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
            <Bell size={24} color="#64748b" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: '#ffffff', fontSize: '10px',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, border: '2px solid #ffffff'
              }}>{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '45px', left: 0,
              width: '280px', maxHeight: '400px', overflowY: 'auto',
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              padding: '12px', zIndex: 1001
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontWeight: 900 }}>الإشعارات</span>
                <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNotifs(false)} />
              </div>
              {notifications?.length > 0 ? notifications.slice(0, 10).map(n => (
                <div key={n.id} style={{ padding: '10px', borderRadius: '10px', background: '#f8fafc', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{n.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{n.message}</div>
                </div>
              )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد تنبيهات</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>م. خالد</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>● مدير النظام</div>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '10px', 
            background: '#2563eb', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '18px'
          }}>خ</div>
        </div>
      </div>
    </header>
  );
}
