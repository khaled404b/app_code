import React from 'react';
import { Search, ChevronLeft, Send, Printer, FileText, Trash2, Edit, ArrowRight } from 'lucide-react';
import { Badge, Card } from '@/components/ui';

export function DeliveryList({ state, actions }) {
  const { filteredDeliveries, search, canEdit, deliveries } = state;
  const { setSearch, openDetail, openNew } = actions;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">إرسال المستندات <span style={{ color: '#94a3b8', fontSize: '20px' }}>({deliveries.length})</span></h1>
        {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ إرسال جديد</button>}
      </div>
      
      <div className="search-wrap" style={{ marginBottom: '16px' }}>
        <Search size={17} color="#94a3b8" />
        <input 
          className="search-input" 
          placeholder="بحث عن إرسال، مشروع أو كود..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      
      <div className="list-group">
        {filteredDeliveries.map(d => (
          <div key={d.id} className="list-row" onClick={() => openDetail(d)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{d.project_name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                رقم الإرسال: {d.transmittal_no} • {d.date}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                الموضوع: {d.subject || 'بدون موضوع'}
              </div>
            </div>
            <ChevronLeft size={16} color="#cbd5e1" />
          </div>
        ))}
        {filteredDeliveries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد سجلات مطابقة</div>
        )}
      </div>
    </div>
  );
}

export function DeliveryDetail({ state, actions }) {
  const { selected, canEdit } = state;
  const { goBack, openEdit, handleDelete, getAttachment } = actions;
  const [isExporting, setIsExporting] = React.useState(false);
  const [attachmentContent, setAttachmentContent] = React.useState(null);

  React.useEffect(() => {
    if (selected?.has_file) {
      getAttachment(selected.id).then(res => setAttachmentContent(res));
    }
  }, [selected, getAttachment]);

  if (!selected) return null;
  
  const attachmentPages = React.useMemo(() => {
    if (!attachmentContent) return [];
    let items = [];
    try {
      if (attachmentContent.startsWith('[')) {
        items = JSON.parse(attachmentContent);
      } else {
        items = [attachmentContent];
      }
      
      // Flatten any nested JSON arrays (e.g. multi-page PDFs inside a multi-file list)
      return items.flatMap(item => {
        if (typeof item === 'string' && item.startsWith('[')) {
          try { return JSON.parse(item); } catch { return [item]; }
        }
        return [item];
      });
    } catch (e) {
      return [];
    }
  }, [attachmentContent]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('delivery-print-template');
      element.style.display = 'block';
      
      const opt = {
        margin: 0,
        filename: `Transmittal-${selected.transmittal_no}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfWorker = html2pdf().from(element).set(opt);
      
      if (selected.has_file) {
        const mainPdfArrayBuffer = await pdfWorker.outputPdf('arraybuffer');
        const attachmentB64 = await getAttachment(selected.id);
        
        if (attachmentB64) {
          const { mergePdfs } = await import('@/lib/pdfUtils');
          const mergedPdfBytes = await mergePdfs(mainPdfArrayBuffer, [attachmentB64]);
          const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Transmittal-${selected.transmittal_no}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          await pdfWorker.save();
        }
      } else {
        await pdfWorker.save();
      }
      
      element.style.display = 'none';
    } catch (e) {
      console.error(e);
      alert('فشل التصدير');
    }
    setIsExporting(false);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title">تفاصيل الإرسال</h1>
        {canEdit && (
          <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
             <button onClick={() => openEdit(selected)} className="icon-btn" style={{ background: '#f1f5f9' }}><Edit size={18} color="#2563eb" /></button>
             <button onClick={handleDelete} className="icon-btn" style={{ background: '#fef2f2' }}><Trash2 size={18} color="#dc2626" /></button>
          </div>
        )}
      </div>

      <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>{selected.transmittal_no}</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, marginTop: '4px' }}>{selected.project_name}</h2>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <Badge status={selected.date} customCfg={{ bg: '#1e293b', color: '#fff' }} />
        </div>
      </div>

      <Card padded style={{ marginBottom: '20px' }}>
        <div className="detail-row"><FileText size={16}/><span className="detail-label">الموضوع</span><span className="detail-value">{selected.subject || '—'}</span></div>
        <div className="detail-row"><Send size={16}/><span className="detail-label">إلى</span><span className="detail-value">{selected.to}</span></div>
        <div className="detail-row" style={{ border: 0 }}><Printer size={16}/><span className="detail-label">رقم العقد</span><span className="detail-value">{selected.contract_no || '—'}</span></div>
        {selected.has_file && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <FileText size={16} color="#059669" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>يوجد مستند مرفق سيتم دمجه عند الطباعة</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {attachmentPages.map((src, i) => (
                src.startsWith('data:image') ? (
                  <img key={i} src={src} style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} alt="Attachment page" />
                ) : (
                  <div key={i} style={{ padding: '20px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center', fontSize: '10px' }}>PDF Document</div>
                )
              ))}
            </div>
          </div>
        )}
      </Card>

      <button className="btn" onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'جاري التحضير...' : 'طباعة وتصدير PDF (دمج المرفقات)'}
      </button>

      {/* The actual component used for printing */}
      <div id="print-container"></div>
    </div>
  );
}
