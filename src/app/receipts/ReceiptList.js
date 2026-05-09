import React from 'react';
import { Card } from '@/components/ui';
import { Printer, Edit, Trash2, FileText } from 'lucide-react';

export default function ReceiptList({ receipts, onEdit, onDelete, onPrint, onExportPDF }) {
  if (!receipts.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        لا توجد سندات قبض مسجلة حالياً.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {receipts.map(rec => (
        <Card key={rec.id} style={{ marginBottom: '10px' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800 }}>{rec.receipt_no}</div>
              <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>{rec.received_from}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{rec.date}</div>
            </div>
            
            <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  KWD {parseFloat(rec.amount_kd || 0).toFixed(0)}.{String(rec.amount_fils || 0).padStart(3, '0')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'left' }}>المبلغ</div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => onPrint(rec)} 
                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="طباعة"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => onExportPDF(rec)} 
                  style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="تصدير PDF"
                >
                  <FileText size={18} />
                </button>
                <button 
                  onClick={() => onEdit(rec)} 
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="تعديل"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => onDelete(rec.id)} 
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
