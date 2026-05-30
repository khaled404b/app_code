import { ArrowRight, Download, Filter, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { useState } from 'react';
import { parseAttachment } from '@/lib/fileHelper';

export function OfferComparison({ state, actions }) {
  const { clients, services, compClient, compPlot, compWorkType, comparisonOffers, comparisonStats, canEdit } = state;
  const { goBack, setCompClient, setCompPlot, setCompWorkType, getClientName, markAsSelected, getAttachment } = actions;
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (comparisonOffers.length === 0) return;
    setIsExporting(true);

    try {
      // Fetch attachments IN TABLE ORDER — use an ordered array, not a plain object
      // so the PDF pages always follow the same rank as the displayed table rows
      const orderedResults = await Promise.all(
        comparisonOffers.map(async (o) => {
          if (!o.has_file) return { offer: o, data: null };
          try {
            const data = o.attachment_data || await getAttachment(o.id);
            return { offer: o, data: data || null };
          } catch (e) {
            console.error('Error fetching attachment for', o.company_name, e);
            return { offer: o, data: null };
          }
        })
      );

      const userFileName = prompt('أدخل اسم الملف:', `مقارنة-عروض-${getClientName(compClient)}`);
      if (!userFileName) { setIsExporting(false); return; }

      const html2pdf = (await import('html2pdf.js')).default;
      const { PDFDocument } = await import('pdf-lib');

      // Step 1: Render the hidden table element
      const element = document.getElementById('comparison-report');
      element.style.display = 'block';
      await new Promise(r => setTimeout(r, 800));

      // Step 2: Generate comparison TABLE as Landscape PDF
      const tableElement = document.getElementById('comparison-report-table');
      const mainPdfBytes = await html2pdf().from(tableElement).set({
        margin: 10,
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).outputPdf('arraybuffer');

      element.style.display = 'none';

      // Step 3: Load table PDF and embed attachments in exact table row order
      const finalDoc = await PDFDocument.load(mainPdfBytes);
      const A4_W = 595.28;
      const A4_H = 841.89;

      for (const { offer: o, data: attachData } of orderedResults) {
        if (!attachData) continue;

        // PDF attachments: copy pages directly
        if (typeof attachData === 'string' && attachData.startsWith('data:application/pdf')) {
          try {
            const rawBase64 = attachData.split(',')[1];
            const attachedDoc = await PDFDocument.load(rawBase64);
            const copiedPages = await finalDoc.copyPages(attachedDoc, attachedDoc.getPageIndices());
            copiedPages.forEach(p => finalDoc.addPage(p));
          } catch (e) { console.error('Failed to copy PDF pages', e); }
          continue;
        }

        // Image attachments: embed each image as a clean full-page A4
        const images = parseAttachment(attachData);
        for (const imgSrc of images) {
          try {
            const resp = await fetch(imgSrc);
            const imgBytes = await resp.arrayBuffer();
            let embeddedImg;
            try {
              embeddedImg = await finalDoc.embedJpg(imgBytes);
            } catch {
              embeddedImg = await finalDoc.embedPng(imgBytes);
            }

            // Scale to fit A4 with padding
            const padding = 20;
            const scaleX = (A4_W - padding * 2) / embeddedImg.width;
            const scaleY = (A4_H - padding * 2) / embeddedImg.height;
            const scale = Math.min(scaleX, scaleY);
            const drawW = embeddedImg.width * scale;
            const drawH = embeddedImg.height * scale;

            const page = finalDoc.addPage([A4_W, A4_H]);
            page.drawImage(embeddedImg, {
              x: (A4_W - drawW) / 2,
              y: (A4_H - drawH) / 2,
              width: drawW,
              height: drawH
            });
          } catch (e) { console.error('Failed to embed image', e); }
        }
      }

      // Step 4: Save and download
      const finalBytes = await finalDoc.save();
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userFileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error('PDF Export Error:', e);
      alert('فشل التصدير: ' + (e?.message || 'خطأ غير معروف'));
    }
    setIsExporting(false);
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}><Filter size={12} style={{ display: 'inline', marginLeft: '4px' }} />اسم العميل</label>
            <select className="form-select" value={compClient} onChange={e => { setCompClient(e.target.value); setCompPlot('all'); }}>
              <option value="all">اختر العميل من القائمة</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}><Filter size={12} style={{ display: 'inline', marginLeft: '4px' }} />رقم القسيمة</label>
            <select className="form-select" value={compPlot} onChange={e => setCompPlot(e.target.value)}>
              <option value="all">كل القسائم</option>
              {(clients.find(c => c.id === compClient)?.plots || []).map((pl, i) => {
                const val = typeof pl === 'object' ? pl.number : pl;
                return <option key={i} value={val}>قسيمة {val}</option>;
              })}
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
                <th style={{ padding: '12px', textAlign: 'center' }}>القسيمة</th>
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
                  <td style={{ padding: '12px', textAlign: 'center', unicodeBidi: 'plaintext' }}>{o.plot_no || '—'}</td>
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

      {/* Hidden PDF Template - Table Only */}
      <div id="comparison-report" style={{ display: 'none' }}>
        <div id="comparison-report-table" style={{ background: 'white', padding: '30px', direction: 'rtl', width: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
            <div style={{ width: '120px' }}><img src="/logo.png" style={{ width: '100px' }} /></div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ textDecoration: 'underline', margin: 0, fontSize: '18px' }}>مقارنة عروض الأسعار</h2>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>العميل: {getClientName(compClient)} | القسيمة: {compPlot === 'all' ? 'الكل' : compPlot} | نوع العمل: {compWorkType}</div>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#4f46e5', color: 'white' }}>
                <th style={{ border: '1px solid #000', padding: '8px' }}>م</th>
                <th style={{ border: '1px solid #000', padding: '8px' }}>اسم الشركة</th>
                <th style={{ border: '1px solid #000', padding: '8px' }}>القسيمة</th>
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
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{o.plot_no || '—'}</td>
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
        </div>
      </div>
    </div>
  );
}
