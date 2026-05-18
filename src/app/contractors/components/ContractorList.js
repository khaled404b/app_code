import React from 'react';
import { Card } from '@/components/ui';
import { Search, Phone, Edit, Trash2, Building, User } from 'lucide-react';

export function ContractorList({ state, actions }) {
  const { clients, selectedClient, selectedPlot, groupedContractors, search, canEdit } = state;
  const { setSelectedClient, setSelectedPlot, setSearch, openNew, openEdit, handleDelete } = actions;

  const selectedClientData = clients.find(c => c.id === selectedClient);
  const clientPlots = selectedClientData?.plots || [];

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">دليل الشركات والمقاولين</h1>
        {canEdit && <button className="btn btn-sm" style={{ width: 'auto' }} onClick={openNew}>+ إضافة مقاول</button>}
      </div>

      <Card padded style={{ marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block' }}>العميل</label>
            <select 
              className="form-select" 
              value={selectedClient || ''} 
              onChange={e => { setSelectedClient(e.target.value); setSelectedPlot(''); }}
            >
              <option value="">جميع العملاء...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block' }}>القسيمة</label>
            <select 
              className="form-select" 
              value={selectedPlot || ''} 
              onChange={e => setSelectedPlot(e.target.value)}
              disabled={!selectedClient}
            >
              <option value="">جميع القسائم...</option>
              {clientPlots.map((p, i) => (
                <option key={i} value={p.number}>قسيمة {p.number}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-wrap" style={{ marginTop: '15px' }}>
          <Search size={17} color="#94a3b8" />
          <input 
            className="search-input" 
            placeholder="بحث بالاسم، التخصص، أو الشركة..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      {Object.keys(groupedContractors).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <Building size={48} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
          <p style={{ fontWeight: 800 }}>لا يوجد مقاولين مسجلين لهذه الفلاتر</p>
          <p style={{ fontSize: '13px', marginTop: '5px' }}>قم باختيار عميل وقسيمة أو أضف مقاول جديد</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {Object.entries(groupedContractors).map(([contractName, contractorsList]) => (
            <div key={contractName}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
                {contractName}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {contractorsList.map(c => {
                  const clientName = clients.find(cl => cl.id === c.client_id)?.name || 'غير محدد';
                  return (
                    <Card key={c.id} style={{ padding: '16px', borderLeft: '4px solid #2563eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{c.company_name}</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <User size={14} /> {c.contact_name || 'بدون اسم مندوب'}
                          </div>
                          {(!selectedClient || !selectedPlot) && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              {clientName} • قسيمة {c.plot_no || 'غير محدد'}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                          <a 
                            href={`tel:${c.phone}`} 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '6px', 
                              background: '#ecfdf5', color: '#059669', 
                              padding: '8px 12px', borderRadius: '20px', 
                              textDecoration: 'none', fontWeight: 800, fontSize: '13px',
                              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.1)'
                            }}
                          >
                            <Phone size={14} />
                            اتصال
                          </a>
                          
                          {canEdit && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Edit size={16} /></button>
                              <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
