'use client';

import React, { useState } from 'react';
import { useReceiptController } from './useReceiptController';
import ReceiptList from './ReceiptList';
import ReceiptForm from './ReceiptForm';
import ReceiptPrint from './ReceiptPrint';
import { PageHeader, SearchBar } from '@/components/ui';
import { Plus, Printer, ArrowRight, Loader2 } from 'lucide-react';

export default function ReceiptsPage() {
  const { state, actions } = useReceiptController();
  const { 
    view, selected, search, form, filtered, 
    isLoading, canEdit 
  } = state;
  
  const { 
    setView, setSelected, setSearch, setForm, 
    handleSave, openNew, openEdit, handleDelete, getFullReceipt 
  } = actions;

  const [isExporting, setIsExporting] = useState(false);

  // Safe Print Handler
  const handlePrint = async (rec) => {
    const full = await getFullReceipt(rec);
    setSelected(full);
    setView('print');
    setTimeout(() => {
      window.print();
      setView('list'); // Return to list after printing
    }, 500);
  };

  const handleExportPDF = async (rec) => {
    const full = await getFullReceipt(rec);
    setSelected(full);
    setView('print');
    setTimeout(async () => {
      const element = document.getElementById('receipt-print');
      if (!element) return;
      
      const opt = {
        margin: 10,
        filename: `Receipt-${rec.receipt_no || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().from(element).set(opt).save();
      } catch (err) {
        console.error('PDF export failed:', err);
      }
      setView('list');
    }, 500);
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
            title="سندات القبض (Receipt Vouchers)" 
            actions={canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ سند جديد</button>} 
          />
          <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم السند، الاسم، أو البيان..." />
          <ReceiptList 
            receipts={filtered} 
            onEdit={openEdit} 
            onDelete={handleDelete} 
            onPrint={handlePrint} 
            onExportPDF={handleExportPDF}
          />
        </>
      )}

      {view === 'form' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <button onClick={() => setView('list')} className="icon-btn"><ArrowRight size={20} /></button>
            <h1 className="page-title">{selected ? 'تعديل السند' : 'إنشاء سند جديد'}</h1>
          </div>
          <form onSubmit={handleSave}>
            <ReceiptForm 
              form={form} 
              setForm={setForm} 
              handleSave={handleSave} 
            />
          </form>
        </>
      )}

      {view === 'print' && selected && (
        <div className="print-only">
          <ReceiptPrint receipt={selected} />
        </div>
      )}
    </div>
  );
}
