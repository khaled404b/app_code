'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, 
  Percent, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- SOLID & COMFORTABLE COMPONENTS ---

const StatCard = ({ label, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '25px', background: '#ffffff', border: `1px solid #e2e8f0`,
      borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.2s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.boxShadow = `0 4px 12px ${color}15`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#e2e8f0';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 800 }}>{label}</span>
      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', border: `1px solid #f1f5f9` }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>{value}</div>
  </div>
);

const RowItem = memo(({ label, value, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '15px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
      background: '#ffffff'
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>{value}</span>
      <ArrowRight size={14} color="#94a3b8" />
    </div>
  </div>
));

export default function Dashboard() {
  const { data, isLoading } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waMsg, setWaMsg] = useState({ subject: '', body: '' });

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
    },
    inv: {
      paid: fInvoices.filter(i => i?.status === 'مدفوعة').length,
      pend: fInvoices.filter(i => i?.status === 'معلقة').length,
      late: fInvoices.filter(i => i?.status === 'متأخرة').length,
    },
    totalRemaining: fSupervision.reduce((acc, s) => acc + calculateSupervisionStats(s).remaining, 0)
  };

  if (isLoading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="#1e293b" />
    </div>
  );

  const goTo = (path, status) => router.push(`${path}?status=${status}&client=${selectedClientId}`);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', margin: 0, padding: '30px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* --- Simple Clean Header --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: 0 }}>مرحباً مهندس خالد</h1>
            <div style={{ height: '4px', width: '40px', background: '#3b82f6', marginTop: '8px', borderRadius: '2px' }} />
          </div>
          <select 
            style={{ 
              padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', 
              fontWeight: 800, background: '#ffffff', color: '#1e293b', outline: 'none'
            }}
            value={selectedClientId} 
            onChange={e => setSelectedClientId(e.target.value)}
          >
            <option value="all">كل المشاريع والعملاء</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* --- Client Detail Card --- */}
        {selectedClient && (
          <div style={{ 
            background: '#ffffff', padding: '25px', borderRadius: '12px', marginBottom: '30px', 
            border: '1px solid #3b82f6', borderLeft: '6px solid #3b82f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '5px' }}>تفاصيل العميل الحالي</div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedClient.name}</h2>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                {selectedClient.drive_link && (
                  <a href={selectedClient.drive_link} target="_blank" style={{ color: '#3b82f6', fontWeight: 800, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <LinkIcon size={14} /> ملفات الدرايف
                  </a>
                )}
                {selectedClient.plots?.map((p, i) => p.maps_link && (
                  <a key={i} href={p.maps_link} target="_blank" style={{ color: '#059669', fontWeight: 800, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} /> قسيمة {p.number}
                  </a>
                ))}
              </div>
            </div>
            <button onClick={() => setShowWhatsApp(true)} style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13px' }}>
              مراسلة واتساب
            </button>
          </div>
        )}

        {/* --- Stats Grid --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="المهام" value={fTasks.length} color="#3b82f6" icon={Briefcase} onClick={() => router.push('/tasks')} />
          <StatCard label="مشاريع الإشراف" value={fSupervision.length} color="#059669" icon={Eye} onClick={() => router.push('/supervision')} />
          <StatCard label="المبالغ المتبقية" value={stats.totalRemaining.toLocaleString() + ' د.ك'} color="#ef4444" icon={TrendingUp} onClick={() => router.push('/supervision')} />
          <StatCard label="الفواتير" value={fInvoices.length} color="#d97706" icon={FileText} onClick={() => router.push('/invoices')} />
        </div>

        {/* --- List Sections --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900, color: '#1e293b' }}>متابعة المهام</div>
            <RowItem label="أعمال متأخرة" value={stats.tasks.late} color="#ef4444" onClick={() => goTo('/tasks', 'متأخرة')} />
            <RowItem label="أعمال جارية" value={stats.tasks.active} color="#3b82f6" onClick={() => goTo('/tasks', 'جارية')} />
            <RowItem label="أعمال منجزة" value={stats.tasks.done} color="#059669" onClick={() => goTo('/tasks', 'منجزة')} />
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900, color: '#1e293b' }}>الحالة المالية</div>
            <RowItem label="فواتير متأخرة" value={stats.inv.late} color="#ef4444" onClick={() => goTo('/invoices', 'متأخرة')} />
            <RowItem label="فواتير معلقة" value={stats.inv.pend} color="#d97706" onClick={() => goTo('/invoices', 'معلقة')} />
            <RowItem label="فواتير مدفوعة" value={stats.inv.paid} color="#059669" onClick={() => goTo('/invoices', 'مدفوعة')} />
          </div>

        </div>

        {/* WhatsApp Modal */}
        {showWhatsApp && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 900, margin: 0 }}>إرسال رسالة واتساب</h3>
                <X style={{ cursor: 'pointer' }} onClick={() => setShowWhatsApp(false)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none' }} placeholder="الموضوع" value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} />
                <textarea style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none' }} rows={4} placeholder="نص الرسالة..." value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} />
                <button 
                  onClick={() => {
                    let msg = `*مكتب فريم الهندسي*\nالموضوع: ${waMsg.subject}\n\n${waMsg.body}`;
                    window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    setShowWhatsApp(false);
                  }} 
                  style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
                >إرسال الآن</button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Add Button */}
        <button 
          onClick={() => router.push('/tasks?new=true')}
          style={{ 
            position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', 
            borderRadius: '50%', background: '#3b82f6', color: '#ffffff', border: 'none', 
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.5)', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}
        >
          <Plus size={30} />
        </button>

      </div>
    </div>
  );
}
