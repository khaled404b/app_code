'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/AppWrapper';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, 
  Percent, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, TrendingUp, RefreshCw, Wifi, WifiOff, Moon, Sun, LogOut, MessageSquare, DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- SOLID UI COMPONENTS ---

const StatCard = ({ label, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '25px', background: '#ffffff', border: `1px solid #e2e8f0`,
      borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 800 }}>{label}</span>
      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
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
  const { data, isLoading, isConnected, isSyncing } = useData();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waMsg, setWaMsg] = useState({ type: 'استفسار', subject: '', amount: '', body: '' });

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <Loader2 className="animate-spin" size={32} color="#1e293b" />
    </div>
  );

  const goTo = (path, status) => router.push(`${path}?status=${status}&client=${selectedClientId}`);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* --- INTEGRATED TOP BAR (RE-ADDED) --- */}
        <div style={{ 
          background: '#ffffff', padding: '15px 25px', borderRadius: '16px', marginBottom: '30px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '20px' }}>F</div>
             <div>
                <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>مكتب فريم الهندسي</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                   {!isConnected ? (
                     <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}><WifiOff size={10} /> منقطع</span>
                   ) : (
                     <span style={{ fontSize: '10px', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}><Wifi size={10} /> متصل حياً</span>
                   )}
                   <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '10px', fontWeight: 800, cursor: 'pointer', padding: 0 }}>تحديث الآن</button>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <button onClick={toggleTheme} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#64748b" />}
             </button>
             <button onClick={() => logout()} style={{ background: '#fee2e2', border: '1px solid #fecaca', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <LogOut size={18} />
             </button>
             <div style={{ width: '1px', height: '25px', background: '#e2e8f0', margin: '0 5px' }} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>م. خالد</div>
                   <div style={{ fontSize: '10px', color: '#059669', fontWeight: 800 }}>● متصل</div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>خ</div>
             </div>
          </div>
        </div>

        {/* --- Greetings & Filter --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>مرحباً بك مجدداً</h2>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>لوحة التحكم الذكية لمكتب فريم</p>
          </div>
          <select 
            style={{ 
              padding: '10px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', 
              fontWeight: 800, background: '#ffffff', color: '#1e293b', outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            value={selectedClientId} 
            onChange={e => setSelectedClientId(e.target.value)}
          >
            <option value="all">📊 جميع المشاريع</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* --- Client Detail Card --- */}
        {selectedClient && (
          <div style={{ 
            background: '#ffffff', padding: '25px', borderRadius: '16px', marginBottom: '35px', 
            border: '2px solid #3b82f6', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#3b82f6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{selectedClient.name}</h3>
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
               <button onClick={() => setShowWhatsApp(true)} style={{ background: '#22c55e', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Send size={18} /> مراسلة العميل
               </button>
            </div>
          </div>
        )}

        {/* --- Stats Grid --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="الأعمال الجارية" value={fTasks.length} color="#3b82f6" icon={Briefcase} onClick={() => router.push('/tasks')} />
          <StatCard label="مشاريع الإشراف" value={fSupervision.length} color="#059669" icon={Eye} onClick={() => router.push('/supervision')} />
          <StatCard label="المطالبات المالية" value={stats.totalRemaining.toLocaleString() + ' د.ك'} color="#ef4444" icon={TrendingUp} onClick={() => router.push('/supervision')} />
          <StatCard label="إجمالي الفواتير" value={fInvoices.length} color="#d97706" icon={FileText} onClick={() => router.push('/invoices')} />
        </div>

        {/* --- Monitoring Sections --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 950, color: '#1e293b' }}>تطور الأعمال</div>
            <RowItem label="أعمال متأخرة" value={stats.tasks.late} color="#ef4444" onClick={() => goTo('/tasks', 'متأخرة')} />
            <RowItem label="أعمال جارية" value={stats.tasks.active} color="#3b82f6" onClick={() => goTo('/tasks', 'جارية')} />
            <RowItem label="أعمال منجزة" value={stats.tasks.done} color="#059669" onClick={() => goTo('/tasks', 'منجزة')} />
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 950, color: '#1e293b' }}>الحالة المالية</div>
            <RowItem label="فواتير متأخرة" value={stats.inv.late} color="#ef4444" onClick={() => goTo('/invoices', 'متأخرة')} />
            <RowItem label="فواتير معلقة" value={stats.inv.pend} color="#d97706" onClick={() => goTo('/invoices', 'معلقة')} />
            <RowItem label="فواتير مسددة" value={stats.inv.paid} color="#059669" onClick={() => goTo('/invoices', 'مدفوعة')} />
          </div>
        </div>

        {/* --- WhatsApp Modal (Enhanced) --- */}
        {showWhatsApp && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 950, fontSize: '20px', margin: 0 }}>مساعد الواتساب الذكي</h3>
                <button onClick={() => setShowWhatsApp(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>نوع الرسالة</label>
                  <select 
                    style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, outline: 'none' }}
                    value={waMsg.type}
                    onChange={e => setWaMsg(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="استفسار">❓ استفسار عام</option>
                    <option value="مطالبة مالية">💰 مطالبة مالية</option>
                    <option value="متابعة عمل">🏗️ متابعة تنفيذ</option>
                    <option value="تنبيه">⚠️ تنبيه / ملاحظة</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>الموضوع</label>
                  <input style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }} placeholder="عنوان الرسالة..." value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>المبلغ (إن وجد)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" style={{ padding: '12px 12px 12px 45px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', width: '100%' }} placeholder="المبلغ المطلوب..." value={waMsg.amount} onChange={e => setWaMsg(p => ({ ...p, amount: e.target.value }))} />
                    <DollarSign size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>التفاصيل</label>
                  <textarea style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }} rows={3} placeholder="اكتب تفاصيل الرسالة هنا..." value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} />
                </div>

                <button 
                  onClick={() => {
                    let msg = `*مكتب فريم الهندسي*\n------------------\n*النوع:* ${waMsg.type}\n*الموضوع:* ${waMsg.subject}\n${waMsg.amount ? `*المبلغ المطلوب:* ${waMsg.amount} د.ك\n` : ''}\n${waMsg.body}\n------------------`;
                    window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    setShowWhatsApp(false);
                  }} 
                  style={{ background: '#22c55e', color: '#ffffff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
                >
                  إرسال الرسالة الآن 🚀
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
