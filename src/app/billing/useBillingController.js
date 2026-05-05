import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { ref, update, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export function useBillingController() {
  const { data, isLoading, updateData } = useData();
  const { user, canEdit } = useAuth();
  
  const [view, setView] = useState('list'); // 'list', 'form', 'print'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  const [loadingFile, setLoadingFile] = useState(false);

  const rawBilling = data?.billingInvoices || [];
  const billingInvoices = (Array.isArray(rawBilling) ? rawBilling : Object.values(rawBilling)).filter(Boolean);
  const clients = (data?.clients || []).filter(Boolean);

  const filtered = useMemo(() => {
    if (!search) return billingInvoices;
    const lowerSearch = search.toLowerCase();
    return billingInvoices.filter(inv => 
      inv.invoice_no?.toLowerCase().includes(lowerSearch) ||
      inv.client_name?.toLowerCase().includes(lowerSearch) ||
      inv.subject?.toLowerCase().includes(lowerSearch)
    );
  }, [billingInvoices, search]);

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
    
    const payload = {
      ...form,
      id: invId,
      amount: parseFloat(form.amount || 0),
      date: form.date || new Date().toISOString().split('T')[0],
      client_name: clients.find(c => c.id === form.client_id)?.name || '—',
      has_file: tempFiles.length > 0 || form.has_file,
      created_by: selected ? (selected.created_by || '—') : user?.name || '—',
      updated_at: new Date().toISOString()
    };

    try {
      // Save to billingInvoices list
      const newList = selected 
        ? billingInvoices.map(i => i.id === selected.id ? payload : i)
        : [...billingInvoices, payload];
      
      await update(ref(db), { billingInvoices: newList });

      // Save attachments separately
      if (tempFiles.length > 0) {
        await set(ref(db, `attachments/${invId}`), JSON.stringify(tempFiles));
      }

      setView('list');
      setSelected(null);
      setTempFiles([]);
    } catch (err) {
      console.error(err);
      alert("فشل الحفظ: " + err.message);
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
    state: { view, selected, search, form, billingInvoices, clients, filtered, tempFiles, loadingFile, isLoading, canEdit },
    actions: { setView, setSelected, setSearch, setForm, setTempFiles, handleSave, openNew, openEdit, handleDelete }
  };
}
