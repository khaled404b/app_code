'use client';

import { useState, useMemo, memo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, Trash2, Paperclip, Search, SlidersHorizontal, Calendar, User
} from 'lucide-react';
import { ref as fRef, set as fSet } from 'firebase/database';
import { db as fDb } from '@/lib/firebase';
import { processAttachment } from '@/lib/fileHelper';
import { useRouter } from 'next/navigation';

// Use browser's crypto.randomUUID for better compatibility
const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const TaskRow = memo(({ task, onClick, clientName }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: 'var(--surface)', padding: '20px', borderRadius: '16px', 
      border: '1px solid var(--border)', cursor: 'pointer', boxShadow: 'var(--shadow)', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '12px', transition: 'all 0.2s'
    }}
  >
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
      <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Briefcase size={20} color="var(--blue)" />
      </div>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{task.title}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700, marginTop: '2px' }}>{clientName}</p>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
       <div style={{ 
         padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, 
         background: task.status === 'منجزة' ? 'var(--green-light)' : task.status === 'متأخرة' ? 'var(--red-light)' : 'var(--blue-light)',
         color: task.status === 'منجزة' ? 'var(--green)' : task.status === 'متأخرة' ? 'var(--red)' : 'var(--blue)'
       }}>
         {task.status}
       </div>
       <ArrowRight size={18} color="var(--text-3)" />
    </div>
  </div>
));

export default function TasksPage() {
  const { data, isLoading, updateData, addNotification } = useData();
  const { user, canEdit } = useAuth();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});
  const [tempFiles, setTempFiles] = useState([]);
  const [loadingFile, setLoadingFile] = useState(false);

  const tasks = useMemo(() => (data?.tasks || []), [data]);
  const clients = useMemo(() => (data?.clients || []), [data]);
  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) || 
      getClientName(t.client_id)?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search, clients]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.title) return alert('يرجى إدخال عنوان المهمة');

    const finalTask = {
      ...form,
      id: selected ? selected.id : generateId(),
      updates: selected ? (selected.updates || []) : [],
      created_by: selected ? (selected.created_by || '—') : (user?.name || '—'),
      created_at: selected ? (selected.created_at || new Date().toISOString()) : new Date().toISOString(),
      has_file: tempFiles.length > 0 || form.has_file || false
    };

    try {
      if (selected) await updateData('tasks', 'update', finalTask, selected.id);
      else {
        await updateData('tasks', 'add', finalTask);
        if (addNotification) {
          await addNotification('task', 'عمل جديد', `تم إضافة عمل: ${finalTask.title}`);
        }
      }

      if (tempFiles.length > 0) {
        await fSet(fRef(fDb, `attachments/${finalTask.id}`), JSON.stringify(tempFiles));
      }

      setView('list');
      setSelected(null);
      setTempFiles([]);
      setForm({});
    } catch (err) {
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    try {
      await updateData('tasks', 'delete', null, id);
      setView('list');
      setSelected(null);
    } catch (err) { alert('فشل الحذف'); }
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
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
           <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>الأعمال والمهام</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 700 }}>متابعة المشاريع الجارية والمكتملة</p>
           </div>
           {view === 'list' && canEdit && (
             <button 
               onClick={() => { setForm({ status: 'جارية' }); setView('form'); }}
               style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
             >
               <Plus size={18} /> إضافة عمل
             </button>
           )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input 
                style={{ width: '100%', padding: '15px 45px 15px 15px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                placeholder="ابحث عن عمل أو عميل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={20} color="var(--text-3)" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {filteredTasks.map(task => (
              <TaskRow key={task.id} task={task} clientName={getClientName(task.client_id)} onClick={() => { setSelected(task); setView('detail'); }} />
            ))}
            
            {filteredTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
                <Briefcase size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
                <p style={{ fontWeight: 800 }}>لا توجد أعمال لعرضها</p>
              </div>
            )}
          </>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selected && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
               <button onClick={() => setView('list')} style={{ background: 'var(--surface-2)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: 'var(--text)' }}>
                 <ArrowRight size={20} />
               </button>
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => { setForm(selected); setView('form'); }} style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>تعديل</button>
                 <button onClick={() => handleDelete(selected.id)} style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Trash2 size={18} /></button>
               </div>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 950, color: 'var(--text)', marginBottom: '8px' }}>{selected.title}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontWeight: 800, fontSize: '14px', marginBottom: '25px' }}>
               <User size={14} /> العميل: {getClientName(selected.client_id)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
               <div style={{ padding: '15px', background: 'var(--surface-2)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700, marginBottom: '5px' }}>الحالة</div>
                  <div style={{ fontWeight: 900, color: 'var(--blue)' }}>{selected.status}</div>
               </div>
               <div style={{ padding: '15px', background: 'var(--surface-2)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700, marginBottom: '5px' }}>التاريخ</div>
                  <div style={{ fontWeight: 900, color: 'var(--text)' }}>{selected.start_date || '—'}</div>
               </div>
            </div>

            <div>
               <h4 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <FileText size={18} /> الملاحظات
               </h4>
               <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '16px', color: 'var(--text-2)', fontSize: '15px', lineHeight: 1.6 }}>
                  {selected.notes || 'لا توجد ملاحظات إضافية لهذا العمل'}
               </div>
            </div>
          </div>
        )}

        {/* FORM VIEW */}
        {view === 'form' && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 950, margin: 0 }}>{selected ? 'تعديل العمل' : 'إضافة عمل جديد'}</h2>
                <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={24} /></button>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-2)' }}>عنوان العمل</label>
                   <input 
                     style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                     placeholder="مثال: ترخيص بناء قسيمة 7B"
                     value={form.title || ''}
                     onChange={e => setForm({...form, title: e.target.value})}
                   />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-2)' }}>العميل</label>
                   <select 
                     style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                     value={form.client_id || ''}
                     onChange={e => setForm({...form, client_id: e.target.value})}
                   >
                     <option value="">اختر العميل...</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-2)' }}>الحالة</label>
                      <select 
                        style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                        value={form.status || 'جارية'}
                        onChange={e => setForm({...form, status: e.target.value})}
                      >
                        <option value="جارية">جارية</option>
                        <option value="منجزة">منجزة</option>
                        <option value="متأخرة">متأخرة</option>
                        <option value="معلقة">معلقة</option>
                      </select>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-2)' }}>تاريخ البدء</label>
                      <input 
                        type="date"
                        style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                        value={form.start_date || ''}
                        onChange={e => setForm({...form, start_date: e.target.value})}
                      />
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-2)' }}>الملاحظات</label>
                   <textarea 
                     rows={4}
                     style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                     placeholder="اكتب ملاحظات العمل هنا..."
                     value={form.notes || ''}
                     onChange={e => setForm({...form, notes: e.target.value})}
                   />
                </div>

                <div style={{ border: '2px dashed var(--border)', borderRadius: '16px', padding: '25px', textAlign: 'center' }}>
                   <input type="file" multiple id="fileUpload" hidden onChange={handleFileUpload} />
                   <label htmlFor="fileUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      {loadingFile ? <Loader2 size={30} className="animate-spin" color="var(--blue)" /> : <Paperclip size={30} color="var(--blue)" />}
                      <span style={{ fontWeight: 900, color: 'var(--text-2)' }}>
                        {tempFiles.length > 0 ? `تم اختيار ${tempFiles.length} ملفات` : 'اضغط لإضافة صور أو ملفات'}
                      </span>
                   </label>
                </div>

                <button 
                  onClick={handleSave}
                  style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 950, fontSize: '17px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                >
                  {selected ? 'حفظ التعديلات' : 'إضافة العمل الآن'}
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
