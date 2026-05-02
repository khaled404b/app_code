'use client';

import { useState, useRef } from 'react';
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
  ChevronRight,
  X,
  PlusCircle,
  Play
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('convert'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const conversionTools = [
    { id: 'dwg-pdf', title: 'DWG إلى PDF', icon: FileCode, from: 'DWG', to: 'PDF', color: '#ef4444' },
    { id: 'dwg-dwf', title: 'DWG إلى DWF', icon: FileCode, from: 'DWG', to: 'DWF', color: '#f43f5e' },
    { id: 'dwf-pdf', title: 'DWF إلى PDF', icon: FileCode, from: 'DWF', to: 'PDF', color: '#f59e0b' },
    { id: 'pdf-dwf', title: 'PDF إلى DWF', icon: FileType, from: 'PDF', to: 'DWF', color: '#ea580c' },
    { id: 'word-pdf', title: 'Word إلى PDF', icon: FileText, from: 'DOCX', to: 'PDF', color: '#3b82f6' },
    { id: 'excel-pdf', title: 'Excel إلى PDF', icon: FileSpreadsheet, from: 'XLSX', to: 'PDF', color: '#10b981' },
  ];

  const pdfTools = [
    { id: 'merge', title: 'دمج ملفات PDF', icon: Files, desc: 'جمع عدة ملفات في ملف واحد', color: '#8b5cf6', multiple: true },
    { id: 'split', title: 'تقسيم PDF', icon: Scissors, desc: 'فصل الصفحات أو استخراجها', color: '#ec4899' },
    { id: 'rotate', title: 'تدوير PDF', icon: RotateCw, desc: 'تعديل اتجاه الصفحات 90 درجة', color: '#06b6d4' },
    { id: 'reorder', title: 'ترتيب الصفحات', icon: ArrowRightLeft, desc: 'تغيير تسلسل الصفحات', color: '#6366f1' },
  ];

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    if (selectedTool?.multiple) {
      setSelectedFiles([...selectedFiles, ...newFiles]);
    } else {
      setSelectedFiles(newFiles);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setStatus(`جاري المعالجة...`);

    try {
      if (activeTab === 'convert') {
        // Mock Conversion
        setTimeout(() => {
          setIsProcessing(false);
          setStatus(`تم التحويل بنجاح! جاري تحميل ${selectedFiles[0].name.split('.')[0]}.${selectedTool.to}`);
          setTimeout(() => { setStatus(null); setSelectedFiles([]); }, 3000);
        }, 3000);
      } else {
        // Real PDF Logic
        if (selectedTool?.id === 'rotate') {
          const file = selectedFiles[0];
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = pdfDoc.getPages();
          pages.forEach(page => page.setRotation(page.getRotation().angle + 90));
          const pdfBytes = await pdfDoc.save();
          downloadBlob(pdfBytes, `rotated_${file.name}`, 'application/pdf');
          finish('تم التدوير والحفظ بنجاح!');
        } else if (selectedTool?.id === 'merge') {
          const mergedPdf = await PDFDocument.create();
          for (const file of selectedFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
          const pdfBytes = await mergedPdf.save();
          downloadBlob(pdfBytes, `merged_document.pdf`, 'application/pdf');
          finish('تم دمج الملفات بنجاح!');
        } else {
          // Mock for others
          setTimeout(() => finish('تمت العملية بنجاح!'), 2000);
        }
      }
    } catch (err) {
      setIsProcessing(false);
      setStatus(`خطأ: ${err.message}`);
    }
  };

  const downloadBlob = (bytes, name, type) => {
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  const finish = (msg) => {
    setIsProcessing(false);
    setStatus(msg);
    setSelectedFiles([]);
    setSelectedTool(null);
    setTimeout(() => setStatus(null), 3000);
  };

  const startTool = (tool) => {
    setSelectedTool(tool);
    setSelectedFiles([]);
    fileInputRef.current.click();
  };

  return (
    <div className="page" style={{ background: 'var(--bg)', color: 'var(--text)', transition: 'background 0.3s' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', color: 'var(--text)' }}>
          مركز الخدمات والتحويلات
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>الأدوات الهندسية المتكاملة في مكان واحد</p>
      </div>

      {/* Tabs */}
      {!selectedTool && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'var(--surface-2)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('convert')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'convert' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'convert' ? 'var(--text)' : 'var(--text-3)',
              fontWeight: 700, transition: '0.3s', boxShadow: activeTab === 'convert' ? 'var(--shadow)' : 'none'
            }}
          >
            تحويل الملفات
          </button>
          <button 
            onClick={() => setActiveTab('pdf-tools')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'pdf-tools' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'pdf-tools' ? 'var(--text)' : 'var(--text-3)',
              fontWeight: 700, transition: '0.3s', boxShadow: activeTab === 'pdf-tools' ? 'var(--shadow)' : 'none'
            }}
          >
            أدوات PDF
          </button>
        </div>
      )}

      {/* Tool Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        
        {!selectedTool ? (
          <>
            {activeTab === 'convert' && conversionTools.map(tool => (
              <Card key={tool.id} padded style={{ background: 'var(--surface)', cursor: 'pointer' }} onClick={() => startTool(tool)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <tool.icon size={24} color={tool.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{tool.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>تحويل سريع ودقيق</div>
                  </div>
                  <ChevronRight size={20} color="var(--text-3)" />
                </div>
              </Card>
            ))}

            {activeTab === 'pdf-tools' && pdfTools.map(tool => (
              <Card key={tool.id} padded style={{ background: 'var(--surface)', cursor: 'pointer' }} onClick={() => startTool(tool)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <tool.icon size={24} color={tool.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{tool.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{tool.desc}</div>
                  </div>
                  <ChevronRight size={20} color="var(--text-3)" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <Card padded style={{ background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <selectedTool.icon color={selectedTool.color} size={24} />
                <h2 style={{ fontWeight: 800, fontSize: '18px' }}>{selectedTool.title}</h2>
              </div>
              <button onClick={() => setSelectedTool(null)} style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text)' }}>
                <X size={18} />
              </button>
            </div>

            {selectedFiles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <FileText size={16} color="var(--text-3)" />
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <button onClick={() => removeFile(i)} style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {selectedTool.multiple && (
                  <button onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: '2px dashed var(--border)', borderRadius: '12px', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', justifyContent: 'center' }}>
                    <PlusCircle size={18} />
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>إضافة ملف آخر</span>
                  </button>
                )}
                <button className="btn" onClick={processFiles} style={{ marginTop: '10px', background: selectedTool.color }}>
                  <Play size={18} /> ابدأ العملية
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }}>
                <Upload size={32} color="var(--text-3)" style={{ marginBottom: '12px' }} />
                <div style={{ fontWeight: 700 }}>اضغط لرفع الملفات</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {selectedTool.from} إلى {selectedTool.to}
                </div>
              </div>
            )}
          </Card>
        )}

      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        multiple={selectedTool?.multiple}
        onChange={handleFileSelect}
        accept={selectedTool?.from === 'DWG' ? '.dwg' : selectedTool?.from === 'DWF' ? '.dwf' : selectedTool?.from === 'PDF' ? '.pdf' : '*'}
      />

      {/* Overlay Processing */}
      {isProcessing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <Loader2 size={48} className="animate-spin" color="#fff" />
          <div style={{ marginTop: '20px', fontWeight: 700, fontSize: '18px', color: '#fff' }}>{status}</div>
        </div>
      )}

      {/* Toast Notification */}
      {!isProcessing && status && (
        <div style={{ position: 'fixed', bottom: '110px', left: '20px', right: '20px', background: '#059669', color: '#fff', padding: '16px', borderRadius: '16px', textAlign: 'center', fontWeight: 700, boxShadow: 'var(--shadow-md)', zIndex: 1500 }}>
          {status}
        </div>
      )}

      <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
