import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

export function useContractorsController() {
  const { data, isLoading, updateData } = useData();
  const { canEdit } = useAuth();
  
  const [view, setView] = useState('list'); // 'list', 'form'
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPlot, setSelectedPlot] = useState('');
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');

  const rawContractors = data?.contractors || [];
  const contractors = (Array.isArray(rawContractors) ? rawContractors : Object.values(rawContractors)).filter(Boolean);
  
  const rawClients = data?.clients || [];
  const clients = (Array.isArray(rawClients) ? rawClients : Object.values(rawClients)).filter(Boolean);

  // Filter contractors based on selected client, plot, and search
  const filteredContractors = useMemo(() => {
    return contractors.filter(c => {
      const matchClient = selectedClient ? c.client_id === selectedClient : true;
      const matchPlot = selectedPlot ? c.plot_no === selectedPlot : true;
      const matchSearch = search ? (
        c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.contract_name?.toLowerCase().includes(search.toLowerCase())
      ) : true;
      return matchClient && matchPlot && matchSearch;
    });
  }, [contractors, selectedClient, selectedPlot, search]);

  // Group contractors by contract_name
  const groupedContractors = useMemo(() => {
    const groups = {};
    filteredContractors.forEach(c => {
      const groupName = c.contract_name || 'أخرى';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(c);
    });
    return groups;
  }, [filteredContractors]);

  const openNew = () => {
    setForm({
      id: uuidv4(),
      client_id: selectedClient || '',
      plot_no: selectedPlot || '',
      company_name: '',
      contract_name: '',
      contacts: [{ id: uuidv4(), name: '', phone: '' }]
    });
    setView('form');
  };

  const openEdit = (contractor) => {
    const editForm = { ...contractor };
    // Convert legacy data to contacts array if needed
    if (!editForm.contacts || editForm.contacts.length === 0) {
      editForm.contacts = [];
      if (editForm.contact_name || editForm.phone) {
        editForm.contacts.push({ 
          id: uuidv4(), 
          name: editForm.contact_name || '', 
          phone: editForm.phone || '' 
        });
      } else {
        editForm.contacts.push({ id: uuidv4(), name: '', phone: '' });
      }
    }
    setForm(editForm);
    setView('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const isEdit = contractors.some(c => c.id === form.id);
      await updateData('contractors', isEdit ? 'update' : 'add', form, isEdit ? form.id : null);
      setView('list');
    } catch (err) {
      alert("فشل الحفظ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المقاول؟')) return;
    try {
      await updateData('contractors', 'delete', null, id);
    } catch (err) {
      alert("فشل الحذف: " + err.message);
    }
  };

  // Extract unique contract names for the datalist (auto-learning dropdown)
  const uniqueContractNames = useMemo(() => {
    const names = new Set([
      'أعمال الإطفاء', 'أعمال الصحي', 'أعمال التكييف', 
      'أعمال الكهرباء', 'هيكل أسود', 'تشطيبات'
    ]);
    contractors.forEach(c => {
      if (c.contract_name && c.contract_name.trim()) {
        names.add(c.contract_name.trim());
      }
    });
    return Array.from(names);
  }, [contractors]);

  return {
    state: { isLoading, canEdit, view, form, search, clients, selectedClient, selectedPlot, groupedContractors, uniqueContractNames },
    actions: { setView, setForm, setSearch, setSelectedClient, setSelectedPlot, openNew, openEdit, handleSave, handleDelete }
  };
}
