'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, FileText, CheckCircle, Clock, AlertCircle, Percent, ArrowRight, Eye, Send, Link as LinkIcon, MapPin, Loader2, X } from 'lucide-react';
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
  const [isExporting, setIsExporting] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waMsg, setWaMsg] = useState({ 
    subject: '', 
    category: '—',
    price: '', 
    date: new Date().toISOString().split('T')[0], 
    body: '',
    includeReport: false,
    selectedAttachmentId: ''
  });

  const clients = data?.clients || [];
  const tasks = data?.tasks || [];
  const invoices = data?.invoices || [];

  const selectedClient = useMemo(() => clients.find(c => c?.id === selectedClientId) || null, [clients, selectedClientId]);

  const clientAttachments = useMemo(() => {
    if (!selectedClient) return [];
    const clientTasks = tasks.filter(t => t.client_id === selectedClientId && t.has_file);
    const clientInvoices = invoices.filter(i => i.client_id === selectedClientId && i.has_file);
    return [
      ...clientTasks.map(t => ({ id: t.id, title: `عمل: ${t.title}` })),
      ...clientInvoices.map(i => ({ id: i.id, title: `فاتورة: ${i.invoice_no || i.id}` }))
    ];
  }, [selectedClient, tasks, invoices, selectedClientId]);

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
    
    let msg = `*مكتب فريم للاستشارات الهندسية* 🏗️\n`;
    msg += `--------------------------------\n`;
    if (waMsg.category !== '—') msg += `*القسم:* ${waMsg.category}\n`;
    msg += `*الموضوع:* ${waMsg.subject}\n`;
    msg += `*التاريخ:* ${waMsg.date}\n`;
    if (waMsg.price) msg += `*المبلغ:* ${waMsg.price} د.ك\n`;
    if (waMsg.body) msg += `\n${waMsg.body}\n`;
    
    if (waMsg.selectedAttachmentId) {
      const att = clientAttachments.find(a => a.id === waMsg.selectedAttachmentId);
      if (att) msg += `📎 *مرفق:* ${att.title}\n`;
    }
    
    if (waMsg.includeReport && selectedClient.drive_link) {
      msg += `\n📂 *رابط المستندات:* ${selectedClient.drive_link}\n`;
    }
    
    msg += `\nلأي استفسار يرجى التواصل معنا.`;
    
    const url = `https://wa.me/${selectedClient.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setShowWhatsApp(false);
  };

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
          {selectedClient?.plots?.filter(p => p.maps_link).map((pl, idx) => (
            <a 
              key={idx}
              href={pl.maps_link.trim().startsWith('http') ? pl.maps_link.trim() : `https://${pl.maps_link.trim()}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: '#ecfdf5', borderRadius: '12px', padding: '6px 12px', border: '1px solid #a7f3d0', textDecoration: 'none' }}
            >
              <MapPin size={14} color="#10b981" />
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#065f46' }}>موقع قسيمة {pl.number}</span>
            </a>
          ))}
          
          {selectedClient && (
            <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button 
                onClick={handleExportClientSummary}
                disabled={isExporting}
                className="btn btn-sm btn-outline" 
                style={{ width: 'auto', background: 'white' }}
              >
                {isExporting ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />} 
                تنزيل تقرير شامل
              </button>
              
              <button 
                onClick={() => setShowWhatsApp(true)}
                className="btn btn-sm btn-outline" 
                style={{ width: 'auto', borderColor: '#22c55e', color: '#15803d', background: '#f0fdf4' }}
              >
                <Send size={14} /> إرسال واتساب
              </button>
            </div>
          )}
        </div>
      </div>

      {showWhatsApp && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <Card padded style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900 }}>مساعد الواتساب الذكي</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowWhatsApp(false)} />
            </div>
            
            <div className="form-group">
              <label className="form-label">نوع الرسالة (التصنيف)</label>
              <select className="form-select" value={waMsg.category} onChange={e => setWaMsg(p => ({ ...p, category: e.target.value }))}>
                <option value="—">بدون تصنيف</option>
                <option value="إشراف هندسي">إشراف هندسي</option>
                <option value="تسليم مستندات">تسليم مستندات</option>
                <option value="عرض سعر">عرض سعر</option>
                <option value="فاتورة مالية">فاتورة مالية</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">الموضوع / العنوان</label>
              <input className="form-input" value={waMsg.subject} onChange={e => setWaMsg(p => ({ ...p, subject: e.target.value }))} placeholder="مثال: عرض سعر فيلا..." />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">المبلغ (د.ك)</label>
                <input className="form-input" value={waMsg.price} onChange={e => setWaMsg(p => ({ ...p, price: e.target.value }))} placeholder="0.000" />
              </div>
              <div className="form-group">
                <label className="form-label">التاريخ</label>
                <input type="date" className="form-input" value={waMsg.date} onChange={e => setWaMsg(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">محتوى الرسالة</label>
              <textarea className="form-input" rows={4} value={waMsg.body} onChange={e => setWaMsg(p => ({ ...p, body: e.target.value }))} placeholder="اكتب ملاحظات إضافية هنا..." />
            </div>

            <div className="form-group">
              <label className="form-label">إرفاق مستند من ملفات العميل</label>
              <select className="form-select" value={waMsg.selectedAttachmentId} onChange={e => setWaMsg(p => ({ ...p, selectedAttachmentId: e.target.value }))}>
                <option value="">— بدون مستند —</option>
                {clientAttachments.map(att => <option key={att.id} value={att.id}>{att.title}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fefce8', padding: '10px', borderRadius: '12px', border: '1px solid #fef08a' }}>
              <input type="checkbox" id="inc-report" checked={waMsg.includeReport} onChange={e => setWaMsg(p => ({ ...p, includeReport: e.target.checked }))} />
              <label htmlFor="inc-report" style={{ fontSize: '12px', fontWeight: 800, color: '#854d0e', cursor: 'pointer' }}>إدراج رابط التقرير الشامل / الدرايف</label>
            </div>
            
            <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '20px', fontSize: '11px', color: '#1e40af', lineHeight: 1.5 }}>
              💡 <strong>ملاحظة:</strong> الواتساب لا يسمح بإرفاق ملفات تلقائياً عبر الرابط. سيقوم البرنامج بوضع بيانات الملف في الرسالة، وعليك إرفاق الملف يدوياً بمجرد فتح المحادثة.
            </div>

            <button className="btn" style={{ background: '#22c55e' }} onClick={sendWhatsApp}>فتح المحادثة والإرسال</button>
          </Card>
        </div>
      )}

      {/* Hidden Client Summary Template */}
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
