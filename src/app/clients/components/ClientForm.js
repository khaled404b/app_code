import { ArrowRight, X } from 'lucide-react';

export function ClientForm({ state, actions }) {
  const { selected, form, newPlot } = state;
  const { goBack, handleSave, addPlot, removePlot, setForm, setNewPlot } = actions;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title">{selected ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h1>
      </div>
      
      <form onSubmit={handleSave}>
        <div className="card card-padded">
          <div className="form-group">
            <label className="form-label">اسم العميل</label>
            <input 
              className="form-input" 
              required 
              value={form.name || ''} 
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input 
              className="form-input" 
              value={form.phone || ''} 
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">رابط جوجل درايف (Google Drive)</label>
            <input 
              className="form-input" 
              placeholder="مثال: https://drive.google.com/..." 
              value={form.drive_link || ''} 
              onChange={e => setForm(p => ({ ...p, drive_link: e.target.value }))} 
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          
          <div className="section-label" style={{ marginTop: '20px', marginBottom: '10px' }}>إدارة القسايم والمواقع</div>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>رقم القسيمة</label>
                <input 
                  className="form-input" 
                  placeholder="مثال: 14" 
                  value={newPlot.number || ''} 
                  onChange={e => setNewPlot(p => ({ ...p, number: e.target.value }))} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>الموقع / المنطقة</label>
                <input 
                  className="form-input" 
                  placeholder="مثال: المطلاع" 
                  value={newPlot.location || ''} 
                  onChange={e => setNewPlot(p => ({ ...p, location: e.target.value }))} 
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>رابط خرائط جوجل لهذه القسيمة</label>
              <input 
                className="form-input" 
                placeholder="أدخل رابط Google Maps هنا..." 
                value={newPlot.maps_link || ''} 
                onChange={e => setNewPlot(p => ({ ...p, maps_link: e.target.value }))} 
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
            <button type="button" className="btn btn-sm" onClick={addPlot} disabled={!newPlot.number}>
              + إضافة القسيمة للقائمة
            </button>
          </div>

          <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
            {(form.plots || []).filter(Boolean).map((pl, i) => (
              <div key={i} style={{ 
                background: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' 
              }}>
                <div>
                  <span style={{ fontWeight: 800 }}>قسيمة: {typeof pl === 'object' ? pl.number : pl}</span>
                  {typeof pl === 'object' && pl.location && (
                    <span style={{ color: '#64748b', marginRight: '8px' }}>({pl.location})</span>
                  )}
                </div>
                <X size={16} style={{ cursor: 'pointer', color: '#dc2626' }} onClick={() => removePlot(i)} />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">نوع العميل</label>
            <select 
              className="form-select" 
              value={form.type || 'طبيعي'} 
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            >
              <option value="طبيعي">طبيعي (بدون نسبة)</option>
              <option value="نسبة">نسبة مكتب</option>
            </select>
          </div>
          
          {form.type === 'نسبة' && (
            <div className="form-group">
              <label className="form-label">قيمة النسبة (%)</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.commission_rate || ''} 
                onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))} 
                placeholder="مثال: 8" 
              />
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ملاحظات إضافية</label>
            <textarea 
              className="form-input" 
              rows={3} 
              value={form.notes || ''} 
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} 
            />
          </div>
        </div>
        
        <button type="submit" className="btn" style={{ marginTop: '20px' }}>حفظ بيانات العميل</button>
      </form>
    </div>
  );
}
