import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { update, ref as dbRef } from 'firebase/database';
import { db } from '@/lib/firebase';

export function useDeliveryController() {
  const { data, isLoading, updateData, getAttachment } = useData();
  const { canEdit, user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list', 'detail', 'form', 'print'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [tempFiles, setTempFiles] = useState([]); // Array of base64 strings

  const rawDeliveries = data?.deliveries || [];
  const deliveries = (Array.isArray(rawDeliveries) ? rawDeliveries : Object.values(rawDeliveries)).filter(Boolean);
  
  const rawClients = data?.clients || [];
  const clients = (Array.isArray(rawClients) ? rawClients : Object.values(rawClients)).filter(Boolean);

  const filteredDeliveries = useMemo(() => {
    if (!search) return deliveries;
    const lowerSearch = search.toLowerCase();
    return deliveries.filter(d => 
      d.project_name?.toLowerCase().includes(lowerSearch) || 
      d.transmittal_no?.toLowerCase().includes(lowerSearch) ||
      d.client_name?.toLowerCase().includes(lowerSearch)
    );
  }, [deliveries, search]);

  const openDetail = (delivery) => { 
    setSelected(delivery); 
    setView('detail'); 
  };
  
  const openNew = () => { 
    setSelected(null); 
    setForm({ 
      id: uuidv4(),
      project_name: '',
      project_no: '',
      contract_no: '',
      to: '',
      from: 'مكتب فريم للإستشارات الهندسية',
      attn: '',
      subject: '',
      date: new Date().toISOString().split('T')[0],
      transmittal_no: `TR-${String(deliveries.length + 1).padStart(3, '0')}`,
      ref_no: '',
      client_ref: '',
      attachments: {
        'وثائق و سندات': false,
        'رسومات و مخططات': false,
        'تقارير': false,
        'أمر تغيير': false,
        'خطاب': false,
        'فاتورة': false,
        'جدول كميات و مواصفات': false,
        'نسخة إلكترونية': false,
      },
      purpose: {
        'للموافقة': false,
        'للمراجعة والتعليق': false,
        'حسب الطلب': false,
        'للمعلومات والسجلات فقط': false,
        'للإجراء اللازم': false,
        'أخرى': false,
      },
      action_codes: {
        'A': false, 'B': false, 'C': false, 'D': false,
        'N': false, 'R': false, 'S': false, 'T': false,
        'إرسال منفصل': false
      },
      document_list: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, document: '', number: '', date: '', description: '', version: '', notes: '' })),
      sender_name: user?.name || '',
      receiver_name: '',
      client_approval: '',
      notes: '',
      distribution: {
        'المهندس و الاستشاري': false,
        'المقاول و الشركة و جهة أخرى': false,
        'الجهة المالكة': false,
      },
      signatures: {
        sender: null,
        receiver: null,
        client: null,
        stamp: null
      },
      has_file: false
    }); 
    setTempFiles([]);
    setView('form'); 
  };
  
  const openEdit = (delivery) => { 
    setForm({ ...delivery }); 
    setTempFiles([]);
    setView('form'); 
  };

  const goBack = () => {
    setView(selected && (view === 'form' || view === 'print') ? 'detail' : 'list');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const finalId = form.id || uuidv4();
    
    const deliveryToSave = { 
      ...form, 
      id: finalId,
      has_file: tempFiles.length > 0 || form.has_file,
      updated_at: new Date().toISOString()
    };

    try {
      await updateData('deliveries', selected ? 'update' : 'add', deliveryToSave, selected?.id);
      
      if (tempFiles.length > 0) {
        // Combine all temp files into one JSON array or keep as is if it's already a list
        // Note: processAttachment already returns a JSON string for PDFs. 
        // We'll store an array of these strings.
        await update(dbRef(db), { [`attachments/${finalId}`]: JSON.stringify(tempFiles) });
      }
      
      setView('list'); 
      setSelected(null);
      setTempFiles([]);
    } catch (err) {
      console.error("Failed to save delivery", err);
      alert("فشل الحفظ: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('حذف هذا الإرسال نهائياً؟')) return;
    await updateData('deliveries', 'delete', null, selected.id);
    setView('list'); 
    setSelected(null);
  };

  return {
    state: { 
      isLoading, canEdit, view, selected, form, search, 
      deliveries, clients, filteredDeliveries, tempFiles
    },
    actions: { 
      setSearch, setView, openDetail, openNew, openEdit, goBack, 
      handleSave, handleDelete, setForm, setTempFiles, getAttachment
    }
  };
}
