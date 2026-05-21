import React from 'react';

export default function BillingPrint({ invoice }) {
  if (!invoice) return <div style={{ padding: '20px', textAlign: 'center' }}>جاري تحميل بيانات الفاتورة...</div>;

  const safeDate = (dateStr) => {
    try {
      if (!dateStr) return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr || '—';
    }
  };

  const items = invoice.items || [];
  const totalAmount = parseFloat(invoice.amount || 0).toFixed(3);

  return (
    <div id="billing-invoice-print" style={{ 
      background: 'white', 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif', 
      color: '#000',
      width: '100%',
      maxWidth: '210mm',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ width: '120px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', display: 'block' }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px', lineHeight: '1.6' }}>
          <div style={{ fontWeight: '900', fontSize: '16px' }}>FROM FRAME ENGINEERING CONSULTANTS</div>
          <div style={{ color: '#2563eb', textDecoration: 'underline' }}>info@frame.com.kw</div>
          <div>T: +965 22451010</div>
          <div>Bnaid Algar, Deema Complex, 2nd floor, office 3</div>
        </div>
      </div>

      {/* Invoice Number Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '6px', marginBottom: '30px' }}>
        <div style={{ fontSize: '12px', opacity: 0.7, letterSpacing: '1px' }}>INVOICE NO.</div>
        <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px' }}>{invoice.invoice_no || '—'}</div>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontSize: '14px' }}>
        <div>
          <span style={{ color: '#94a3b8', marginRight: '40px' }}>DATE</span>
          <span style={{ fontWeight: '700' }}>{safeDate(invoice.date)}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8', marginRight: '10px' }}>TO</span>
          <span style={{ fontWeight: '900', fontSize: '15px' }}>
            {invoice.client_name || '—'} 
            {invoice.plot_no ? ` | Plot: ${invoice.plot_no}` : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1.5px solid #000', background: '#f8fafc' }}>
          <div style={{ flex: 1, padding: '12px', fontWeight: '900', borderRight: '1.5px solid #000' }}>SERVICE DESCRIPTION</div>
          <div dir="ltr" style={{ width: '150px', padding: '12px', fontWeight: '900', textAlign: 'center' }}>Amount (KD)</div>
        </div>
        
        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <div style={{ flex: 1, padding: '15px', borderRight: '1.5px solid #000', whiteSpace: 'pre-wrap' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{item?.description || '—'}</div>
              </div>
              <div style={{ width: '150px', padding: '15px', textAlign: 'center', fontWeight: '700' }}>
                {parseFloat(item?.amount || 0).toFixed(3)}
              </div>
            </div>
          ))}
          {/* Empty Space Filler */}
          <div style={{ flex: 1, borderRight: '1.5px solid #000', width: 'calc(100% - 150px)' }}></div>
          <div style={{ borderTop: '1px solid #000', width: '100%' }}></div>
        </div>

        {/* Total Row */}
        <div style={{ display: 'flex', borderTop: '0.5px solid #000', background: '#fff' }}>
          <div style={{ flex: 1, padding: '12px 15px', fontWeight: '900', borderRight: '1.5px solid #000', textAlign: 'right' }}>Total</div>
          <div style={{ width: '150px', padding: '12px 15px', fontWeight: '900', textAlign: 'center', background: '#f8fafc' }}>
            KWD {totalAmount}
          </div>
        </div>

        {/* Authorized */}
        <div style={{ padding: '15px', borderTop: '1.5px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontWeight: '900', fontSize: '12px', marginBottom: '5px', color: '#64748b' }}>Authorized:</div>
          {invoice.stamp_image && (
            <div style={{ position: 'relative', width: '130px' }}>
              <img src={invoice.stamp_image} alt="Stamp" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          )}
        </div>
      </div>

      {/* Remarks */}
      <div style={{ border: '1.5px solid #000', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '900', fontSize: '12px', marginBottom: '8px', color: '#64748b' }}>Remarks:</div>
        <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#1e293b' }}>
          {invoice.remarks || 'No additional remarks.'}
        </div>
      </div>

      {/* Attachments Section (Visible in Print/PDF) */}
      {invoice.attachments && invoice.attachments.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          {invoice.attachments.map((src, i) => (
            <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '30px' }}>
              {/* Attachment page header: logo + invoice number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Attachment {i + 1} of {invoice.attachments.length}</div>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>{invoice.invoice_no || '—'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{invoice.client_name || ''} {invoice.plot_no ? `| Plot: ${invoice.plot_no}` : ''}</div>
                </div>
              </div>

              {/* Attachment image */}
              <img src={src} style={{ width: '100%', display: 'block', borderRadius: '4px', border: '1px solid #e2e8f0' }} />

              {/* Attachment page footer: signature */}
              {invoice.stamp_image && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Authorized:</div>
                    <img src={invoice.stamp_image} alt="Stamp" style={{ height: '70px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
