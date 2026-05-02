import { ArrowRight, Building2, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui';

export function OfferDetail({ state, actions }) {
  const { selected, canEdit } = state;
  const { goBack, openEdit, handleDelete, markAsSelected, getClientName, fetchAndShowFile } = actions;

  if (!selected) return null;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title" style={{ fontSize: '22px' }}>تفاصيل العرض</h1>
        {canEdit && (
          <button onClick={() => openEdit(selected)} className="btn btn-ghost btn-sm" style={{ marginRight: 'auto', width: 'auto' }}>
            تعديل
          </button>
        )}
      </div>

      <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>كود الطلب: {selected.request_code}</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>{selected.company_name}</h2>
          </div>
          {selected.is_selected && (
            <div style={{ background: '#059669', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
              ✓ تم اختياره
            </div>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>قيمة العرض</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8' }}>{parseFloat(selected.price || 0).toFixed(2)} د.ك</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>نوع العمل</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '5px' }}>{selected.work_type}</div>
          </div>
        </div>
      </div>

      <Card padded style={{ marginBottom: '16px' }}>
        <div className="section-label" style={{ marginTop: 0 }}>بيانات العميل</div>
        <div className="detail-row">
          <span className="detail-label">اسم العميل</span>
          <span className="detail-value">{getClientName(selected.client_id)}</span>
        </div>
        <div className="detail-row" style={{ border: 0 }}>
          <span className="detail-label">رقم القسيمة</span>
          <span className="detail-value">{selected.plot_no || '—'}</span>
        </div>
      </Card>

      <Card padded style={{ marginBottom: '16px' }}>
        <div className="section-label" style={{ marginTop: 0 }}>تفاصيل إضافية</div>
        <div className="detail-row"><FileText size={16} /><span className="detail-label">رقم العرض</span><span className="detail-value">{selected.offer_number || '—'}</span></div>
        <div className="detail-row"><Calendar size={16} /><span className="detail-label">تاريخ الاستلام</span><span className="detail-value">{selected.receive_date}</span></div>
        <div className="detail-row" style={{ border: 0 }}><Calendar size={16} /><span className="detail-label">صلاحية العرض حتى</span><span className="detail-value">{selected.validity_date || '—'}</span></div>
      </Card>

      {(selected.description || selected.notes) && (
        <Card padded style={{ marginBottom: '24px' }}>
          {selected.description && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>الوصف التفصيلي</div>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{selected.description}</p>
            </div>
          )}
          {selected.notes && (
            <div style={{ paddingTop: selected.description ? '16px' : 0, borderTop: selected.description ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>ملاحظات</div>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{selected.notes}</p>
            </div>
          )}
        </Card>
      )}

      {selected.has_file && (
        <Card padded style={{ marginBottom: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="#059669" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#065f46' }}>مستند عرض السعر مرفق</div>
              <div style={{ fontSize: '11px', color: '#047857' }}>تم رفع الملف بنجاح</div>
            </div>
            <button className="btn btn-outline btn-sm" style={{ width: 'auto', background: 'white' }} onClick={() => fetchAndShowFile(selected)}>
              👁️ عرض المرفق
            </button>
          </div>
        </Card>
      )}

      {canEdit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
          {!selected.is_selected && (
            <button className="btn" style={{ background: '#059669' }} onClick={() => markAsSelected(selected.id)}>
              <CheckCircle size={18} style={{ marginLeft: '6px' }} /> اعتماد واختيار هذا العرض
            </button>
          )}
          <button className="btn-danger" onClick={handleDelete}>
            <XCircle size={18} style={{ marginLeft: '6px' }} /> حذف العرض
          </button>
        </div>
      )}
    </div>
  );
}
