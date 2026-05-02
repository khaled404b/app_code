import React from 'react';
import { Card } from '../ui';

export const InvoiceForm = ({ form, setForm, clients, services, customService, setCustomService, fileInputRef, tempFiles, setTempFiles, generateNextNo }) => {
  return (
    <div className="card card-padded">
      <div className="form-group">
        <label className="form-label">نوع العملية</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className={`pill ${form.type === 'expense' || !form.type ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, type: 'expense', invoice_no: form.id ? p.invoice_no : generateNextNo('expense') }))}>مصروف (INV)</button>
          <button type="button" className={`pill ${form.type === 'deposit' ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, type: 'deposit', invoice_no: form.id ? p.invoice_no : generateNextNo('deposit') }))}>دفعة عهدة (PC)</button>
        </div>
      </div>
      <div className="form-group"><label className="form-label">الرقم (تلقائي)</label><input className="form-input" required value={form.invoice_no || ''} onChange={e => setForm(p => ({ ...p, invoice_no: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">المبلغ</label><input type="number" step="0.001" className="form-input" required value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">العميل</label>
        <select className="form-select" value={form.client_id || ''} onChange={e => setForm(p => ({ ...p, client_id: e.target.value, plot_no: '' }))}>
          <option value="">اختر العميل...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">رقم القسيمة / الموقع</label>
        <select className="form-select" value={form.plot_no || ''} onChange={e => setForm(p => ({ ...p, plot_no: e.target.value }))}>
          <option value="">اختر القسيمة...</option>
          {(clients.find(c => c.id === form.client_id)?.plots || []).filter(Boolean).map((pl, i) => {
            const label = typeof pl === 'object' ? `${pl.number} ${pl.location ? `(${pl.location})` : ''}` : pl;
            const value = typeof pl === 'object' ? pl.number : pl;
            return <option key={i} value={value}>{label}</option>;
          })}
        </select>
        {form.client_id && !(clients.find(c => c.id === form.client_id)?.plots?.length) && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>هذا العميل ليس لديه قسايم مسجلة.</div>}
      </div>
      <div className="form-group"><label className="form-label">الشركة / المقاول</label><input className="form-input" value={form.contractor || '—'} onChange={e => setForm(p => ({ ...p, contractor: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">نوع الخدمة</label>
        <select className="form-select" value={form.service_type || ''} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))}>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
          <option value="آخر...">+ أخرى</option>
        </select>
        {form.service_type === 'آخر...' && <input className="form-input" style={{ marginTop: '8px' }} value={customService} onChange={e => setCustomService(e.target.value)} placeholder="اكتب التصنيف هنا..." />}
      </div>
      <div className="form-group"><label className="form-label">البيان التفصيلي</label><textarea className="form-input" rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">التاريخ</label><input type="date" className="form-input" value={form.issue_date || ''} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} /></div>
      <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">الحالة</label>
        <select className="form-select" value={form.status || 'معلقة'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
          <option>معلقة</option><option>مدفوعة</option><option>متأخرة</option>
        </select>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
        <label className="form-label">المرفقات (صورة أو PDF) - يمكنك اختيار أكثر من ملف</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {tempFiles?.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>مرفق #{i+1}</span>
              <button type="button" onClick={() => {
                const newFiles = tempFiles.filter((_, idx) => idx !== i);
                setTempFiles(newFiles);
                if (newFiles.length === 0 && !form.has_file) setForm(p => ({ ...p, has_file: false }));
              }} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>حذف</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current.click()}>+ إضافة مرفق</button>
        </div>
        
        {form.has_file && tempFiles.length === 0 && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>✓ يوجد مرفقات سابقة (سيتم الاحتفاظ بها)</div>
        )}
      </div>
    </div>
  );
};
