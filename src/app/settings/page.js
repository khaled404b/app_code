'use client';

import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { LogOut, Info, Database, Shield, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SettingsPage() {
  const { user, logout, canEdit } = useAuth();
  const { data } = useData();

  const handleExport = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    if (data.clients?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.clients), 'العملاء');
    if (data.tasks?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.tasks), 'الأعمال');
    if (data.invoices?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.invoices), 'الفواتير');
    XLSX.writeFile(wb, `frame-office-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: '28px' }}>الإعدادات</h1>

      {/* User Info */}
      <div style={{ marginBottom: '8px' }}><div className="section-label">الحساب الحالي</div></div>
      <div className="card card-padded" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: user?.color || '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 900, color: 'white',
          boxShadow: `0 6px 16px ${user?.color || '#2563eb'}44`, flexShrink: 0,
        }}>
          {user?.name?.[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '18px' }}>{user?.name}</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '4px',
            background: canEdit ? '#ecfdf5' : '#fffbeb', padding: '3px 10px', borderRadius: '20px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: canEdit ? '#059669' : '#d97706' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: canEdit ? '#059669' : '#d97706' }}>
              {canEdit ? 'تعديل وعرض' : 'عرض فقط'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '8px' }}><div className="section-label">إحصائيات البيانات</div></div>
      <div className="card" style={{ marginBottom: '24px' }}>
        {[
          { label: 'عدد العملاء', value: data?.clients?.length || 0, color: '#7c3aed' },
          { label: 'عدد الأعمال', value: data?.tasks?.length || 0, color: '#2563eb' },
          { label: 'عدد الفواتير', value: data?.invoices?.length || 0, color: '#059669' },
        ].map((row, i) => (
          <div className="detail-row" key={i} style={{ borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
            <Database size={16} color={row.color} />
            <span className="detail-label">{row.label}</span>
            <span style={{ fontWeight: 800, fontSize: '18px', color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '8px' }}><div className="section-label">الأدوات</div></div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="list-row" onClick={handleExport} style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Download size={18} color="#059669" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>تصدير إلى Excel</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>تنزيل جميع البيانات</div>
          </div>
        </div>
        <div className="list-row" onClick={logout} style={{ borderBottom: 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} color="#dc2626" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#dc2626' }}>تسجيل الخروج</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>مسح الجلسة الحالية</div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="card card-padded" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏗️</div>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>مكتب فريم الهندسي</div>
        <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>الإصدار 2.0 • 2025</div>
        <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Shield size={14} color="#94a3b8" />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>البيانات محمية على خوادم Google Firebase</span>
        </div>
      </div>
    </div>
  );
}
