'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, 
  Percent, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- Professional Clean Components ---

const SimpleStat = ({ label, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '20px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>{label}</div>
      <Icon size={16} color={color} />
    </div>
    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{value}</div>
  </div>
);

const RowItem = memo(({ label, value, color, onClick, status }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 15px',
      borderBottom: '1px solid #f1f5f9',
      cursor: 'pointer',
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{value}</span>
      <ArrowRight size={14} color="#cbd5e1" />
    </div>
  </div>
));

export default function Dashboard() {
  const { data, isLoading } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waMsg, setWaMsg] = useState({ subject: '', category: '—', price: '', date: new Date().toISOString().split('T')[0], body: '' });

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

  if (isLoading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;

  const goTo = (path, status) => router.push(`${path}?status=${status}&client=${selectedClientId}`);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      
      {/* --- Top Bar: Filter & Greetings --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>مرحباً مهندس {user?.name || ''}</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>لوحة تحكم مكتب فريم الهندسي</p>
        </div>
        <select 
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
          value={selectedClientId} 
          onChange={e => setSelectedClientId(e.target.value)}
        >
          <option value="all">كل المشاريع والعملاء</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* --- Client Actions (If selected) --- */}
      {selectedClient && (
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, color: '#0f172a' }}>العميل: {selectedClient.name}</span>
            {selectedClient.drive_link && (
              <a href={selectedClient.drive_link} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2563eb', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                <LinkIcon size={14} /> ملفات الدرايف
              </a>
            )}
            {selectedClient.plots?.map((p, i) => p.maps_link && (
              <a key={i} href={p.maps_link} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                <MapPin size={14} /> قسيمة {p.number}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowWhatsApp(true)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Send size={14} /> مراسلة
            </button>
          </div>
        </div>
      )}

      {/* --- Main Stats Grid --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <SimpleStat label="إجمالي الأعمال" value={fTasks.length} color="#2563eb" icon={Briefcase} onClick={() => router.push('/tasks')} />
        <SimpleStat label="مشاريع الإشراف" value={fSupervision.length} color="#059669" icon={Eye} onClick={() => router.push('/supervision')} />
        <SimpleStat label="المبالغ المتبقية" value={stats.totalRemaining.toFixed(2) + ' د.ك'} color="#ef4444" icon={TrendingUp} onClick={() => router.push('/supervision')} />
        <SimpleStat label="الفواتير المصدرة" value={fInvoices.length} color="#d97706" icon={FileText} onClick={() => router.push('/invoices')} />
      </div>

      {/* --- Detail Sections --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        
        {/* Section: Project Health */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900 }}>متابعة الأعمال</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <RowItem label="أعمال متأخرة" value={stats.tasks.late} color="#ef4444" onClick={() => goTo('/tasks', 'متأخرة')} />
            <RowItem label="أعمال جارية" value={stats.tasks.active} color="#2563eb" onClick={() => goTo('/tasks', 'جارية')} />
            <RowItem label="أعمال منجزة" value={stats.tasks.done} color="#059669" onClick={() => goTo('/tasks', 'منجزة')} />
          </div>
        </div>

        {/* Section: Invoice Health */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900 }}>الحالة المالية</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <RowItem label="فواتير متأخرة" value={stats.inv.late} color="#ef4444" onClick={() => goTo('/invoices', 'متأخرة')} />
            <RowItem label="فواتير معلقة" value={stats.inv.pend} color="#d97706" onClick={() => goTo('/invoices', 'معلقة')} />
            <RowItem label="فواتير مسددة" value={stats.inv.paid} color="#059669" onClick={() => goTo('/invoices', 'مدفوعة')} />
          </div>
        </div>

      </div>

      {/* WhatsApp Modal (Simplified) */}
      {showWhatsApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900 }}>مساعد الواتساب</h3>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowWhatsApp(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} placeholder="الموضوع" value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} />
              <input style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} placeholder="المبلغ (اختياري)" value={waMsg.price} onChange={e => setWaMsg(p => ({ ...p, price: e.target.value }))} />
              <textarea style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} rows={3} placeholder="التفاصيل..." value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} />
              <button onClick={() => {
                let msg = `*مكتب فريم الهندسي*\nالموضوع: ${waMsg.subject}\nالتاريخ: ${waMsg.date}\n${waMsg.price ? `المبلغ: ${waMsg.price} د.ك\n` : ''}\n${waMsg.body}`;
                window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                setShowWhatsApp(false);
              }} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>إرسال واتساب</button>
            </div>
          </div>
        </div>
      )}

      {/* Float Add Button */}
      <button 
        onClick={() => router.push('/tasks?new=true')}
        style={{ position: 'fixed', bottom: '30px', left: '30px', width: '55px', height: '55px', borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', boxShadow: '0 5px 15px rgba(37,99,235,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Plus size={28} />
      </button>

    </div>
  );
}
