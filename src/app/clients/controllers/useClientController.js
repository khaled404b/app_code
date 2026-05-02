import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

export function useClientController() {
  const { data, isLoading, updateData } = useData();
  const { canEdit } = useAuth();
  
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list', 'detail', 'form'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [newPlot, setNewPlot] = useState({ number: '', location: '', maps_link: '' });

  const clients = data?.clients || [];

  // Filter Logic
  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const lowerSearch = search.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(lowerSearch) || 
      c.phone?.includes(search)
    );
  }, [clients, search]);

  // Actions
  const openDetail = (client) => { 
    setSelected(client); 
    setView('detail'); 
  };
  
  const openNew = () => { 
    setSelected(null); 
    setForm({ name: '', phone: '', location: '', notes: '', drive_link: '', maps_link: '', type: 'طبيعي', commission_rate: '8', plots: [] }); 
    setNewPlot({ number: '', location: '', maps_link: '' });
    setView('form'); 
  };
  
  const openEdit = (client) => { 
    setForm({ ...client, plots: client.plots || [] }); 
    setNewPlot({ number: '', location: '', maps_link: '' });
    setView('form'); 
  };

  const goBack = () => {
    setView(selected && view === 'form' ? 'detail' : 'list');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const sanitized = { ...form, commission_rate: form.commission_rate || '0' };
      
      if (selected) {
        updateData('clients', 'update', sanitized, selected.id);
      } else {
        updateData('clients', 'add', { ...sanitized, id: uuidv4() });
      }
      
      setView('list'); 
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('فشل الحفظ: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('حذف هذا العميل؟')) return;
    await updateData('clients', 'delete', null, selected.id);
    setView('list'); 
    setSelected(null);
  };

  const addPlot = () => {
    if (!newPlot.number) return;
    setForm(p => ({ ...p, plots: [...(p.plots || []), { ...newPlot, id: uuidv4() }] }));
    setNewPlot({ number: '', location: '', maps_link: '' });
  };

  const removePlot = (index) => {
    setForm(p => ({ ...p, plots: p.plots.filter((_, idx) => idx !== index) }));
  };

  return {
    state: { isLoading, canEdit, view, selected, form, newPlot, search, clients, filteredClients },
    actions: { setSearch, openDetail, openNew, openEdit, goBack, handleSave, handleDelete, addPlot, removePlot, setForm, setNewPlot }
  };
}
