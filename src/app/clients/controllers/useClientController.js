import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

export function useClientController() {
  const { data, isLoading, updateData, addNotification } = useData();
  const { canEdit } = useAuth();
  
  const [search, setSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('الكل');
  const [plotFilter, setPlotFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'detail', 'form'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [newPlot, setNewPlot] = useState({ number: '', location: '', maps_link: '' });

  const clients = data?.clients || [];

  // Filter Logic
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (!c) return false;

      // Text search
      if (search) {
        const lowerSearch = search.toLowerCase();
        const matches = 
          c.name?.toLowerCase().includes(lowerSearch) || 
          c.phone?.includes(search) ||
          c.location?.toLowerCase().includes(lowerSearch) ||
          (c.plots || []).some(p => String(p.number || p).toLowerCase().includes(lowerSearch));
        if (!matches) return false;
      }

      // Type filter
      if (clientTypeFilter !== 'الكل' && (c.type || 'طبيعي') !== clientTypeFilter) {
        return false;
      }

      // Plot filter
      const plotCount = (c.plots || []).length;
      if (plotFilter === 'with_plots' && plotCount === 0) return false;
      if (plotFilter === 'no_plots' && plotCount > 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'plots_desc') {
        return ((b.plots || []).length) - ((a.plots || []).length);
      }
      return (a.name || '').localeCompare(b.name || '', 'ar');
    });
  }, [clients, search, clientTypeFilter, plotFilter, sortBy]);

  // Statistics for the filtered subset
  const stats = useMemo(() => {
    const total = filteredClients.length;
    let normal = 0;
    let commission = 0;
    let totalPlots = 0;

    filteredClients.forEach(c => {
      if (c.type === 'نسبة') commission++;
      else normal++;
      totalPlots += (c.plots || []).length;
    });

    return { total, normal, commission, totalPlots };
  }, [filteredClients]);

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
        addNotification('client', 'عميل جديد', `تم إضافة العميل: ${sanitized.name}`);
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
    updateData('clients', 'delete', null, selected.id);
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
    state: { 
      isLoading, canEdit, view, selected, form, newPlot, search, clients, 
      filteredClients, clientTypeFilter, plotFilter, sortBy, showFilters, stats 
    },
    actions: { 
      setSearch, setClientTypeFilter, setPlotFilter, setSortBy, setShowFilters,
      openDetail, openNew, openEdit, goBack, handleSave, handleDelete, 
      addPlot, removePlot, setForm, setNewPlot 
    }
  };
}
