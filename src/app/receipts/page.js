'use client';

import React, { useState } from 'react';
import { useReceiptController } from './useReceiptController';
import ReceiptList from './ReceiptList';
import ReceiptForm from './ReceiptForm';
import ReceiptPrint from './ReceiptPrint';
import { PageHeader, SearchBar, Card } from '@/components/ui';
import { Plus, Printer, ArrowRight, Loader2, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';

export default function ReceiptsPage() {
  const { state, actions } = useReceiptController();
  const { 
    view, selected, search, form, filtered, clients,
    isLoading, canEdit, filters, showFilters, stats
  } = state;
  
  const { 
    setView, setSelected, setSearch, setForm, 
    handleSave, openNew, openEdit, handleDelete, getFullReceipt,
    setF, setShowFilters
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

          {/* Quick Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: '10px', 
            marginBottom: '16px' 
          }}>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>السندات المعروضة</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', marginTop: '2px' }}>{stats.totalCount}</div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>إجمالي المقبوض</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--green)', marginTop: '2px' }}>{stats.totalAmount.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>نقداً / كاش</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue)', marginTop: '2px' }}>{stats.cashAmount.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>كي نت / شيك / تحويل</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--purple)', marginTop: '2px' }}>{(stats.knetAmount + stats.chequeAmount + stats.transferAmount).toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
            </div>
          </div>

          {/* Payment Method Pills */}
          <div className="pills-row">
            {['الكل', 'نقداً', 'كي نت', 'شيك', 'تحويل بنكي'].map(m => (
              <button 
                key={m} 
                className={`pill ${filters.paymentMethod === m ? 'active' : ''}`}
                onClick={() => setF('paymentMethod', m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search Bar & Filter Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم السند، الاسم، أو البيان..." />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: showFilters ? 'var(--blue-light)' : 'var(--surface)',
                border: `1.5px solid ${showFilters ? 'var(--blue)' : 'var(--border)'}`,
                color: showFilters ? 'var(--blue)' : 'var(--text-2)',
                padding: '12px 14px', borderRadius: '14px', cursor: 'pointer',
                fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap'
              }}
            >
              <SlidersHorizontal size={16} />
              فلاتر
              <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>

          {/* Expandable Advanced Filters */}
          {showFilters && (
            <Card padded style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">العميل</label>
                  <select className="form-select" value={filters.client} onChange={e => setF('client', e.target.value)}>
                    <option value="الكل">📊 جميع العملاء</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ترتيب السندات</label>
                  <select className="form-select" value={filters.sort} onChange={e => setF('sort', e.target.value)}>
                    <option value="date_desc">التاريخ: الأحدث أولاً</option>
                    <option value="date_asc">التاريخ: الأقدم أولاً</option>
                    <option value="amount_desc">المبلغ: الأعلى أولاً</option>
                    <option value="amount_asc">المبلغ: الأقل أولاً</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">من تاريخ</label>
                  <input type="date" className="form-input" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">إلى تاريخ</label>
                  <input type="date" className="form-input" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">المبلغ الأدنى</label>
                  <input type="number" placeholder="0.000" className="form-input" value={filters.amountMin} onChange={e => setF('amountMin', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">المبلغ الأقصى</label>
                  <input type="number" placeholder="999.999" className="form-input" value={filters.amountMax} onChange={e => setF('amountMax', e.target.value)} />
                </div>
              </div>

              <button 
                onClick={() => setF('reset')} 
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--red)', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <RotateCcw size={14} /> إعادة ضبط الفلاتر
              </button>
            </Card>
          )}

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
