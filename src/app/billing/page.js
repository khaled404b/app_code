'use client';

import React, { useState } from 'react';
import { useBillingController } from './useBillingController';
import BillingList from './BillingList';
import BillingForm from './BillingForm';
import BillingPrint from './BillingPrint';
import { PageHeader, SearchBar, Card } from '@/components/ui';
import { 
  Plus, Printer, Download, ArrowRight, Loader2, 
  FileText, Paperclip, SlidersHorizontal, ChevronDown, RotateCcw 
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { parseAttachment } from '@/lib/fileHelper';

export default function BillingPage() {
  const { state, actions } = useBillingController();
  const {
    view, selected, search, form, filtered,
    tempFiles, loadingFile, isLoading, canEdit, clients,
    filters, showFilters, stats
  } = state;

  const {
    setView, setSelected, setSearch, setForm,
    setTempFiles, handleSave, openNew, openEdit, handleDelete,
    setF, setShowFilters
  } = actions;

  const [isExporting, setIsExporting] = useState(false);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

  // Helper to fetch full invoice with attachments + stamp
  const fetchWithAttachments = async (inv) => {
    if (inv.attachments && inv.stamp_image !== undefined) return inv; // Already loaded
    try {
      const [attachSnap, stampSnap] = await Promise.all([
        get(ref(db, `attachments/${inv.id}`)),
        get(ref(db, `stamps/${inv.id}`))
      ]);
      return {
        ...inv,
        attachments: attachSnap.exists() ? parseAttachment(attachSnap.val()) : [],
        stamp_image: stampSnap.exists() ? stampSnap.val() : null
      };
    } catch (err) {
      console.error("Error fetching attachments/stamp:", err);
    }
    return { ...inv, attachments: [], stamp_image: null };
  };

  const handleSelectForView = async (inv) => {
    setSelected(inv); // Show immediate state
    setView('detail');
    const full = await fetchWithAttachments(inv);
    setSelected(full);
  };

  // Open edit form — also load stamp so user can see/replace it
  const handleEdit = async (inv) => {
    openEdit(inv);
    try {
      const snap = await get(ref(db, `stamps/${inv.id}`));
      if (snap.exists()) {
        setForm(prev => ({ ...prev, stamp_image: snap.val() }));
      }
    } catch (_) { }
  };

  // Safe Print Handler
  const handlePrint = async (inv) => {
    const full = await fetchWithAttachments(inv);
    setSelected(full);
    setView('print');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Safe PDF Export Handler
  const handleExportPDF = async (inv) => {
    if (!inv) return;
    setIsExporting(true);
    const full = await fetchWithAttachments(inv);
    setSelected(full);

    setTimeout(async () => {
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
        console.error('PDF export error:', err);
        alert('فشل تصدير PDF: ' + err.message);
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const showAttachment = async (inv) => {
    if (!inv || !inv.id) return;
    setLoadingAttachment(true);
    try {
      const [attachSnap, stampSnap] = await Promise.all([
        get(ref(db, `attachments/${inv.id}`)),
        get(ref(db, `stamps/${inv.id}`))
      ]);

      if (!attachSnap.exists()) {
        alert('لا توجد مرفقات لهذه الفاتورة');
        setLoadingAttachment(false);
        return;
      }

      const files = parseAttachment(attachSnap.val());
      if (files.length === 0) {
        alert('صيغة المرفقات غير مدعومة');
        setLoadingAttachment(false);
        return;
      }

      const stampSrc = stampSnap.exists() ? stampSnap.val() : null;
      const logoUrl = window.location.origin + '/logo.png';

      const stampHtml = stampSrc
        ? `<div style="text-align:center;">
            <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Authorized:</div>
            <img src="${stampSrc}" style="height:70px; object-fit:contain;" />
           </div>`
        : '';

      const content = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>مرفقات الفاتورة ${inv.invoice_no || ''}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .file-card { background: white; border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            img.preview { max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px; }
            iframe { width: 100%; height: 600px; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px; }
            .btn { background: #0284c7; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 style="margin:0;">مرفقات الفاتورة: ${inv.invoice_no || ''}</h2>
              <p style="margin:4px 0 0 0; color:#64748b; font-size:14px;">العميل: ${inv.client_name || '—'}</p>
            </div>
            ${stampHtml}
          </div>
          <div class="files">
            ${files.map((f, i) => `
              <div class="file-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong>ملف #${i + 1}</strong>
                  <a href="${f}" download="attachment-${inv.invoice_no || 'file'}-${i + 1}" class="btn">تحميل الملف</a>
                </div>
                ${f.startsWith('data:image/') ? `<img src="${f}" class="preview" />` : ''}
                ${f.startsWith('data:application/pdf') ? `<iframe src="${f}"></iframe>` : ''}
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
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

          {/* Quick Stats Summary */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: '10px', 
            marginBottom: '16px' 
          }}>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>الفواتير المعروضة</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', marginTop: '2px' }}>{stats.totalCount}</div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>إجمالي المبالغ</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--blue)', marginTop: '2px' }}>{stats.totalAmount.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 800 }}>المدفوع ({stats.paidCount})</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--green)', marginTop: '2px' }}>{stats.paidAmount.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 800 }}>المعلق ({stats.pendingCount})</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--orange)', marginTop: '2px' }}>{stats.pendingAmount.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
            </div>
          </div>

          {/* Status Pills */}
          <div className="pills-row">
            {['الكل', 'معلقة', 'مدفوعة', 'ملغاة'].map(s => (
              <button 
                key={s} 
                className={`pill ${filters.status === s ? 'active' : ''}`}
                onClick={() => setF('status', s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Bar & Advanced Filter Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة، اسم العميل، البيان..." />
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
                  <label className="form-label">ترتيب الفواتير</label>
                  <select className="form-select" value={filters.sort} onChange={e => setF('sort', e.target.value)}>
                    <option value="date_desc">التاريخ: الأحدث أولاً</option>
                    <option value="date_asc">التاريخ: الأقدم أولاً</option>
                    <option value="amount_desc">المبلغ: الأعلى أولاً</option>
                    <option value="amount_asc">المبلغ: الأقل أولاً</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">المرفقات</label>
                  <select className="form-select" value={filters.hasAttachment} onChange={e => setF('hasAttachment', e.target.value)}>
                    <option value="all">الكل</option>
                    <option value="yes">تحتوي مرفق 📎</option>
                    <option value="no">بدون مرفق</option>
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

          <BillingList
            billingInvoices={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPrint={handleSelectForView}
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
    </div>
  );
}
