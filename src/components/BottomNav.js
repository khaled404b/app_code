'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, FileText, Settings, LogOut, Eye, ClipboardList, Send, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function BottomNavContent() {
  const pathname = usePathname();
  const { user, logout, canEdit } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', icon: Home, label: 'الرئيسية' },
    { href: '/clients', icon: Users, label: 'العملاء' },
    { href: '/tasks', icon: Briefcase, label: 'الأعمال' },
    { href: '/invoices', icon: FileText, label: 'الفواتير' },
    { href: '/supervision', icon: Eye, label: 'الإشراف' },
    { href: '/offers', icon: ClipboardList, label: 'العروض' },
    { href: '/deliveries', icon: Send, label: 'التسليم' },
    { href: '/services', icon: ClipboardList, label: 'مركز الخدمات' },
    { href: '/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Top Bar - Always Visible */}
      <div className="top-bar" style={{ zIndex: 1002 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar" style={{ background: user?.color || '#2563eb', width: '34px', height: '34px', fontSize: '13px' }}>
            {user?.name?.[0]}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>{user?.name}</div>
            <div style={{
              fontSize: '11px', fontWeight: 700, lineHeight: 1,
              color: canEdit ? '#059669' : '#d97706',
            }}>
              {canEdit ? '● متصل' : '● مشاهد'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={logout} className="icon-btn" style={{ width: '34px', height: '34px', background: 'rgba(220, 38, 38, 0.1)' }}>
            <LogOut size={15} color="#dc2626" />
          </button>
        </div>
      </div>

      {/* FAB Button */}
      <button className={`fab-btn ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Navigation Overlay */}
      <div className={`nav-overlay ${isOpen ? 'active' : ''}`} onClick={closeMenu}>
        <div className="nav-grid" onClick={e => e.stopPropagation()}>
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link 
              key={href} 
              href={href} 
              className="fab-item" 
              onClick={closeMenu}
              style={{
                background: pathname === href ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: pathname === href ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <Icon size={24} color={pathname === href ? '#fff' : 'rgba(255, 255, 255, 0.7)'} strokeWidth={2.5} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default memo(BottomNavContent);
