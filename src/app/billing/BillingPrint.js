import React from 'react';

export default function BillingPrint({ invoice }) {
  if (!invoice) return <div style={{ padding: '20px', textAlign: 'center' }}>جاري تحميل بيانات الفاتورة...</div>;

  const safeDate = (dateStr) => {
    try {
      if (!dateStr) return new Date().toLocaleDateString('ar-KW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return new Date(dateStr).toLocaleDateString('ar-KW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr || '—';
    }
  };

  // حذف البادئة FB- من رقم الفاتورة
  const displayInvoiceNo = (invoice.invoice_no || '—').replace(/^FB-/, '');

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
      boxSizing: 'border-box',
      direction: 'rtl'
    }}>
      {/* Header – الشعار يسار، معلومات الشركة يمين */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ textAlign: 'right', fontSize: '14px', lineHeight: '2' }}>
          <div style={{ fontWeight: '900', fontSize: '20px', marginBottom: '6px' }}>فريم للإستشارات الهندسية</div>
          <div><span style={{ fontWeight: '700', marginLeft: '8px' }}>الإيميل:</span><span style={{ color: '#2563eb', textDecoration: 'underline' }}>info@frame.com.kw</span></div>
          <div><span style={{ fontWeight: '700', marginLeft: '8px' }}>الرقم:</span>22451010</div>
          <div><span style={{ fontWeight: '700', marginLeft: '8px' }}>العنوان:</span>بنيد القار، مجمع ديمة، الدور الثاني، مكتب 3</div>
        </div>
        <div style={{ width: '120px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', display: 'block' }} />
        </div>
      </div>

      {/* كلمة فاتورة فوق الشريط */}
      <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '18px', marginBottom: '6px', color: '#0f172a', letterSpacing: '1px' }}>فاتورة</div>

      {/* شريط رقم الفاتورة: رقم الفاتورة يمين – الرقم يسار */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: 'white', padding: '14px 20px', borderRadius: '6px', marginBottom: '10px' }}>
        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '3px', direction: 'ltr' }}>{displayInvoiceNo}</div>
        <div style={{ fontSize: '16px', fontWeight: '700', opacity: 0.85 }}>رقم الفاتورة</div>
      </div>

      {/* إلى / التاريخ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '30px', marginTop: '20px', fontSize: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', direction: 'rtl' }}>
        {/* إلى + الاسم – على اليمين */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ color: '#64748b', fontWeight: '700', fontSize: '13px' }}>إلى</span>
          <span style={{ fontWeight: '900', fontSize: '17px' }}>{invoice.client_name || '—'}{invoice.plot_no ? ` | قسيمة: ${invoice.plot_no}` : ''}</span>
        </div>
        {/* التاريخ + القيمة – على اليسار */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ color: '#64748b', fontWeight: '700', fontSize: '13px' }}>التاريخ</span>
          <span style={{ fontWeight: '700', fontSize: '14px' }}>{safeDate(invoice.date)}</span>
        </div>
      </div>

      {/* الجدول */}
      <div style={{ border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1.5px solid #000', background: '#f8fafc' }}>
          <div style={{ flex: 1, padding: '14px 16px', fontWeight: '900', fontSize: '16px', borderLeft: '1.5px solid #000', textAlign: 'right' }}>وصف الخدمة</div>
          <div style={{ width: '150px', padding: '14px 16px', fontWeight: '900', fontSize: '15px', textAlign: 'center' }}>المبلغ <span style={{ display: 'inline-block', direction: 'ltr' }}>(د.ك)</span></div>
        </div>
        
        {/* البنود */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #eee', minHeight: '80px' }}>
              <div style={{ flex: 1, padding: '25px 18px', borderLeft: '1.5px solid #000', whiteSpace: 'pre-wrap', textAlign: 'right', display: 'flex', alignItems: 'center' }}>
                <div style={{ fontWeight: '400', fontSize: '14px', lineHeight: '1.7' }}>{item?.description || '—'}</div>
              </div>
              <div style={{ width: '150px', padding: '25px 10px', textAlign: 'center', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {parseFloat(item?.amount || 0).toFixed(3)}
              </div>
            </div>
          ))}
          <div style={{ flex: 1, borderLeft: '1.5px solid #000', width: 'calc(100% - 150px)' }}></div>
          <div style={{ borderTop: '1px solid #000', width: '100%' }}></div>
        </div>

        {/* صف الإجمالي */}
        <div style={{ display: 'flex', borderTop: '0.5px solid #000', background: '#fff' }}>
          <div style={{ flex: 1, padding: '12px 15px', fontWeight: '900', borderLeft: '1.5px solid #000', textAlign: 'right' }}>الإجمالي</div>
          <div style={{ width: '150px', padding: '12px 15px', fontWeight: '900', textAlign: 'center', background: '#f8fafc' }}>
            {totalAmount} د.ك
          </div>
        </div>

        {/* الاعتماد */}
        <div style={{ padding: '14px 20px', borderTop: '1.5px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontWeight: '900', fontSize: '12px', marginBottom: '8px', color: '#64748b' }}>الاعتماد:</div>
          {invoice.stamp_image && (
            <div style={{ position: 'relative', width: '130px' }}>
              <img src={invoice.stamp_image} alt="Stamp" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          )}
        </div>
      </div>

      {/* الملاحظات – تظهر فقط إذا كانت موجودة */}
      <div style={{ border: '1.5px solid #000', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '900', fontSize: '12px', marginBottom: '8px', color: '#64748b' }}>ملاحظات:</div>
        <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#1e293b' }}>{invoice.remarks || 'لا يوجد'}</div>
      </div>

      {/* المرفقات (تظهر عند الطباعة) */}
      {invoice.attachments && invoice.attachments.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          {invoice.attachments.map((src, i) => (
            <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '30px' }}>
              {/* رأس صفحة المرفق: الشعار + رقم الفاتورة */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>مرفق {i + 1} من {invoice.attachments.length}</div>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>{displayInvoiceNo}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{invoice.client_name || ''} {invoice.plot_no ? `| قسيمة: ${invoice.plot_no}` : ''}</div>
                </div>
                <img src="/logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
              </div>

              {/* صورة المرفق */}
              <img src={src} style={{ width: '100%', display: 'block', borderRadius: '4px', border: '1px solid #e2e8f0' }} />

              {/* تذييل صفحة المرفق: التوقيع */}
              {invoice.stamp_image && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>الاعتماد:</div>
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
