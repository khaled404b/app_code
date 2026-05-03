'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, FileText, Settings, Eye } from 'lucide-react';

function BottomNavContent() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'الرئيسية' },
    { href: '/clients', icon: Users, label: 'العملاء' },
    { href: '/tasks', icon: Briefcase, label: 'الأعمال' },
    { href: '/invoices', icon: FileText, label: 'الفواتير' },
    { href: '/supervision', icon: Eye, label: 'الإشراف' },
    { href: '/settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#ffffff', borderTop: '1px solid #e2e8f0',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: '70px', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link 
            key={href} 
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              textDecoration: 'none', color: isActive ? '#2563eb' : '#64748b',
              flex: 1, padding: '10px 0', transition: 'all 0.2s'
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 900 : 700 }}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default memo(BottomNavContent);
