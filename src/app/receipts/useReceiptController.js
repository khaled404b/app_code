import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';

export function useReceiptController() {
  const { data, isLoading } = useData();
  const { user, canEdit } = useAuth();
  
  const [view, setView] = useState('list'); // 'list', 'form', 'print'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});

  const rawReceipts = data?.receipts || [];
  const receipts = (Array.isArray(rawReceipts) ? rawReceipts : Object.values(rawReceipts)).filter(Boolean);
  const clients = (data?.clients || []).filter(Boolean);

  const filtered = useMemo(() => {
    if (!search) return receipts;
    const lowerSearch = search.toLowerCase();
    return receipts.filter(rec => 
      rec.receipt_no?.toLowerCase().includes(lowerSearch) ||
      rec.received_from?.toLowerCase().includes(lowerSearch) ||
      rec.being_for?.toLowerCase().includes(lowerSearch)
    );
  }, [receipts, search]);

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
    
    // Build payload
    const rawPayload = {
      ...form,
      id: recId,
      amount_kd: parseFloat(form.amount_kd || 0),
      amount_fils: parseInt(form.amount_fils || 0),
      date: form.date || new Date().toISOString().split('T')[0],
      created_by: selected ? (selected.created_by || '—') : user?.name || '—',
      updated_at: new Date().toISOString()
    };

    // Strip undefined values
    const payload = JSON.parse(JSON.stringify(rawPayload));

    try {
      const newList = selected 
        ? receipts.map(i => i.id === selected.id ? payload : i)
        : [...receipts, payload];
      
      const cleanList = JSON.parse(JSON.stringify(newList.filter(Boolean)));

      await update(ref(db), { receipts: cleanList });

      setView('list');
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const openNew = () => {
    setForm({
      receipt_no: generateNextNo(),
      date: new Date().toISOString().split('T')[0],
      amount_kd: '',
      amount_fils: '',
      received_from: '',
      sum_text: '',
      payment_method: 'cash',
      cheque_no: '',
      bank: '',
      being_for: ''
    });
    setSelected(null);
    setView('form');
  };

  const openEdit = (rec) => {
    setForm({ ...rec });
    setSelected(rec);
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا السند نهائياً؟')) return;
    const newList = receipts.filter(i => i.id !== id);
    await update(ref(db), { receipts: newList });
    setView('list');
  };

  return {
    state: { view, selected, search, form, receipts, clients, filtered, isLoading, canEdit },
    actions: { setView, setSelected, setSearch, setForm, handleSave, openNew, openEdit, handleDelete }
  };
}
