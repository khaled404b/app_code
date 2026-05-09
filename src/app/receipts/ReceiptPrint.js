import React from 'react';

export default function ReceiptPrint({ receipt }) {
  if (!receipt) return <div style={{ padding: '20px', textAlign: 'center' }}>جاري تحميل بيانات السند...</div>;

  const safeDate = (dateStr) => {
    try {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return {
        day: String(date.getDate()).padStart(2, '0'),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        year: date.getFullYear()
      };
    } catch (e) {
      return { day: '', month: '', year: '' };
    }
  };

  const dateParts = safeDate(receipt.date);

  return (
    <div id="receipt-print" style={{ 
      background: 'white', 
      padding: '30px', 
      fontFamily: 'Arial, sans-serif', 
      color: '#000',
      width: '100%',
      maxWidth: '210mm',
      margin: '0 auto',
      position: 'relative',
      boxSizing: 'border-box',
      border: '2px solid #000',
      borderRadius: '8px'
    }}>
      {/* Header with Logo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ width: '100px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', display: 'block' }} />
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>سند قبض</h1>
          <h2 style={{ margin: '0', fontSize: '18px', textDecoration: 'underline' }}>Receipt Voucher</h2>
        </div>
        <div style={{ width: '100px' }}>{/* Spacer for balance */}</div>
      </div>

      {/* Date and Amount Box */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
          <span style={{ fontWeight: 'bold', marginRight: '5px' }}>Date:</span>
          <span style={{ borderBottom: '1px solid #000', padding: '0 10px', minWidth: '30px', textAlign: 'center' }}>{dateParts.day}</span>
          <span>/</span>
          <span style={{ borderBottom: '1px solid #000', padding: '0 10px', minWidth: '30px', textAlign: 'center' }}>{dateParts.month}</span>
          <span>/</span>
          <span style={{ borderBottom: '1px solid #000', padding: '0 10px', minWidth: '40px', textAlign: 'center' }}>{dateParts.year}</span>
          <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>تاريخ</span>
        </div>

        {/* Amount Box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2px', fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
            <div style={{ width: '80px', textAlign: 'center' }}>KD</div>
            <div style={{ width: '50px', textAlign: 'center' }}>Fils</div>
          </div>
          <div style={{ display: 'flex', border: '2px solid #000' }}>
            <div style={{ width: '80px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #000', fontWeight: 'bold' }}>
              {receipt.amount_kd || '0'}
            </div>
            <div style={{ width: '50px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {String(receipt.amount_fils || '000').padStart(3, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Received From */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>Received From:</span>
          <div style={{ flex: 1, borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold', minHeight: '20px' }}>
            {receipt.received_from}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>:استلمنا من</span>
        </div>

        {/* The Sum Of KD */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>The Sum Of KD:</span>
          <div style={{ flex: 1, borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold', minHeight: '20px' }}>
            {receipt.sum_text}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>:مبلغ بالدينار الكويتي وقدرة</span>
        </div>

        {/* Cash/Cheque No and Bank */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>Cash/Cheque No:</span>
          <div style={{ width: '150px', borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold', minHeight: '20px', textAlign: 'center' }}>
            {receipt.cheque_no || (receipt.payment_method === 'cash' ? 'نقداً' : '')}
          </div>
          
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>:نقداً/شيك رقم</span>
          
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>On Bank:</span>
          <div style={{ flex: 1, borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold', minHeight: '20px' }}>
            {receipt.bank || '—'}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>:على بنك</span>
        </div>

        {/* Being For */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>Being For:</span>
          <div style={{ flex: 1, borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold', minHeight: '20px' }}>
            {receipt.being_for}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>:وذلك عن</span>
        </div>

      </div>

      {/* Footer Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', paddingTop: '10px' }}>
        {/* Accountant Sig */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px', position: 'relative' }}>
          {receipt.accountant_sig && (
            <img src={receipt.accountant_sig} alt="Accountant Signature" style={{ height: '50px', objectFit: 'contain', position: 'absolute', bottom: '20px', left: '100px' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Accountant Sig:</span>
            <div style={{ width: '150px', borderBottom: '1px solid #000' }}></div>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>:توقيع المحاسب</div>
        </div>

        {/* Receiver Sig */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', position: 'relative' }}>
          {receipt.receiver_sig && (
            <img src={receipt.receiver_sig} alt="Receiver Signature" style={{ height: '50px', objectFit: 'contain', position: 'absolute', bottom: '20px', right: '100px' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Receiver Sig:</span>
            <div style={{ width: '150px', borderBottom: '1px solid #000' }}></div>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>:توقيع المستلم</div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print, #receipt-print * { visibility: visible !important; }
          #receipt-print { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important;
            padding: 20mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
