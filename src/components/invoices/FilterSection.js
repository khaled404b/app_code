import React from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Card } from '../ui';

export const FilterSection = ({ filters, setF, clients, showFilters, setShowFilters, initialFilters }) => {
  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
        {['الكل', 'مدفوعة', 'معلقة', 'متأخرة'].map(s => (
          <button 
            key={s} 
            className={`pill ${filters.status === s ? 'active' : ''}`} 
            onClick={() => setF('status', s)}
          >
            {s}
          </button>
        ))}
      </div>

      <button 
        onClick={() => setShowFilters(!showFilters)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '12px', marginBottom: '12px', width: '100%', fontSize: '14px', fontWeight: 800 }}
      >
        <SlidersHorizontal size={16} /> فلاتر وتصنيف متقدم 
        <ChevronDown size={16} style={{ marginRight: 'auto', transform: showFilters ? 'rotate(180deg)' : 'none' }} />
      </button>

      {showFilters && (
        <Card padded style={{ marginBottom: '15px' }}>
          <div className="form-group">
            <label className="form-label">تصفية حسب العميل</label>
            <select className="form-select" value={filters.client} onChange={e => setF('client', e.target.value)}>
              <option value="الكل">كل العملاء</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div><label className="form-label">من تاريخ</label><input type="date" className="form-input" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)} /></div>
            <div><label className="form-label">إلى تاريخ</label><input type="date" className="form-input" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div><label className="form-label">السعر من</label><input type="number" placeholder="0.000" className="form-input" value={filters.amountMin} onChange={e => setF('amountMin', e.target.value)} /></div>
            <div><label className="form-label">السعر إلى</label><input type="number" placeholder="999.999" className="form-input" value={filters.amountMax} onChange={e => setF('amountMax', e.target.value)} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">ترتيب حسب التاريخ</label>
            <select className="form-select" value={filters.sort} onChange={e => setF('sort', e.target.value)}>
              <option value="desc">من الأحدث إلى الأقدم</option>
              <option value="asc">من الأقدم إلى الأحدث</option>
            </select>
          </div>
          <button 
            onClick={() => setF('reset', initialFilters)} 
            className="btn-danger" 
            style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '12px' }}
          >
            تصفير كافة الفلاتر
          </button>
        </Card>
      )}
    </>
  );
};
