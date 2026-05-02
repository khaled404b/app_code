import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const useInvoices = (invoices, clients) => {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({ 
    status: 'الكل', 
    client: 'الكل', 
    dateFrom: '', 
    dateTo: '', 
    amountMin: '', 
    amountMax: '',
    search: '', 
    sort: 'desc' 
  });

  // Handle URL params
  useEffect(() => {
    const s = searchParams.get('status');
    const c = searchParams.get('client');
    if (s || c) {
      setFilters(prev => ({ ...prev, status: s || prev.status, client: c || prev.client }));
    }
  }, [searchParams]);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      if (!inv) return false;
      const client = clients.find(c => c.id === inv.client_id);
      const cn = (client && client.name) || '—';
      const amt = parseFloat(inv.amount) || 0;
      
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches = (inv.invoice_no || '').toLowerCase().includes(query) ||
                        cn.toLowerCase().includes(query) ||
                        (inv.contractor || '').toLowerCase().includes(query) ||
                        (inv.description || '').toLowerCase().includes(query) ||
                        (inv.service_type || '').toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (filters.status !== 'الكل' && inv.status !== filters.status) return false;
      if (filters.client !== 'الكل' && inv.client_id !== filters.client) return false;
      if (filters.dateFrom && inv.issue_date < filters.dateFrom) return false;
      if (filters.dateTo && inv.issue_date > filters.dateTo) return false;
      if (filters.amountMin && amt < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && amt > parseFloat(filters.amountMax)) return false;
      
      return true;
    }).sort((a, b) => {
      const d1 = a.issue_date || '';
      const d2 = b.issue_date || '';
      return filters.sort === 'desc' ? d2.localeCompare(d1) : d1.localeCompare(d2);
    });
  }, [invoices, clients, filters]);

  return { filters, setF, filteredInvoices, setFilters };
};
