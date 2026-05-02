import { ArrowRight, Phone, MapPin, Percent, Hash, Link as LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColor } from './ClientList';

export function ClientDetail({ state, actions }) {
  const { selected, canEdit } = state;
  const { goBack, openEdit, handleDelete } = actions;

  if (!selected) return null;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowRight size={20} /></button>
        <h1 className="page-title" style={{ fontSize: '22px' }}>بيانات العميل</h1>
        {canEdit && (
          <button onClick={() => openEdit(selected)} className="btn btn-ghost btn-sm" style={{ marginRight: 'auto', width: 'auto' }}>
            تعديل
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          width: '72px', height: '72px', borderRadius: '50%', background: getColor(selected.name), 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', 
          fontSize: '28px', fontWeight: 900, color: 'white' 
        }}>
          {selected.name?.[0]}
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{selected.name}</h2>
        <div style={{ marginTop: '8px' }}>
          <span className={`badge ${selected.type === 'نسبة' ? 'badge-orange' : 'badge-blue'}`}>
            {selected.type === 'نسبة' ? `نسبة مكتب (${selected.commission_rate || 8}%)` : 'نظام طبيعي'}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="detail-row">
          <Phone size={16} color="#94a3b8" />
          <span className="detail-label">الهاتف</span>
          <span className="detail-value">{selected.phone || '—'}</span>
        </div>
        {selected.drive_link && (
          <div className="detail-row">
            <LinkIcon size={16} color="#2563eb" />
            <span className="detail-label">جوجل درايف</span>
            <a href={selected.drive_link.trim().startsWith('http') ? selected.drive_link.trim() : `https://${selected.drive_link.trim()}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', fontSize: '13px', direction: 'ltr' }}>
              فتح المجلد
            </a>
          </div>
        )}
        <div className="detail-row" style={{ border: 0 }}>
          <Percent size={16} color="#94a3b8" />
          <span className="detail-label">نسبة المكتب</span>
          <span className="detail-value">{selected.type === 'نسبة' ? `${selected.commission_rate || 8}%` : 'لا يوجد'}</span>
        </div>
      </div>

      <div className="section-label">القسايم والمواقع المسجلة</div>
      <div style={{ display: 'grid', gap: '12px' }}>
        {(selected.plots || []).filter(Boolean).map((pl, i) => (
          <Card key={i} padded style={{ borderRight: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Hash size={14} color="#2563eb" /> قسيمة: {typeof pl === 'object' ? pl.number : pl}
                </div>
                {typeof pl === 'object' && pl.location && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} /> {pl.location}
                  </div>
                )}
              </div>
              {typeof pl === 'object' && pl.maps_link && (
                <a 
                  href={pl.maps_link.trim().startsWith('http') ? pl.maps_link.trim() : `https://${pl.maps_link.trim()}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="icon-btn" 
                  style={{ background: '#ecfdf5', border: '1px solid #10b981', width: '32px', height: '32px' }}
                >
                  <MapPin size={16} color="#059669" />
                </a>
              )}
            </div>
          </Card>
        ))}
        {(!selected.plots || selected.plots.length === 0) && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>لا توجد قسايم مسجلة</div>
        )}
      </div>

      {selected.notes && (
        <>
          <div className="section-label">ملاحظات</div>
          <div className="card card-padded" style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', lineHeight: 1.6 }}>{selected.notes}</p>
          </div>
        </>
      )}

      {canEdit && (
        <button className="btn-danger" style={{ width: '100%', marginTop: '24px' }} onClick={handleDelete}>
          حذف العميل
        </button>
      )}
    </div>
  );
}
