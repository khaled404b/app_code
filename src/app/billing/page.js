'use client';

import React, { useState, useEffect } from 'react';
import { useBillingController } from './useBillingController';
import BillingList from './BillingList';
import BillingForm from './BillingForm';
import BillingPrint from './BillingPrint';
import { PageHeader, SearchBar } from '@/components/ui';
import { Plus, Printer, Download, ArrowRight, Loader2, FileText, Paperclip } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { parseAttachment } from '@/lib/fileHelper';

export default function BillingPage() {
  const { state, actions } = useBillingController();
  const { 
    view, selected, search, form, filtered, 
    tempFiles, loadingFile, isLoading, canEdit, clients 
  } = state;
  
  const { 
    setView, setSelected, setSearch, setForm, 
    setTempFiles, handleSave, openNew, openEdit, handleDelete 
  } = actions;

  const [isExporting, setIsExporting] = useState(false);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

  // Safe Print Handler
  const handlePrint = (inv) => {
    setSelected(inv);
    setView('print');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Safe PDF Export Handler
  const handleExportPDF = async (inv) => {
    if (!inv) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('billing-invoice-print');
      if (!element) throw new Error('قالب الطباعة غير موجود');
      
      const opt = {
        margin: 0,
        filename: `Invoice-${inv.invoice_no || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error(err);
      alert('فشل تصدير PDF: ' + err.message);
    }
    setIsExporting(false);
  };

  // Safe Attachment Viewer
  const showAttachment = async (inv) => {
    if (!inv || !inv.id) return;
    setLoadingAttachment(true);
    try {
      const snap = await get(ref(db, `attachments/${inv.id}`));
      if (!snap.exists()) {
        alert('لا توجد مرفقات لهذه الفاتورة');
        setLoadingAttachment(false);
        return;
      }
      
      const files = parseAttachment(snap.val());
      if (files.length === 0) {
        alert('صيغة المرفقات غير مدعومة');
        setLoadingAttachment(false);
        return;
      }

      const imgTags = files.map((src, i) => `
        <div style="background:white; border-radius:8px; padding:16px; box-shadow:0 2px 12px rgba(0,0,0,0.15); max-width:860px; width:100%; margin-bottom: 20px;">
          <div style="font-size:12px; color:#64748b; margin-bottom:10px;">مرفق ${i+1}</div>
          <img src="${src}" style="width:100%; display:block; border-radius:4px;" />
        </div>`
      ).join('');
      
      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>مرفقات - ${inv.invoice_no}</title>
        <style>body{margin:0; background:#f1f5f9; display:flex; flex-direction:column; align-items:center; padding:30px; font-family:sans-serif;}</style>
        </head><body>${imgTags}</body></html>`;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      alert('خطأ في جلب الملف');
    }
    setLoadingAttachment(false);
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader2 className="animate-spin" size={32} color="var(--blue)" />
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      {view === 'list' && (
        <>
          <PageHeader 
            title="فواتير المكتب (Billing)" 
            actions={canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ فاتورة جديدة</button>} 
          />
          <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة، اسم العميل..." />
          <BillingList 
            billingInvoices={filtered} 
            onEdit={openEdit} 
            onDelete={handleDelete} 
            onPrint={(inv) => { setSelected(inv); setView('detail'); }} 
          />
        </>
      )}

      {view === 'detail' && selected && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button>
            <h1 className="page-title">معاينة الفاتورة</h1>
            <div style={{ marginRight: 'auto', display: 'flex', gap: '10px' }}>
              {selected.has_file && (
                <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={() => showAttachment(selected)} disabled={loadingAttachment}>
                  {loadingAttachment ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} />} المرفقات
                </button>
              )}
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => handlePrint(selected)}><Printer size={18} /> طباعة</button>
              <button className="btn" style={{ width: 'auto' }} onClick={() => handleExportPDF(selected)} disabled={isExporting}>
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} PDF
              </button>
            </div>
          </div>
          
          <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            overflow: 'hidden', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <BillingPrint invoice={selected} />
          </div>
        </>
      )}

      {view === 'form' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <button onClick={() => setView(selected ? 'detail' : 'list')} className="icon-btn"><ArrowRight size={20} /></button>
            <h1 className="page-title">{selected ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}</h1>
          </div>
          <form onSubmit={handleSave}>
            <BillingForm 
              form={form} 
              setForm={setForm} 
              clients={clients} 
              handleSave={handleSave} 
              tempFiles={tempFiles} 
              setTempFiles={setTempFiles} 
              loadingFile={loadingFile} 
            />
          </form>
        </>
      )}

      {view === 'print' && selected && (
        <div className="print-only">
          <BillingPrint invoice={selected} />
        </div>
      )}
    </div>
  );
}
