import React from 'react';
import { ArrowRight, Download, Loader2 } from 'lucide-react';
import { parseAttachment } from '@/lib/fileHelper';

export const StatementView = ({ 
  statementType, setStatementType, setView, setAllAttachments, fetchAllFilteredAttachments, 
  isExporting, filters, selectedClient, isCommissionMode, rate, expenses, deposits, 
  totalExpenses, totalDeposits, totalCommission, balance, currentTitle, today, allAttachments, filtered 
}) => {
  return (
    <div className="page">
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => { setView('list'); setAllAttachments({}); }} className="btn btn-ghost" style={{ width: 'auto' }}><ArrowRight size={20} /> عودة</button>
        <select className="form-select" style={{ width: '220px' }} value={statementType} onChange={e => setStatementType(e.target.value)}>
          <option value="comprehensive">كشف العهدة النثرية (مع النسبة)</option>
          <option value="petty">كشف المصروفات الشامل (مع الرصيد)</option>
        </select>
        <button onClick={fetchAllFilteredAttachments} className="btn" style={{ width: 'auto' }} disabled={isExporting}>
          {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} تنزيل PDF
        </button>
      </div>
      
      <div id="printable-statement" style={{ background: 'white', padding: '10px', minHeight: '100%', direction: 'rtl' }}>
        <style>{`.statement-table { width: 100%; border-collapse: collapse; margin-top: 15px; } .statement-table th, .statement-table td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 10px; } .header-box { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; } .attachment-gallery { margin-top: 50px; page-break-before: always; } .attachment-item { margin-bottom: 30px; border: 1px solid #eee; padding: 10px; break-inside: avoid; }`}</style>
        
        <div className="header-box">
          <div style={{ width: '180px' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>FRAME</h1>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>مكتب فريم الهندسي</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, textDecoration: 'underline', color: '#0f172a' }}>{currentTitle}</h2>
            <div style={{ fontSize: '11px', marginTop: '5px', fontWeight: 700 }}>خلال الفترة من: ({filters.dateFrom || '...'}) إلى: ({filters.dateTo || '...'})</div>
            <div style={{ fontSize: '10px', marginTop: '3px', color: '#94a3b8' }}>تاريخ التنزيل: {today}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', lineHeight: 1.6 }}>
            <div>العميل: <strong style={{ fontSize: '14px' }}>{selectedClient?.name || '—'}</strong></div>
            <div>رقم القسيمة: <strong>{selectedClient?.plot_no || '—'}</strong></div>
            <div>الهاتف: <strong>{selectedClient?.phone || '—'}</strong></div>
            <div>الموقع: <strong>{selectedClient?.location || '—'}</strong></div>
          </div>
        </div>

        {/* Professional Summary Box */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
           <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>إجمالي المصروفات</div>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>{totalExpenses.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
           </div>
           {statementType === 'petty' && (
             <>
               <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>إجمالي العهدة</div>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>{totalDeposits.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
               </div>
               <div style={{ flex: 1, background: balance < 0 ? '#fef2f2' : '#f0fdf4', padding: '12px', borderRadius: '10px', border: balance < 0 ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '10px', color: balance < 0 ? '#991b1b' : '#166534', fontWeight: 700, marginBottom: '4px' }}>الرصيد المتبقي</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: balance < 0 ? '#dc2626' : '#059669' }}>{balance.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
               </div>
             </>
           )}
           {statementType === 'comprehensive' && isCommissionMode && (
             <div style={{ flex: 1, background: '#f0f9ff', padding: '12px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 700, marginBottom: '4px' }}>نسبة المكتب ({rate}%)</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0284c7' }}>{totalCommission.toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
             </div>
           )}
        </div>

        {statementType === 'comprehensive' ? (
          <table className="statement-table">
            <thead><tr><th style={{ width: '10%' }}>التاريخ</th><th style={{ width: '15%' }}>نوع الخدمة</th><th>وصف العمل (البيان)</th><th style={{ width: '15%' }}>المقاول / الشركة</th><th style={{ width: '12%' }}>المدفوع</th>{isCommissionMode && <th style={{ width: '12%' }}>نسبة المكتب {rate}%</th>}</tr></thead>
            <tbody>
              {expenses.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.issue_date}</td><td>{inv.service_type}</td><td>{inv.description || '—'}</td><td>{inv.contractor || '—'}</td><td>{(parseFloat(inv.amount) || 0).toFixed(3)}</td>{isCommissionMode && <td>{((parseFloat(inv.amount) || 0) * (rate/100)).toFixed(3)}</td>}
                </tr>
              ))}
              <tr style={{ background: '#eee', fontWeight: 900 }}><td colSpan={4}>الإجمالي</td><td>{totalExpenses.toFixed(3)}</td>{isCommissionMode && <td>{totalCommission.toFixed(3)}</td>}</tr>
            </tbody>
          </table>
        ) : (
          <>
            <table className="statement-table" style={{ marginBottom: '30px' }}>
              <thead><tr><th style={{ width: '5%' }}>م</th><th style={{ width: '40%' }}>البيان (العهدة المستلمة)</th><th style={{ width: '20%' }}>الشركة</th><th style={{ width: '15%' }}>التاريخ</th><th style={{ width: '20%' }}>المبلغ</th></tr></thead>
              <tbody>
                {deposits.map((inv, i) => (<tr key={inv.id}><td>{i + 1}</td><td>{inv.description !== '—' ? inv.description : inv.service_type}</td><td>{inv.contractor || '—'}</td><td>{inv.issue_date}</td><td>{(parseFloat(inv.amount) || 0).toFixed(3)}</td></tr>))}
                <tr style={{ background: '#f8fafc', fontWeight: 900 }}><td colSpan={4}>إجمالي العهد المستلمة</td><td>{totalDeposits.toFixed(3)}</td></tr>
              </tbody>
            </table>
            <table className="statement-table">
              <thead><tr><th style={{ width: '5%' }}>م</th><th style={{ width: '15%' }}>نوع الخدمة</th><th>البيان (المصروفات)</th><th style={{ width: '15%' }}>الشركة</th><th style={{ width: '12%' }}>التاريخ</th><th style={{ width: '15%' }}>المبلغ</th></tr></thead>
              <tbody>
                {expenses.map((inv, i) => (<tr key={inv.id}><td>{i + 1}</td><td>{inv.service_type}</td><td>{inv.description || '—'}</td><td>{inv.contractor || '—'}</td><td>{inv.issue_date}</td><td>{(parseFloat(inv.amount) || 0).toFixed(3)}</td></tr>))}
                <tr style={{ background: '#f8fafc', fontWeight: 900 }}><td colSpan={5}>إجمالي المصروفات</td><td>{totalExpenses.toFixed(3)}</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: '15px', textAlign: 'left', fontWeight: 900, fontSize: '13px' }}>المتبقي من العهدة: <span style={{ color: balance < 0 ? 'red' : 'green' }}>{balance.toFixed(3)} د.ك</span></div>
          </>
        )}

        {statementType === 'petty' && Object.keys(allAttachments).length > 0 && (
          <div className="attachment-gallery">
            <h2 style={{ fontSize: '18px', fontWeight: 900, borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '30px', textAlign: 'center' }}>مرفقات الإيصالات والعهدة</h2>
            {filtered.filter(inv => allAttachments[inv.id]).flatMap((inv, idx) => {
              const images = parseAttachment(allAttachments[inv.id]);
              if (images.length === 0) return [];
              return images.map((imgSrc, pageIndex) => (
                <div key={`${inv.id}-page-${pageIndex}`} className="attachment-item" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '30px', pageBreakInside: 'avoid' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '12px', borderRight: '4px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 900 }}>
                        مرفق رقم ({idx + 1}){images.length > 1 ? ` - صفحة ${pageIndex + 1}/${images.length}` : ''}: {inv.invoice_no}
                      </div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>التاريخ: {inv.issue_date} | البيان: {inv.description} | المبلغ: {(parseFloat(inv.amount)||0).toFixed(3)}</div>
                    </div>
                  </div>
                  <img 
                    src={imgSrc} 
                    style={{ maxWidth: '100%', maxHeight: '900px', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
                    alt={`receipt-${idx + 1}-page-${pageIndex + 1}`} 
                  />
                </div>
              ));
            })}
          </div>
        )}
      </div>
    </div>
  );
};
