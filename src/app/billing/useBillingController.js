import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { ref, update, set } from 'firebase/database';
import { db } from '@/lib/firebase';

const INITIAL_FILTERS = {
  status: 'الكل',
  client: 'الكل',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
  hasAttachment: 'all',
  sort: 'date_desc'
};

export function useBillingController() {
  const searchParams = useSearchParams();
  const { data, isLoading, updateData } = useData();
  const { user, canEdit } = useAuth();
  
  const [view, setView] = useState('list'); // 'list', 'form', 'print', 'detail'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [form, setForm] = useState({});
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  const [loadingFile, setLoadingFile] = useState(false);

  // Sync with URL query parameters (e.g. from Dashboard)
  useEffect(() => {
    if (!searchParams) return;
    const s = searchParams.get('status');
    const c = searchParams.get('client');
    if (s || c) {
      setFilters(prev => ({
        ...prev,
        status: s || prev.status,
        client: c || prev.client
      }));
    }
  }, [searchParams]);

  const rawBilling = data?.billingInvoices || [];
  const billingInvoices = (Array.isArray(rawBilling) ? rawBilling : Object.values(rawBilling)).filter(Boolean);
  const clients = (data?.clients || []).filter(Boolean);

  const setF = (key, value) => {
    if (key === 'reset') {
      setFilters(INITIAL_FILTERS);
      setSearch('');
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const filtered = useMemo(() => {
    return billingInvoices.filter(inv => {
      if (!inv) return false;
      
      // Text search
      if (search) {
        const lowerSearch = search.toLowerCase();
        const matches = 
          inv.invoice_no?.toLowerCase().includes(lowerSearch) ||
          inv.client_name?.toLowerCase().includes(lowerSearch) ||
          inv.subject?.toLowerCase().includes(lowerSearch) ||
          inv.remarks?.toLowerCase().includes(lowerSearch);
        if (!matches) return false;
      }

      // Status filter
      if (filters.status !== 'الكل' && inv.status !== filters.status) {
        return false;
      }

      // Client filter
      if (filters.client !== 'الكل' && inv.client_id !== filters.client) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && inv.date && inv.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && inv.date && inv.date > filters.dateTo) {
        return false;
      }

      // Amount range filter
      const amount = parseFloat(inv.amount) || 0;
      if (filters.amountMin && amount < parseFloat(filters.amountMin)) {
        return false;
      }
      if (filters.amountMax && amount > parseFloat(filters.amountMax)) {
        return false;
      }

      // Attachment filter
      if (filters.hasAttachment === 'yes' && !inv.has_file) return false;
      if (filters.hasAttachment === 'no' && inv.has_file) return false;

      return true;
    }).sort((a, b) => {
      if (filters.sort === 'date_desc') {
        return (b.date || '').localeCompare(a.date || '');
      }
      if (filters.sort === 'date_asc') {
        return (a.date || '').localeCompare(b.date || '');
      }
      if (filters.sort === 'amount_desc') {
        return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      }
      if (filters.sort === 'amount_asc') {
        return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      }
      return 0;
    });
  }, [billingInvoices, search, filters]);

  // Dynamic statistics calculated on filtered data
  const stats = useMemo(() => {
    const totalCount = filtered.length;
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    filtered.forEach(inv => {
      const amt = parseFloat(inv.amount) || 0;
      totalAmount += amt;
      if (inv.status === 'مدفوعة') {
        paidAmount += amt;
        paidCount++;
      } else if (inv.status === 'معلقة' || !inv.status) {
        pendingAmount += amt;
        pendingCount++;
      }
    });

    return {
      totalCount,
      totalAmount,
      paidAmount,
      pendingAmount,
      paidCount,
      pendingCount
    };
  }, [filtered]);

  const generateNextNo = () => {
    const prefix = 'FB'; // Frame Billing
    const year = new Date().getFullYear();
    const relevant = billingInvoices.filter(i => i.invoice_no?.startsWith(`${prefix}-${year}`));
    if (relevant.length === 0) return `${prefix}-${year}-001`;
    const nums = relevant.map(i => parseInt(i.invoice_no.split('-')[2])).filter(n => !isNaN(n));
    const max = Math.max(...nums, 0);
    return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const invId = selected ? selected.id : uuidv4();

    // Extract stamp separately — don't store large base64 in main list
    const stampImage = form.stamp_image || null;

    // Build payload WITHOUT stamp_image (stored separately)
    const { stamp_image: _removed, ...formWithoutStamp } = form;
    const rawPayload = {
      ...formWithoutStamp,
      id: invId,
      amount: parseFloat(form.amount || 0),
      date: form.date || new Date().toISOString().split('T')[0],
      client_name: form.client_name || clients.find(c => c.id === form.client_id)?.name || '—',
      has_file: !!(tempFiles.length > 0 || form.has_file),
      has_stamp: !!stampImage,
      created_by: selected ? (selected.created_by || '—') : user?.name || '—',
      updated_at: new Date().toISOString()
    };

    const payload = JSON.parse(JSON.stringify(rawPayload));

    try {
      const newList = selected 
        ? billingInvoices.map(i => i.id === selected.id ? payload : i)
        : [...billingInvoices, payload];

      const cleanList = JSON.parse(JSON.stringify(newList.filter(Boolean)));
      await update(ref(db), { billingInvoices: cleanList });

      if (tempFiles.length > 0) {
        await set(ref(db, `attachments/${invId}`), JSON.stringify(tempFiles));
      }

      if (stampImage) {
        await set(ref(db, `stamps/${invId}`), stampImage);
      }

      setView('list');
      setSelected(null);
      setTempFiles([]);
    } catch (err) {
      console.error(err);
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const openNew = () => {
    setForm({
      invoice_no: generateNextNo(),
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', amount: '' }],
      remarks: '',
      status: 'معلقة'
    });
    setTempFiles([]);
    setSelected(null);
    setView('form');
  };

  const openEdit = (inv) => {
    setForm({ ...inv });
    setTempFiles([]);
    setSelected(inv);
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذه الفاتورة نهائياً؟')) return;
    const newList = billingInvoices.filter(i => i.id !== id);
    await update(ref(db), { billingInvoices: newList });
    setView('list');
  };

  return {
    state: { 
      view, selected, search, form, billingInvoices, clients, 
      filtered, tempFiles, loadingFile, isLoading, canEdit,
      filters, showFilters, stats
    },
    actions: { 
      setView, setSelected, setSearch, setForm, setTempFiles, 
      handleSave, openNew, openEdit, handleDelete,
      setF, setShowFilters
    }
  };
}
