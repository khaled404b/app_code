'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, 
  Percent, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, TrendingUp, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- SOLID UI COMPONENTS ---

const StatCard = ({ label, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '24px', background: 'var(--card-bg)', border: `2px solid var(--border-color)`,
      borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
      boxShadow: '0 4px 0 var(--border-color)', transition: 'transform 0.1s ease',
      position: 'relative', overflow: 'hidden'
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
    onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <div style={{ padding: '8px', background: `${color}15`, borderRadius: '10px' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 950, color: 'var(--text-main)' }}>{value}</div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: color }} />
  </div>
);

const RowItem = memo(({ label, value, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '2px solid var(--border-color)', cursor: 'pointer',
      background: 'var(--card-bg)', transition: 'background 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: color, boxShadow: `0 0 10px ${color}40` }} />
      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <span style={{ fontSize: '18px', fontWeight: 950, color: 'var(--text-main)' }}>{value}</span>
      <ArrowRight size={16} color="var(--text-muted)" />
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
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <Loader2 className="animate-spin" size={48} color="#2563eb" />
      <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-main)' }}>جاري تحضير البيانات...</span>
    </div>
  );

  const goTo = (path, status) => router.push(`${path}?status=${status}&client=${selectedClientId}`);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* --- Page Header & Filter --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', borderBottom: '2px solid var(--border-color)', paddingBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 950, color: 'var(--text-main)', margin: 0 }}>مرحباً مهندس خالد 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px', fontWeight: 700 }}>نظرة عامة على حالة المشاريع والعملاء اليوم</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <label style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)' }}>تصفية حسب المشروع</label>
          <select 
            style={{ 
              padding: '12px 25px', borderRadius: '12px', border: '2px solid var(--border-color)', 
              fontWeight: 900, background: 'var(--card-bg)', color: 'var(--text-main)', 
              outline: 'none', cursor: 'pointer', fontSize: '14px',
              boxShadow: '0 4px 0 var(--border-color)'
            }}
            value={selectedClientId} 
            onChange={e => setSelectedClientId(e.target.value)}
          >
            <option value="all">📊 جميع المشاريع والعملاء</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* --- Active Client Card --- */}
      {selectedClient && (
        <div style={{ 
          background: '#2563eb', padding: '25px', borderRadius: '20px', marginBottom: '40px', 
          color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
        }}>
          <div>
            <div style={{ fontSize: '13px', opacity: 0.8, fontWeight: 700, marginBottom: '5px' }}>المشروع المختار حالياً</div>
            <h2 style={{ fontSize: '24px', fontWeight: 950, margin: 0 }}>{selectedClient.name}</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
              {selectedClient.drive_link && (
                <a href={selectedClient.drive_link} target="_blank" style={{ color: 'white', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                  <LinkIcon size={14} /> ملفات الدرايف
                </a>
              )}
              {selectedClient.plots?.map((p, i) => p.maps_link && (
                <a key={i} href={p.maps_link} target="_blank" style={{ color: 'white', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                  <MapPin size={14} /> القسيمة {p.number}
                </a>
              ))}
            </div>
          </div>
          <button onClick={() => setShowWhatsApp(true)} style={{ background: 'white', color: '#2563eb', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={16} /> مراسلة العميل
          </button>
        </div>
      )}

      {/* --- Core Stats --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '50px' }}>
        <StatCard label="إجمالي المهام" value={fTasks.length} color="#6366f1" icon={Briefcase} onClick={() => router.push('/tasks')} />
        <StatCard label="مشاريع الإشراف" value={fSupervision.length} color="#059669" icon={Eye} onClick={() => router.push('/supervision')} />
        <StatCard label="المطالبات المالية" value={stats.totalRemaining.toLocaleString() + ' د.ك'} color="#ef4444" icon={TrendingUp} onClick={() => router.push('/supervision')} />
        <StatCard label="الفواتير المصدرة" value={fInvoices.length} color="#f59e0b" icon={FileText} onClick={() => router.push('/invoices')} />
      </div>

      {/* --- Tracking Rows --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 0 var(--border-color)' }}>
          <div style={{ padding: '18px 24px', background: 'var(--bg-main)', borderBottom: '2px solid var(--border-color)', fontWeight: 950, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="#6366f1" /> متابعة تنفيذ الأعمال
          </div>
          <RowItem label="أعمال متأخرة (عاجلة)" value={stats.tasks.late} color="#ef4444" onClick={() => goTo('/tasks', 'متأخرة')} />
          <RowItem label="أعمال جارية التنفيذ" value={stats.tasks.active} color="#6366f1" onClick={() => goTo('/tasks', 'جارية')} />
          <RowItem label="أعمال مكتملة" value={stats.tasks.done} color="#059669" onClick={() => goTo('/tasks', 'منجزة')} />
        </div>

        <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 0 var(--border-color)' }}>
          <div style={{ padding: '18px 24px', background: 'var(--bg-main)', borderBottom: '2px solid var(--border-color)', fontWeight: 950, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Percent size={18} color="#f59e0b" /> الحالة المالية والفواتير
          </div>
          <RowItem label="فواتير متأخرة الدفع" value={stats.inv.late} color="#ef4444" onClick={() => goTo('/invoices', 'متأخرة')} />
          <RowItem label="فواتير بانتظار التحصيل" value={stats.inv.pend} color="#f59e0b" onClick={() => goTo('/invoices', 'معلقة')} />
          <RowItem label="فواتير مدفوعة بالكامل" value={stats.inv.paid} color="#059669" onClick={() => goTo('/invoices', 'مدفوعة')} />
        </div>

      </div>

      {/* --- WhatsApp Modal --- */}
      {showWhatsApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '2px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 950, fontSize: '20px', margin: 0 }}>مساعد الواتساب</h3>
              <button onClick={() => setShowWhatsApp(false)} style={{ background: 'var(--bg-main)', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)' }}>موضوع الرسالة</label>
                <input style={{ padding: '12px', border: '2px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }} placeholder="مثال: فاتورة الدفعة الثانية" value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)' }}>نص الرسالة</label>
                <textarea style={{ padding: '12px', border: '2px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }} rows={4} placeholder="اكتب تفاصيل الرسالة هنا..." value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} />
              </div>
              <button 
                onClick={() => {
                  let msg = `*مكتب فريم الهندسي*\nالموضوع: ${waMsg.subject}\n\n${waMsg.body}`;
                  window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  setShowWhatsApp(false);
                }} 
                style={{ background: '#22c55e', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
              >
                إرسال الرسالة الآن 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Float Add Button */}
      <button 
        onClick={() => router.push('/tasks?new=true')}
        style={{ 
          position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', 
          borderRadius: '20px', background: '#6366f1', color: 'white', border: 'none', 
          boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)', cursor: 'pointer', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}
      >
        <Plus size={32} strokeWidth={3} />
      </button>

    </div>
  );
}
