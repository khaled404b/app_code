import React, { useState } from 'react';
import { Plus, Trash2, Paperclip, Loader2, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { processAttachment } from '@/lib/fileHelper';

export default function BillingForm({ form, setForm, clients, handleSave, tempFiles, setTempFiles, loadingFile }) {
  
  const addItem = () => {
    const items = [...(form.items || []), { description: '', amount: '' }];
    setForm({ ...form, items });
  };

  const removeItem = (idx) => {
    const items = (form.items || []).filter((_, i) => i !== idx);
    const newAmount = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    setForm({ ...form, items, amount: newAmount });
  };

  const updateItem = (idx, field, value) => {
    const items = (form.items || []).map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    const newAmount = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    setForm({ ...form, items, amount: newAmount });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const results = [];
      for (const f of files) {
        const res = await processAttachment(f);
        results.push(res);
      }
      setTempFiles(prev => [...prev, ...results]);
      setForm(p => ({ ...p, has_file: true }));
    } catch (err) { alert('فشل المعالجة: ' + err.message); }
  };

  return (
    <Card padded>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">رقم الفاتورة</label>
          <input className="form-input" value={form.invoice_no || ''} readOnly style={{ background: '#f8fafc' }} />
        </div>
        <div className="form-group">
          <label className="form-label">التاريخ</label>
          <input type="date" className="form-input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '25px' }}>
        <label className="form-label">العميل المرسل إليه (To)</label>
        <select className="form-select" value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value })}>
          <option value="">اختر العميل...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>بنود الخدمات</h3>
          <button type="button" onClick={addItem} className="btn btn-sm" style={{ width: 'auto', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>+ إضافة بند</button>
        </div>
        
        {(form.items || []).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <textarea 
                className="form-input" 
                placeholder="وصف الخدمة..." 
                value={item.description} 
                onChange={e => updateItem(idx, 'description', e.target.value)}
                rows={2}
              />
            </div>
            <div style={{ width: '120px' }}>
              <input 
                type="number" 
                step="0.001" 
                className="form-input" 
                placeholder="المبلغ" 
                value={item.amount} 
                onChange={e => updateItem(idx, 'amount', e.target.value)} 
              />
            </div>
            <button type="button" onClick={() => removeItem(idx)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">ملاحظات إضافية (Remarks)</label>
        <textarea className="form-input" rows={3} value={form.remarks || ''} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="اكتب أي شروط أو ملاحظات هنا..." />
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1' }}>
        <label className="form-label">المرفقات (Files/Receipts)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {tempFiles.map((f, i) => (
            <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {f.startsWith('data:image') ? <img src={f} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>PDF</div>}
              <button type="button" onClick={() => setTempFiles(tempFiles.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
            </div>
          ))}
          <button type="button" onClick={() => document.getElementById('billing-files').click()} style={{ width: '60px', height: '60px', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
            <Plus size={20} />
          </button>
          <input type="file" id="billing-files" hidden multiple accept="image/*,.pdf" onChange={handleFileUpload} />
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 800 }}>إجمالي الفاتورة</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>KWD {(parseFloat(form.amount || 0)).toFixed(3)}</div>
        </div>
        <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 40px' }}>حفظ الفاتورة</button>
      </div>
    </Card>
  );
}
