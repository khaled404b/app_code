'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { 
  FileType, 
  Files, 
  Scissors, 
  RotateCw, 
  Upload, 
  Download, 
  ArrowRightLeft,
  FileCode,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('convert'); // 'convert' or 'pdf-tools'
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus(`جاري معالجة الملف: ${file.name}...`);

    // Simulate processing for conversion tools
    if (activeTab === 'convert') {
      setTimeout(() => {
        setIsProcessing(false);
        setStatus(`تم تحويل الملف بنجاح! جاري بدء التحميل...`);
        setTimeout(() => setStatus(null), 3000);
      }, 3000);
    } else {
      // Real processing for PDF Rotate (Demo)
      try {
        if (selectedTool?.id === 'rotate') {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = pdfDoc.getPages();
          pages.forEach(page => page.setRotation(page.getRotation().angle + 90));
          const pdfBytes = await pdfDoc.save();
          
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rotated_${file.name}`;
          link.click();
          
          setIsProcessing(false);
          setStatus(`تم تدوير الملف وحفظه بنجاح!`);
          setTimeout(() => setStatus(null), 3000);
        } else {
          // Other PDF tools mock
          setTimeout(() => {
            setIsProcessing(false);
            setStatus(`تمت العملية بنجاح! (نسخة تجريبية)`);
            setTimeout(() => setStatus(null), 3000);
          }, 2500);
        }
      } catch (err) {
        setIsProcessing(false);
        setStatus(`خطأ: ${err.message}`);
      }
    }
  };

  const triggerUpload = (tool) => {
    setSelectedTool(tool);
    document.getElementById('file-upload-input').click();
  };
  
  const conversionTools = [
    { id: 'dwg-pdf', title: 'DWG إلى PDF', icon: FileCode, from: 'DWG', to: 'PDF', color: '#dc2626' },
    { id: 'dwg-dwf', title: 'DWG إلى DWF', icon: FileCode, from: 'DWG', to: 'DWF', color: '#e11d48' },
    { id: 'dwf-pdf', title: 'DWF إلى PDF', icon: FileCode, from: 'DWF', to: 'PDF', color: '#f59e0b' },
    { id: 'pdf-dwf', title: 'PDF إلى DWF', icon: FileType, from: 'PDF', to: 'DWF', color: '#ea580c' },
    { id: 'word-pdf', title: 'Word إلى PDF', icon: FileText, from: 'DOCX', to: 'PDF', color: '#2563eb' },
    { id: 'excel-pdf', title: 'Excel إلى PDF', icon: FileSpreadsheet, from: 'XLSX', to: 'PDF', color: '#16a34a' },
  ];

  const pdfTools = [
    { id: 'merge', title: 'دمج ملفات PDF', icon: Files, desc: 'جمع عدة ملفات في ملف واحد', color: '#8b5cf6' },
    { id: 'split', title: 'تقسيم PDF', icon: Scissors, desc: 'فصل الصفحات أو استخراجها', color: '#ec4899' },
    { id: 'rotate', title: 'تدوير PDF', icon: RotateCw, desc: 'تعديل اتجاه الصفحات', color: '#06b6d4' },
    { id: 'reorder', title: 'ترتيب الصفحات', icon: ArrowRightLeft, desc: 'تغيير تسلسل الصفحات', color: '#6366f1' },
  ];

  const handleMockProcess = (tool) => {
    setIsProcessing(true);
    setStatus(`جاري تحويل ${tool.title}...`);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setStatus(`تمت العملية بنجاح! (نسخة تجريبية)`);
      setTimeout(() => setStatus(null), 3000);
    }, 2500);
  };

  return (
    <div className="page" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', color: '#fff', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center', paddingTop: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', background: 'linear-gradient(to left, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          مركز الخدمات والتحويلات
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>الأدوات الهندسية المتكاملة في مكان واحد</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={() => setActiveTab('convert')}
          style={{ 
            flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: activeTab === 'convert' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'convert' ? '#fff' : '#94a3b8',
            fontWeight: 700, transition: '0.3s'
          }}
        >
          تحويل الملفات
        </button>
        <button 
          onClick={() => setActiveTab('pdf-tools')}
          style={{ 
            flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: activeTab === 'pdf-tools' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'pdf-tools' ? '#fff' : '#94a3b8',
            fontWeight: 700, transition: '0.3s'
          }}
        >
          أدوات PDF
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        
        {activeTab === 'convert' && conversionTools.map(tool => (
          <Card key={tool.id} padded style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => handleMockProcess(tool)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${tool.color}30` }}>
                <tool.icon size={24} color={tool.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '16px' }}>{tool.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>تحويل مباشر وبدقة عالية</div>
              </div>
              <ChevronRight size={20} color="#475569" />
            </div>
          </Card>
        ))}

        {activeTab === 'pdf-tools' && pdfTools.map(tool => (
          <Card key={tool.id} padded style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => handleMockProcess(tool)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${tool.color}30` }}>
                <tool.icon size={24} color={tool.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '16px' }}>{tool.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{tool.desc}</div>
              </div>
              <ChevronRight size={20} color="#475569" />
            </div>
          </Card>
        ))}

      </div>

      {/* Overlay Processing */}
      {isProcessing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <Loader2 size={48} className="animate-spin" color="#fff" />
          <div style={{ marginTop: '20px', fontWeight: 700, fontSize: '18px' }}>{status}</div>
          <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '16px', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: '#2563eb' }} className="pulse-shimmer"></div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {!isProcessing && status && (
        <div style={{ position: 'fixed', bottom: '110px', left: '20px', right: '20px', background: '#059669', color: '#fff', padding: '16px', borderRadius: '16px', textAlign: 'center', fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1500 }}>
          {status}
        </div>
      )}

      <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pulse-shimmer { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0% { opacity: 0.5; transform: translateX(-100%); } 50% { opacity: 1; } 100% { opacity: 0.5; transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
