import { ArrowRight, Upload, X, Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { processAttachment } from '@/lib/fileHelper';
import SignaturePad from '@/components/SignaturePad';
import { Card } from '@/components/ui';

export function DeliveryForm({ state, actions }) {
  const { form, clients, tempFiles } = state;
  const { goBack, handleSave, setForm, setTempFiles } = actions;
  const fileInputRef = useRef(null);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateNested = (parent, key, value) => {
    setForm(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const updateDoc = (index, key, value) => {
    const newList = [...form.document_list];
    newList[index] = { ...newList[index], [key]: value };
    updateForm('document_list', newList);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await processAttachment(file);
      setTempFileBase64(result);
      updateForm('has_file', true);
    } catch (err) {
      alert('فشل معالجة الملف');
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title">{form.id ? 'تعديل إرسال مستندات' : 'إرسال مستندات جديد'}</h1>
      </div>

      <form onSubmit={handleSave}>
        <Card padded style={{ marginBottom: '20px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>بيانات المشروع الأساسية</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">اسم المشروع</label>
              <input className="form-input" required value={form.project_name || ''} onChange={e => updateForm('project_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم المشروع</label>
              <input className="form-input" value={form.project_no || ''} onChange={e => updateForm('project_no', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم العقد</label>
              <input className="form-input" value={form.contract_no || ''} onChange={e => updateForm('contract_no', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">إلى</label>
              <input className="form-input" value={form.to || ''} onChange={e => updateForm('to', e.target.value)} placeholder="مثال: ورثة أحمد المحري" />
            </div>
            <div className="form-group">
              <label className="form-label">من</label>
              <input className="form-input" value={form.from || ''} onChange={e => updateForm('from', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">عناية</label>
              <input className="form-input" value={form.attn || ''} onChange={e => updateForm('attn', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">التاريخ</label>
              <input type="date" className="form-input" value={form.date || ''} onChange={e => updateForm('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم الإرسال</label>
              <input className="form-input" value={form.transmittal_no || ''} onChange={e => updateForm('transmittal_no', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم المراجعة</label>
              <input className="form-input" value={form.ref_no || ''} onChange={e => updateForm('ref_no', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">مرجع العميل</label>
              <input className="form-input" value={form.client_ref || ''} onChange={e => updateForm('client_ref', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">الموضوع</label>
              <input className="form-input" value={form.subject || ''} onChange={e => updateForm('subject', e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Attachments Section First */}
        <Card padded style={{ marginBottom: '20px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>نوع المرفقات (المرفقات)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              'وثائق و سندات', 'رسومات و مخططات', 'تقارير', 
              'أمر تغيير', 'خطاب', 'فاتورة', 
              'جدول كميات و مواصفات', 'نسخة إلكترونية'
            ].map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.attachments?.[key] || false} onChange={e => updateNested('attachments', key, e.target.checked)} />
                {key}
              </label>
            ))}
          </div>
        </Card>

        {/* Purpose Section Second */}
        <Card padded style={{ marginBottom: '20px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>مقدم من أجل</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {Object.keys(form.purpose || {}).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.purpose[key]} onChange={e => updateNested('purpose', key, e.target.checked)} />
                {key}
              </label>
            ))}
          </div>
        </Card>

        {/* Action Taken Section Third */}
        <Card padded style={{ marginBottom: '20px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>الإجراء المتخذ / الرموز</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.keys(form.action_codes || {}).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.action_codes[key]} onChange={e => updateNested('action_codes', key, e.target.checked)} />
                <span style={{ fontWeight: 'bold', minWidth: '15px' }}>{key === 'إرسال منفصل' ? '' : key}</span> {
                  key === 'A' ? 'موافقة' :
                  key === 'B' ? 'موافقة مع ملاحظات' :
                  key === 'C' ? 'موافقة مع تعليقات' :
                  key === 'D' ? 'غير موافق عليه' :
                  key === 'N' ? 'تمت الإشارة' :
                  key === 'R' ? 'تمت المراجعة - مطابق' :
                  key === 'S' ? 'تمت المراجعة مع ملاحظات' :
                  key === 'T' ? 'مراجعة مع تعليقات' : key
                }
              </label>
            ))}
          </div>
        </Card>

        <Card padded style={{ marginBottom: '20px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>قائمة المستندات (حتى 10 أسطر)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>م</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', minWidth: '120px' }}>المستند</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>الرقم</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>التاريخ</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', minWidth: '120px' }}>الوصف</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>النسخة</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', minWidth: '100px' }}>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {form.document_list?.map((doc, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input className="form-input" style={{ fontSize: '11px', padding: '4px' }} value={doc.document} onChange={e => updateDoc(i, 'document', e.target.value)} />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input className="form-input" style={{ fontSize: '11px', padding: '4px' }} value={doc.number} onChange={e => updateDoc(i, 'number', e.target.value)} />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input type="date" className="form-input" style={{ fontSize: '11px', padding: '4px' }} value={doc.date} onChange={e => updateDoc(i, 'date', e.target.value)} />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input className="form-input" style={{ fontSize: '11px', padding: '4px' }} value={doc.description} onChange={e => updateDoc(i, 'description', e.target.value)} />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input className="form-input" style={{ fontSize: '11px', padding: '4px' }} value={doc.version} onChange={e => updateDoc(i, 'version', e.target.value)} />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input className="form-input" style={{ fontSize: '11px', padding: '4px' }} value={doc.notes} onChange={e => updateDoc(i, 'notes', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padded style={{ marginBottom: '20px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>التواقيع والختم</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">توقيع المرسل</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const base64 = await processAttachment(file);
                  updateNested('signatures', 'sender', base64);
                }
              }} />
              {form.signatures?.sender && <img src={form.signatures.sender} style={{ maxHeight: '60px', marginTop: '10px' }} />}
            </div>
            <div className="form-group">
              <label className="form-label">الختم</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const base64 = await processAttachment(file);
                  updateNested('signatures', 'stamp', base64);
                }
              }} />
              {form.signatures?.stamp && <img src={form.signatures.stamp} style={{ maxHeight: '60px', marginTop: '10px' }} />}
            </div>
            <div className="form-group">
              <label className="form-label">توقيع المستلم (اختياري)</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const base64 = await processAttachment(file);
                  updateNested('signatures', 'receiver', base64);
                }
              }} />
              {form.signatures?.receiver && <img src={form.signatures.receiver} style={{ maxHeight: '60px', marginTop: '10px' }} />}
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">ملاحظات إضافية</label>
            <textarea className="form-input" rows={2} value={form.notes || ''} onChange={e => updateForm('notes', e.target.value)} />
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <label className="form-label">توزيع النسخ</label>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {[
                'المهندس و الاستشاري',
                'المقاول و الشركة و جهة أخرى',
                'الجهة المالكة'
              ].map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.distribution?.[key] || false} onChange={e => updateNested('distribution', key, e.target.checked)} />
                  {key}
                </label>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', marginBottom: '24px' }}>
          <label className="form-label">المرفقات (دمج مع الملف النهائي) - يمكنك اختيار أكثر من ملف</label>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf" multiple onChange={async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            try {
              const results = [];
              for (const f of files) {
                const res = await processAttachment(f);
                results.push(res);
              }
              setTempFiles(prev => [...prev, ...results]);
              updateForm('has_file', true);
            } catch (err) {
              console.error(err);
              alert('فشل معالجة بعض الملفات: ' + err.message);
            }
          }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {state.tempFiles?.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>مرفق #{i+1} ({f.startsWith('[') ? 'مستند متعدد الصفحات' : 'صورة/ملف'})</span>
                <button type="button" onClick={() => {
                  const newFiles = state.tempFiles.filter((_, idx) => idx !== i);
                  setTempFiles(newFiles);
                  if (newFiles.length === 0 && !form.has_file) updateForm('has_file', false);
                }} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14}/></button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current.click()}><Plus size={16} style={{ marginLeft: '6px' }} /> إضافة مرفقات</button>
          </div>
          
          {form.has_file && state.tempFiles.length === 0 && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>✓ يوجد مرفقات سابقة (سيتم الاحتفاظ بها ما لم ترفع ملفات جديدة)</div>
          )}
        </div>

        <button type="submit" className="btn" style={{ marginBottom: '40px' }}>حفظ البيانات</button>
      </form>
    </div>
  );
}
