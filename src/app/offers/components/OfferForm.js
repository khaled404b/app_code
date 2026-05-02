import { ArrowRight, Upload, Loader2, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { processAttachment } from '@/lib/fileHelper';

export function OfferForm({ state, actions }) {
  const { selected, form, clients, services, tempFiles } = state;
  const { goBack, handleSave, setForm, setTempFiles } = actions;
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);


  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title">{selected ? 'تعديل عرض' : 'تسجيل عرض جديد'}</h1>
      </div>
      
      <form onSubmit={handleSave}>
        <div className="card card-padded">
          <div className="section-label" style={{ marginTop: 0 }}>بيانات الطلب</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">كود الطلب (تلقائي)</label>
              <input className="form-input" required value={form.request_code || ''} onChange={e => setForm(p => ({ ...p, request_code: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">العميل</label>
              <select className="form-select" required value={form.client_id || ''} onChange={e => {
                const clientId = e.target.value;
                const client = clients.find(c => c.id === clientId);
                const firstPlot = client?.plots?.[0];
                const plotVal = typeof firstPlot === 'object' ? firstPlot.number : firstPlot;
                setForm(p => ({ ...p, client_id: clientId, plot_no: plotVal || '' }));
              }}>
                <option value="">اختر العميل...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {(() => {
              const selectedClient = clients.find(c => c.id === form.client_id);
              const plots = selectedClient?.plots || [];
              
              if (plots.length > 1) {
                return (
                  <div className="form-group">
                    <label className="form-label">اختر القسيمة</label>
                    <select 
                      className="form-select" 
                      required 
                      value={form.plot_no || ''} 
                      onChange={e => setForm(p => ({ ...p, plot_no: e.target.value }))}
                    >
                      <option value="">اختر القسيمة...</option>
                      {plots.map((pl, i) => {
                        const num = typeof pl === 'object' ? pl.number : pl;
                        const loc = typeof pl === 'object' ? pl.location : '';
                        return <option key={i} value={num}>{num} {loc ? `(${loc})` : ''}</option>
                      })}
                    </select>
                  </div>
                );
              } else if (plots.length === 1 || selectedClient?.plot_no) {
                const p = plots[0] || selectedClient?.plot_no;
                const val = typeof p === 'object' ? p.number : p;
                return (
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#64748b' }}>رقم القسيمة</label>
                    <input className="form-input" readOnly value={val || ''} style={{ background: '#f8fafc', color: '#475569', cursor: 'default' }} />
                  </div>
                );
              }
              return null;
            })()}
          </div>
          
          <div className="form-group">
            <label className="form-label">نوع العمل</label>
            <select className="form-select" required value={form.work_type || ''} onChange={e => setForm(p => ({ ...p, work_type: e.target.value }))}>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="آخر...">+ أخرى (كتابة يدوية)</option>
            </select>
            {form.work_type === 'آخر...' && (
               <input 
                 className="form-input" 
                 style={{ marginTop: '8px' }} 
                 placeholder="اكتب نوع العمل هنا..." 
                 required
                 value={state.customWorkType || ''} 
                 onChange={e => actions.setCustomWorkType(e.target.value)} 
               />
            )}
          </div>

          <div className="section-label">بيانات العرض</div>
          <div className="form-group">
            <label className="form-label">اسم الشركة (مقدمة العرض)</label>
            <input className="form-input" required value={form.company_name || ''} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">رقم العرض</label>
              <input className="form-input" value={form.offer_number || ''} onChange={e => setForm(p => ({ ...p, offer_number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">قيمة العرض (د.ك)</label>
              <input type="number" step="0.001" className="form-input" required value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">تاريخ الاستلام</label>
              <input type="date" className="form-input" required value={form.receive_date || ''} onChange={e => setForm(p => ({ ...p, receive_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">صلاحية العرض حتى</label>
              <input type="date" className="form-input" value={form.validity_date || ''} onChange={e => setForm(p => ({ ...p, validity_date: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">وصف تفصيلي</label>
            <textarea className="form-input" rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات إضافية</label>
            <textarea className="form-input" rows={2} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">الحالة</label>
            <select className="form-select" value={form.status || 'قيد الدراسة'} onChange={e => setForm(p => ({ ...p, status: e.target.value, is_selected: e.target.value === 'مختار' }))}>
              <option value="قيد الدراسة">قيد الدراسة</option>
              <option value="مختار">مختار</option>
              <option value="مستبعد">مستبعد</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <label className="form-label">المرفقات (عرض السعر PDF أو صورة) - يمكنك اختيار أكثر من ملف</label>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf" multiple onChange={async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            setUploading(true);
            try {
              const results = [];
              for (const f of files) {
                const res = await processAttachment(f);
                results.push(res);
              }
              actions.setTempFiles(prev => [...prev, ...results]);
              setForm(p => ({ ...p, has_file: true }));
            } catch (err) {
              console.error(err);
              alert('فشل معالجة بعض الملفات: ' + err.message);
            }
            setUploading(false);
          }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {state.tempFiles?.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>مرفق #{i+1} ({f.startsWith('[') ? 'مستند متعدد الصفحات' : 'صورة/ملف'})</span>
                <button type="button" onClick={() => {
                  const newFiles = state.tempFiles.filter((_, idx) => idx !== i);
                  actions.setTempFiles(newFiles);
                  if (newFiles.length === 0 && !form.has_file) setForm(p => ({ ...p, has_file: false }));
                }} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14}/></button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} style={{ marginLeft: '6px' }} />} 
              إضافة مرفقات عرض السعر
            </button>
          </div>

          {form.has_file && state.tempFiles.length === 0 && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>✓ يوجد مرفقات سابقة (سيتم الاحتفاظ بها ما لم ترفع ملفات جديدة)</div>
          )}
        </div>
        
        <button type="submit" className="btn" style={{ marginTop: '20px' }}>حفظ العرض</button>
      </form>
    </div>
  );
}
