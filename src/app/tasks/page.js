'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChevronLeft, ArrowRight, Download, SlidersHorizontal, 
  ChevronDown, Loader2, Trash2, Plus, X, FileText, 
  Calendar, User, MessageSquare, Paperclip, Send, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { ref as fRef, set as fSet } from 'firebase/database';
import { db as fDb } from '@/lib/firebase';
import { processAttachment } from '@/lib/fileHelper';

import { STATUS_CFG } from '@/constants/config';
import { Badge, Card, PageHeader, SearchBar } from '@/components/ui';
import { useTasks } from '@/hooks/useTasks';

// Browser-safe ID generator
const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

function TasksPage() {
  const { data, isLoading, updateData, addNotification } = useData();
  const { canEdit, user } = useAuth();
  
  const tasks = useMemo(() => (data && data.tasks) || [], [data]);
  const clients = useMemo(() => (data && data.clients) || [], [data]);
  const clientName = (id) => clients.find(c => c.id === id)?.name || '—';
  
  const { filters, setF, filteredTasks: filtered, setFilters } = useTasks(tasks, clients);
  
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [updateText, setUpdateText] = useState('');
  const [tempFiles, setTempFiles] = useState([]); 
  const [loadingFile, setLoadingFile] = useState(false);

  // Handle Save with Fixes
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.title) return alert('يرجى إدخال عنوان العمل');

    const finalTask = { 
      ...form, 
      id: selected ? selected.id : generateId(), 
      updates: selected ? (selected.updates || []) : [], 
      created_by: selected ? (selected.created_by || '—') : (user && user.name) || '—', 
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
    } catch (err) {
      console.error(err);
      alert('فشل حفظ المهمة: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    try {
      await updateData('tasks', 'delete', null, id);
      await fSet(fRef(fDb, `attachments/${id}`), null);
      setSelected(null); 
      setView('list');
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
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
           <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>سجل الأعمال</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 700 }}>إدارة ومتابعة مهام المكتب</p>
           </div>
           {view === 'list' && canEdit && (
             <button 
               onClick={() => { setForm({ status: 'جارية', priority: 'عادية' }); setView('form'); }}
               style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
             >
               <Plus size={18} /> إضافة عمل
             </button>
           )}
           {view !== 'list' && (
             <button 
               onClick={() => { setView('list'); setSelected(null); }}
               style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 15px', borderRadius: '12px', fontWeight: 800, color: 'var(--text)', cursor: 'pointer' }}
             >
               العودة للقائمة
             </button>
           )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <SearchBar value={filters.search} onChange={v => setF('search', v)} placeholder="ابحث عن عمل أو عميل..." />
            
            {filtered.map(task => (
              <div 
                key={task.id}
                onClick={() => { setSelected(task); setView('detail'); }}
                style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} color="var(--blue)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{task.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700, marginTop: '2px' }}>{clientName(task.client_id)}</p>
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
            ))}
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-3)', fontWeight: 800 }}>لا توجد أعمال مطابقة للبحث</div>}
          </div>
        )}

        {/* FORM VIEW */}
        {view === 'form' && (
          <form onSubmit={handleSave} style={{ background: 'var(--surface)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 950, marginBottom: '10px' }}>{selected ? 'تعديل العمل' : 'إضافة عمل جديد'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-2)' }}>عنوان العمل</label>
               <input 
                 style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
                 value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} placeholder="مثال: ترخيص بناء قسيمة 7B" 
               />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-2)' }}>العميل</label>
                 <select 
                   style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
                   value={form.client_id || ''} onChange={e => setForm({...form, client_id: e.target.value})}
                 >
                   <option value="">اختر العميل...</option>
                   {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-2)' }}>الحالة</label>
                 <select 
                   style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
                   value={form.status || 'جارية'} onChange={e => setForm({...form, status: e.target.value})}
                 >
                   <option value="جارية">جارية</option>
                   <option value="منجزة">منجزة</option>
                   <option value="متأخرة">متأخرة</option>
                   <option value="معلقة">معلقة</option>
                 </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-2)' }}>تاريخ البدء</label>
               <input 
                 type="date"
                 style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
                 value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} 
               />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-2)' }}>الملاحظات</label>
               <textarea 
                 rows={4}
                 style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
                 value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="اكتب أي ملاحظات إضافية هنا..." 
               />
            </div>

            {/* Attachments Section */}
            <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
               <input type="file" multiple id="fileInput" hidden onChange={handleFileUpload} />
               <label htmlFor="fileInput" style={{ cursor: 'pointer', color: 'var(--blue)', fontWeight: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {loadingFile ? <Loader2 className="animate-spin" /> : <Paperclip size={24} />}
                  <span>{tempFiles.length > 0 ? `تم اختيار ${tempFiles.length} ملفات` : 'إضافة مرفقات (صور أو تقارير)'}</span>
               </label>
            </div>

            <button 
              type="submit"
              style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '18px', borderRadius: '12px', fontWeight: 950, fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
            >
              {selected ? 'حفظ التعديلات' : 'إضافة العمل الآن'}
            </button>
          </form>
        )}

        {/* DETAIL VIEW (Simplified) */}
        {view === 'detail' && selected && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div>
                   <h2 style={{ fontSize: '22px', fontWeight: 950, color: 'var(--text)', margin: 0 }}>{selected.title}</h2>
                   <p style={{ fontSize: '14px', color: 'var(--blue)', fontWeight: 800, marginTop: '5px' }}>العميل: {clientName(selected.client_id)}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <button onClick={() => { setForm(selected); setView('form'); }} style={{ background: 'var(--surface-2)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><FileText size={18} /></button>
                   <button onClick={() => handleDelete(selected.id)} style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '30px', padding: '20px', background: 'var(--surface-2)', borderRadius: '16px' }}>
                <div>
                   <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700 }}>الحالة</span>
                   <div style={{ fontWeight: 900, marginTop: '4px', color: 'var(--blue)' }}>{selected.status}</div>
                </div>
                <div>
                   <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700 }}>تاريخ البدء</span>
                   <div style={{ fontWeight: 900, marginTop: '4px' }}>{selected.start_date || '—'}</div>
                </div>
                <div>
                   <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 700 }}>بواسطة</span>
                   <div style={{ fontWeight: 900, marginTop: '4px' }}>{selected.created_by}</div>
                </div>
             </div>

             <div style={{ marginBottom: '30px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '10px' }}>الملاحظات</h4>
                <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '12px', color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>
                   {selected.notes || 'لا توجد ملاحظات'}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default memo(TasksPage);
