'use client';

import { RefreshCw, Wifi, WifiOff, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/AppWrapper';
import { useData } from '@/hooks/useData';

export default function TopBar() {
  const { isConnected, isSyncing } = useData();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ 
      background: '#ffffff', padding: '12px 20px', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      {/* RIGHT: BRANDING & STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
         <div style={{ 
           width: '36px', height: '36px', borderRadius: '8px', 
           background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', 
           color: '#ffffff', fontWeight: 900, fontSize: '18px' 
         }}>F</div>
         <div>
            <h1 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: 0 }}>مكتب فريم الهندسي</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
               {!isConnected ? (
                 <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                   <WifiOff size={10} /> منقطع
                 </span>
               ) : (
                 <span style={{ fontSize: '9px', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                   <Wifi size={10} /> متصل حياً
                 </span>
               )}
               <button 
                 onClick={() => window.location.reload()} 
                 style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '9px', fontWeight: 800, cursor: 'pointer', padding: 0 }}
               >تحديث البيانات</button>
            </div>
         </div>
      </div>

      {/* LEFT: CONTROLS & PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
         <button onClick={toggleTheme} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           {theme === 'dark' ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#64748b" />}
         </button>
         <button onClick={() => logout()} style={{ background: '#fee2e2', border: '1px solid #fecaca', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <LogOut size={16} />
         </button>
         
         <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 2px' }} />
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ textAlign: 'right', display: 'none' }}> {/* Responsive hide */}
               <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>م. فواز</div>
            </div>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '8px', 
              background: '#2563eb', color: '#ffffff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 900, fontSize: '15px' 
            }}>ف</div>
         </div>
      </div>
    </div>
  );
}
