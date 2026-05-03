'use client';

import { useState, useMemo, memo, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, FileText, ArrowRight, Eye, Send, Link as LinkIcon, 
  MapPin, Loader2, X, Plus, Trash2, Paperclip, Search, 
  Download, Printer, FileCheck, Info, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { ref as fRef, set as fSet } from 'firebase/database';
import { db as fDb } from '@/lib/firebase';
import { processAttachment } from '@/lib/fileHelper';
import html2pdf from 'html2pdf.js';

// Browser-safe ID generator
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
  const [isExporting, setIsExporting] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(false);
  
  const reportRef = useRef();

  const tasks = useMemo(() => (data?.tasks || []), [data]);
  const clients = useMemo(() => (data?.clients || []), [data]);
  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) || 
      getClientName(t.client_id)?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search, clients]);

  // Statistics for Summary
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status === 'منجزة').length;
    const active = filteredTasks.filter(t => t.status === 'جارية').length;
    const late = filteredTasks.filter(t => t.status === 'متأخرة').length;
    return { total, done, active, late, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [filteredTasks]);

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

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      const element = reportRef.current;
      const opt = {
        margin: 10,
        filename: `تقرير_الأعمال_${new Date().toLocaleDateString('ar-EG')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      html2pdf().set(opt).from(element).save().then(() => setIsExporting(false));
    }, 500);
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
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>سجل الأعمال</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 700 }}>إدارة ومتابعة مهام المكتب</p>
           </div>
           {view === 'list' && (
             <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                   onClick={handleExportPDF}
                   style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 15px', borderRadius: '12px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Download size={18} /> التقرير
                </button>
                {canEdit && (
                  <button 
                    onClick={() => { setForm({ status: 'جارية' }); setView('form'); }}
                    style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <Plus size={18} /> إضافة عمل
                  </button>
                )}
             </div>
           )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  style={{ width: '100%', padding: '15px 45px 15px 15px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontWeight: 700 }}
                  placeholder="ابحث عن عمل أو عميل..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <Search size={20} color="var(--text-3)" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '10px 15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                 <input type="checkbox" checked={includeFiles} onChange={e => setIncludeFiles(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                 <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-2)' }}>المرفقات بالتقرير</span>
              </div>
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

        {/* DETAIL & FORM VIEWS (Omitted for brevity, assuming they are kept as before) */}
        {/* ... existing DETAIL and FORM views ... */}
        {view === 'form' && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 950, margin: 0 }}>{selected ? 'تعديل العمل' : 'إضافة عمل جديد'}</h2>
                <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={24} /></button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="عنوان العمل..." value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                <select style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} value={form.client_id || ''} onChange={e => setForm({...form, client_id: e.target.value})}>
                  <option value="">اختر العميل...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} value={form.status || 'جارية'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="جارية">جارية</option>
                  <option value="منجزة">منجزة</option>
                  <option value="متأخرة">متأخرة</option>
                  <option value="معلقة">معلقة</option>
                </select>
                <textarea rows={4} style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', fontWeight: 700 }} placeholder="الملاحظات..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} />
                <button onClick={handleSave} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 950, fontSize: '17px', cursor: 'pointer' }}>{selected ? 'حفظ التعديلات' : 'إضافة العمل الآن'}</button>
             </div>
          </div>
        )}

        {view === 'detail' && selected && (
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <button onClick={() => setView('list')} style={{ background: 'var(--surface-2)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: 'var(--text)', marginBottom: '20px' }}><ArrowRight size={20} /></button>
             <h2 style={{ fontSize: '22px', fontWeight: 950, color: 'var(--text)', marginBottom: '8px' }}>{selected.title}</h2>
             <p style={{ fontWeight: 800, color: 'var(--blue)' }}>العميل: {getClientName(selected.client_id)}</p>
             <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg)', borderRadius: '16px', color: 'var(--text-2)' }}>{selected.notes || 'لا توجد ملاحظات'}</div>
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => { setForm(selected); setView('form'); }} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800 }}>تعديل</button>
                <button onClick={() => handleDelete(selected.id)} style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800 }}>حذف</button>
             </div>
          </div>
        )}

        {/* --- HIDDEN REPORT FOR PDF GENERATION --- */}
        <div style={{ display: 'none' }}>
           <div ref={reportRef} style={{ padding: '20mm', background: '#fff', color: '#000', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '20px' }}>
                 <div>
                    <h1 style={{ color: '#2563eb', margin: 0, fontSize: '24px' }}>مكتب فريم الهندسي</h1>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>تقرير متابعة الأعمال والمهام</p>
                 </div>
                 <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    <p style={{ margin: 0, fontSize: '12px' }}>المصدر: لوحة تحكم فريم</p>
                 </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                 <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>📊 ملخص الأعمال</h2>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '10px', color: '#64748b' }}>إجمالي الأعمال</div><div style={{ fontSize: '20px', fontWeight: 900 }}>{stats.total}</div></div>
                    <div><div style={{ fontSize: '10px', color: '#64748b' }}>المنجزة</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>{stats.done}</div></div>
                    <div><div style={{ fontSize: '10px', color: '#64748b' }}>الجارية</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>{stats.active}</div></div>
                    <div><div style={{ fontSize: '10px', color: '#64748b' }}>نسبة الإنجاز</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#8b5cf6' }}>{stats.percent}%</div></div>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredTasks.map((task, index) => (
                  <div key={task.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                       <h3 style={{ margin: 0, fontSize: '16px' }}>{index + 1}. {task.title}</h3>
                       <span style={{ fontWeight: 800, fontSize: '12px', color: '#2563eb' }}>{task.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>العميل: {getClientName(task.client_id)} | التاريخ: {task.start_date || '—'}</div>
                    <div style={{ fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '8px', lineHeight: '1.5' }}>{task.notes || 'لا توجد ملاحظات'}</div>
                    
                    {includeFiles && task.has_file && (
                      <div style={{ marginTop: '10px', color: '#2563eb', fontSize: '11px', fontWeight: 700 }}>* يحتوي العمل على مرفقات صور/ملفات</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                 تم إنشاء هذا التقرير تلقائياً بواسطة نظام فريم الهندسي الذكي
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
