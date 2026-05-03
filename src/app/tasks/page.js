'use client';

import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, Trash2, Paperclip, Search, 
  Download, History, MessageSquare, PlusCircle, Clock, User, CheckCircle2,
  FileCheck, Info, AlertCircle, PauseCircle, PlayCircle
} from 'lucide-react';
import { ref as fRef, set as fSet, get as fGet } from 'firebase/database';
import { db as fDb } from '@/lib/firebase';
import { processAttachment } from '@/lib/fileHelper';

// Version: 1.0.7 - Restored Missing Elements
const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function TasksPage() {
  const { data, isLoading, updateData, addNotification } = useData();
  const { user, canEdit } = useAuth();
  
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});
  const [tempFiles, setTempFiles] = useState([]);
  const [loadingFile, setLoadingFile] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [existingFiles, setExistingFiles] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [reportFiles, setReportFiles] = useState({}); 
  
  const reportRef = useRef();

  const tasks = useMemo(() => (data?.tasks || []), [data]);
  const clients = useMemo(() => (data?.clients || []), [data]);
  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';
  const getClientPlots = (id) => clients.find(c => c.id === id)?.plots || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) || 
      getClientName(t.client_id)?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search, clients]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status === 'منجزة').length;
    const active = filteredTasks.filter(t => t.status === 'جارية').length;
    return { total, done, active, percent: total > 0 ? Math.round((done/total)*100) : 0 };
  }, [filteredTasks]);

  useEffect(() => {
    if (selected && selected.id) {
      fGet(fRef(fDb, `attachments/${selected.id}`)).then(snap => {
        if (snap.exists()) setExistingFiles(JSON.parse(snap.val()));
        else setExistingFiles([]);
      });
    }
  }, [selected]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.title) return alert('يرجى إدخال عنوان المهمة');
    const taskId = selected ? selected.id : generateId();
    const finalTask = { ...form, id: taskId, updates: selected ? (selected.updates || []) : [], created_by: selected ? (selected.created_by || '—') : (user?.name || '—'), created_at: selected ? (selected.created_at || new Date().toISOString()) : new Date().toISOString(), has_file: tempFiles.length > 0 || existingFiles.length > 0 || false };
    try {
      if (selected) await updateData('tasks', 'update', finalTask, selected.id);
      else { await updateData('tasks', 'add', finalTask); if (addNotification) await addNotification('task', 'عمل جديد', `تم إضافة عمل: ${finalTask.title}`); }
      if (tempFiles.length > 0) { const allFiles = [...existingFiles, ...tempFiles]; await fSet(fRef(fDb, `attachments/${taskId}`), JSON.stringify(allFiles)); }
      setView('list'); setSelected(null); setTempFiles([]); setForm({});
    } catch (err) { alert('فشل الحفظ'); }
  };

  const handleStatusQuickChange = async (newStatus) => {
    if (!selected) return;
    const updatedTask = { ...selected, status: newStatus };
    try { await updateData('tasks', 'update', updatedTask, selected.id); setSelected(updatedTask); if (addNotification) await addNotification('task', 'تحديث حالة', `تغيرت حالة "${selected.title}" إلى ${newStatus}`); } catch (err) { alert('فشل تغيير الحالة'); }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const html2pdf = (await import('html2pdf.js')).default;
    if (includeFiles) {
      const fileData = {};
      const tasksWithFiles = filteredTasks.filter(t => t.has_file);
      await Promise.all(tasksWithFiles.map(async (t) => {
        const snap = await fGet(fRef(fDb, `attachments/${t.id}`));
        if (snap.exists()) fileData[t.id] = JSON.parse(snap.val());
      }));
      setReportFiles(fileData);
    }
    setTimeout(() => {
      const element = reportRef.current;
      const opt = { 
        margin: 10, 
        filename: `تقرير_فريم_${new Date().toLocaleDateString('ar-EG')}.pdf`, 
        image: { type: 'jpeg', quality: 1 }, 
        html2canvas: { scale: 3, useCORS: true, letterRendering: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, 
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } 
      };
      html2pdf().set(opt).from(element).save().then(() => { setIsExporting(false); setReportFiles({}); });
    }, 1500);
  };

  const handleFileAction = (base64Data) => {
    if (!base64Data) return;
    if (!base64Data.startsWith('data:')) { window.open(base64Data, '_blank'); return; }
    try {
      const parts = base64Data.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const uArr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) uArr[i] = raw.charCodeAt(i);
      const blob = new Blob([uArr], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url; link.target = '_blank';
      if (contentType.includes('image')) link.download = `img_${Date.now()}.png`;
      else if (contentType.includes('pdf')) link.download = `doc_${Date.now()}.pdf`;
      link.click(); document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { window.open(base64Data, '_blank'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    try { await updateData('tasks', 'delete', null, id); setView('list'); setSelected(null); } catch (err) { alert('فشل الحذف'); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoadingFile(true);
    try {
      const processed = await Promise.all(files.map(file => processAttachment(file)));
      setTempFiles(prev => [...prev, ...processed]);
    } catch (err) { alert('فشل معالجة الملفات'); } finally { setLoadingFile(false); }
  };

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return;
    const newUpdate = { id: generateId(), text: updateText, user: user?.name || 'مجهول', date: new Date().toISOString() };
    const updatedTask = { ...selected, updates: [newUpdate, ...(selected.updates || [])] };
    await updateData('tasks', 'update', updatedTask, selected.id);
    setSelected(updatedTask); setUpdateText('');
  };

  const bidiStyle = { unicodeBidi: 'plaintext', textAlign: 'right', direction: 'rtl' };

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><Loader2 className="animate-spin" size={32} color="var(--blue)" /></div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '20px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* APP HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
           <div><h1 style={{ fontSize: '24px', fontWeight: 950, color: 'var(--text)', margin: 0 }}>متابعة الأعمال</h1><p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 700 }}>نظام فريم لإدارة المشاريع</p></div>
           {view === 'list' && (
             <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleExportPDF} disabled={isExporting} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 15px', borderRadius: '12px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isExporting ? 0.5 : 1 }}>
                  {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} التقرير
                </button>
                {canEdit && <button onClick={() => { setForm({ status: 'جارية' }); setView('form'); setSelected(null); setTempFiles([]); }} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Plus size={18} /> إضافة عمل</button>}
             </div>
           )}
           {view !== 'list' && <button onClick={() => setView('list')} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 15px', borderRadius: '12px', fontWeight: 800, color: 'var(--text)', cursor: 'pointer' }}>العودة للقائمة</button>}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input style={{ width: '100%', padding: '15px 45px 15px 15px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
                <Search size={20} color="var(--text-3)" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '10px 15px', borderRadius: '12px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                 <input type="checkbox" checked={includeFiles} onChange={e => setIncludeFiles(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                 <span style={{ fontSize: '11px', fontWeight: 800 }}>المرفقات بالتقرير</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTasks.map(task => (
                <div key={task.id} onClick={() => { setSelected(task); setView('detail'); }} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={20} color="var(--blue)" /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)', margin: 0, ...bidiStyle }}>{task.title}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700, ...bidiStyle }}>{getClientName(task.client_id)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, background: task.status === 'منجزة' ? 'var(--green-light)' : task.status === 'متأخرة' ? 'var(--red-light)' : 'var(--blue-light)', color: task.status === 'منجزة' ? 'var(--green)' : task.status === 'متأخرة' ? 'var(--red)' : 'var(--blue)' }}>{task.status || 'جارية'}</div>
                     <ArrowRight size={18} color="var(--text-3)" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                   <div>
                     <h2 style={{ fontSize: '22px', fontWeight: 950, color: 'var(--text)', margin: 0, ...bidiStyle }}>{selected.title}</h2>
                     <p style={{ fontWeight: 800, color: 'var(--blue)', marginTop: '4px', ...bidiStyle }}>{getClientName(selected.client_id)} {selected.plot_number ? `| قسيمة: ${selected.plot_number}` : ''}</p>
                   </div>
                   <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => { setForm(selected); setView('form'); }} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', color: 'var(--text)' }}>تعديل</button><button onClick={() => handleDelete(selected.id)} style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}><Trash2 size={16} /></button></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '25px' }}>
                   {[{ label: 'منجزة', color: 'var(--green)', icon: CheckCircle2 }, { label: 'جارية', color: 'var(--blue)', icon: PlayCircle }, { label: 'متأخرة', color: 'var(--red)', icon: AlertCircle }, { label: 'معلقة', color: 'var(--orange)', icon: PauseCircle }].map(s => (
                     <button key={s.label} onClick={() => handleStatusQuickChange(s.label)} style={{ padding: '10px 5px', borderRadius: '10px', border: selected.status === s.label ? `2px solid ${s.color}` : '1px solid var(--border)', background: selected.status === s.label ? `${s.color}15` : 'var(--surface)', color: s.color, fontWeight: 900, fontSize: '11px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><s.icon size={16} /> {s.label}</button>
                   ))}
                </div>
                <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '16px', color: 'var(--text-2)', fontSize: '14px', marginBottom: '20px', ...bidiStyle }}>{selected.notes || 'لا توجد ملاحظات أساسية'}</div>
                {existingFiles.length > 0 && <div style={{ marginTop: '20px' }}><h4 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '10px' }}>المرفقات ({existingFiles.length})</h4><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>{existingFiles.map((f, i) => (<div key={i} onClick={() => handleFileAction(f)} style={{ height: '80px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.startsWith('data:image') ? <img src={f} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={24} color="var(--blue)" />}</div>))}</div></div>}
             </div>
             <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 950, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><History size={20} color="var(--blue)" /> سجل المتابعة</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}><textarea style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', resize: 'none' }} rows={2} placeholder="أضف تحديثاً..." value={updateText} onChange={e => setUpdateText(e.target.value)} /><button onClick={handleAddUpdate} style={{ background: 'var(--blue)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={20} /></button></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {(selected.updates || []).map((up, i) => (
                     <div key={up.id} style={{ background: 'var(--surface-2)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                           <div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> <span>{up.user}</span></div>
                           <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 800 }}>{new Date(up.date).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6', ...bidiStyle }}>{up.text}</div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* FORM VIEW */}
        {view === 'form' && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 950, marginBottom: '20px' }}>{selected ? 'تعديل العمل' : 'إضافة عمل جديد'}</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="العنوان..." value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <select style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} value={form.client_id || ''} onChange={e => setForm({...form, client_id: e.target.value, plot_number: ''})}><option value="">اختر العميل...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <select style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} value={form.plot_number || ''} onChange={e => setForm({...form, plot_number: e.target.value})} disabled={!form.client_id}><option value="">اختر القسيمة...</option>{getClientPlots(form.client_id).map((p, i) => <option key={i} value={p.number}>قسيمة {p.number}</option>)}</select>
                </div>
                <textarea rows={4} style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="ملاحظات..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} />
                <div style={{ border: '2px dashed var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}><input type="file" multiple id="fileZZ" hidden onChange={handleFileUpload} /><label htmlFor="fileZZ" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>{loadingFile ? <Loader2 size={24} className="animate-spin" /> : <Paperclip size={24} color="var(--blue)" />}<span style={{ fontWeight: 900, fontSize: '13px' }}>إرفاق مرفقات</span></label></div>
                <button onClick={handleSave} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 950, fontSize: '17px', cursor: 'pointer' }}>حفظ</button>
             </div>
          </div>
        )}

        {/* --- THE PDF REPORT --- */}
        <div style={{ display: 'none' }}>
           <div ref={reportRef} style={{ padding: '20mm', background: '#fff', color: '#000', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
              <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div><h1 style={{ color: '#2563eb', margin: 0, fontSize: '26px', fontWeight: 900 }}>مكتب فريم الهندسي</h1><p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#64748b' }}>تقرير متابعة الأعمال | {new Date().toLocaleDateString('ar-EG')}</p></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                {filteredTasks.map((task, i) => (
                  <div key={task.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '15px', padding: '25px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                       <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ background: '#2563eb', color: '#fff', padding: '2px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '14px' }}>{i + 1}</span>
                          <span style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b', unicodeBidi: 'plaintext' }}>{task.title}</span>
                       </div>
                       <span style={{ fontSize: '13px', fontWeight: 800, padding: '4px 12px', background: '#f1f5f9', borderRadius: '20px', color: '#2563eb' }}>{task.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px', fontWeight: 700 }}>العميل: {getClientName(task.client_id)} {task.plot_number ? ` | قسيمة: ${task.plot_number}` : ''}</div>
                    <div style={{ fontSize: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', marginBottom: '15px', borderRight: '4px solid #2563eb', color: '#000', unicodeBidi: 'plaintext', lineHeight: '1.6' }}>
                       <div style={{ fontWeight: 900, marginBottom: '6px', color: '#475569', fontSize: '12px' }}>الملاحظات الأساسية:</div>
                       <div style={{ whiteSpace: 'pre-wrap' }}>{task.notes || 'لا توجد ملاحظات'}</div>
                    </div>
                    {task.updates?.length > 0 && (
                      <div style={{ marginTop: '10px', padding: '15px', background: '#f1f5f9', borderRadius: '10px' }}>
                         <div style={{ fontSize: '13px', fontWeight: 900, marginBottom: '10px', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>📝 سجل المتابعة:</div>
                         {task.updates.map((up, j) => (<div key={j} style={{ fontSize: '12px', marginBottom: '8px', paddingBottom: '5px', borderBottom: j === task.updates.length - 1 ? 'none' : '1px solid #e2e8f0', unicodeBidi: 'plaintext' }}><span style={{ fontWeight: 900, color: '#2563eb' }}>{up.user}: </span><span>{up.text}</span></div>))}
                      </div>
                    )}
                    {includeFiles && reportFiles[task.id] && reportFiles[task.id].length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ fontWeight: 900, fontSize: '12px', marginBottom: '10px', color: '#64748b' }}>📸 المرفقات الصورية:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>{reportFiles[task.id].filter(f => f.startsWith('data:image')).map((file, idx) => (<div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', height: '150px' }}><img src={file} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
