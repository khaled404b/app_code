'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, 
  Percent, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, Calendar, TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';

// --- Modern Sub-Components ---

const QuickAction = ({ icon: Icon, label, color, onClick, badge }) => (
  <button 
    onClick={onClick}
    className="modern-hover"
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      padding: '16px',
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      position: 'relative',
      flex: 1,
      minWidth: '100px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
  >
    <div style={{ 
      width: '45px', height: '45px', borderRadius: '14px', 
      background: color + '15', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', color: color
    }}>
      <Icon size={22} />
    </div>
    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>{label}</span>
    {badge && (
      <span style={{ 
        position: 'absolute', top: '10px', right: '10px',
        background: color, color: 'white', fontSize: '10px',
        padding: '2px 6px', borderRadius: '10px', fontWeight: 900
      }}>{badge}</span>
    )}
  </button>
);

const SummaryRow = memo(({ label, value, color, icon: Icon, onClick, subtitle }) => (
  <div
    onClick={onClick}
    className="modern-hover"
    style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px', borderRadius: '16px', cursor: 'pointer',
      background: 'var(--bg-main)', border: '1px solid var(--border-color)',
      marginBottom: '10px', transition: 'all 0.2s ease'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ 
        width: '42px', height: '42px', borderRadius: '12px', 
        background: color + '10', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', color: color 
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>{label}</div>
        {subtitle && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontWeight: 900, fontSize: '20px', color: color }}>{value}</span>
      <ArrowRight size={16} color="var(--text-muted)" />
    </div>
  </div>
));

export default function Dashboard() {
  const { data, isLoading, isConnected, isSyncing } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waMsg, setWaMsg] = useState({ 
    subject: '', 
    category: '—',
    price: '', 
    date: new Date().toISOString().split('T')[0], 
    body: ''
  });

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
      totalRemaining: fSupervision.reduce((acc, s) => acc + calculateSupervisionStats(s).remaining, 0)
    }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <Loader2 className="animate-spin" size={48} color="#2563eb" />
      <p style={{ fontWeight: 800, color: '#64748b' }}>جاري تحضير لوحة التحكم...</p>
    </div>
  );

  const goTo = (path, status) => {
    const c = selectedClientId === 'all' ? 'الكل' : selectedClientId;
    router.push(`${path}?status=${status}&client=${c}`);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  const handleExportClientSummary = async () => {
    if (!selectedClient) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('client-summary-template');
      element.style.display = 'block';
      await html2pdf().from(element).set({
        margin: [10, 10, 10, 10],
        filename: `Client-Summary-${selectedClient.name}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
      element.style.display = 'none';
    } catch (e) { alert('فشل التصدير'); }
    setIsExporting(false);
  };

  const sendWhatsApp = () => {
    if (!selectedClient?.phone) return alert('لا يوجد رقم هاتف للعميل');
    let msg = `*مكتب فريم للاستشارات الهندسية* 🏗️\n--------------------------------\n`;
    if (waMsg.category !== '—') msg += `*القسم:* ${waMsg.category}\n`;
    msg += `*الموضوع:* ${waMsg.subject}\n*التاريخ:* ${waMsg.date}\n`;
    if (waMsg.price) msg += `*المبلغ:* ${waMsg.price} د.ك\n`;
    if (waMsg.body) msg += `\n${waMsg.body}\n`;
    msg += `\nلأي استفسار يرجى التواصل معنا.`;
    window.open(`https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    setShowWhatsApp(false);
  };

  return (
    <div className="page fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* --- Header Section --- */}
      <div style={{ marginBottom: '32px', animation: 'slideDown 0.5s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
              {greeting}، {user?.name || 'مهندس'} ✨
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              نظرة عامة على المكتب
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
             <select 
              className="form-select modern-shadow" 
              style={{ width: '220px', borderRadius: '16px', border: 'none', background: 'var(--card-bg)', fontWeight: 800 }} 
              value={selectedClientId} 
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <option value="all">📊 جميع المشاريع</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Client Quick Stats & Links */}
        {selectedClient && (
          <div className="fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'var(--card-bg)', padding: '15px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            {selectedClient.type === 'نسبة' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff7ed', padding: '8px 14px', borderRadius: '14px', color: '#c2410c', fontSize: '13px', fontWeight: 900 }}>
                <TrendingUp size={16} /> نسبة المكتب: {selectedClient.commission_rate}%
              </div>
            )}
            {selectedClient.drive_link && (
              <a href={selectedClient.drive_link} target="_blank" className="modern-hover" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '8px 14px', borderRadius: '14px', color: '#1d4ed8', fontSize: '13px', fontWeight: 900, textDecoration: 'none' }}>
                <LinkIcon size={16} /> ملفات الدرایف
              </a>
            )}
            {selectedClient.plots?.map((p, i) => p.maps_link && (
              <a key={i} href={p.maps_link} target="_blank" className="modern-hover" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', padding: '8px 14px', borderRadius: '14px', color: '#047857', fontSize: '13px', fontWeight: 900, textDecoration: 'none' }}>
                <MapPin size={16} /> موقع قسيمة {p.number}
              </a>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={handleExportClientSummary} disabled={isExporting} className="btn-modern-small" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              {isExporting ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />} تقرير
            </button>
            <button onClick={() => setShowWhatsApp(true)} className="btn-modern-small" style={{ background: '#22c55e', color: 'white' }}>
              <Send size={14} /> واتساب
            </button>
          </div>
        )}
      </div>

      {/* --- Top Power Grid --- */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '15px', marginBottom: '32px', animation: 'slideUp 0.6s ease-out' 
      }}>
        <QuickAction icon={Briefcase} label="الأعمال الجارية" color="#2563eb" badge={stats.tasks.active} onClick={() => router.push('/tasks')} />
        <QuickAction icon={Eye} label="إشراف قيد المتابعة" color="#059669" badge={stats.supervision.count} onClick={() => router.push('/supervision')} />
        <QuickAction icon={FileText} label="الفواتير المعلقة" color="#d97706" badge={stats.inv.pend} onClick={() => router.push('/invoices')} />
        <QuickAction icon={Send} label="طلبات التسليم" color="#6366f1" badge={(data?.deliveries || []).length} onClick={() => router.push('/deliveries')} />
      </div>

      {/* --- Main Content Layout --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* Column 1: Tasks Status */}
        <div className="fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingRight: '5px' }}>
            <div style={{ width: '4px', height: '18px', background: '#2563eb', borderRadius: '10px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 900 }}>حالة الأعمال</h2>
          </div>
          <Card padded style={{ background: 'var(--card-bg)', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <SummaryRow label="أعمال متأخرة" value={stats.tasks.late} color="#ef4444" icon={AlertCircle} onClick={() => goTo('/tasks', 'متأخرة')} subtitle="تتطلب تدخل فوري" />
            <SummaryRow label="أعمال جارية" value={stats.tasks.active} color="#2563eb" icon={Clock} onClick={() => goTo('/tasks', 'جارية')} subtitle="قيد التنفيذ حالياً" />
            <SummaryRow label="أعمال منجزة" value={stats.tasks.done} color="#10b981" icon={CheckCircle} onClick={() => goTo('/tasks', 'منجزة')} subtitle="تم الانتهاء منها" />
          </Card>
        </div>

        {/* Column 2: Financial Status */}
        <div className="fade-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingRight: '5px' }}>
            <div style={{ width: '4px', height: '18px', background: '#d97706', borderRadius: '10px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 900 }}>الحالة المالية</h2>
          </div>
          <Card padded style={{ background: 'var(--card-bg)', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <SummaryRow label="مبالغ الإشراف المتبقية" value={stats.supervision.totalRemaining.toFixed(2) + ' د.ك'} color="#6366f1" icon={TrendingUp} onClick={() => router.push('/supervision')} subtitle="إجمالي الأقساط المتبقية" />
            <SummaryRow label="فواتير متأخرة" value={stats.inv.late} color="#ef4444" icon={AlertCircle} onClick={() => goTo('/invoices', 'متأخرة')} subtitle="لم يتم تحصيلها بعد" />
            <SummaryRow label="فواتير معلقة" value={stats.inv.pend} color="#d97706" icon={FileText} onClick={() => goTo('/invoices', 'معلقة')} subtitle="في انتظار الدفع" />
          </Card>
        </div>

      </div>

      {/* --- Floating Add Button --- */}
      <button 
        onClick={() => router.push('/tasks?new=true')}
        style={{
          position: 'fixed', bottom: '30px', left: '30px',
          width: '60px', height: '60px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)', border: 'none', cursor: 'pointer',
          zIndex: 100, transition: 'transform 0.2s'
        }}
        className="btn-add-hover"
      >
        <Plus size={30} />
      </button>

      {/* --- WhatsApp Assistant Modal --- */}
      {showWhatsApp && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Card padded style={{ width: '100%', maxWidth: '420px', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '20px' }}>مساعد الواتساب</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>تواصل احترافي مع العميل</p>
              </div>
              <button onClick={() => setShowWhatsApp(false)} style={{ background: 'var(--bg-main)', border: 'none', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                <X size={20} color="var(--text-main)" />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">نوع الرسالة</label>
                <select className="form-select modern-input" value={waMsg.category} onChange={e => setWaMsg(p => ({ ...p, category: e.target.value }))}>
                  <option value="—">بدون تصنيف</option>
                  <option value="إشراف هندسي">إشراف هندسي</option>
                  <option value="تسليم مستندات">تسليم مستندات</option>
                  <option value="عرض سعر">عرض سعر</option>
                  <option value="فاتورة مالية">فاتورة مالية</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">الموضوع</label>
                <input className="form-input modern-input" value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} placeholder="أدخل عنوان الرسالة..." />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">المبلغ (د.ك)</label>
                  <input className="form-input modern-input" value={waMsg.price} onChange={e => setWaMsg(p => ({ ...p, price: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="form-group">
                  <label className="form-label">التاريخ</label>
                  <input type="date" className="form-input modern-input" value={waMsg.date} onChange={e => setWaMsg(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">تفاصيل إضافية</label>
                <textarea className="form-input modern-input" rows={3} value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} placeholder="نص اختياري يظهر في نهاية الرسالة..." />
              </div>

              <button 
                className="btn-modern" 
                style={{ background: '#22c55e', color: 'white', marginTop: '10px', height: '50px', fontSize: '15px' }} 
                onClick={sendWhatsApp}
              >
                إرسال الآن للعميل
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Styles & Keyframes */}
      <style jsx global>{`
        .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .modern-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.08);
          border-color: #2563eb44 !important;
        }
        
        .modern-input {
          border-radius: 12px !important;
          border: 1px solid var(--border-color) !important;
          background: var(--bg-main) !important;
          padding: 12px !important;
        }

        .btn-modern-small {
          padding: 8px 16px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          transition: all 0.2s;
        }
        .btn-modern-small:hover { transform: scale(1.05); }

        .btn-add-hover:hover { transform: scale(1.1) rotate(90deg); }
        
        .modern-shadow {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
      `}</style>

      <div id="client-summary-template" style={{ display: 'none', background: 'white', padding: '40px', direction: 'rtl', color: '#000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>FRAME</h1>
            <div style={{ fontSize: '14px' }}>مكتب فريم للاستشارات الهندسية</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ margin: 0 }}>تقرير الحالة الشامل</h2>
            <div style={{ fontSize: '12px' }}>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>بيانات العميل</h3>
            <div style={{ marginBottom: '8px' }}><strong>الاسم:</strong> {selectedClient?.name}</div>
            <div style={{ marginBottom: '8px' }}><strong>الهاتف:</strong> {selectedClient?.phone}</div>
            <div><strong>عدد القسايم:</strong> {selectedClient?.plots?.length || 0}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>أرقام المشروع</h3>
            <div style={{ marginBottom: '8px' }}><strong>إجمالي الأعمال:</strong> {fTasks.length}</div>
            <div style={{ marginBottom: '8px' }}><strong>الفواتير المصدرة:</strong> {fInvoices.length}</div>
            <div><strong>عروض الأسعار:</strong> {(data?.offers || []).filter(o => o.client_id === selectedClientId).length}</div>
          </div>
        </div>

        {fSupervision.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ borderRight: '5px solid #059669', paddingRight: '10px' }}>الحالة الإشرافية</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead><tr style={{ background: '#f1f5f9' }}><th style={{ border: '1px solid #ddd', padding: '10px' }}>المشروع</th><th style={{ border: '1px solid #ddd', padding: '10px' }}>القيمة</th><th style={{ border: '1px solid #ddd', padding: '10px' }}>المحصل</th><th style={{ border: '1px solid #ddd', padding: '10px' }}>المتبقي</th></tr></thead>
              <tbody>
                {fSupervision.map(s => {
                  const sStats = calculateSupervisionStats(s);
                  return (
                    <tr key={s.id}>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>{s.project_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>{s.contract_value.toFixed(3)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>{s.collected_amount.toFixed(3)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', color: '#dc2626', fontWeight: 900 }}>{sStats.remaining.toFixed(3)} د.ك</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ borderRight: '5px solid #2563eb', paddingRight: '10px' }}>الأعمال الحالية</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead><tr style={{ background: '#f1f5f9' }}><th style={{ border: '1px solid #ddd', padding: '10px' }}>البيان</th><th style={{ border: '1px solid #ddd', padding: '10px' }}>القسيمة</th><th style={{ border: '1px solid #ddd', padding: '10px' }}>الحالة</th></tr></thead>
            <tbody>
              {fTasks.map(t => (
                <tr key={t.id}>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{t.title}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{t.plot_no}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          يُعتبر هذا التقرير ملخصاً داخلياً لمكتب فريم الهندسي، وليس مستنداً رسمياً للمطالبة المالية إلا بالفواتير المعتمدة.
        </div>
      </div>
    </div>
  );
}
