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

  const getIcon = (type) => {
    switch(type) {
      case 'client': return <Users size={16} color="#2563eb" />;
      case 'task': return <Briefcase size={16} color="#d97706" />;
      case 'supervision': return <Eye size={16} color="#059669" />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--card-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', rowGap: '10px'
    }}>
      {/* LEFT GROUP: Logo, Status, Theme, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => window.location.reload()} style={{ background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444' }} title="خروج">
          <LogOut size={18} />
        </button>

        <button onClick={toggleTheme} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#64748b" />}
        </button>

        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

        {!isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 800, background: '#fee2e2', padding: '4px 8px', borderRadius: '8px' }}>
            <WifiOff size={12} /> غير متصل
          </div>
        ) : isSyncing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#2563eb', fontWeight: 800 }}>
            <RefreshCw size={12} className="animate-spin" />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#22c55e', fontWeight: 800 }}>
            <Wifi size={12} /> متصل
          </div>
        )}

        <button 
          onClick={() => { localStorage.removeItem('frame_app_cache'); window.location.reload(); }} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
          title="تحديث البيانات"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* RIGHT GROUP: Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="icon-btn" style={{ background: 'none', border: 'none', padding: 0, position: 'relative' }}>
            <Bell size={22} color="var(--text-main)" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: 'white', fontSize: '10px',
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, border: '2px solid var(--card-bg)'
              }}>{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '40px', left: 0,
              width: '280px', maxHeight: '400px', overflowY: 'auto',
              background: 'var(--card-bg)', border: '1px solid var(--border-color)',
              borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              padding: '12px', zIndex: 1000
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>الإشعارات</span>
                <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowNotifs(false)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications && notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} style={{ 
                    padding: '10px', borderRadius: '12px', background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)', display: 'flex', gap: '10px'
                  }}>
                    <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.timestamp).toLocaleString('ar-EG')}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>لا توجد إشعارات</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>م. فواز</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>مدير النظام</div>
          </div>
          <div style={{ 
            width: '38px', height: '38px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '15px',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
          }}>م</div>
        </div>
      </div>
    </header>
  );
}
