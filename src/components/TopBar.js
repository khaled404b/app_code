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
      background: 'var(--surface)', padding: '12px 20px', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1100,
      boxShadow: 'var(--shadow)'
    }}>
      {/* RIGHT: BRANDING & STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
         <div style={{ 
           width: '36px', height: '36px', borderRadius: '8px', 
           background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
           color: '#ffffff', fontWeight: 900, fontSize: '18px' 
         }}>F</div>
         <div>
            <h1 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>مكتب فريم الهندسي</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
               {!isConnected ? (
                 <span style={{ fontSize: '9px', color: 'var(--red)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                   <WifiOff size={10} /> منقطع
                 </span>
               ) : (
                 <span style={{ fontSize: '9px', color: 'var(--green)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                   <Wifi size={10} /> متصل حياً
                 </span>
               )}
               <button 
                 onClick={() => window.location.reload()} 
                 style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '9px', fontWeight: 800, cursor: 'pointer', padding: 0 }}
               >تحديث البيانات</button>
            </div>
         </div>
      </div>

      {/* LEFT: CONTROLS & PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
         <button onClick={toggleTheme} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
           {theme === 'dark' ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#64748b" />}
         </button>
         <button onClick={() => logout()} style={{ background: 'var(--red-light)', border: '1px solid var(--border)', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <LogOut size={16} />
         </button>
         
         <div style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 2px' }} />
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '8px', 
              background: 'var(--blue)', color: '#ffffff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 900, fontSize: '15px' 
            }}>ف</div>
         </div>
      </div>
    </div>
  );
}
