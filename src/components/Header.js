'use client';

import { Bell, X } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { useState } from 'react';

export default function Header() {
  const { notifications } = useData();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 20px',
      height: '60px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      {/* LEFT: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>F</div>
        <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-main)' }}>فريم</span>
      </div>

      {/* RIGHT: User & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
            <Bell size={22} color="var(--text-main)" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: 'white', fontSize: '9px',
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, border: '2px solid var(--card-bg)'
              }}>{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '40px', left: 0,
              width: '280px', maxHeight: '400px', overflowY: 'auto',
              background: 'var(--card-bg)', border: '1px solid var(--border-color)',
              borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              padding: '12px', zIndex: 1001
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800 }}>الإشعارات</span>
                <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowNotifs(false)} />
              </div>
              {notifications?.length > 0 ? notifications.slice(0, 10).map(n => (
                <div key={n.id} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-main)', marginBottom: '5px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 800 }}>{n.title}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              )) : <div style={{ textAlign: 'center', fontSize: '12px', padding: '10px' }}>لا توجد تنبيهات</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>م. فواز</span>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>مدير النظام</span>
          </div>
          <div style={{ 
            width: '35px', height: '35px', borderRadius: '50%', 
            background: '#2563eb', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '14px'
          }}>م</div>
        </div>
      </div>
    </header>
  );
}
