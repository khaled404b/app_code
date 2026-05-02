'use client';

import { useState, useMemo, Suspense } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import {
  Eye, Plus, Search, ArrowRight, User, Calendar,
  DollarSign, Clock, AlertCircle, CheckCircle,
  Building2, Hash, Percent, TrendingUp, Download, Phone, Filter
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { parseAttachment, processAttachment } from '@/lib/fileHelper';
import { calculateSupervisionStats } from '@/utils/supervisionCalc';
import { Badge, Card, PageHeader, SearchBar } from '@/components/ui';

function SupervisionContent() {
  const { data, isLoading, updateData } = useData();
  const { canEdit } = useAuth();

  const supervision = data?.supervision || [];
  const clients = data?.clients || [];

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
        (c?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesClient = clientFilter === 'all' || p.client_id === clientFilter;

      const stats = calculateSupervisionStats(p);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && !stats.isExpired) ||
        (statusFilter === 'expired' && stats.isExpired) ||
        (statusFilter === 'due' && stats.remaining > 0);

      return matchesSearch && matchesClient && matchesStatus;
    });
  }, [supervision, search, clients, clientFilter, statusFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      id: selected?.id || uuidv4(),
      contract_value: parseFloat(form.contract_value || 0),
      free_months: parseInt(form.free_months || 0),
      suspension_days: parseInt(form.suspension_days || 0),
      collected_amount: parseFloat(form.collected_amount || 0),
      has_file: tempFiles.length > 0 || form.has_file,
    };

    if (selected) await updateData('supervision', 'update', payload, selected.id);
    else await updateData('supervision', 'add', payload);

    if (tempFiles.length > 0) {
      set(ref(db, `attachments/${payload.id}`), JSON.stringify(tempFiles));
    }

    setView('list'); setSelected(null); setTempFiles([]);
  };

  const getClient = (id) => clients.find(c => c.id === id) || {};

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('supervision-report-template');
      element.style.display = 'block';
      const userFileName = prompt('أدخل اسم الملف:', `تقرير-إشراف-${Date.now()}`);
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
    const stats = calculateSupervisionStats(selected);
    const client = getClient(selected.client_id);
    return (
      <div className="page">
        <PageHeader
          title="تفاصيل الإشراف"
          actions={<button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button>}
        />

        <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{client.name || '—'} {selected.plot_no && `(قسيمة ${selected.plot_no})`}</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>{selected.project_name}</h2>
            </div>
            {stats.isExpired && <Badge status="منتهي" customCfg={{ bg: '#ef4444', color: '#fff' }} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>إجمالي المستحق</div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{stats.totalDue.toFixed(3)} د.ك</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>المعدل اليومي</div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{stats.dailyRate.toFixed(3)} د.ك</div>
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
          <div className="section-label" style={{ marginTop: 0 }}>بيانات العقد</div>
          <div className="detail-row"><DollarSign size={16} /><span className="detail-label">قيمة العقد (شهري)</span><span className="detail-value">{selected.contract_value} د.ك</span></div>
          <div className="detail-row"><Calendar size={16} /><span className="detail-label">تاريخ البدء</span><span className="detail-value">{selected.start_date}</span></div>
          <div className="detail-row"><Calendar size={16} /><span className="detail-label">تاريخ النهاية</span><span className="detail-value">{selected.end_date || 'مفتوح'}</span></div>
          <div className="detail-row"><Clock size={16} /><span className="detail-label">أشهر مجانية</span><span className="detail-value">{selected.free_months} شهر</span></div>
          <div className="detail-row" style={{ border: 0 }}><AlertCircle size={16} /><span className="detail-label">أيام الإيقاف</span><span className="detail-value">{selected.suspension_days} يوم</span></div>
        </Card>

        <Card padded style={{ borderRight: '4px solid #059669' }}>
          <div className="section-label" style={{ marginTop: 0, color: '#059669' }}>الحالة المالية</div>
          <div className="detail-row"><TrendingUp size={16} /><span className="detail-label">الأيام المحتسبة</span><span className="detail-value">{stats.billingDays} يوم</span></div>
          <div className="detail-row"><DollarSign size={16} /><span className="detail-label">الرسوم المحصلة</span><span className="detail-value">{(selected.collected_amount || 0).toFixed(3)} د.ك</span></div>
          <div className="detail-row" style={{ border: 0 }}><AlertCircle size={16} /><span className="detail-label">الرصيد المتبقي</span><span className="detail-value" style={{ fontWeight: 900, color: stats.remaining > 0 ? '#dc2626' : '#059669' }}>{stats.remaining.toFixed(3)} د.ك</span></div>
        </Card>

        {selected.has_file && (
          <button className="btn btn-outline" style={{ marginTop: '15px' }} onClick={() => fetchAndShowFile(selected)} disabled={loadingFile}>
            {loadingFile ? 'جاري التحميل...' : '👁️ عرض المرفقات'}
          </button>
        )}

        {canEdit && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={() => { setForm(selected); setView('form'); }} className="btn">تعديل البيانات</button>
            <button onClick={() => { if (confirm('حذف؟')) updateData('supervision', 'delete', null, selected.id); setView('list'); }} className="btn btn-danger" style={{ width: 'auto' }}>حذف</button>
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
        <PageHeader title={selected ? "تعديل إشراف" : "إضافة إشراف جديد"} actions={<button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button>} />
        <form onSubmit={handleSave}>
          <Card padded>
            <div className="form-group"><label className="form-label">المشروع / العقار</label><input className="form-input" required value={form.project_name || ''} onChange={e => setForm({ ...form, project_name: e.target.value })} placeholder="مثال: مطلع" /></div>
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
              <div className="form-group"><label className="form-label">قيمة العقد (شهرياً)</label><input type="number" className="form-input" required value={form.contract_value || ''} onChange={e => setForm({ ...form, contract_value: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">الأشهر المجانية</label><input type="number" className="form-input" value={form.free_months || ''} onChange={e => setForm({ ...form, free_months: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group"><label className="form-label">تاريخ البدء</label><input type="date" className="form-input" required value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">تاريخ الانتهاء (اختياري)</label><input type="date" className="form-input" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group"><label className="form-label">أيام الإيقاف</label><input type="number" className="form-input" value={form.suspension_days || ''} onChange={e => setForm({ ...form, suspension_days: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">المبلغ المحصل</label><input type="number" step="0.001" className="form-input" value={form.collected_amount || ''} onChange={e => setForm({ ...form, collected_amount: e.target.value })} /></div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <label className="form-label">المرفقات (صور الإشراف أو العقد) - يمكنك اختيار أكثر من ملف</label>
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
                } catch (err) { alert('فشل المعالجة: ' + err.message); }
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
        title="نظام الإشراف"
        actions={<><button onClick={handleExportPDF} className="icon-btn" disabled={isExporting}><Download size={20} /></button>{canEdit && <button onClick={() => { setForm({ start_date: new Date().toISOString().split('T')[0], free_months: 0, suspension_days: 0, collected_amount: 0 }); setSelected(null); setView('form'); }} className="btn btn-sm" style={{ width: 'auto' }}>+ جديد</button>}</>}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="بحث عن مشروع أو عميل..." />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        <select className="form-select btn-sm" style={{ width: 'auto', flexShrink: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط حالياً</option>
          <option value="expired">منتهي</option>
          <option value="due">عليه مستحقات</option>
        </select>
        <select className="form-select btn-sm" style={{ width: 'auto', flexShrink: 0 }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
          <option value="all">كل العملاء</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="list-group">
        {filtered.map(p => {
          const stats = calculateSupervisionStats(p);
          const client = getClient(p.client_id);
          return (
            <Card key={p.id} style={{ marginBottom: '16px', borderRight: stats.remaining > 0 ? '5px solid #dc2626' : '5px solid #059669' }} onClick={() => { setSelected(p); setView('detail'); }}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>{client.name} {p.plot_no && `• قسيمة ${p.plot_no}`}</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>{p.project_name}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: stats.remaining > 0 ? '#dc2626' : '#059669' }}>{stats.remaining.toFixed(3)}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>الرصيد د.ك</div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                    <TrendingUp size={14} /> {stats.billingDays} يوم محتسب
                  </div>
                  {stats.isExpired && <Badge status="منتهي" customCfg={{ bg: '#fee2e2', color: '#dc2626' }} />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fixed Landscape Report Template */}
      <div id="supervision-report-template" style={{ display: 'none', background: 'white', padding: '30px', direction: 'rtl', width: '280mm', minHeight: '190mm' }}>
        <style>{`
            .rep-table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
            .rep-table th, .rep-table td { border: 1px solid #000; padding: 5px 2px; text-align: center; font-size: 8.5px; word-wrap: break-word; }
            .rep-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .sum-box { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; gap: 25px; border: 1px solid #e2e8f0; }
         `}</style>

        <div className="rep-header">
          <div><h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>FRAME</h1><div style={{ fontSize: '11px' }}>فريم للاستشارات الهندسية</div></div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ textDecoration: 'underline', margin: 0, fontSize: '18px' }}>كشف متابعة عقود الإشراف</h2>
            <div style={{ fontSize: '11px', marginTop: '3px' }}>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
          </div>
          <div style={{ textAlign: 'left', fontSize: '11px' }}><div>نظام الإدارة</div><div>v2.0 Professional</div></div>
        </div>

        <div className="sum-box">
          <div><div style={{ fontSize: '10px', color: '#64748b' }}>المشاريع</div><div style={{ fontSize: '18px', fontWeight: 900 }}>{filtered.length}</div></div>
          <div><div style={{ fontSize: '10px', color: '#64748b' }}>إجمالي المستحقات</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>{filtered.reduce((acc, p) => acc + calculateSupervisionStats(p).remaining, 0).toFixed(3)} د.ك</div></div>
        </div>

        <table className="rep-table">
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ width: '25px' }}>م</th>
              <th style={{ width: '80px' }}>العميل</th>
              <th style={{ width: '60px' }}>القسيمة</th>
              <th style={{ width: '70px' }}>المشروع</th>
              <th style={{ width: '45px' }}>العقد</th>
              <th style={{ width: '60px' }}>البدء</th>
              <th style={{ width: '60px' }}>النهاية</th>
              <th style={{ width: '35px' }}>إيقاف</th>
              <th style={{ width: '40px' }}>الأيام</th>
              <th style={{ width: '40px' }}>اليومي</th>
              <th style={{ width: '60px' }}>المستحق</th>
              <th style={{ width: '60px' }}>المحصل</th>
              <th style={{ width: '60px' }}>المتبقي</th>
              <th style={{ width: '40px' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const s = calculateSupervisionStats(p);
              const cl = getClient(p.client_id);
              return (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{cl.name}</td>
                  <td>{p.plot_no || '—'}</td>
                  <td>{p.project_name}</td>
                  <td>{p.contract_value}</td>
                  <td>{p.start_date}</td>
                  <td>{p.end_date || 'مفتوح'}</td>
                  <td>{p.suspension_days}</td>
                  <td>{s.billingDays}</td>
                  <td>{s.dailyRate.toFixed(2)}</td>
                  <td style={{ fontWeight: 700 }}>{s.totalDue.toFixed(3)}</td>
                  <td>{(p.collected_amount || 0).toFixed(3)}</td>
                  <td style={{ fontWeight: 900, color: s.remaining > 0 ? '#dc2626' : '#059669' }}>{s.remaining.toFixed(3)}</td>
                  <td style={{ fontSize: '7px' }}>{s.isExpired ? 'منتهي' : 'نشط'}</td>
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
