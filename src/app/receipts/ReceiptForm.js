import React from 'react';
import { Card } from '@/components/ui';

export default function ReceiptForm({ form, setForm, handleSave }) {
  return (
    <Card padded>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">رقم السند</label>
          <input className="form-input" value={form.receipt_no || ''} readOnly style={{ background: '#f8fafc' }} />
        </div>
        <div className="form-group">
          <label className="form-label">التاريخ</label>
          <input type="date" className="form-input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">المبلغ (دينار)</label>
          <input type="number" className="form-input" placeholder="0" value={form.amount_kd || ''} onChange={e => setForm({ ...form, amount_kd: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">المبلغ (فلس)</label>
          <input type="number" className="form-input" placeholder="000" value={form.amount_fils || ''} onChange={e => setForm({ ...form, amount_fils: e.target.value })} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label className="form-label">استلمنا من (Received From)</label>
        <input className="form-input" placeholder="اسم الشخص أو الشركة..." value={form.received_from || ''} onChange={e => setForm({ ...form, received_from: e.target.value })} />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label className="form-label">مبلغ وقدره (The Sum Of KD)</label>
        <input className="form-input" placeholder="فقط خمسمائة دينار كويتي لا غير..." value={form.sum_text || ''} onChange={e => setForm({ ...form, sum_text: e.target.value })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">طريقة الدفع</label>
          <select className="form-select" value={form.payment_method || 'cash'} onChange={e => setForm({ ...form, payment_method: e.target.value, cheque_no: '', bank: '' })}>
            <option value="cash">نقداً</option>
            <option value="cheque">شيك</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">نقداً / شيك رقم</label>
          <input 
            className="form-input" 
            placeholder="رقم الشيك إن وجد" 
            value={form.cheque_no || ''} 
            onChange={e => setForm({ ...form, cheque_no: e.target.value })}
            disabled={form.payment_method !== 'cheque'}
            style={{ background: form.payment_method !== 'cheque' ? '#f1f5f9' : '#fff' }}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">على بنك</label>
          <input 
            className="form-input" 
            placeholder="اسم البنك إن وجد" 
            value={form.bank || ''} 
            onChange={e => setForm({ ...form, bank: e.target.value })}
            disabled={form.payment_method !== 'cheque'}
            style={{ background: form.payment_method !== 'cheque' ? '#f1f5f9' : '#fff' }}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '25px' }}>
        <label className="form-label">وذلك عن (Being For)</label>
        <textarea className="form-input" rows={3} placeholder="سبب الدفع أو الوصف..." value={form.being_for || ''} onChange={e => setForm({ ...form, being_for: e.target.value })} />
      </div>

      <div style={{ marginTop: '30px', padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 40px' }} onClick={handleSave}>حفظ السند</button>
      </div>
    </Card>
  );
}
