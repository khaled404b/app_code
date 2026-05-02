import { ArrowRight, Download, Filter, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { useState } from 'react';
import { mergePdfs } from '@/lib/pdfUtils';
import { parseAttachment } from '@/lib/fileHelper';

export function OfferComparison({ state, actions }) {
  const { clients, services, compClient, compWorkType, comparisonOffers, comparisonStats, canEdit } = state;
  const { goBack, setCompClient, setCompWorkType, getClientName, markAsSelected, getAttachment } = actions;
  const [isExporting, setIsExporting] = useState(false);
  const [pdfAttachments, setPdfAttachments] = useState({});

  const handleExportPDF = async () => {
    if (comparisonOffers.length === 0) return;
    setIsExporting(true);
    
    // Fetch all attachments (from offer object first, fallback to DB for legacy)
    const results = {};
    for (const o of comparisonOffers) {
      if (o.has_file) {
        try {
          const data = o.attachment_data || await getAttachment(o.id);
          if (data) results[o.id] = data;
        } catch (e) { console.error("Error fetching attachment", e); }
      }
    }
    setPdfAttachments(results);

    // Wait a bit for images to render in DOM
    setTimeout(async () => {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.getElementById('comparison-report');
        element.style.display = 'block';
        
        // 1. Generate main HTML to PDF as ArrayBuffer
        const pdfWorker = html2pdf().from(element).set({ 
          margin: 10, 
          filename: `Offers-Comparison-${Date.now()}.pdf`, 
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
        });
        
        const mainPdfArrayBuffer = await pdfWorker.outputPdf('arraybuffer');
        
        // 2. Collect base64 strings of PDF attachments
        const pdfFilesToMerge = Object.values(results).filter(b64 => b64.startsWith('data:application/pdf'));
        
        if (pdfFilesToMerge.length > 0) {
          // 3. Merge them using pdf-lib
          const mergedPdfBytes = await mergePdfs(mainPdfArrayBuffer, pdfFilesToMerge);
          
          // 4. Download merged PDF
          const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Offers-Comparison-With-Attachments-${Date.now()}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // If no PDF attachments, just save normally
          await pdfWorker.save();
        }
        
        element.style.display = 'none';
      } catch (e) { 
        console.error(e);
        alert('فشل التصدير'); 
      }
      setIsExporting(false);
    }, 1500);
  };


  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title">اختيار العرض المراد مقارنته</h1>
        <button className="icon-btn" style={{ marginRight: 'auto' }} onClick={handleExportPDF} disabled={isExporting || comparisonOffers.length === 0}>
          {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
        </button>
      </div>

      <Card padded style={{ marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}><Filter size={12} style={{ display: 'inline', marginLeft: '4px' }} />اسم العميل</label>
            <select className="form-select" value={compClient} onChange={e => setCompClient(e.target.value)}>
              <option value="all">اختر العميل من القائمة</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}><Filter size={12} style={{ display: 'inline', marginLeft: '4px' }} />نوع العمل</label>
            <select className="form-select" value={compWorkType} onChange={e => setCompWorkType(e.target.value)}>
              <option value="all">اختر نوع العمل من القائمة</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {comparisonStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 800 }}>عدد الشركات</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1d4ed8' }}>{comparisonStats.count}</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '10px', color: '#166534', fontWeight: 800 }}>أقل سعر</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#15803d' }}>{comparisonStats.lowest.toFixed(2)}</div>
          </div>
          <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 800 }}>أعلى سعر</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#b91c1c' }}>{comparisonStats.highest.toFixed(2)}</div>
          </div>
          <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 800 }}>فرق الأسعار</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#b45309' }}>{comparisonStats.diff.toFixed(2)}</div>
          </div>
        </div>
      )}

      {comparisonOffers.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#4f46e5', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'center' }}>م</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>اسم الشركة</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>قيمة العرض</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>الحالة</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>صلاحية العرض</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>مختار ✔️</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>الفرق عن الأقل</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>رقم العرض</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {comparisonOffers.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9', background: o.is_selected ? '#f0fdf4' : (i % 2 === 0 ? '#fff' : '#f8fafc') }}>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800 }}>{o.rank}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: o.is_selected ? 800 : 500 }}>{o.company_name}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 900, color: '#2563eb' }}>{parseFloat(o.price || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{o.status}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{o.validity_date || '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {o.is_selected ? (
                      <span style={{ color: '#059669', fontWeight: 900 }}>نعم</span>
                    ) : (
                      canEdit ? <button onClick={() => markAsSelected(o.id)} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>اختيار</button> : 'لا'
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: o.price_diff === 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
                    {o.price_diff === 0 ? '-' : `(${o.price_diff.toFixed(2)})`}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{o.offer_number || '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '11px', color: '#64748b' }}>{o.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
          يرجى اختيار العميل ونوع العمل لعرض المقارنة، أو لا توجد عروض مطابقة.
        </div>
      )}

      {/* Hidden PDF Template */}
      <div id="comparison-report" style={{ display: 'none', background: 'white', padding: '30px', direction: 'rtl', width: '1000px', margin: '0 auto' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
            <div><h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>FRAME</h1><div style={{ fontSize: '11px' }}>مكتب فريم الهندسي</div></div>
            <div style={{ textAlign: 'center' }}>
               <h2 style={{ textDecoration: 'underline', margin: 0, fontSize: '18px' }}>مقارنة عروض الأسعار</h2>
               <div style={{ fontSize: '12px', marginTop: '5px' }}>العميل: {getClientName(compClient)} | نوع العمل: {compWorkType}</div>
            </div>
            <div style={{ textAlign: 'left', fontSize: '11px' }}><div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div></div>
         </div>
         {comparisonStats && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <div><strong>عدد العروض:</strong> {comparisonStats.count}</div>
               <div><strong>أقل سعر:</strong> {comparisonStats.lowest.toFixed(2)} د.ك</div>
               <div><strong>أعلى سعر:</strong> {comparisonStats.highest.toFixed(2)} د.ك</div>
               <div><strong>فرق الأسعار:</strong> {comparisonStats.diff.toFixed(2)} د.ك</div>
            </div>
         )}
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center', marginBottom: '30px' }}>
            <thead>
               <tr style={{ background: '#4f46e5', color: 'white' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>م</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>اسم الشركة</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>رقم العرض</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>قيمة العرض</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>صلاحية العرض</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>الفرق عن الأقل</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>مختار</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>ملاحظات</th>
               </tr>
            </thead>
            <tbody>
               {comparisonOffers.map((o) => (
                  <tr key={o.id} style={{ background: o.is_selected ? '#f0fdf4' : 'transparent' }}>
                     <td style={{ border: '1px solid #000', padding: '8px' }}>{o.rank}</td>
                     <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{o.company_name}</td>
                     <td style={{ border: '1px solid #000', padding: '8px' }}>{o.offer_number || '—'}</td>
                     <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 800 }}>{parseFloat(o.price || 0).toFixed(2)}</td>
                     <td style={{ border: '1px solid #000', padding: '8px' }}>{o.validity_date || '—'}</td>
                     <td style={{ border: '1px solid #000', padding: '8px', direction: 'ltr' }}>{o.price_diff === 0 ? '-' : `(${o.price_diff.toFixed(2)})`}</td>
                     <td style={{ border: '1px solid #000', padding: '8px', fontWeight: o.is_selected ? 800 : 400 }}>{o.is_selected ? 'نعم' : 'لا'}</td>
                     <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{o.notes || '—'}</td>
                  </tr>
               ))}
            </tbody>
         </table>

         {/* Attachments Section - ordered by comparisonOffers (lowest price first) */}
         {comparisonOffers.some(o => pdfAttachments[o.id]) && (
           <div style={{ pageBreakBefore: 'always' }}>
             <h3 style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>المرفقات وعروض الأسعار الأصلية (مرتبة من الأقل سعراً)</h3>
             {comparisonOffers.filter(o => pdfAttachments[o.id]).flatMap(o => {
               const images = parseAttachment(pdfAttachments[o.id]);
               return images.map((imgSrc, pageIndex) => (
                 <div key={`attach-${o.id}-page-${pageIndex}`} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                   <div style={{ background: '#1e293b', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <strong>م{o.rank} - {o.company_name} ({parseFloat(o.price || 0).toFixed(2)} د.ك)</strong>
                     <span style={{ fontSize: '11px', opacity: 0.8 }}>
                       {images.length > 1 ? `صفحة ${pageIndex + 1} / ${images.length}` : 'مرفق عرض السعر'}
                     </span>
                   </div>
                   <img src={imgSrc} style={{ maxWidth: '100%', maxHeight: '540px', objectFit: 'contain', border: '1px solid #e2e8f0', display: 'block', margin: '0 auto' }} alt={`مرفق-${o.rank}-${pageIndex + 1}`} />
                 </div>
               ));
             })}
           </div>
         )}
      </div>
    </div>
  );
}
