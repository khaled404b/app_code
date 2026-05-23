import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { ref, update, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export function useBillingController() {
  const { data, isLoading, updateData } = useData();
  const { user, canEdit } = useAuth();
  
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get('status') || 'all';
  const clientParam = searchParams?.get('client') || 'all';

  const [view, setView] = useState('list'); // 'list', 'form', 'print'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [clientFilter, setClientFilter] = useState(clientParam);
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  const [loadingFile, setLoadingFile] = useState(false);

  // Sync state if URL search parameters change
  useEffect(() => {
    if (statusParam) setStatusFilter(statusParam);
    if (clientParam) setClientFilter(clientParam);
  }, [statusParam, clientParam]);

  const rawBilling = data?.billingInvoices || [];
  const billingInvoices = (Array.isArray(rawBilling) ? rawBilling : Object.values(rawBilling)).filter(Boolean);
  const clients = (data?.clients || []).filter(Boolean);

  const filtered = useMemo(() => {
    return billingInvoices.filter(inv => {
      const matchesSearch = !search || 
        inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
        inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.subject?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesClient = clientFilter === 'all' || inv.client_id === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [billingInvoices, search, statusFilter, clientFilter]);

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

    // Strip all undefined values recursively to avoid Firebase errors
    const payload = JSON.parse(JSON.stringify(rawPayload));

    try {
      // Save to billingInvoices list
      const newList = selected 
        ? billingInvoices.map(i => i.id === selected.id ? payload : i)
        : [...billingInvoices, payload];

      // Clean the entire list before saving (remove any nulls/undefineds)
      const cleanList = JSON.parse(JSON.stringify(newList.filter(Boolean)));

      await update(ref(db), { billingInvoices: cleanList });

      // Save attachments separately
      if (tempFiles.length > 0) {
        await set(ref(db, `attachments/${invId}`), JSON.stringify(tempFiles));
      }

      // Save stamp image separately
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

  const supervision = (data?.supervision || []).filter(Boolean);
  const contracts = (data?.contracts || []).filter(Boolean);

  const openNew = () => {
    setForm({
      invoice_no: generateNextNo(),
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', amount: '' }],
      remarks: '',
      status: 'معلقة',
      link_type: '',
      link_id: '',
      link_installment_id: ''
    });
    setTempFiles([]);
    setSelected(null);
    setView('form');
  };

  const openEdit = (inv) => {
    setForm({
      link_type: '',
      link_id: '',
      link_installment_id: '',
      ...inv
    });
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
    state: { view, selected, search, form, billingInvoices, clients, supervision, contracts, filtered, tempFiles, loadingFile, isLoading, canEdit, statusFilter, clientFilter },
    actions: { setView, setSelected, setSearch, setForm, setTempFiles, handleSave, openNew, openEdit, handleDelete, setStatusFilter, setClientFilter }
  };
}
