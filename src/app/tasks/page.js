'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, Trash2, Paperclip, Search, 
  Download, History, MessageSquare, PlusCircle, Clock, User, CheckCircle2
} from 'lucide-react';
import { ref as fRef, set as fSet, get as fGet } from 'firebase/database';
import { db as fDb } from '@/lib/firebase';
import { processAttachment } from '@/lib/fileHelper';
import html2pdf from 'html2pdf.js';

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

  const tasks = useMemo(() => (data?.tasks || []), [data]);
  const clients = useMemo(() => (data?.clients || []), [data]);
  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) || 
      getClientName(t.client_id)?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search, clients]);

  // Fetch attachments when a task is selected
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
    const finalTask = {
      ...form,
      id: taskId,
      updates: selected ? (selected.updates || []) : [],
      created_by: selected ? (selected.created_by || '—') : (user?.name || '—'),
      created_at: selected ? (selected.created_at || new Date().toISOString()) : new Date().toISOString(),
      has_file: tempFiles.length > 0 || existingFiles.length > 0 || false
    };

    try {
      if (selected) await updateData('tasks', 'update', finalTask, selected.id);
      else {
        await updateData('tasks', 'add', finalTask);
        if (addNotification) await addNotification('task', 'عمل جديد', `تم إضافة عمل: ${finalTask.title}`);
      }

      if (tempFiles.length > 0) {
        const allFiles = [...existingFiles, ...tempFiles];
        await fSet(fRef(fDb, `attachments/${taskId}`), JSON.stringify(allFiles));
      }

      setView('list');
      setSelected(null);
      setTempFiles([]);
      setForm({});
    } catch (err) {
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return;
    const newUpdate = {
      id: generateId(),
      text: updateText,
      user: user?.name || 'مجهول',
      date: new Date().toISOString()
    };
    const updatedTask = { ...selected, updates: [newUpdate, ...(selected.updates || [])] };
    try {
      await updateData('tasks', 'update', updatedTask, selected.id);
      setSelected(updatedTask);
      setUpdateText('');
    } catch (err) { alert('فشل إضافة التحديث'); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoadingFile(true);
    try {
      const processed = await Promise.all(files.map(file => processAttachment(file)));
      setTempFiles(prev => [...prev, ...processed]);
    } catch (err) {
      alert('فشل معالجة الملفات');
    } finally {
      setLoadingFile(false);
    }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader2 className="animate-spin" size={32} color="var(--blue)" />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '20px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
           <h1 style={{ fontSize: '24px', fontWeight: 950, color: 'var(--text)', margin: 0 }}>متابعة الأعمال</h1>
           {view === 'list' && (
             <button onClick={() => { setForm({ status: 'جارية' }); setView('form'); setSelected(null); setTempFiles([]); }} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <Plus size={18} /> إضافة عمل
             </button>
           )}
           {view !== 'list' && (
             <button onClick={() => setView('list')} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 15px', borderRadius: '12px', fontWeight: 800, color: 'var(--text)', cursor: 'pointer' }}>العودة للقائمة</button>
           )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input style={{ width: '100%', padding: '15px 45px 15px 15px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
              <Search size={20} color="var(--text-3)" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            {filteredTasks.map(task => (
              <div key={task.id} onClick={() => { setSelected(task); setView('detail'); }} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={20} color="var(--blue)" /></div>
                  <div><h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{task.title}</h3><p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700 }}>{getClientName(task.client_id)}</p></div>
                </div>
                <ArrowRight size={18} color="var(--text-3)" />
              </div>
            ))}
          </>
        )}

        {/* FORM VIEW */}
        {view === 'form' && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 950, marginBottom: '20px' }}>{selected ? 'تعديل العمل' : 'إضافة عمل جديد'}</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="عنوان العمل..." value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                <select style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} value={form.client_id || ''} onChange={e => setForm({...form, client_id: e.target.value})}>
                  <option value="">اختر العميل...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                
                {/* ATTACHMENTS IN FORM */}
                <div style={{ border: '2px dashed var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                   <input type="file" multiple id="fileAdd" hidden onChange={handleFileUpload} />
                   <label htmlFor="fileAdd" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      {loadingFile ? <Loader2 size={24} className="animate-spin" /> : <Paperclip size={24} color="var(--blue)" />}
                      <span style={{ fontWeight: 900, fontSize: '13px' }}>إرفاق ملفات أو صور</span>
                   </label>
                   {tempFiles.length > 0 && (
                     <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {tempFiles.map((f, i) => <div key={i} style={{ padding: '5px 10px', background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>مرفق {i+1}</div>)}
                     </div>
                   )}
                </div>

                <button onClick={handleSave} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 950, fontSize: '17px', cursor: 'pointer' }}>حفظ العمل والمرفقات</button>
             </div>
          </div>
        )}

        {/* DETAIL VIEW WITH UPDATES TIMELINE */}
        {view === 'detail' && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 950, color: 'var(--text)', marginBottom: '5px' }}>{selected.title}</h2>
                <p style={{ fontWeight: 800, color: 'var(--blue)', marginBottom: '20px' }}>{getClientName(selected.client_id)}</p>
                
                <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '12px', color: 'var(--text-2)', marginBottom: '20px' }}>{selected.notes || 'لا توجد ملاحظات أساسية'}</div>
                
                {/* ATTACHMENTS DISPLAY */}
                {existingFiles.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                     <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '10px' }}>المرفقات</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                        {existingFiles.map((f, i) => (
                           <div key={i} onClick={() => window.open(f, '_blank')} style={{ height: '80px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', overflow: 'hidden' }}>
                              {f.startsWith('data:image') ? <img src={f} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} /></div>}
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>

             {/* UPDATES TIMELINE SECTION */}
             <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 950, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={20} color="var(--blue)" /> سجل التحديثات والمتابعة
                </h3>

                {/* Add New Update */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                   <textarea style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', resize: 'none' }} rows={2} placeholder="أضف تحديثاً جديداً لمسار العمل..." value={updateText} onChange={e => setUpdateText(e.target.value)} />
                   <button onClick={handleAddUpdate} style={{ background: 'var(--blue)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={20} /></button>
                </div>

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '2px solid var(--border)', paddingRight: '20px' }}>
                   {(selected.updates || []).map((up, i) => (
                     <div key={up.id} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', right: '-27px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--blue)', border: '3px solid var(--surface)' }} />
                        <div style={{ background: 'var(--surface-2)', padding: '15px', borderRadius: '12px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text)' }}>{up.user}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700 }}>{new Date(up.date).toLocaleDateString('ar-EG')}</span>
                           </div>
                           <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0 }}>{up.text}</p>
                        </div>
                     </div>
                   ))}
                   {(selected.updates || []).length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-3)', fontWeight: 700 }}>لا توجد تحديثات مسجلة بعد</p>}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
