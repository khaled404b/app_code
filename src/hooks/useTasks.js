import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { STATUS_CFG } from '@/constants/config';

export const useTasks = (tasks, clients) => {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({ 
    status: 'الكل', 
    client: 'الكل', 
    dateFrom: '', 
    dateTo: '', 
    search: '', 
    sort: 'priority' 
  });

  useEffect(() => {
    const s = searchParams.get('status');
    const c = searchParams.get('client');
    if (s || c) {
      setFilters(prev => ({ ...prev, status: s || prev.status, client: c || prev.client }));
    }
  }, [searchParams]);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let list = tasks.filter(t => {
      if (!t) return false;
      const client = clients.find(c => c.id === t.client_id);
      const cn = (client && client.name) || '—';
      
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(t.title || '').toLowerCase().includes(q) && !cn.toLowerCase().includes(q)) return false;
      }
      if (filters.status !== 'الكل' && t.status !== filters.status) return false;
      if (filters.client !== 'الكل' && t.client_id !== filters.client) return false;
      if (filters.dateFrom && t.start_date < filters.dateFrom) return false;
      if (filters.dateTo && t.start_date > filters.dateTo) return false;
      return true;
    });

    list.sort((a, b) => {
      if (filters.sort === 'priority') {
        const p1 = STATUS_CFG.TASKS[a.status]?.priority || 99;
        const p2 = STATUS_CFG.TASKS[b.status]?.priority || 99;
        if (p1 !== p2) return p1 - p2;
        return (b.start_date || '').localeCompare(a.start_date || '');
      } else {
        const d1 = a.start_date || '';
        const d2 = b.start_date || '';
        return filters.sort === 'desc' ? d2.localeCompare(d1) : d1.localeCompare(d2);
      }
    });

    return list;
  }, [tasks, clients, filters]);

  return { filters, setF, filteredTasks, setFilters };
};
