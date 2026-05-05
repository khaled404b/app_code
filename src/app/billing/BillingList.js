import React from 'react';
import { Card, Badge } from '@/components/ui';
import { FileText, Printer, Trash2, Edit2, Calendar, User, DollarSign, Paperclip } from 'lucide-react';

export default function BillingList({ billingInvoices, onEdit, onDelete, onPrint }) {
  if (billingInvoices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <FileText size={32} color="#94a3b8" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#475569' }}>لا توجد فواتير مكتب مسجلة</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>ابدأ بإضافة أول فاتورة صادرة من المكتب للعملاء</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {billingInvoices.map((inv) => (
        <Card key={inv.id} padded onClick={() => onPrint(inv)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="#0369a1" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 950, margin: 0, color: '#0f172a' }}>{inv.invoice_no}</h3>
                  {inv.has_file && <Paperclip size={14} color="#94a3b8" />}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    <User size={14} /> {inv.client_name} {inv.plot_no ? `(قسيمة ${inv.plot_no})` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    <Calendar size={14} /> {inv.date}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 950, color: '#0f172a' }}>{parseFloat(inv.amount || 0).toFixed(3)} <small style={{ fontSize: '10px' }}>د.ك</small></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onPrint(inv); }}
                  style={{ background: '#f0fdf4', border: '1px solid #dcfce7', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#059669' }}
                >
                  <Printer size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(inv.id); }}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
