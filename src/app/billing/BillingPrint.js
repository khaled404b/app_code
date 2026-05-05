import React from 'react';

export default function BillingPrint({ invoice, getClientName }) {
  if (!invoice) return null;

  return (
    <div id="billing-invoice-print" style={{ 
      background: 'white', 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif', 
      color: '#000',
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px' }}>
        <div style={{ width: '120px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%' }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px', lineHeight: '1.6' }}>
          <div style={{ fontWeight: '900', fontSize: '16px' }}>FROM FRAME ENGINEERING CONSULTANTS</div>
          <div style={{ color: '#2563eb', textDecoration: 'underline' }}>info@frame.com.kw</div>
          <div>T: +965 22451010</div>
          <div>Bnaid Algar, Deema Complex, 2nd floor, office 3</div>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontSize: '14px' }}>
        <div>
          <span style={{ color: '#94a3b8', marginRight: '40px' }}>DATE</span>
          <span style={{ fontWeight: '700' }}>{new Date(invoice.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8', marginRight: '10px' }}>TO</span>
          <span style={{ fontWeight: '900', fontSize: '15px' }}>{invoice.client_name}</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1.5px solid #000', background: '#fff' }}>
          <div style={{ flex: 1, padding: '12px', fontWeight: '900', borderRight: '1.5px solid #000' }}>SERVICE DESCRIPTION</div>
          <div style={{ width: '150px', padding: '12px', fontWeight: '900', textAlign: 'center' }}>Amount (KD)</div>
        </div>
        
        {/* Items */}
        <div style={{ minHeight: '300px' }}>
          {(invoice.items || []).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', borderBottom: idx === (invoice.items.length - 1) ? 'none' : '1px solid #eee' }}>
              <div style={{ flex: 1, padding: '15px', borderRight: '1.5px solid #000', whiteSpace: 'pre-wrap' }}>
                <div style={{ fontWeight: '700' }}>{item.description}</div>
              </div>
              <div style={{ width: '150px', padding: '15px', textAlign: 'center', fontWeight: '700' }}>
                {parseFloat(item.amount || 0).toFixed(3)}
              </div>
            </div>
          ))}
          {/* Filler for empty space if needed */}
          <div style={{ flex: 1 }}></div>
        </div>

        {/* Total Row */}
        <div style={{ display: 'flex', borderTop: '1.5px solid #000', background: '#fff' }}>
          <div style={{ flex: 1, padding: '10px 15px', fontWeight: '900', borderRight: '1.5px solid #000' }}>Total</div>
          <div style={{ width: '150px', padding: '10px 15px', fontWeight: '900', textAlign: 'center' }}>
            KWD {parseFloat(invoice.amount || 0).toFixed(3)}
          </div>
        </div>

        {/* Authorized */}
        <div style={{ padding: '15px', borderTop: '1.5px solid #000', minHeight: '100px' }}>
          <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '10px' }}>Authorized:</div>
          <div style={{ position: 'relative', width: '100px', height: '60px' }}>
            <img src="/logo.png" alt="Signature" style={{ width: '100%', opacity: 0.8 }} />
            {/* Signature Overlay Placeholder */}
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-10deg)',
              fontFamily: '"Great Vibes", cursive', fontSize: '24px', color: '#1e3a8a', opacity: 0.6,
              whiteSpace: 'nowrap'
            }}>
              FRAME
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div style={{ border: '1.5px solid #000', borderRadius: '4px', padding: '12px', minHeight: '120px' }}>
        <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '8px' }}>Remarks:</div>
        <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
          {invoice.remarks || 'No additional remarks.'}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        @media print {
          body * { visibility: hidden; }
          #billing-invoice-print, #billing-invoice-print * { visibility: visible; }
          #billing-invoice-print { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}
