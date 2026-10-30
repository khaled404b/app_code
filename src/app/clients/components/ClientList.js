import { Search, ChevronLeft, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui';

const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
export const getColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

export function ClientList({ state, actions }) {
  const { 
    filteredClients, search, clients, canEdit, 
    clientTypeFilter, plotFilter, sortBy, showFilters, stats 
  } = state;
  const { 
    setSearch, openDetail, openNew, setClientTypeFilter, 
    setPlotFilter, setSortBy, setShowFilters 
  } = actions;

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          قائمة العملاء <span style={{ color: 'var(--text-3)', fontSize: '18px' }}>({stats.total})</span>
        </h1>
        {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ عميل جديد</button>}
      </div>

      {/* Quick Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '10px', 
        marginBottom: '16px' 
      }}>
        <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 800 }}>العملاء المعروضون</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', marginTop: '2px' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 800 }}>عملاء طبيعي</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--blue)', marginTop: '2px' }}>{stats.normal}</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--purple)', fontWeight: 800 }}>عملاء نسبة</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--purple)', marginTop: '2px' }}>{stats.commission}</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 800 }}>إجمالي القسائم</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--green)', marginTop: '2px' }}>{stats.totalPlots}</div>
        </div>
      </div>

      {/* Client Type Pills */}
      <div className="pills-row" style={{ marginBottom: '12px' }}>
        {['الكل', 'طبيعي', 'نسبة'].map(t => (
          <button 
            key={t}
            className={`pill ${clientTypeFilter === t ? 'active' : ''}`}
            onClick={() => setClientTypeFilter(t)}
          >
            {t === 'الكل' ? 'جميع الأنواع' : `عميل ${t}`}
          </button>
        ))}
      </div>

      {/* Search Bar & Filter Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={17} color="#94a3b8" />
          <input 
            className="search-input" 
            placeholder="بحث باسم العميل، الهاتف، المنطقة، أو رقم القسيمة..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: showFilters ? 'var(--blue-light)' : 'var(--surface)',
            border: `1.5px solid ${showFilters ? 'var(--blue)' : 'var(--border)'}`,
            color: showFilters ? 'var(--blue)' : 'var(--text-2)',
            padding: '12px 14px', borderRadius: '14px', cursor: 'pointer',
            fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap'
          }}
        >
          <SlidersHorizontal size={16} />
          فلاتر
          <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <Card padded style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">القسائم المسجلة</label>
              <select className="form-select" value={plotFilter} onChange={e => setPlotFilter(e.target.value)}>
                <option value="all">الكل (مع وبدون قسائم)</option>
                <option value="with_plots">لديه قسائم مسجلة فقط</option>
                <option value="no_plots">بدون قسائم مسجلة</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ترتيب القائمة</label>
              <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name_asc">الاسم أبجدياً (أ - ي)</option>
                <option value="plots_desc">عدد القسائم: الأكثر أولاً</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              setClientTypeFilter('الكل');
              setPlotFilter('all');
              setSortBy('name_asc');
              setSearch('');
            }}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--red)', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <RotateCcw size={14} /> إعادة ضبط الفلاتر
          </button>
        </Card>
      )}
      
      {/* Client List Rows */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</span>
                {c.type === 'نسبة' && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--purple-light)', color: 'var(--purple)', fontWeight: 800 }}>
                    نسبة ({c.commission_rate || '8'}%)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                {(c.plots || []).length} قسايم مسجلة • {c.phone || 'بدون هاتف'} {c.location ? `• ${c.location}` : ''}
              </div>
            </div>
            <ChevronLeft size={16} color="var(--text-3)" />
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-3)' }}>
            لا توجد نتائج مطابقة للفلاتر
          </div>
        )}
      </div>
    </div>
  );
}
