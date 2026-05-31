import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { update, ref as dbRef, set as fSet } from 'firebase/database';
import { db } from '@/lib/firebase';
import { parseAttachment } from '@/lib/fileHelper';

export function useOfferController() {
  const { data, isLoading, updateData, getAttachment } = useData();
  const { canEdit } = useAuth();
  
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list', 'detail', 'form', 'comparison'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings
  
  // List Filters
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWorkType, setFilterWorkType] = useState('all');
  
  // Filters for Comparison
  const [compClient, setCompClient] = useState('all');
  const [compPlot, setCompPlot] = useState('all');
  const [compWorkType, setCompWorkType] = useState('all');
  const [customWorkType, setCustomWorkType] = useState('');

  const rawOffers = data?.offers || [];
  const offers = (Array.isArray(rawOffers) ? rawOffers : Object.values(rawOffers)).filter(Boolean);
  
  const rawClients = data?.clients || [];
  const clients = (Array.isArray(rawClients) ? rawClients : Object.values(rawClients)).filter(Boolean);
  
  const services = (data?.settings?.services || ['تصميم معماري', 'إشراف هندسي', 'استشارات هندسية'])
    .filter(s => !['ننن', 'نخم', 'االل'].includes(s));

  // Helper
  const getClientName = (id) => clients.find(c => c.id === id)?.name || 'غير معروف';

  // Filter Logic for List
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      // Search filter
      if (search) {
        const lowerSearch = search.toLowerCase();
        const matchesSearch = 
          o.company_name?.toLowerCase().includes(lowerSearch) || 
          o.request_code?.toLowerCase().includes(lowerSearch) ||
          getClientName(o.client_id).toLowerCase().includes(lowerSearch) ||
          String(o.plot_no || '').toLowerCase().includes(lowerSearch);
        if (!matchesSearch) return false;
      }
      // Client filter
      if (filterClient !== 'all' && o.client_id !== filterClient) return false;
      // Status filter
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      // Work type filter
      if (filterWorkType !== 'all' && o.work_type !== filterWorkType) return false;
      return true;
    });
  }, [offers, search, clients, filterClient, filterStatus, filterWorkType]);

  // Unique work types from existing offers for the filter dropdown
  const uniqueWorkTypes = useMemo(() => {
    const types = new Set(offers.map(o => o.work_type).filter(Boolean));
    return [...types];
  }, [offers]);

  // Unique statuses from existing offers
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(offers.map(o => o.status).filter(Boolean));
    return [...statuses];
  }, [offers]);

  // Comparison Logic
  const comparisonOffers = useMemo(() => {
    if (compClient === 'all' || compWorkType === 'all') return [];
    
    const filtered = offers.filter(o => 
      o.client_id === compClient && 
      o.work_type === compWorkType && 
      (compPlot === 'all' || String(o.plot_no) === String(compPlot))
    );
    if (filtered.length === 0) return [];
    
    // Sort by price ascending
    const sorted = [...filtered].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    
    const lowestPrice = parseFloat(sorted[0].price) || 0;
    
    return sorted.map((o, index) => {
      const price = parseFloat(o.price) || 0;
      return {
        ...o,
        rank: index + 1,
        price_diff: price - lowestPrice,
        is_lowest: index === 0,
        is_highest: index === sorted.length - 1 && sorted.length > 1
      };
    });
  }, [offers, compClient, compWorkType, compPlot]);

  const comparisonStats = useMemo(() => {
    if (comparisonOffers.length === 0) return null;
    const lowest = comparisonOffers[0].price;
    const highest = comparisonOffers[comparisonOffers.length - 1].price;
    return {
      count: comparisonOffers.length,
      lowest,
      highest,
      diff: highest - lowest
    };
  }, [comparisonOffers]);

  // Actions
  const openDetail = (offer) => { 
    setSelected(offer); 
    setView('detail'); 
  };
  
  const openNew = () => { 
    setSelected(null); 
    setForm({ 
      client_id: '', plot_no: '', work_type: services[0], request_code: `PR-${String(offers.length + 1).padStart(3, '0')}`,
      company_name: '', offer_number: '', receive_date: new Date().toISOString().split('T')[0],
      validity_date: '', price: '', status: 'قيد الدراسة', is_selected: false, 
      description: '', notes: '', has_file: false 
    }); 
    setTempFiles([]);
    setCustomWorkType('');
    setView('form'); 
  };
  
  const openEdit = async (offer) => { 
    setForm({ ...offer }); 
    setTempFiles([]);
    if (!services.includes(offer.work_type)) {
      setForm(p => ({ ...p, work_type: 'آخر...' }));
      setCustomWorkType(offer.work_type);
    } else {
      setCustomWorkType('');
    }
    setView('form'); 
    if (offer.has_file) {
      try {
        const stored = await getAttachment(offer.id);
        if (stored) {
          setTempFiles(parseAttachment(stored));
        }
      } catch (e) {
        console.error("Error loading attachments for edit:", e);
      }
    }
  };

  const goBack = () => {
    setView(selected && view === 'form' ? 'detail' : 'list');
  };

  const openComparison = () => {
    setView('comparison');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    let finalWorkType = form.work_type;
    if (form.work_type === 'آخر...' && customWorkType.trim()) {
      finalWorkType = customWorkType.trim();
      if (!services.includes(finalWorkType)) {
        await updateData('settings', 'update', { services: [...services, finalWorkType] });
      }
    }

    const finalId = selected ? selected.id : uuidv4();
    const stripAttachment = ({ attachment_data, ...rest }) => rest;
    
    const offerForList = stripAttachment({ 
      ...form, id: finalId, work_type: finalWorkType,
      price: parseFloat(form.price) || 0,
      has_file: tempFiles.length > 0 || form.has_file,
    });

    // Strip attachment_data from ALL offers before writing
    const cleanOffers = offers.map(stripAttachment);
    const finalOffers = selected 
      ? cleanOffers.map(o => o.id === selected.id ? offerForList : o) 
      : [...cleanOffers, offerForList];
      
    try {
      update(dbRef(db), { offers: finalOffers });
      
      if (tempFiles.length > 0) {
        await fSet(dbRef(db, `attachments/${finalId}`), JSON.stringify(tempFiles));
      }
    } catch (err) {
      console.error("Failed to save offer", err);
      alert("فشل الحفظ: " + err.message);
      return;
    }
    
    setView('list'); 
    setSelected(null);
    setTempFiles([]);
  };

  const handleDelete = async () => {
    if (!window.confirm('حذف هذا العرض نهائياً؟')) return;
    updateData('offers', 'delete', null, selected.id);
    setView('list'); 
    setSelected(null);
  };

  const markAsSelected = async (offerId) => {
    if (!canEdit) return;
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    await updateData('offers', 'update', { ...offer, status: 'مختار', is_selected: true }, offerId);
  };

  const fetchAndShowFile = async (offer) => {
    if (!offer.has_file) return;
    try {
      // New format: attachment_data is stored directly on offer
      const stored = offer.attachment_data || await getAttachment(offer.id);
      if (!stored) { alert("المرفق غير موجود"); return; }

      const images = parseAttachment(stored);
      if (images.length === 0) { alert("صيغة المرفق غير مدعومة"); return; }

      const imgTags = images.map((src, i) => `
        <div style="background:white; border-radius:8px; padding:16px; box-shadow:0 2px 12px rgba(0,0,0,0.15); max-width:860px; width:100%;">
          ${images.length > 1 ? `<div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:10px; direction:rtl;">الصفحة ${i + 1} من ${images.length}</div>` : ''}
          <img src="${src}" style="width:100%; display:block; border-radius:4px;" />
        </div>`
      ).join('');

      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>عرض سعر - ${offer.company_name}</title>
        <style>body{margin:0; background:#f1f5f9; display:flex; flex-direction:column; align-items:center; gap:20px; padding:30px; font-family:sans-serif;}</style>
        </head><body>${imgTags}</body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error("Error fetching file:", e);
      alert("خطأ في جلب المرفق");
    }
  };

  return {
    state: { 
      isLoading, canEdit, view, selected, form, search, 
      offers, clients, services, filteredOffers, comparisonOffers, comparisonStats,
      compClient, compPlot, compWorkType, tempFiles, customWorkType,
      filterClient, filterStatus, filterWorkType, uniqueWorkTypes, uniqueStatuses
    },
    actions: { 
      setSearch, setView, openDetail, openNew, openEdit, goBack, openComparison, 
      handleSave, handleDelete, markAsSelected, setCompClient, setCompPlot, setCompWorkType, 
      setForm, setTempFiles, getClientName, fetchAndShowFile, setCustomWorkType, getAttachment,
      setFilterClient, setFilterStatus, setFilterWorkType
    }
  };
}
