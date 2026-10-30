import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { ref, update, get } from 'firebase/database';
import { db } from '@/lib/firebase';

const INITIAL_FILTERS = {
  client: 'الكل',
  paymentMethod: 'الكل',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
  sort: 'date_desc'
};

export function useReceiptController() {
  const { data, isLoading } = useData();
  const { user, canEdit } = useAuth();
  
  const [view, setView] = useState('list'); // 'list', 'form', 'print'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const rawReceipts = data?.receipts || [];
  const receipts = (Array.isArray(rawReceipts) ? rawReceipts : Object.values(rawReceipts)).filter(Boolean);
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
    return receipts.filter(rec => {
      if (!rec) return false;

      // Text Search
      if (search) {
        const lowerSearch = search.toLowerCase();
        const matches = 
          rec.receipt_no?.toLowerCase().includes(lowerSearch) ||
          rec.received_from?.toLowerCase().includes(lowerSearch) ||
          rec.being_for?.toLowerCase().includes(lowerSearch) ||
          rec.check_no?.toLowerCase().includes(lowerSearch) ||
          rec.bank_name?.toLowerCase().includes(lowerSearch);
        if (!matches) return false;
      }

      // Client filter
      if (filters.client !== 'الكل' && rec.client_id !== filters.client) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod !== 'الكل' && rec.payment_method !== filters.paymentMethod) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && rec.date && rec.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && rec.date && rec.date > filters.dateTo) {
        return false;
      }

      // Amount range filter
      const amount = parseFloat(rec.amount) || 0;
      if (filters.amountMin && amount < parseFloat(filters.amountMin)) {
        return false;
      }
      if (filters.amountMax && amount > parseFloat(filters.amountMax)) {
        return false;
      }

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
  }, [receipts, search, filters]);

  // Statistics for the filtered subset
  const stats = useMemo(() => {
    const totalCount = filtered.length;
    let totalAmount = 0;
    let cashAmount = 0;
    let knetAmount = 0;
    let chequeAmount = 0;
    let transferAmount = 0;

    filtered.forEach(rec => {
      const amt = parseFloat(rec.amount) || 0;
      totalAmount += amt;
      const method = rec.payment_method || 'نقداً';
      if (method === 'نقداً' || method === 'كاش') cashAmount += amt;
      else if (method.includes('كي نت') || method.includes('knet')) knetAmount += amt;
      else if (method.includes('شيك')) chequeAmount += amt;
      else if (method.includes('تحويل')) transferAmount += amt;
    });

    return {
      totalCount,
      totalAmount,
      cashAmount,
      knetAmount,
      chequeAmount,
      transferAmount
    };
  }, [filtered]);

  const generateNextNo = () => {
    const prefix = 'RV'; // Receipt Voucher
    const year = new Date().getFullYear();
    const relevant = receipts.filter(i => i.receipt_no?.startsWith(`${prefix}-${year}`));
    if (relevant.length === 0) return `${prefix}-${year}-001`;
    const nums = relevant.map(i => {
      const parts = i.receipt_no.split('-');
      return parts.length >= 3 ? parseInt(parts[2]) : 0;
    }).filter(n => !isNaN(n));
    const max = Math.max(...nums, 0);
    return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const recId = selected ? selected.id : uuidv4();
    
    const { accountant_sig, receiver_sig, ...restForm } = form;
    const rawPayload = {
      ...restForm,
      id: recId,
      receipt_no: form.receipt_no || generateNextNo(),
      date: form.date || new Date().toISOString().split('T')[0],
      amount: parseFloat(form.amount || 0),
      has_signatures: !!(accountant_sig || receiver_sig),
      created_by: selected ? (selected.created_by || '—') : user?.name || '—',
      updated_at: new Date().toISOString()
    };

    const payload = JSON.parse(JSON.stringify(rawPayload));

    try {
      const newList = selected 
        ? receipts.map(i => i.id === selected.id ? payload : i)
        : [...receipts, payload];

      const cleanList = JSON.parse(JSON.stringify(newList.filter(Boolean)));
      await update(ref(db), { receipts: cleanList });

      if (accountant_sig || receiver_sig) {
        await update(ref(db), {
          [`receipt_signatures/${recId}`]: {
            accountant_sig: accountant_sig || null,
            receiver_sig: receiver_sig || null
          }
        });
      }

      setView('list');
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const getFullReceipt = async (rec) => {
    try {
      const snap = await get(ref(db, `receipt_signatures/${rec.id}`));
      if (snap.exists()) {
        const sigs = snap.val();
        return { ...rec, ...sigs };
      }
    } catch (e) {
      console.error('Failed to load signatures:', e);
    }
    return rec;
  };

  const openNew = () => {
    setForm({
      receipt_no: generateNextNo(),
      date: new Date().toISOString().split('T')[0],
      payment_method: 'نقداً',
      amount: '',
      received_from: '',
      being_for: '',
      check_no: '',
      bank_name: ''
    });
    setSelected(null);
    setView('form');
  };

  const openEdit = async (rec) => {
    const full = await getFullReceipt(rec);
    setForm({ ...full });
    setSelected(full);
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا السند نهائياً؟')) return;
    const newList = receipts.filter(i => i.id !== id);
    await update(ref(db), { receipts: newList });
    setView('list');
  };

  return {
    state: { 
      view, selected, search, form, receipts, clients, 
      filtered, isLoading, canEdit,
      filters, showFilters, stats
    },
    actions: { 
      setView, setSelected, setSearch, setForm, 
      handleSave, openNew, openEdit, handleDelete, getFullReceipt,
      setF, setShowFilters
    }
  };
}
