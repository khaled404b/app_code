'use client';

import { Bell, Moon, Sun, User, X, Briefcase, Users, Eye, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '10px', 
          background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: '14px'
        }}>F</div>
        <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-main)' }}>فريم</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => {
            localStorage.removeItem('frame_app_cache');
            window.location.reload();
          }} 
          style={{ 
            background: '#2563eb', color: 'white', border: 'none', 
            padding: '6px 12px', borderRadius: '10px', display: 'flex', 
            alignItems: 'center', gap: '6px', cursor: 'pointer', 
            fontSize: '11px', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' 
          }} 
          title="تحديث البيانات ومزامنة الأجهزة"
        >
          <RefreshCw size={14} /> تحديث البيانات
        </button>

        <button onClick={toggleTheme} className="icon-btn" style={{ background: 'none', border: 'none', padding: 0 }}>
          {theme === 'dark' ? <Sun size={20} color="#facc15" /> : <Moon size={20} color="#64748b" />}
        </button>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="icon-btn" style={{ background: 'none', border: 'none', padding: 0, position: 'relative' }}>
            <Bell size={20} color="var(--text-main)" />
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
              padding: '12px'
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '5px' }}>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 }}>م. فواز</span>
            {!isConnected ? (
              <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} /> غير متصل
              </span>
            ) : isSyncing ? (
              <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <RefreshCw size={8} className="animate-spin" /> مزامنة...
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} /> متصل
              </span>
            )}
          </div>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '14px',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
          }}>م</div>
        </div>
      </div>
    </header>
  );
}
