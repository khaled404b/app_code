import React from 'react';
import { Card } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export function ContractorForm({ state, actions }) {
  const { form, clients } = state;
  const { setForm, handleSave, setView } = actions;

  const selectedClientData = clients.find(c => c.id === form.client_id);
  const clientPlots = selectedClientData?.plots || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button type="button" onClick={() => setView('list')} className="icon-btn">
          <ArrowRight size={20} />
        </button>
        <h1 className="page-title">إضافة / تعديل مقاول</h1>
      </div>

      <form onSubmit={handleSave}>
        <Card padded>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">العميل</label>
              <select 
                required 
                className="form-select" 
                value={form.client_id || ''} 
                onChange={e => setForm({ ...form, client_id: e.target.value, plot_no: '' })}
              >
                <option value="">اختر العميل...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">القسيمة</label>
              <select 
                required 
                className="form-select" 
                value={form.plot_no || ''} 
                onChange={e => setForm({ ...form, plot_no: e.target.value })}
                disabled={!form.client_id}
              >
                <option value="">اختر القسيمة...</option>
                {clientPlots.map((p, i) => (
                  <option key={i} value={p.number}>قسيمة {p.number}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">نوع العقد / التخصص</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              placeholder="مثال: صحي، تكييف، كهرباء، هيكل أسود..." 
              value={form.contract_name || ''} 
              onChange={e => setForm({ ...form, contract_name: e.target.value })} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">اسم الشركة</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                placeholder="اسم الشركة المنفذة" 
                value={form.company_name || ''} 
                onChange={e => setForm({ ...form, company_name: e.target.value })} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">اسم المقاول / المندوب</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="اسم الشخص المسؤول" 
                value={form.contact_name || ''} 
                onChange={e => setForm({ ...form, contact_name: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label">رقم الهاتف</label>
            <input 
              required 
              type="tel" 
              className="form-input" 
              placeholder="رقم الهاتف للاتصال" 
              value={form.phone || ''} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
              dir="ltr"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn" style={{ flex: 1 }}>حفظ المقاول</button>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setView('list')}>إلغاء</button>
          </div>
        </Card>
      </form>
    </div>
  );
}
