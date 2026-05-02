'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, FileText, CheckCircle, Clock, AlertCircle, Percent, ArrowRight, Eye, Send, Link as LinkIcon, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card } from '@/components/ui';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

const StatItem = memo(({ label, value, color, icon: Icon, onClick }) => (
  <div
    className="detail-row"
    style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', padding: '16px' }}
    onClick={onClick}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: color + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={color} />
    </div>
    <span className="detail-label" style={{ fontWeight: 700 }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontWeight: 900, fontSize: '22px', color: color }}>{value}</span>
      <ArrowRight size={16} color="#cbd5e1" />
    </div>
  </div>
));

export default function Dashboard() {
  const { data, isLoading } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('all');

  const clients = data?.clients || [];
  const tasks = data?.tasks || [];
  const invoices = data?.invoices || [];

  const selectedClient = useMemo(() => clients.find(c => c?.id === selectedClientId) || null, [clients, selectedClientId]);

  const fTasks = useMemo(() => (selectedClientId === 'all' ? tasks : tasks.filter(t => t?.client_id === selectedClientId)).filter(Boolean), [tasks, selectedClientId]);
  const fInvoices = useMemo(() => (selectedClientId === 'all' ? invoices : invoices.filter(i => i?.client_id === selectedClientId)).filter(Boolean), [invoices, selectedClientId]);
  const fSupervision = useMemo(() => (selectedClientId === 'all' ? data?.supervision || [] : (data?.supervision || []).filter(s => s?.client_id === selectedClientId)).filter(Boolean), [data?.supervision, selectedClientId]);

  const stats = {
    tasks: {
      active: fTasks.filter(t => t?.status === 'جارية').length,
      done: fTasks.filter(t => t?.status === 'منجزة').length,
      late: fTasks.filter(t => t?.status === 'متأخرة').length,
      pend: fTasks.filter(t => t?.status === 'معلقة').length,
    },
    inv: {
      paid: fInvoices.filter(i => i?.status === 'مدفوعة').length,
      pend: fInvoices.filter(i => i?.status === 'معلقة').length,
      late: fInvoices.filter(i => i?.status === 'متأخرة').length,
    },
    supervision: {
      count: fSupervision.length,
      totalRemaining: fSupervision.reduce((acc, s) => {
        return acc + calculateSupervisionStats(s).remaining;
      }, 0)
    }
  };

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>جاري التحميل...</p></div>;

  const goTo = (path, status) => {
    const c = selectedClientId === 'all' ? 'الكل' : selectedClientId;
    router.push(`${path}?status=${status}&client=${c}`);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  return (
    <div className="page">
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>{greeting} 👋</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">{user?.name || 'مرحباً'}</h1>
          <select className="form-select" style={{ width: 'auto', borderRadius: '14px' }} value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
            <option value="all">كل العملاء</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {selectedClient?.type === 'نسبة' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: '#fff7ed', borderRadius: '12px', padding: '6px 12px', border: '1px solid #fed7aa' }}>
              <Percent size={14} color="#d97706" /><span style={{ fontSize: '13px', fontWeight: 900, color: '#9a3412' }}>نسبة المكتب: {selectedClient.commission_rate}%</span>
            </div>
          )}
          {selectedClient?.drive_link && (
            <a 
              href={selectedClient.drive_link.trim().startsWith('http') ? selectedClient.drive_link.trim() : `https://${selectedClient.drive_link.trim()}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: '#eff6ff', borderRadius: '12px', padding: '6px 12px', border: '1px solid #bfdbfe', textDecoration: 'none' }}
            >
              <LinkIcon size={14} color="#2563eb" />
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e40af' }}>ملفات جوجل درايف</span>
            </a>
          )}
          {selectedClient?.maps_link && (
            <a 
              href={(selectedClient.maps_link.includes('google.com') || selectedClient.maps_link.includes('goo.gl')) ? (selectedClient.maps_link.trim().startsWith('http') ? selectedClient.maps_link.trim() : `https://${selectedClient.maps_link.trim()}`) : `https://maps.google.com/?q=${encodeURIComponent(selectedClient.maps_link.trim())}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: '#ecfdf5', borderRadius: '12px', padding: '6px 12px', border: '1px solid #a7f3d0', textDecoration: 'none' }}
            >
              <MapPin size={14} color="#10b981" />
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#065f46' }}>الموقع الفعلي</span>
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px', marginBottom: '28px' }}>
        <Card padded><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}><Briefcase size={14} /> الأعمال</div><div style={{ fontSize: '24px', fontWeight: 900 }}>{fTasks.length}</div></Card>
        <Card padded><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}><FileText size={14} /> الفواتير</div><div style={{ fontSize: '24px', fontWeight: 900 }}>{fInvoices.length}</div></Card>
        <Card padded onClick={() => router.push('/supervision')} style={{ cursor: 'pointer', borderRight: '4px solid #0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}><Eye size={14} /> الإشراف</div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.supervision.count}</div>
          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>{stats.supervision.totalRemaining.toFixed(2)} د.ك</div>
        </Card>
        <Card padded onClick={() => router.push('/deliveries')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}><Send size={14} /> التسليم</div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>{(data?.deliveries || []).length}</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>إرسال مستندات</div>
        </Card>
      </div>

      <div className="section-label">حالة الأعمال</div>
      <Card style={{ marginBottom: '28px' }}>
        <StatItem label="أعمال متأخرة" value={stats.tasks.late} color="#dc2626" icon={AlertCircle} onClick={() => goTo('/tasks', 'متأخرة')} />
        <StatItem label="أعمال جارية" value={stats.tasks.active} color="#2563eb" icon={Clock} onClick={() => goTo('/tasks', 'جارية')} />
        <StatItem label="أعمال منجزة" value={stats.tasks.done} color="#059669" icon={CheckCircle} onClick={() => goTo('/tasks', 'منجزة')} />
      </Card>

      <div className="section-label">حالة الفواتير</div>
      <Card>
        <StatItem label="فواتير متأخرة" value={stats.inv.late} color="#dc2626" icon={AlertCircle} onClick={() => goTo('/invoices', 'متأخرة')} />
        <StatItem label="فواتير مدفوعة" value={stats.inv.paid} color="#059669" icon={CheckCircle} onClick={() => goTo('/invoices', 'مدفوعة')} />
        <StatItem label="فواتير معلقة" value={stats.inv.pend} color="#d97706" icon={FileText} onClick={() => goTo('/invoices', 'معلقة')} />
      </Card>
    </div>
  );
}
