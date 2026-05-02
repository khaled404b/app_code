import { Search, ChevronLeft } from 'lucide-react';

const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
export const getColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

export function ClientList({ state, actions }) {
  const { filteredClients, search, clients, canEdit } = state;
  const { setSearch, openDetail, openNew } = actions;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">قائمة العملاء <span style={{ color: '#94a3b8', fontSize: '20px' }}>({clients.length})</span></h1>
        {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ عميل جديد</button>}
      </div>
      
      <div className="search-wrap" style={{ marginBottom: '16px' }}>
        <Search size={17} color="#94a3b8" />
        <input 
          className="search-input" 
          placeholder="بحث باسم العميل أو رقم الهاتف..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      
      <div className="list-group">
        {filteredClients.map(c => (
          <div key={c.id} className="list-row" onClick={() => openDetail(c)}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '12px', background: getColor(c.name), 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white', fontWeight: 900, flexShrink: 0, fontSize: '20px' 
            }}>
              {c.name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {(c.plots || []).length} قسايم مسجلة • {c.phone || 'بدون هاتف'}
              </div>
            </div>
            <ChevronLeft size={16} color="#cbd5e1" />
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد نتائج للبحث</div>
        )}
      </div>
    </div>
  );
}
