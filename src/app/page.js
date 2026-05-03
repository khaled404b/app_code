'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/AppWrapper';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, 
  Percent, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, TrendingUp, RefreshCw, Wifi, WifiOff, Moon, Sun, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- Components ---

const SimpleStat = ({ label, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)',
      borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>{label}</div>
      <Icon size={16} color={color} />
    </div>
    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)' }}>{value}</div>
  </div>
);

const RowItem = memo(({ label, value, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 15px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>{value}</span>
      <ArrowRight size={14} color="var(--text-muted)" />
    </div>
  </div>
));

export default function Dashboard() {
  const { data, isLoading, isConnected, isSyncing } = useData();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('all');
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

  const handleRefresh = () => {
    localStorage.removeItem('frame_app_cache');
    window.location.reload();
  };

  if (isLoading) return <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
    <Loader2 className="animate-spin" size={40} color="#2563eb" />
    <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>جاري تحديث البيانات...</span>
  </div>;

  const goTo = (path, status) => router.push(`${path}?status=${status}&client=${selectedClientId}`);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* --- Unified Action Bar (Status, Sync, Theme, Logout) --- */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '20px', background: 'var(--card-bg)', padding: '10px 15px', 
        borderRadius: '12px', border: '1px solid var(--border-color)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ef4444', fontWeight: 900, background: '#fee2e2', padding: '6px 12px', borderRadius: '8px' }}>
              <WifiOff size={14} /> انقطع الاتصال
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#059669', fontWeight: 900, background: '#f0fdf4', padding: '6px 12px', borderRadius: '8px' }}>
              <Wifi size={14} /> متصل حياً
            </div>
          )}
          <button onClick={handleRefresh} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> تحديث
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#64748b" />}
          </button>
          <button onClick={() => window.location.reload()} style={{ background: '#fee2e2', border: 'none', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* --- Header & Client Filter --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>نظرة عامة على المكتب</h1>
        </div>
        <select 
          style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: 700, background: 'var(--card-bg)', color: 'var(--text-main)', outline: 'none' }}
          value={selectedClientId} 
          onChange={e => setSelectedClientId(e.target.value)}
        >
          <option value="all">📊 جميع المشاريع</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* --- Client Quick Links --- */}
      {selectedClient && (
        <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, color: 'var(--text-main)' }}>{selectedClient.name}</span>
            {selectedClient.drive_link && (
              <a href={selectedClient.drive_link} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2563eb', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                <LinkIcon size={14} /> الدرايف
              </a>
            )}
            {selectedClient.plots?.map((p, i) => p.maps_link && (
              <a key={i} href={p.maps_link} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                <MapPin size={14} /> قسيمة {p.number}
              </a>
            ))}
          </div>
          <button onClick={() => setShowWhatsApp(true)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Send size={14} /> مراسلة
          </button>
        </div>
      )}

      {/* --- Dashboard Grid --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <SimpleStat label="الأعمال" value={fTasks.length} color="#2563eb" icon={Briefcase} onClick={() => router.push('/tasks')} />
        <SimpleStat label="الإشراف" value={fSupervision.length} color="#059669" icon={Eye} onClick={() => router.push('/supervision')} />
        <SimpleStat label="المتبقي" value={stats.totalRemaining.toFixed(2) + ' د.ك'} color="#ef4444" icon={TrendingUp} onClick={() => router.push('/supervision')} />
        <SimpleStat label="الفواتير" value={fInvoices.length} color="#d97706" icon={FileText} onClick={() => router.push('/invoices')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 15px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', fontWeight: 900, fontSize: '14px' }}>متابعة الأعمال</div>
          <RowItem label="أعمال متأخرة" value={stats.tasks.late} color="#ef4444" onClick={() => goTo('/tasks', 'متأخرة')} />
          <RowItem label="أعمال جارية" value={stats.tasks.active} color="#2563eb" onClick={() => goTo('/tasks', 'جارية')} />
          <RowItem label="أعمال منجزة" value={stats.tasks.done} color="#059669" onClick={() => goTo('/tasks', 'منجزة')} />
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 15px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', fontWeight: 900, fontSize: '14px' }}>الحالة المالية</div>
          <RowItem label="فواتير متأخرة" value={stats.inv.late} color="#ef4444" onClick={() => goTo('/invoices', 'متأخرة')} />
          <RowItem label="فواتير معلقة" value={stats.inv.pend} color="#d97706" onClick={() => goTo('/invoices', 'معلقة')} />
          <RowItem label="فواتير مسددة" value={stats.inv.paid} color="#059669" onClick={() => goTo('/invoices', 'مدفوعة')} />
        </div>
      </div>

      {/* Floating Add Button (Right Only) */}
      <button 
        onClick={() => router.push('/tasks?new=true')}
        style={{ position: 'fixed', bottom: '25px', right: '25px', width: '55px', height: '55px', borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', boxShadow: '0 5px 15px rgba(37,99,235,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      >
        <Plus size={28} />
      </button>

      {/* WhatsApp Modal */}
      {showWhatsApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '380px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900 }}>مساعد الواتساب</h3>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowWhatsApp(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)' }} placeholder="الموضوع" value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} />
              <textarea style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)' }} rows={3} placeholder="التفاصيل..." value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} />
              <button onClick={() => {
                let msg = `*مكتب فريم الهندسي*\nالموضوع: ${waMsg.subject}\n${waMsg.body}`;
                window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                setShowWhatsApp(false);
              }} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>إرسال الآن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
