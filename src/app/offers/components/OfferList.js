import { Search, ChevronLeft, BarChart2 } from 'lucide-react';

const getStatusColor = (status) => {
  switch(status) {
    case 'مختار': return '#059669'; // Green
    case 'مستبعد': return '#dc2626'; // Red
    case 'قيد الدراسة': return '#d97706'; // Orange
    default: return '#64748b';
  }
};

export function OfferList({ state, actions }) {
  const { filteredOffers, search, canEdit, offers } = state;
  const { setSearch, openDetail, openNew, openComparison, getClientName } = actions;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">سجل العروض <span style={{ color: '#94a3b8', fontSize: '20px' }}>({offers.length})</span></h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={openComparison}>
            <BarChart2 size={16} style={{ marginLeft: '4px' }} /> مقارنة العروض
          </button>
          {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ عرض جديد</button>}
        </div>
      </div>
      
      <div className="search-wrap" style={{ marginBottom: '16px' }}>
        <Search size={17} color="#94a3b8" />
        <input 
          className="search-input" 
          placeholder="بحث عن عرض، شركة أو عميل..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      
      <div className="list-group">
        {filteredOffers.map(o => (
          <div key={o.id} className="list-row" onClick={() => openDetail(o)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px' }}>{o.company_name}</span>
                <span style={{ fontWeight: 900, color: '#2563eb' }}>{parseFloat(o.price || 0).toFixed(2)} د.ك</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{getClientName(o.client_id)}</span>
                {o.plot_no && <span>({o.plot_no})</span>}
                <span>•</span>
                <span>{o.work_type}</span>
                <span>•</span>
                <span>كود: {o.request_code}</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <span className="badge" style={{ background: getStatusColor(o.status) + '15', color: getStatusColor(o.status), border: `1px solid ${getStatusColor(o.status)}40` }}>
                  {o.status}
                </span>
                {o.has_file && <span className="badge badge-blue" style={{ marginLeft: '6px' }}>مرفق 📎</span>}
              </div>
            </div>
            <ChevronLeft size={16} color="#cbd5e1" style={{ marginRight: '10px' }} />
          </div>
        ))}
        {filteredOffers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد عروض مطابقة للبحث</div>
        )}
      </div>
    </div>
  );
}
