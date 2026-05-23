'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { 
  Briefcase, FileText, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, TrendingUp, DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- SOLID UI COMPONENTS (THEMED) ---

const StatCard = ({ label, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '25px', background: 'var(--surface)', border: `1px solid var(--border)`,
      borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px',
      boxShadow: 'var(--shadow)', transition: 'all 0.2s'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: 800 }}>{label}</span>
      <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: '8px' }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text)' }}>{value}</div>
  </div>
);

const RowItem = memo(({ label, value, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '15px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
      background: 'var(--surface)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <span style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text)' }}>{value}</span>
      <ArrowRight size={14} color="var(--text-3)" />
    </div>
  </div>
));

export default function Dashboard() {
  const { data, isLoading } = useData();
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
  const fContracts = useMemo(() => (selectedClientId === 'all' ? data?.contracts || [] : (data?.contracts || []).filter(c => c?.client_id === selectedClientId)).filter(Boolean), [data?.contracts, selectedClientId]);

  const supervisionStats = useMemo(() => {
    return fSupervision.map(s => calculateSupervisionStats(s, invoices));
  }, [fSupervision, invoices]);

  const contractsStats = useMemo(() => {
    return fContracts.map(c => calculateSupervisionStats(c, invoices));
  }, [fContracts, invoices]);

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
    supervisionRemaining: supervisionStats.reduce((acc, s) => acc + s.remaining, 0),
    contractsRemaining: contractsStats.reduce((acc, c) => acc + c.remaining, 0)
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader2 className="animate-spin" size={32} color="var(--text)" />
    </div>
  );

  const goTo = (path, status) => router.push(`${path}?status=${status}&client=${selectedClientId}`);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* --- Greetings & Filter --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>مرحباً بك مجدداً</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 700, marginTop: '4px' }}>لوحة التحكم الذكية للنظام</p>
          </div>
          <select 
            style={{ 
              padding: '10px 15px', borderRadius: '10px', border: '1px solid var(--border)', 
              fontWeight: 800, background: 'var(--surface)', color: 'var(--text)', outline: 'none',
              boxShadow: 'var(--shadow)'
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
            background: 'var(--surface)', padding: '25px', borderRadius: '16px', marginBottom: '35px', 
            border: '2px solid var(--blue)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: 'var(--blue)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, color: 'var(--text)', margin: 0 }}>{selectedClient.name}</h3>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                    {selectedClient.drive_link && (
                      <a href={selectedClient.drive_link} target="_blank" style={{ color: 'var(--blue)', fontWeight: 800, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <LinkIcon size={14} /> ملفات الدرايف
                      </a>
                    )}
                    {selectedClient.plots?.map((p, i) => p.maps_link && (
                      <a key={i} href={p.maps_link} target="_blank" style={{ color: 'var(--green)', fontWeight: 800, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} /> قسيمة {p.number}
                      </a>
                    ))}
                  </div>
               </div>
               <button onClick={() => setShowWhatsApp(true)} style={{ background: 'var(--green)', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Send size={18} /> مراسلة العميل
               </button>
            </div>
          </div>
        )}

        {/* --- Stats Grid --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="الأعمال الجارية" value={fTasks.length} color="var(--blue)" icon={Briefcase} onClick={() => router.push('/tasks')} />
          <StatCard label="مشاريع الإشراف" value={fSupervision.length} color="var(--green)" icon={Eye} onClick={() => router.push('/supervision')} />
          <StatCard label="عقود المشاريع" value={fContracts.length} color="var(--purple)" icon={FileText} onClick={() => router.push('/contracts')} />
          <StatCard label="مطالبات الإشراف" value={stats.supervisionRemaining.toLocaleString() + ' د.ك'} color="var(--red)" icon={TrendingUp} onClick={() => router.push('/supervision')} />
          <StatCard label="مطالبات العقود" value={stats.contractsRemaining.toLocaleString() + ' د.ك'} color="var(--orange)" icon={TrendingUp} onClick={() => router.push('/contracts')} />
          <StatCard label="إجمالي الفواتير" value={fInvoices.length} color="var(--blue)" icon={FileText} onClick={() => router.push('/invoices')} />
        </div>

        {/* --- Monitoring Sections --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '15px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontWeight: 950, color: 'var(--text)' }}>تطور الأعمال</div>
            <RowItem label="أعمال متأخرة" value={stats.tasks.late} color="var(--red)" onClick={() => goTo('/tasks', 'متأخرة')} />
            <RowItem label="أعمال جارية" value={stats.tasks.active} color="var(--blue)" onClick={() => goTo('/tasks', 'جارية')} />
            <RowItem label="أعمال منجزة" value={stats.tasks.done} color="var(--green)" onClick={() => goTo('/tasks', 'منجزة')} />
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '15px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontWeight: 950, color: 'var(--text)' }}>الحالة المالية</div>
            <RowItem label="فواتير متأخرة" value={stats.inv.late} color="var(--red)" onClick={() => goTo('/invoices', 'متأخرة')} />
            <RowItem label="فواتير معلقة" value={stats.inv.pend} color="var(--orange)" onClick={() => goTo('/invoices', 'معلقة')} />
            <RowItem label="فواتير مسددة" value={stats.inv.paid} color="var(--green)" onClick={() => goTo('/invoices', 'مدفوعة')} />
          </div>
        </div>

        {/* --- WhatsApp Modal (Enhanced) --- */}
        {showWhatsApp && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 950, fontSize: '20px', margin: 0, color: 'var(--text)' }}>مساعد الواتساب الذكي</h3>
                <button onClick={() => setShowWhatsApp(false)} style={{ background: 'var(--surface-2)', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', color: 'var(--text)' }}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-3)' }}>نوع الرسالة</label>
                  <select 
                    style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 700, outline: 'none', background: 'var(--surface-2)', color: 'var(--text)' }}
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
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-3)' }}>الموضوع</label>
                  <input style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', background: 'var(--surface-2)', color: 'var(--text)' }} placeholder="عنوان الرسالة..." value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-3)' }}>المبلغ (إن وجد)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" style={{ padding: '12px 12px 12px 45px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', width: '100%', background: 'var(--surface-2)', color: 'var(--text)' }} placeholder="المبلغ المطلوب..." value={waMsg.amount} onChange={e => setWaMsg(p => ({ ...p, amount: e.target.value }))} />
                    <DollarSign size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-3)' }}>التفاصيل</label>
                  <textarea style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', background: 'var(--surface-2)', color: 'var(--text)' }} rows={3} placeholder="اكتب تفاصيل الرسالة هنا..." value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} />
                </div>

                <button 
                  onClick={() => {
                    let msg = `*مكتب فريم الهندسي*\n------------------\n*النوع:* ${waMsg.type}\n*الموضوع:* ${waMsg.subject}\n${waMsg.amount ? `*المبلغ المطلوب:* ${waMsg.amount} د.ك\n` : ''}\n${waMsg.body}\n------------------`;
                    window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    setShowWhatsApp(false);
                  }} 
                  style={{ background: 'var(--green)', color: '#ffffff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
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
