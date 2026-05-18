import React from 'react';
import { Card } from '@/components/ui';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ContractorForm({ state, actions }) {
  const { form, clients } = state;
  const { setForm, handleSave, setView } = actions;

  const selectedClientData = clients.find(c => c.id === form.client_id);
  const clientPlots = selectedClientData?.plots || [];

  const addContact = () => {
    const contacts = [...(form.contacts || []), { id: uuidv4(), name: '', phone: '' }];
    setForm({ ...form, contacts });
  };

  const removeContact = (id) => {
    const contacts = (form.contacts || []).filter(c => c.id !== id);
    setForm({ ...form, contacts });
  };

  const updateContact = (id, field, value) => {
    const contacts = (form.contacts || []).map(c => c.id === id ? { ...c, [field]: value } : c);
    setForm({ ...form, contacts });
  };

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

          <div style={{ marginBottom: '20px' }}>
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
          </div>

          <div style={{ marginBottom: '30px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label className="form-label" style={{ margin: 0 }}>المندوبين وجهات الاتصال</label>
              <button type="button" onClick={addContact} className="btn btn-sm" style={{ width: 'auto', background: '#dbeafe', color: '#1e40af' }}>
                <Plus size={16} /> إضافة شخص
              </button>
            </div>
            
            {(form.contacts || []).map((contact, idx) => (
              <div key={contact.id} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="اسم الشخص المسؤول" 
                    value={contact.name} 
                    onChange={e => updateContact(contact.id, 'name', e.target.value)} 
                    required={idx === 0}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="رقم الهاتف للاتصال" 
                    value={contact.phone} 
                    onChange={e => updateContact(contact.id, 'phone', e.target.value)} 
                    dir="ltr"
                    required={idx === 0}
                  />
                </div>
                {(form.contacts || []).length > 1 && (
                  <button type="button" onClick={() => removeContact(contact.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginTop: '2px' }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
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
