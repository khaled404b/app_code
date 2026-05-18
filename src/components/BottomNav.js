'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Briefcase, FileText, Settings, Eye, 
  ClipboardList, Send, LayoutGrid, X, Building 
} from 'lucide-react';

function BottomNavContent() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { href: '/', icon: Home, label: 'الرئيسية' },
    { href: '/clients', icon: Users, label: 'العملاء' },
    { href: '/tasks', icon: Briefcase, label: 'الأعمال' },
    { href: '/invoices', icon: FileText, label: 'الفواتير' },
    { href: '/supervision', icon: Eye, label: 'الإشراف' },
  ];

  const moreItems = [
    { href: '/billing', icon: FileText, label: 'فواتير المكتب' },
    { href: '/contractors', icon: Building, label: 'دليل الشركات' },
    { href: '/receipts', icon: FileText, label: 'سندات القبض' },
    { href: '/offers', icon: ClipboardList, label: 'العروض' },
    { href: '/deliveries', icon: Send, label: 'التسليم' },
    { href: '/services', icon: ClipboardList, label: 'مركز الخدمات' },
    { href: '/settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <>
      {/* More Items Menu */}
      {showMore && (
        <div 
          onClick={() => setShowMore(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', width: '100%', maxWidth: '500px',
              borderRadius: '24px 24px 0 0', padding: '30px',
              boxShadow: 'var(--shadow-md)', animation: 'slideUp 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text)' }}>الأقسام الإضافية</span>
               <button onClick={() => setShowMore(false)} style={{ background: 'var(--surface-2)', border: 'none', padding: '8px', borderRadius: '10px', color: 'var(--text)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {moreItems.map(({ href, icon: Icon, label }) => (
                <Link 
                  key={href} 
                  href={href}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '15px',
                    background: pathname === href ? 'var(--blue-light)' : 'var(--surface-2)',
                    border: pathname === href ? '1px solid var(--blue)' : '1px solid var(--border)',
                    borderRadius: '12px', textDecoration: 'none', color: 'var(--text)'
                  }}
                >
                  <Icon size={20} color={pathname === href ? 'var(--blue)' : 'var(--text-3)'} />
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        height: '75px', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: 'var(--shadow)'
      }}>
        {mainItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link 
              key={href} 
              href={href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                textDecoration: 'none', color: isActive ? 'var(--blue)' : 'var(--text-3)',
                flex: 1, padding: '10px 0', transition: 'all 0.2s'
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 900 : 700 }}>{label}</span>
            </Link>
          );
        })}
        
        {/* MORE BUTTON */}
        <button 
          onClick={() => setShowMore(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', color: showMore ? 'var(--blue)' : 'var(--text-3)',
            flex: 1, padding: '10px 0', cursor: 'pointer'
          }}
        >
          <LayoutGrid size={22} strokeWidth={showMore ? 2.5 : 2} />
          <span style={{ fontSize: '10px', fontWeight: 700 }}>المزيد</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default memo(BottomNavContent);
