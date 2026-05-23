'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus, ArrowRight, User, Calendar,
  DollarSign, Clock, AlertCircle, CheckCircle,
  Building2, Hash, TrendingUp, Download, Phone
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { parseAttachment } from '@/lib/fileHelper';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';
import { Badge, Card, PageHeader, SearchBar } from '@/components/ui';

function SupervisionContent() {
  const { data, isLoading, updateData, addNotification } = useData();
  const { canEdit } = useAuth();

  const supervision = data?.supervision || [];
  const clients = data?.clients || [];
  const billingInvoices = data?.billingInvoices || [];

  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  const [loadingFile, setLoadingFile] = useState(false);

  const filtered = useMemo(() => {
    return supervision.filter(p => {
      const c = clients.find(cl => cl.id === p.client_id);
      const matchesSearch = (p.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.contract_no || '').toLowerCase().includes(search.toLowerCase());
      const matchesClient = clientFilter === 'all' || p.client_id === clientFilter;

      const stats = calculateSupervisionStats(p, billingInvoices);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && !stats.isExpired) ||
        (statusFilter === 'expired' && stats.isExpired) ||
        (statusFilter === 'due' && stats.remaining > 0) ||
        (statusFilter === 'paid' && stats.remaining <= 0);

      return matchesSearch && matchesClient && matchesStatus;
    });
  }, [supervision, search, clients, clientFilter, statusFilter, billingInvoices]);

  const handleQuickPayment = async () => {
    if (!selected) return;
    const amountStr = prompt('أدخل قيمة الدفعة المستلمة (د.ك):');
    if (amountStr === null) return; // user cancelled
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('الرجاء إدخال رقم صحيح أكبر من الصفر');
      return;
    }

    const newCollected = (selected.collected_amount || 0) + amount;
    const payload = {
      ...selected,
      collected_amount: newCollected
    };

    try {
      await updateData('supervision', 'update', payload, selected.id);
      setSelected(payload); // update local state
      addNotification('supervision', 'دفعة إشراف جديدة', `تم تسجيل دفعة بقيمة ${amount.toFixed(3)} د.ك لمشروع ${selected.project_name}`);
    } catch (err) {
      alert('خطأ أثناء تسجيل الدفعة: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      id: selected?.id || uuidv4(),
      billing_type: 'supervision',
      contract_value: parseFloat(form.contract_value || 0),
      free_months: parseInt(form.free_months || 0),
      suspension_days: parseInt(form.suspension_days || 0),
      collected_amount: parseFloat(form.collected_amount || 0),
      contract_no: form.contract_no || '',
      signing_date: form.signing_date || '',
      contract_notes: form.contract_notes || '',
      has_file: !!(tempFiles.length > 0 || form.has_file),
    };

    try {
      if (selected) {
        await updateData('supervision', 'update', payload, selected.id);
      } else {
        await updateData('supervision', 'add', payload);
        addNotification('supervision', 'مشروع إشراف جديد', `تم إضافة مشروع إشراف شهري: ${payload.project_name}`);
      }

      if (tempFiles.length > 0) {
        await set(ref(db, `attachments/${payload.id}`), JSON.stringify(tempFiles));
      }

      setView('list'); 
      setSelected(null); 
      setTempFiles([]);
    } catch (err) {
      console.error(err);
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const getClient = (id) => clients.find(c => c.id === id) || {};

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('supervision-report-template');
      element.style.display = 'block';
      const userFileName = prompt('أدخل اسم الملف:', `تقرير-الإشراف-${Date.now()}`);
      if (!userFileName) { setIsExporting(false); return; }

      await html2pdf().from(element).set({
        margin: [5, 5, 5, 5],
        filename: `${userFileName}.pdf`,
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).save();
      element.style.display = 'none';
    } catch (e) { alert('فشل التصدير'); }
    setIsExporting(false);
  };

  const fetchAndShowFile = async (item) => {
    setLoadingFile(true);
    try {
      const snap = await get(ref(db, `attachments/${item.id}`));
      if (!snap.exists()) { alert("المرفق غير موجود"); setLoadingFile(false); return; }
      const images = parseAttachment(snap.val());
      if (images.length === 0) { alert("صيغة المرفق غير مدعومة"); setLoadingFile(false); return; }

      const imgTags = images.map((src, i) => `
        <div style="background:white; border-radius:8px; padding:16px; box-shadow:0 2px 12px rgba(0,0,0,0.15); max-width:860px; width:100%;">
          ${images.length > 1 ? `<div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:10px; direction:rtl;">الصفحة ${i + 1} من ${images.length}</div>` : ''}
          <img src="${src}" style="width:100%; display:block; border-radius:4px;" />
        </div>`
      ).join('');

      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>مرفق الإشراف - ${item.project_name}</title>
        <style>body{margin:0; background:#f1f5f9; display:flex; flex-direction:column; align-items:center; gap:20px; padding:30px; font-family:sans-serif;}</style>
        </head><body>${imgTags}</body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) { alert("خطأ في جلب المرفق"); }
    setLoadingFile(false);
  };

  if (view === 'detail' && selected) {
    const stats = calculateSupervisionStats(selected, billingInvoices);
    const client = getClient(selected.client_id);
    return (
      <div className="page">
        <PageHeader
          title="تفاصيل الإشراف الشهري"
          actions={<button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button>}
        />

        <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{client.name || '—'} {selected.plot_no && `(قسيمة ${selected.plot_no})`}</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>{selected.project_name}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {stats.remaining <= 0 ? (
                <Badge status="تم سداد ما عليه" customCfg={{ bg: '#059669', color: '#fff' }} />
              ) : (
                <Badge status="لم يسدد ما عليه" customCfg={{ bg: '#dc2626', color: '#fff' }} />
              )}
              {stats.isExpired && <Badge status="منتهي" customCfg={{ bg: '#78716c', color: '#fff' }} />}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>إجمالي المستحق الفعلي (حتى اليوم)</div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{stats.totalDue.toFixed(3)} د.ك</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>المعدل اليومي</div>
              <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>
                {stats.dailyRate.toFixed(3)} د.ك
              </div>
            </div>
          </div>
        </div>

        <Card padded style={{ marginBottom: '16px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>بيانات العميل والعقار</div>
          <div className="detail-row"><User size={16} /><span className="detail-label">العميل</span><span className="detail-value">{client.name}</span></div>
          <div className="detail-row"><Phone size={16} /><span className="detail-label">الهاتف</span><span className="detail-value">{client.phone || '—'}</span></div>
          <div className="detail-row" style={{ border: 0 }}><Hash size={16} /><span className="detail-label">رقم القسيمة</span><span className="detail-value">{selected.plot_no || '—'}</span></div>
        </Card>

        <Card padded style={{ marginBottom: '16px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>بيانات العقد والفوترة</div>
          <div className="detail-row"><Hash size={16} /><span className="detail-label">رقم العقد</span><span className="detail-value" style={{ fontWeight: 800 }}>{selected.contract_no || 'غير متوفر'}</span></div>
          <div className="detail-row"><Calendar size={16} /><span className="detail-label">تاريخ توقيع العقد</span><span className="detail-value">{selected.signing_date || '—'}</span></div>
          <div className="detail-row"><Building2 size={16} /><span className="detail-label">نوع الفوترة / العقد</span><span className="detail-value" style={{ fontWeight: 800 }}>👷 إشراف شهري مستمر (مقدم)</span></div>
          <div className="detail-row"><DollarSign size={16} /><span className="detail-label">قيمة العقد (شهري)</span><span className="detail-value">{selected.contract_value} د.ك</span></div>
          <div className="detail-row"><Calendar size={16} /><span className="detail-label">تاريخ البدء للفوترة</span><span className="detail-value">{selected.start_date}</span></div>
          <div className="detail-row"><Calendar size={16} /><span className="detail-label">تاريخ نهاية الإشراف</span><span className="detail-value">{selected.end_date || 'مفتوح'}</span></div>
          <div className="detail-row"><Clock size={16} /><span className="detail-label">أشهر مجانية</span><span className="detail-value">{selected.free_months} شهر</span></div>
          <div className="detail-row" style={{ border: 0 }}><AlertCircle size={16} /><span className="detail-label">أيام الإيقاف</span><span className="detail-value">{selected.suspension_days} يوم</span></div>
          
          {selected.contract_notes && (
            <div style={{ marginTop: '15px', padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', fontSize: '12px', borderLeft: '3px solid var(--blue)' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-2)', marginBottom: '4px' }}>شروط وملاحظات العقد:</div>
              <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{selected.contract_notes}</div>
            </div>
          )}
        </Card>

        {/* حالة السداد ومتابعة الدفع */}
        <Card padded style={{ borderRight: stats.remaining > 0 ? '4px solid #dc2626' : '4px solid #059669', marginBottom: '16px' }}>
          <div className="section-label" style={{ marginTop: 0, color: stats.remaining > 0 ? '#dc2626' : '#059669', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>حالة سداد الإشراف والمطالبات</span>
            <Badge 
              status={stats.remaining <= 0 ? 'مسدد بالكامل' : 'مستحق السداد'} 
              customCfg={stats.remaining <= 0 ? { bg: '#ecfdf5', color: '#059669' } : { bg: '#fef2f2', color: '#dc2626' }} 
            />
          </div>
          
          <div className="detail-row">
            <CheckCircle size={16} color={stats.remaining <= 0 ? '#059669' : '#dc2626'} />
            <span className="detail-label">هل دفع ما عليه؟</span>
            <span className="detail-value" style={{ fontWeight: 900, color: stats.remaining <= 0 ? '#059669' : '#dc2626' }}>
              {stats.remaining <= 0 ? 'نعم، تم سداد كامل المستحقات' : `لا، لم يسدد ما عليه ومتبقي: ${stats.remaining.toFixed(3)} د.ك`}
            </span>
          </div>

          <div className="detail-row">
            <TrendingUp size={16} /><span className="detail-label">الفترة المحتسبة (مقدم)</span>
            <span className="detail-value">{(stats.billingDays / 30).toFixed(0)} شهر ({stats.billingDays} يوم)</span>
          </div>

          <div className="detail-row">
            <DollarSign size={16} /><span className="detail-label">إجمالي المستحق الفعلي</span>
            <span className="detail-value">{stats.totalDue.toFixed(3)} د.ك</span>
          </div>

          <div className="detail-row">
            <DollarSign size={16} /><span className="detail-label">إجمالي المبلغ المحصل</span>
            <span className="detail-value" style={{ color: '#059669', fontWeight: 800 }}>{stats.collectedAmount.toFixed(3)} د.ك</span>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', width: '100%', marginTop: '5px' }}>
              (محصل يدوي: {(selected.collected_amount || 0).toFixed(3)} د.ك + فواتير مدفوعة مرتبطة: {(stats.collectedAmount - (selected.collected_amount || 0)).toFixed(3)} د.ك)
            </div>
          </div>

          {/* List linked paid invoices */}
          {billingInvoices.filter(inv => inv.link_type === 'supervision' && inv.link_id === selected.id && inv.status === 'مدفوعة').length > 0 && (
            <div style={{ marginTop: '15px', background: 'var(--surface-2)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)', marginBottom: '8px' }}>🔗 فواتير مسددة مرتبطة تلقائياً:</div>
              {billingInvoices.filter(inv => inv.link_type === 'supervision' && inv.link_id === selected.id && inv.status === 'مدفوعة').map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>فاتورة رقم {inv.invoice_no} ({inv.issue_date})</span>
                  <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>+{parseFloat(inv.amount).toFixed(3)} د.ك</span>
                </div>
              ))}
            </div>
          )}

          {canEdit && (
            <div style={{ padding: '5px 0' }}>
              <button 
                onClick={handleQuickPayment} 
                className="btn btn-outline btn-sm" 
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#059669', color: '#059669', marginTop: '10px' }}
              >
                ➕ تسجيل دفعة يدوية إضافية
              </button>
            </div>
          )}

          {/* شريط تقدم السداد */}
          <div style={{ marginTop: '20px', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: 'var(--text-3)', marginBottom: '8px' }}>
              <span>نسبة سداد الفوترة:</span>
              <span>{stats.totalDue > 0 ? Math.min(100, (stats.collectedAmount / stats.totalDue) * 100).toFixed(1) : '0.0'}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'var(--surface-2)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${stats.totalDue > 0 ? Math.min(100, (stats.collectedAmount / stats.totalDue) * 100) : 0}%`, 
                  background: stats.remaining <= 0 ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #d97706, #fbbf24)',
                  borderRadius: '5px',
                  transition: 'width 0.5s ease-out'
                }} 
              />
            </div>
          </div>
        </Card>

        {selected.has_file && (
          <button className="btn btn-outline" style={{ marginTop: '15px' }} onClick={() => fetchAndShowFile(selected)} disabled={loadingFile}>
            {loadingFile ? 'جاري التحميل...' : '👁️ عرض المرفقات'}
          </button>
        )}

        {canEdit && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={() => { setForm(selected); setView('form'); }} className="btn">تعديل البيانات</button>
            <button onClick={() => { if (confirm('هل أنت متأكد من حذف مشروع الإشراف هذا نهائياً؟')) updateData('supervision', 'delete', null, selected.id); setView('list'); }} className="btn btn-danger" style={{ width: 'auto' }}>حذف المشروع</button>
          </div>
        )}
      </div>
    );
  }

  if (view === 'form') {
    const selectedClient = getClient(form.client_id);
    const availablePlots = selectedClient?.plots || [];

    return (
      <div className="page">
        <PageHeader title={selected ? "تعديل بيانات الإشراف" : "إضافة مشروع إشراف جديد"} actions={<button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button>} />
        <form onSubmit={handleSave}>
          <Card padded>
            <div className="form-group"><label className="form-label">المشروع / العقار</label><input className="form-input" required value={form.project_name || ''} onChange={e => setForm({ ...form, project_name: e.target.value })} placeholder="مثال: قسيمة الخالدية السكنية" /></div>
            <div className="form-group">
              <label className="form-label">العميل</label>
              <select className="form-select" required value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value, plot_no: '' })}>
                <option value="">اختر العميل...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">رقم القسيمة / الموقع (من صفحة العملاء)</label>
              <select className="form-select" required value={form.plot_no || ''} onChange={e => setForm({ ...form, plot_no: e.target.value })}>
                <option value="">اختر القسيمة...</option>
                {availablePlots.filter(Boolean).map((pl, i) => {
                  const label = typeof pl === 'object' ? `${pl.number} ${pl.location ? `(${pl.location})` : ''}` : pl;
                  const value = typeof pl === 'object' ? pl.number : pl;
                  return <option key={i} value={value}>{label}</option>;
                })}
              </select>
              {form.client_id && availablePlots.length === 0 && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>هذا العميل ليس لديه قسايم مسجلة. أضف قسايم من صفحة العملاء أولاً.</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">رقم الاتفاقية / العقد</label>
                <input className="form-input" value={form.contract_no || ''} onChange={e => setForm({ ...form, contract_no: e.target.value })} placeholder="مثال: Frame-SUP-2026" />
              </div>
              <div className="form-group">
                <label className="form-label">تاريخ توقيع الاتفاقية</label>
                <input type="date" className="form-input" value={form.signing_date || ''} onChange={e => setForm({ ...form, signing_date: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group"><label className="form-label">قيمة الإشراف (شهرياً بالدنانير)</label><input type="number" step="0.001" className="form-input" required value={form.contract_value || ''} onChange={e => setForm({ ...form, contract_value: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">الأشهر المجانية (بدون فوترة)</label><input type="number" className="form-input" value={form.free_months || ''} onChange={e => setForm({ ...form, free_months: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group"><label className="form-label">تاريخ بدء الفوترة</label><input type="date" className="form-input" required value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">تاريخ نهاية الإشراف (إن وجد)</label><input type="date" className="form-input" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group"><label className="form-label">أيام الإيقاف للمشروع</label><input type="number" className="form-input" value={form.suspension_days || ''} onChange={e => setForm({ ...form, suspension_days: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">المبلغ المحصل اليدوي (خارج الفواتير)</label><input type="number" step="0.001" className="form-input" value={form.collected_amount || ''} onChange={e => setForm({ ...form, collected_amount: e.target.value })} /></div>
            </div>

            <div className="form-group">
              <label className="form-label">شروط وملاحظات الإشراف</label>
              <textarea className="form-input" rows={3} value={form.contract_notes || ''} onChange={e => setForm({ ...form, contract_notes: e.target.value })} placeholder="اكتب أي ملاحظات إضافية حول اتفاقية الإشراف..." />
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <label className="form-label">المرفقات (صور الاتفاقية أو المخططات) - يمكنك اختيار أكثر من ملف</label>
              <input type="file" multiple style={{ display: 'none' }} id="super-files" accept="image/*,.pdf" onChange={async e => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                const { processAttachment } = await import('@/lib/fileHelper');
                try {
                  const results = [];
                  for (const f of files) {
                    const res = await processAttachment(f);
                    results.push(res);
                  }
                  setTempFiles(prev => [...prev, ...results]);
                  setForm(p => ({ ...p, has_file: true }));
                } catch (err) { alert('فشل معالجة الملفات: ' + err.message); }
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {tempFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>مرفق #{i + 1}</span>
                    <button type="button" onClick={() => {
                      const newFiles = tempFiles.filter((_, idx) => idx !== i);
                      setTempFiles(newFiles);
                      if (newFiles.length === 0 && !form.has_file) setForm(p => ({ ...p, has_file: false }));
                    }} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>حذف</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById('super-files').click()}>+ إضافة مرفقات</button>
              </div>
              {form.has_file && tempFiles.length === 0 && <div style={{ marginTop: '10px', fontSize: '11px', color: '#059669', fontWeight: 800 }}>✓ يوجد مرفقات سابقة</div>}
            </div>
          </Card>
          <button type="submit" className="btn" style={{ marginTop: '20px' }}>حفظ البيانات</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="مشاريع الإشراف المستمر"
        actions={
          <>
            <button onClick={handleExportPDF} className="icon-btn" disabled={isExporting}><Download size={20} /></button>
            {canEdit && (
              <button 
                onClick={() => { 
                  setForm({ 
                    start_date: new Date().toISOString().split('T')[0], 
                    free_months: 0, 
                    suspension_days: 0, 
                    collected_amount: 0, 
                    contract_no: '', 
                    signing_date: '', 
                    contract_notes: '', 
                    billing_type: 'supervision'
                  }); 
                  setSelected(null); 
                  setView('form'); 
                }} 
                className="btn btn-sm" 
                style={{ width: 'auto' }}
              >
                + مشروع جديد
              </button>
            )}
          </>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="بحث عن مشروع إشراف، عميل، أو عقد..." />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        <select className="form-select btn-sm" style={{ width: 'auto', flexShrink: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط حالياً</option>
          <option value="expired">منتهي</option>
          <option value="due">لم يسدد (عليه مستحقات)</option>
          <option value="paid">مسدد بالكامل</option>
        </select>
        <select className="form-select btn-sm" style={{ width: 'auto', flexShrink: 0 }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
          <option value="all">كل العملاء</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="list-group">
        {filtered.map(p => {
          const stats = calculateSupervisionStats(p, billingInvoices);
          const client = getClient(p.client_id);
          return (
            <Card key={p.id} style={{ marginBottom: '16px', borderRight: stats.remaining > 0 ? '5px solid #dc2626' : '5px solid #059669' }} onClick={() => { setSelected(p); setView('detail'); }}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>
                      {client.name} {p.plot_no && `• قسيمة ${p.plot_no}`} {p.contract_no && `• عقد: ${p.contract_no}`}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>{p.project_name}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: stats.remaining > 0 ? '#dc2626' : '#059669' }}>{stats.remaining.toFixed(3)}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>المتبقي د.ك</div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                    <TrendingUp size={14} /> 
                    <span>
                      {(stats.billingDays / 30).toFixed(0)} أشهر محتسبة ({stats.billingDays} يوم)
                    </span>
                  </div>
                  
                  <Badge status="إشراف شهري" customCfg={{ bg: '#faf5ff', color: '#7c3aed' }} />
                  
                  {stats.remaining <= 0 ? (
                    <Badge status="تم سداد ما عليه" customCfg={{ bg: '#ecfdf5', color: '#059669' }} />
                  ) : (
                    <Badge status="لم يسدد ما عليه" customCfg={{ bg: '#fef2f2', color: '#dc2626' }} />
                  )}
                  {stats.isExpired && <Badge status="منتهي" customCfg={{ bg: '#78716c', color: '#fff' }} />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* PDF Export Template */}
      <div id="supervision-report-template" style={{ display: 'none', background: 'white', padding: '30px', direction: 'rtl', width: '280mm', minHeight: '190mm' }}>
        <style>{`
          .rep-table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
          .rep-table th, .rep-table td { border: 1px solid #000; padding: 5px 2px; text-align: center; font-size: 8.5px; word-wrap: break-word; }
          .rep-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .sum-box { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; gap: 25px; border: 1px solid #e2e8f0; }
        `}</style>

        <div className="rep-header">
          <div style={{ width: '120px' }}><h2>مكتب فريم</h2></div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>تقرير مشاريع الإشراف الشهري المستمر</h2>
            <div style={{ fontSize: '11px', marginTop: '5px' }}>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
          </div>
          <div style={{ width: '120px', fontSize: '9px', textAlign: 'left' }}>نظام فريم الذكي</div>
        </div>

        <div className="sum-box">
          <div><span style={{ fontSize: '10px', color: '#64748b' }}>إجمالي المشاريع: </span><strong style={{ fontSize: '12px' }}>{filtered.length}</strong></div>
          <div><span style={{ fontSize: '10px', color: '#64748b' }}>إجمالي المستحق: </span><strong style={{ fontSize: '12px' }}>{filtered.reduce((sum, p) => sum + calculateSupervisionStats(p, billingInvoices).totalDue, 0).toFixed(3)} د.ك</strong></div>
          <div><span style={{ fontSize: '10px', color: '#64748b' }}>إجمالي المحصل الفعلي: </span><strong style={{ fontSize: '12px', color: '#059669' }}>{filtered.reduce((sum, p) => sum + calculateSupervisionStats(p, billingInvoices).collectedAmount, 0).toFixed(3)} د.ك</strong></div>
          <div><span style={{ fontSize: '10px', color: '#64748b' }}>إجمالي المطالبات المتبقية: </span><strong style={{ fontSize: '12px', color: '#dc2626' }}>{filtered.reduce((sum, p) => sum + calculateSupervisionStats(p, billingInvoices).remaining, 0).toFixed(3)} د.ك</strong></div>
        </div>

        <table className="rep-table">
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ width: '15%' }}>العميل</th>
              <th style={{ width: '20%' }}>المشروع</th>
              <th style={{ width: '10%' }}>القسيمة</th>
              <th style={{ width: '12%' }}>قيمة العقد (شهري)</th>
              <th style={{ width: '10%' }}>البدء</th>
              <th style={{ width: '11%' }}>المستحق الكلي</th>
              <th style={{ width: '11%' }}>المحصل الكلي</th>
              <th style={{ width: '11%' }}>المتبقي (د.ك)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const stats = calculateSupervisionStats(p, billingInvoices);
              const client = getClient(p.client_id);
              return (
                <tr key={p.id}>
                  <td>{client.name || '—'}</td>
                  <td><strong>{p.project_name}</strong></td>
                  <td>{p.plot_no || '—'}</td>
                  <td>{p.contract_value} د.ك</td>
                  <td>{p.start_date}</td>
                  <td>{stats.totalDue.toFixed(3)}</td>
                  <td style={{ color: '#059669' }}>{stats.collectedAmount.toFixed(3)}</td>
                  <td style={{ color: stats.remaining > 0 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{stats.remaining.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SupervisionPage() {
  return <SupervisionContent />;
}
