'use client';

import { useState, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Plus, ArrowRight, User, Calendar, FileText, Building2, AlignLeft, Image as ImageIcon, Trash2, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ref, get, update, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { processAttachment, parseAttachment } from '@/lib/fileHelper';

// NEW REFACTORED IMPORTS
import { STATUS_CFG, SERVICES_DEFAULT } from '@/constants/config';
import { Badge, Card, PageHeader, SearchBar } from '@/components/ui';
import { useInvoices } from '@/hooks/useInvoices';
import { FilterSection } from '@/components/invoices/FilterSection';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { StatementView } from '@/components/invoices/StatementView';

function InvoicesContent() {
  const { data, isLoading, updateData } = useData();
  const { canEdit, user } = useAuth();
  
  const invoices = (data && data.invoices) || [];
  const clients = (data && data.clients) || [];
  const services = (data && data.settings && data.settings.services) || SERVICES_DEFAULT;

  const { filters, setF, filteredInvoices: filtered, setFilters } = useInvoices(invoices, clients);
  
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [customService, setCustomService] = useState('');
  const [statementType, setStatementType] = useState('comprehensive');
  const [isExporting, setIsExporting] = useState(false);
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  const [loadingFile, setLoadingFile] = useState(false);
  const [allAttachments, setAllAttachments] = useState({}); 
  const fileInputRef = useRef(null);

  const generateNextNo = (type) => {
    const prefix = type === 'deposit' ? 'PC' : 'INV';
    const relevant = invoices.filter(i => i.invoice_no?.startsWith(prefix));
    if (relevant.length === 0) return `${prefix}-1001`;
    const nums = relevant.map(i => parseInt(i.invoice_no.split('-')[1])).filter(n => !isNaN(n));
    if (nums.length === 0) return `${prefix}-1001`;
    const max = Math.max(...nums);
    return `${prefix}-${max + 1}`;
  };

  // Helper: strip large attachment_data before any list write
  const stripAttachment = (inv) => {
    const { attachment_data, ...rest } = inv;
    return rest;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const invId = selected ? selected.id : uuidv4();
    const serviceToSave = form.service_type === 'آخر...' ? customService : (form.service_type || '—');
    const currentInvoice = { 
      ...form, id: invId, service_type: serviceToSave, 
      contractor: form.contractor || '—', description: form.description || '—', 
      invoice_no: form.invoice_no || '—', type: form.type || 'expense', amount: form.amount || '0', 
      issue_date: form.issue_date || new Date().toISOString().split('T')[0], status: form.status || 'معلقة',
      has_file: !!(tempFiles.length > 0 || form.has_file),
      created_by: selected ? (selected.created_by || '—') : (user && user.name) || '—', 
      created_at: selected ? (selected.created_at || new Date().toISOString()) : new Date().toISOString(),
      plot_no: form.plot_no || '—'
    };

    try { 
      // Strip attachment_data from ALL invoices before writing (prevents Write too large)
      const cleanInvoices = invoices.map(stripAttachment);
      const cleanCurrent = stripAttachment(currentInvoice);
      const finalList = selected 
        ? cleanInvoices.map(i => i.id === selected.id ? cleanCurrent : i)
        : [...cleanInvoices, cleanCurrent];

      update(ref(db), { invoices: finalList });
      
      // Write attachment separately as an isolated write
      if (tempFiles.length > 0) {
        set(ref(db, `attachments/${invId}`), JSON.stringify(tempFiles));
      }
      
      setView('list'); setSelected(null); setTempFiles([]); setCustomService('');
    } catch (err) { console.error(err); alert("فشل الحفظ: " + err.message); }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const cleanInvoices = invoices.filter(i => i.id !== id).map(stripAttachment);
      update(ref(db), { invoices: cleanInvoices });
      set(ref(db, `attachments/${id}`), null);
      setSelected(null); 
      setView('list');
    } catch (err) { alert('فشل الحذف'); }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ تحذير: سيتم حذف جميع الفواتير في النظام نهائياً! هل أنت متأكد؟')) return;
    const confirmText = prompt('اكتب "حذف الكل" للتأكيد:');
    if (confirmText !== 'حذف الكل') return;
    try {
      await update(ref(db), { invoices: [] });
      alert('تم حذف جميع الفواتير بنجاح');
      setView('list');
    } catch (err) { alert('فشل المسح الشامل'); }
  };

  const fetchAndShowFile = async (inv) => {
    setLoadingFile(true);
    try {
      // New format: stored directly on invoice object
      let stored = inv.attachment_data;
      
      // Legacy fallback: read from DB
      if (!stored) {
        const snap = await get(ref(db, `attachments/${inv.id}`));
        if (snap.exists()) stored = snap.val();
      }
      
      if (!stored) { alert("المرفق غير موجود"); setLoadingFile(false); return; }
      
      const images = parseAttachment(stored);
      if (images.length === 0) { alert("صيغة المرفق غير مدعومة"); setLoadingFile(false); return; }
      
      const imgTags = images.map((src, i) => `
        <div style="background:white; border-radius:8px; padding:16px; box-shadow:0 2px 12px rgba(0,0,0,0.15); max-width:860px; width:100%;">
          ${images.length > 1 ? `<div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:10px; direction:rtl;">الصفحة ${i + 1} من ${images.length}</div>` : ''}
          <img src="${src}" style="width:100%; display:block; border-radius:4px;" />
        </div>`
      ).join('');
      
      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>مرفق - ${inv.invoice_no}</title>
        <style>body{margin:0; background:#f1f5f9; display:flex; flex-direction:column; align-items:center; gap:20px; padding:30px; font-family:sans-serif;}</style>
        </head><body>${imgTags}</body></html>`;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) { 
      console.error("Error fetching file:", e);
      alert("خطأ في جلب المرفق"); 
    }
    setLoadingFile(false);
  };

  const fetchAllFilteredAttachments = async () => {
    if (statementType === 'comprehensive') { generatePDF(); return; }
    setIsExporting(true);
    const results = {};
    for (const inv of filtered) {
      if (inv.has_file) {
        try {
          // New format: read from invoice object
          if (inv.attachment_data) {
            results[inv.id] = inv.attachment_data;
          } else {
            // Legacy: read from DB
            const snap = await get(ref(db, `attachments/${inv.id}`));
            if (snap.exists()) results[inv.id] = snap.val();
          }
        } catch (e) { console.error("Error fetching attachment", e); }
      }
    }
    setAllAttachments(results);
    setTimeout(generatePDF, 2000);
  };

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('printable-statement');
      const userFileName = prompt('أدخل اسم الملف:', `كشف-حساب-${Date.now()}`);
      if (!userFileName) { setIsExporting(false); return; }

      const opt = { 
        margin: 10, 
        filename: `${userFileName}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
      };
      
      const pdfWorker = html2pdf().from(element).set(opt);
      const mainPdfArrayBuffer = await pdfWorker.outputPdf('arraybuffer');
      
      const pdfFilesToMerge = Object.values(allAttachments).filter(b64 => typeof b64 === 'string' && b64.startsWith('data:application/pdf'));
      
      if (pdfFilesToMerge.length > 0) {
        const { mergePdfs } = await import('@/lib/pdfUtils');
        const mergedPdfBytes = await mergePdfs(mainPdfArrayBuffer, pdfFilesToMerge);
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Statement-With-Attachments-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await pdfWorker.save();
      }
    } catch (e) { 
      console.error(e);
      alert('فشل تصدير الـ PDF'); 
    }
    setIsExporting(false);
  };

  const getClient = (id) => clients.find(cl => cl.id === id) || null;
  const clientName = (id) => getClient(id)?.name || '—';

  if (view === 'statement') return <StatementView {...{ statementType, setStatementType, setView, setAllAttachments, fetchAllFilteredAttachments, isExporting, filters, selectedClient: getClient(filters.client), isCommissionMode: getClient(filters.client)?.type === 'نسبة', rate: parseFloat(getClient(filters.client)?.commission_rate || 0), expenses: filtered.filter(i => i.type === 'expense' || !i.type), deposits: filtered.filter(i => i.type === 'deposit'), totalExpenses: filtered.filter(i => i.type === 'expense' || !i.type).reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0), totalDeposits: filtered.filter(i => i.type === 'deposit').reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0), totalCommission: filtered.filter(i => i.type === 'expense' || !i.type).reduce((acc, i) => acc + (parseFloat(i.amount) || 0) * (parseFloat(getClient(filters.client)?.commission_rate || 0)/100), 0), balance: filtered.filter(i => i.type === 'deposit').reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0) - filtered.filter(i => i.type === 'expense' || !i.type).reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0), currentTitle: statementType === 'comprehensive' ? 'كشف حساب العهدة النثرية' : 'كشف المصروفات الشامل', today: new Date().toLocaleDateString('ar-EG'), allAttachments, filtered }} />;

  if (view === 'detail' && selected) return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button><h1 className="page-title">التفاصيل</h1>{canEdit && <button onClick={() => { setForm({...selected}); setView('form'); }} className="btn btn-ghost btn-sm" style={{ marginRight: 'auto', width: 'auto' }}>تعديل</button>}</div>
      <div style={{ background: STATUS_CFG.INVOICES[selected.status]?.color, borderRadius: '20px', padding: '24px', marginBottom: '20px', color: 'white' }}><div style={{ fontSize: '12px', opacity: 0.8 }}>{selected.invoice_no}</div><div style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px' }}>{(parseFloat(selected.amount) || 0).toFixed(3)} د.ك</div></div>
      <Card>
        <div className="detail-row"><User size={18} color="#94a3b8" /><span className="detail-label">العميل</span><span className="detail-value">{clientName(selected.client_id)}</span></div>
        <div className="detail-row"><MapPin size={18} color="#94a3b8" /><span className="detail-label">القسيمة</span><span className="detail-value">{selected.plot_no || '—'}</span></div>
        <div className="detail-row"><Building2 size={18} color="#94a3b8" /><span className="detail-label">الشركة</span><span className="detail-value">{selected.contractor || '—'}</span></div>
        <div className="detail-row"><AlignLeft size={18} color="#94a3b8" /><span className="detail-label">البيان</span><span className="detail-value">{selected.description || '—'}</span></div>
        <div className="detail-row"><Calendar size={18} color="#94a3b8" /><span className="detail-label">التاريخ</span><span className="detail-value">{selected.issue_date}</span></div>
        <div className="detail-row" style={{ border: 0 }}><span className="detail-label">الحالة</span><Badge status={selected.status} type="INVOICES" /></div>
      </Card>
      {selected.has_file && <button className="btn btn-outline" style={{ marginTop: '15px' }} onClick={() => fetchAndShowFile(selected)}>👁️ عرض المرفق</button>}
      {canEdit && <button className="btn btn-danger" style={{ marginTop: '10px', background: 'none', border: '1px solid #fee2e2', color: '#dc2626' }} onClick={() => handleDelete(selected.id)}><Trash2 size={16} /> حذف هذه الفاتورة</button>}
    </div>
  );

  if (view === 'form') return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><button onClick={() => setView(selected ? 'detail' : 'list')} className="icon-btn"><ArrowRight size={20} /></button><h1 className="page-title">{selected ? 'تعديل' : 'إضافة'}</h1></div>
      <form onSubmit={handleSave}>
        <InvoiceForm {...{ form, setForm, clients, services, customService, setCustomService, fileInputRef, tempFiles, setTempFiles, generateNextNo }} />
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={async e => { 
          const files = Array.from(e.target.files); 
          if (files.length > 0) { 
            try { 
              const results = [];
              for (const f of files) {
                const res = await processAttachment(f);
                results.push(res);
              }
              setTempFiles(prev => [...prev, ...results]);
              setForm(p => ({ ...p, has_file: true })); 
            } catch(err) { 
              alert('فشل معالجة بعض الملفات: ' + err.message); 
            } 
          } 
        }} accept="image/*,.pdf" />
        <button type="submit" className="btn" style={{ marginTop: '20px' }}>حفظ</button>
      </form>
    </div>
  );

  return (
    <div className="page">
      <PageHeader title="الفواتير والعهدة" actions={<>
        <button className="icon-btn" onClick={() => setView('statement')}><FileText size={20} /></button>
        {canEdit && invoices.length > 0 && <button className="icon-btn" style={{ color: '#dc2626' }} onClick={handleClearAll} title="مسح الكل"><Trash2 size={20} /></button>}
        {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => { setForm({ invoice_no: generateNextNo('expense'), client_id: clients[0]?.id || '', status: 'معلقة', type: 'expense', issue_date: new Date().toISOString().split('T')[0] }); setSelected(null); setView('form'); }}>+ جديد</button>}
      </>} />
      <SearchBar value={filters.search} onChange={v => setF('search', v)} placeholder="بحث شامل..." />
      <FilterSection {...{ filters, setF, clients, showFilters, setShowFilters, initialFilters: { status: 'الكل', client: 'الكل', dateFrom: '', dateTo: '', amountMin: '', amountMax: '', search: '', sort: 'desc' } }} />
      <div className="list-group">
        {filtered.map(inv => (
          <div key={inv.id} className="list-row" onClick={() => { setSelected(inv); setView('detail'); }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{inv.invoice_no}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {clientName(inv.client_id)} 
                {inv.plot_no ? ` (قسيمة ${inv.plot_no})` : (getClient(inv.client_id)?.plot_no ? ` (قسيمة ${getClient(inv.client_id).plot_no})` : '')} 
                • {inv.issue_date}
              </div>
              <div style={{ marginTop: '4px', display: 'flex', gap: '5px' }}>
                <Badge status={inv.status} type="INVOICES" />
                {inv.type === 'deposit' && <Badge status="عهدة PC" customCfg={{ color: '#666', bg: '#eee' }} />}
                {inv.has_file && <ImageIcon size={14} color="#94a3b8" />}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 900, color: STATUS_CFG.INVOICES[inv.status]?.color }}>{(parseFloat(inv.amount) || 0).toFixed(3)}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{inv.contractor || '—'}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return <InvoicesContent />;
}
