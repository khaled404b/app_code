import React, { memo } from 'react';
import { STATUS_CFG } from '@/constants/config';
import { Search } from 'lucide-react';

// Unified Badge Component
export const Badge = memo(({ status, type = 'INVOICES', customCfg }) => {
  const cfg = customCfg || STATUS_CFG[type][status] || { color: '#64748b', bg: '#f1f5f9', badge: '' };
  return (
    <span 
      className={`badge ${cfg.badge}`} 
      style={{ 
        fontSize: '11px', 
        padding: '4px 10px', 
        borderRadius: '8px',
        fontWeight: 800,
        ...(!cfg.badge && { background: cfg.bg, color: cfg.color })
      }}
    >
      {status}
    </span>
  );
});

// Unified Card Component
export const Card = memo(({ children, padded = false, style = {}, onClick }) => (
  <div 
    className={`card ${padded ? 'card-padded' : ''}`} 
    style={{ borderRadius: '24px', overflow: 'hidden', ...style }}
    onClick={onClick}
  >
    {children}
  </div>
));

// Unified Page Header
export const PageHeader = memo(({ title, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
    <h1 className="page-title" style={{ marginBottom: 0 }}>{title}</h1>
    <div style={{ display: 'flex', gap: '8px' }}>
      {actions}
    </div>
  </div>
));

// Unified Search Input
export const SearchBar = memo(({ value, onChange, placeholder = "بحث..." }) => (
  <div className="search-wrap" style={{ marginBottom: '15px' }}>
    <Search size={17} color="#94a3b8" />
    <input 
      className="search-input" 
      placeholder={placeholder} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
));
