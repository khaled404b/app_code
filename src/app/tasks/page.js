'use client';

import { useState, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, ArrowRight, Download, SlidersHorizontal, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ref as fRef, set as fSet } from 'firebase/database';
import { db as fDb } from '@/lib/firebase';
import { processAttachment } from '@/lib/fileHelper';

import { STATUS_CFG } from '@/constants/config';
import { Badge, Card, PageHeader, SearchBar } from '@/components/ui';
import { useTasks } from '@/hooks/useTasks';

function TasksContent() {
  const { data, isLoading, updateData } = useData();
  const { canEdit, user } = useAuth();
  
  const tasks = (data && data.tasks) || [];
  const clients = (data && data.clients) || [];
  const clientName = (id) => clients.find(c => c.id === id)?.name || '—';
  const getClient = (id) => clients.find(c => c.id === id) || {};

  const { filters, setF, filteredTasks: filtered, setFilters } = useTasks(tasks, clients);
  
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [updateText, setUpdateText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  const [loadingFile, setLoadingFile] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const finalTask = { 
      ...form, 
      id: selected ? selected.id : uuidv4(), 
      updates: selected ? (selected.updates || []) : [], 
      created_by: selected ? (selected.created_by || '—') : (user && user.name) || '—', 
      created_at: selected ? (selected.created_at || new Date().toISOString()) : new Date().toISOString(),
      has_file: tempFiles.length > 0 || form.has_file
    };
    
    if (selected) await updateData('tasks', 'update', finalTask, selected.id);
    else await updateData('tasks', 'add', finalTask);
    
    if (tempFiles.length > 0) {
      fSet(fRef(fDb, `attachments/${finalTask.id}`), JSON.stringify(tempFiles));
    }
    
    setView('list'); setSelected(null); setTempFiles([]);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    try {
      await updateData('tasks', 'delete', null, id);
      fSet(fRef(fDb, `attachments/${id}`), null);
      setSelected(null); setView('list');
    } catch (err) { alert('فشل الحذف'); }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ تحذير: سيتم حذف جميع الأعمال نهائياً!')) return;
    const confirmText = prompt('اكتب "حذف الكل" للتأكيد:');
    if (confirmText !== 'حذف الكل') return;
    try {
      await fSet(fRef(fDb, 'tasks'), []);
      alert('تم الحذف بنجاح');
      setView('list');
    } catch (err) { alert('فشل المسح الشامل'); }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    const newUpdate = { id: uuidv4(), text: updateText, user: (user && user.name) || '—', date: new Date().toISOString() };
    const updatedTask = { ...selected, updates: [newUpdate, ...(selected.updates || [])] };
    await updateData('tasks', 'update', updatedTask, selected.id);
    setSelected(updatedTask); setUpdateText(''); setView('detail');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('report-template');
      element.style.display = 'block';
      await html2pdf().from(element).set({ 
        margin: [10, 5, 10, 5], 
        filename: `Works-Report-${Date.now()}.pdf`, 
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
      }).save();
      element.style.display = 'none';
    } catch (e) { alert('فشل التصدير'); }
    setIsExporting(false);
  };

  const fetchAndShowFile = async (item) => {
    setLoadingFile(true);
    try {
      const { ref, get } = await import('firebase/database');
      const { db } = await import('@/lib/firebase');
      const { parseAttachment } = await import('@/lib/fileHelper');
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
      
      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>مرفقات العمل - ${item.title}</title>
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
    const cfg = STATUS_CFG.TASKS[selected.status] || STATUS_CFG.TASKS['جارية'];
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button><h1 className="page-title">التفاصيل</h1>{canEdit && <button onClick={() => { setForm({...selected}); setView('form'); }} className="btn btn-ghost btn-sm" style={{ marginRight: 'auto', width: 'auto' }}>تعديل</button>}</div>
        <div style={{ background: cfg.color, borderRadius: '25px', padding: '30px', marginBottom: '20px', color: 'white' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.9 }}>{selected.status}</div><h2 style={{ fontSize: '24px', fontWeight: 900, marginTop: '8px' }}>{selected.title}</h2></div></div></div>
        <Card padded style={{ marginBottom: '16px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}><div><div style={{ fontSize: '11px', color: '#94a3b8' }}>العميل</div><div style={{ fontSize: '14px', fontWeight: 700 }}>{clientName(selected.client_id)}</div></div><div><div style={{ fontSize: '11px', color: '#94a3b8' }}>القسيمة</div><div style={{ fontSize: '14px', fontWeight: 700 }}>{selected.plot_no || '—'}</div></div></div></Card>
        {selected.has_file && (
          <button className="btn btn-outline" style={{ marginBottom: '16px' }} onClick={() => fetchAndShowFile(selected)} disabled={loadingFile}>
            {loadingFile ? 'جاري التحميل...' : '👁️ عرض المرفقات'}
          </button>
        )}
        {canEdit && <button className="btn btn-danger" style={{ marginBottom: '16px', background: 'none', border: '1px solid #fee2e2', color: '#dc2626' }} onClick={() => handleDelete(selected.id)}><Trash2 size={16} /> حذف هذا العمل</button>}
        {selected.notes && <Card padded style={{ borderRight: '4px solid #cbd5e1', marginBottom: '24px' }}><div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>الملاحظات</div><p style={{ fontSize: '15px', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.notes}</p></Card>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{ fontSize: '18px', fontWeight: 900 }}>سجل التعديلات</h3><button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => setView('update')}>+ إضافة تعديل</button></div>
        {(selected.updates || []).map(up => <Card key={up.id} padded style={{ marginBottom: '12px', borderRight: '4px solid #2563eb' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}><span style={{ fontWeight: 800, color: '#2563eb' }}>{up.user}</span><span style={{ color: '#94a3b8' }}>{new Date(up.date).toLocaleDateString('ar-EG')}</span></div><p style={{ fontSize: '14px' }}>{up.text}</p></Card>)}
      </div>
    );
  }

  if (view === 'update') return (
    <div className="page"><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><button onClick={() => setView('detail')} className="icon-btn"><ArrowRight size={20} /></button><h1 className="page-title">توثيق تعديل</h1></div><form onSubmit={handleAddUpdate}><Card padded><textarea className="form-input" rows={8} required value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="اكتب تفاصيل التعديل..." style={{ resize: 'none' }} /></Card><button type="submit" className="btn" style={{ marginTop: '20px' }}>حفظ التعديل</button></form></div>
  );

  if (view === 'form') {
    const selClient = getClient(form.client_id);
    const availablePlots = selClient?.plots || [];
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><button onClick={() => setView(selected ? 'detail' : 'list')} className="icon-btn"><ArrowRight size={20} /></button><h1 className="page-title">{selected ? 'تعديل' : 'إضافة عمل'}</h1></div>
        <form onSubmit={handleSave}>
          <Card padded>
            <div className="form-group"><label className="form-label">موضوع العمل (العنوان)</label><input className="form-input" required value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">العميل</label><select className="form-select" required value={form.client_id || ''} onChange={e => setForm(p => ({ ...p, client_id: e.target.value, plot_no: '' }))}><option value="">اختر العميل...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group">
              <label className="form-label">رقم القسيمة / الموقع</label>
              <select className="form-select" required value={form.plot_no || ''} onChange={e => setForm(p => ({ ...p, plot_no: e.target.value }))}>
                <option value="">اختر القسيمة...</option>
                {availablePlots.filter(Boolean).map((pl, i) => {
                  const label = typeof pl === 'object' ? `${pl.number} ${pl.location ? `(${pl.location})` : ''}` : pl;
                  const value = typeof pl === 'object' ? pl.number : pl;
                  return <option key={i} value={value}>{label}</option>;
                })}
              </select>
            </div>
            <div className="form-group"><label className="form-label">الحالة</label><select className="form-select" value={form.status || 'جارية'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>{Object.keys(STATUS_CFG.TASKS).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">تاريخ البدء</label><input type="date" className="form-input" value={form.start_date || ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">الملاحظات</label><textarea className="form-input" rows={4} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <label className="form-label">المرفقات (صور العمل أو تقارير) - يمكنك اختيار أكثر من ملف</label>
              <input type="file" multiple style={{ display: 'none' }} id="task-files" accept="image/*,.pdf" onChange={async e => {
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
                } catch(err) { alert('فشل المعالجة: ' + err.message); }
              }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {tempFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>مرفق #{i+1}</span>
                    <button type="button" onClick={() => {
                      const newFiles = tempFiles.filter((_, idx) => idx !== i);
                      setTempFiles(newFiles);
                      if (newFiles.length === 0 && !form.has_file) setForm(p => ({ ...p, has_file: false }));
                    }} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>حذف</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById('task-files').click()}>+ إضافة مرفقات</button>
              </div>
              {form.has_file && tempFiles.length === 0 && <div style={{ marginTop: '10px', fontSize: '11px', color: '#059669', fontWeight: 800 }}>✓ يوجد مرفقات سابقة</div>}
            </div>
          </Card>
          <button type="submit" className="btn" style={{ marginTop: '20px' }}>حفظ</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="الأعمال" actions={<>
        <button className="icon-btn" onClick={handleExportPDF} disabled={isExporting}>{isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}</button>
        {canEdit && tasks.length > 0 && <button className="icon-btn" style={{ color: '#dc2626' }} onClick={handleClearAll} title="مسح الكل"><Trash2 size={20} /></button>}
        {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => { setForm({ title: '', client_id: '', status: 'جارية', start_date: new Date().toISOString().split('T')[0] }); setSelected(null); setView('form'); }}>+ جديد</button>}
      </>} />
      <SearchBar value={filters.search} onChange={v => setF('search', v)} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>{['الكل', ...Object.keys(STATUS_CFG.TASKS)].map(s => <button key={s} className={`pill ${filters.status === s ? 'active' : ''}`} onClick={() => setF('status', s)}>{s}</button>)}</div>
      <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '12px', marginBottom: '12px', width: '100%', fontSize: '14px', fontWeight: 800 }}><SlidersHorizontal size={16} /> فلاتر وتصنيف <ChevronDown size={16} style={{ marginRight: 'auto', transform: showFilters ? 'rotate(180deg)' : 'none' }} /></button>
      {showFilters && <Card padded style={{ marginBottom: '15px' }}><div className="form-group"><label className="form-label">العميل</label><select className="form-select" value={filters.client} onChange={e => setF('client', e.target.value)}><option value="الكل">كل العملاء</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}><div><label className="form-label">من تاريخ بدء</label><input type="date" className="form-input" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)} /></div><div><label className="form-label">إلى تاريخ بدء</label><input type="date" className="form-input" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)} /></div></div><div className="form-group"><label className="form-label">ترتيب حسب</label><select className="form-select" value={filters.sort} onChange={e => setF('sort', e.target.value)}><option value="priority">الأولوية</option><option value="desc">الأحدث</option><option value="asc">الأقدم</option></select></div></Card>}
      <div className="list-group">
        {filtered.map(t => (
          <div key={t.id} className="list-row" onClick={() => { setSelected(t); setView('detail'); }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {clientName(t.client_id)} 
                {t.plot_no && ` • قسيمة ${t.plot_no}`} 
                • {t.start_date || '—'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}><Badge status={t.status} type="TASKS" />{(t.updates || []).length > 0 && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 800 }}>({t.updates.length}) تعديلات</span>}</div>
            </div>
            <ChevronLeft size={18} color="#cbd5e1" />
          </div>
        ))}
      </div>
      {/* Hidden Report Template for PDF */}
      <div id="report-template" style={{ display: 'none', background: 'white', padding: '40px', direction: 'rtl', width: '297mm' }}>
        <style>{`
          .task-rep-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .task-rep-table th, .task-rep-table td { border: 1px solid #000; padding: 10px; text-align: center; font-size: 11px; }
          .task-rep-header { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
          .task-sum-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; gap: 40px; border: 1px solid #e2e8f0; }
        `}</style>
        
        <div className="task-rep-header">
          <div><h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>FRAME</h1><div style={{ fontSize: '12px' }}>فريم للاستشارات الهندسية</div></div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ textDecoration: 'underline', margin: 0 }}>تقرير متابعة سير الأعمال</h2>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
          </div>
          <div style={{ textAlign: 'left', fontSize: '12px' }}><div>نظام الإدارة</div><div>v2.0 Professional</div></div>
        </div>

        <div className="task-sum-box">
          <div><div style={{ fontSize: '12px', color: '#64748b' }}>إجمالي الأعمال</div><div style={{ fontSize: '20px', fontWeight: 900 }}>{filtered.length}</div></div>
          <div><div style={{ fontSize: '12px', color: '#64748b' }}>أعمال منجزة</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>{filtered.filter(t => t.status === 'منجزة').length}</div></div>
          <div><div style={{ fontSize: '12px', color: '#64748b' }}>أعمال جارية</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>{filtered.filter(t => t.status === 'جارية').length}</div></div>
        </div>

        <table className="task-rep-table">
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ width: '5%' }}>م</th>
              <th style={{ width: '20%' }}>العميل / القسيمة</th>
              <th>موضوع العمل (البيان)</th>
              <th style={{ width: '12%' }}>تاريخ البدء</th>
              <th style={{ width: '12%' }}>الحالة</th>
              <th style={{ width: '25%' }}>آخر التحديثات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, idx) => {
              return (
                <tr key={t.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{clientName(t.client_id)}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{t.plot_no ? `قسيمة: ${t.plot_no}` : ''}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{t.title}</td>
                  <td>{t.start_date}</td>
                  <td style={{ fontWeight: 800, color: t.status === 'منجزة' ? '#059669' : t.status === 'متأخرة' ? '#dc2626' : '#2563eb' }}>{t.status}</td>
                  <td style={{ textAlign: 'right', fontSize: '9px' }}>{t.updates?.[0]?.text || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return <TasksContent />;
}
