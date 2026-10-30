import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { STATUS_CFG } from '@/constants/config';

const INITIAL_FILTERS = {
  status: 'الكل',
  client: 'الكل',
  dateFrom: '',
  dateTo: '',
  search: '',
  sort: 'priority'
};

export const useTasks = (tasks = [], clients = []) => {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    const s = searchParams.get('status');
    const c = searchParams.get('client');
    if (s || c) {
      setFilters(prev => ({
        ...prev,
        status: s && s !== 'all' ? s : prev.status,
        client: c && c !== 'all' ? c : prev.client
      }));
    }
  }, [searchParams]);

  const setF = (k, v) => {
    if (k === 'reset') {
      setFilters(INITIAL_FILTERS);
    } else {
      setFilters(p => ({ ...p, [k]: v }));
    }
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let list = tasks.filter(t => {
      if (!t) return false;
      const client = clients.find(c => c.id === t.client_id);
      const cn = (client && client.name) || '—';
      
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches = 
          (t.title || '').toLowerCase().includes(q) ||
          cn.toLowerCase().includes(q) ||
          (t.service_type || '').toLowerCase().includes(q) ||
          (t.assignee || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (filters.status !== 'الكل' && filters.status !== 'all' && t.status !== filters.status) {
        return false;
      }

      if (filters.client !== 'الكل' && filters.client !== 'all' && t.client_id !== filters.client) {
        return false;
      }

      if (filters.dateFrom && t.start_date && t.start_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && t.start_date && t.start_date > filters.dateTo) {
        return false;
      }

      return true;
    });

    list.sort((a, b) => {
      if (filters.sort === 'priority') {
        const p1 = STATUS_CFG.TASKS[a.status]?.priority || 99;
        const p2 = STATUS_CFG.TASKS[b.status]?.priority || 99;
        if (p1 !== p2) return p1 - p2;
        return (b.start_date || '').localeCompare(a.start_date || '');
      } else if (filters.sort === 'desc') {
        return (b.start_date || '').localeCompare(a.start_date || '');
      } else {
        return (a.start_date || '').localeCompare(b.start_date || '');
      }
    });

    return list;
  }, [tasks, clients, filters]);

  // Overall task stats & filtered task stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status === 'منجزة').length;
    const active = filteredTasks.filter(t => t.status === 'جارية').length;
    const late = filteredTasks.filter(t => t.status === 'متأخرة').length;
    const pending = filteredTasks.filter(t => t.status === 'معلقة' || t.status === 'لم تبدأ').length;
    return {
      total,
      done,
      active,
      late,
      pending,
      percent: total > 0 ? Math.round((done / total) * 100) : 0
    };
  }, [filteredTasks]);

  return { filters, setF, filteredTasks, setFilters, showFilters, setShowFilters, stats };
};
