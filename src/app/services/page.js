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
  Play,
  Settings2
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('convert'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [splitRange, setSplitRange] = useState('1'); // for split tool
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
    { id: 'split', title: 'تقسيم PDF', icon: Scissors, desc: 'استخراج صفحات محددة (مثال: 1,2,5)', color: '#ec4899' },
    { id: 'rotate', title: 'تدوير PDF', icon: RotateCw, desc: 'تدوير الصفحات 90 درجة يميناً', color: '#06b6d4' },
    { id: 'reorder', title: 'عكس ترتيب الصفحات', icon: ArrowRightLeft, desc: 'عكس تسلسل جميع صفحات الملف', color: '#6366f1' },
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
        // Mock Conversion with realistic delay
        setTimeout(() => finish(`تم تحويل الملف بنجاح! (نسخة تجريبية)`), 3000);
      } else {
        // REAL PDF LOGIC
        if (selectedTool?.id === 'merge') {
          const mergedPdf = await PDFDocument.create();
          for (const file of selectedFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
          const pdfBytes = await mergedPdf.save();
          downloadBlob(pdfBytes, `merged_document.pdf`, 'application/pdf');
          finish('تم دمج الملفات بنجاح!');
        } 
        else if (selectedTool?.id === 'rotate') {
          const file = selectedFiles[0];
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pages = pdfDoc.getPages();
          pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + 90) % 360));
          });
          const pdfBytes = await pdfDoc.save();
          downloadBlob(pdfBytes, `rotated_${file.name}`, 'application/pdf');
          finish('تم التدوير بنجاح!');
        }
        else if (selectedTool?.id === 'split') {
          const file = selectedFiles[0];
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const splitPdf = await PDFDocument.create();
          
          // Parse range like "1,2,5" or "1-3"
          const pageNumbers = splitRange.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < pdfDoc.getPageCount());
          
          if (pageNumbers.length === 0) throw new Error('يرجى إدخال أرقام صفحات صحيحة');
          
          const copiedPages = await splitPdf.copyPages(pdfDoc, pageNumbers);
          copiedPages.forEach(page => splitPdf.addPage(page));
          
          const pdfBytes = await splitPdf.save();
          downloadBlob(pdfBytes, `split_${file.name}`, 'application/pdf');
          finish(`تم استخراج ${pageNumbers.length} صفحات بنجاح!`);
        }
        else if (selectedTool?.id === 'reorder') {
          const file = selectedFiles[0];
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const reversedPdf = await PDFDocument.create();
          
          const indices = pdfDoc.getPageIndices().reverse();
          const copiedPages = await reversedPdf.copyPages(pdfDoc, indices);
          copiedPages.forEach(page => reversedPdf.addPage(page));
          
          const pdfBytes = await reversedPdf.save();
          downloadBlob(pdfBytes, `reversed_${file.name}`, 'application/pdf');
          finish('تم عكس ترتيب الصفحات بنجاح!');
        }
      }
    } catch (err) {
      setIsProcessing(false);
      setStatus(`خطأ: ${err.message}`);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const downloadBlob = (bytes, name, type) => {
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
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
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>مركز الخدمات والتحويلات</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>أدوات معالجة الملفات الاحترافية</p>
      </div>

      {/* Tabs */}
      {!selectedTool && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'var(--surface-2)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <button onClick={() => setActiveTab('convert')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'convert' ? 'var(--surface)' : 'transparent', color: activeTab === 'convert' ? 'var(--text)' : 'var(--text-3)', fontWeight: 700, boxShadow: activeTab === 'convert' ? 'var(--shadow)' : 'none' }}>تحويل الملفات</button>
          <button onClick={() => setActiveTab('pdf-tools')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'pdf-tools' ? 'var(--surface)' : 'transparent', color: activeTab === 'pdf-tools' ? 'var(--text)' : 'var(--text-3)', fontWeight: 700, boxShadow: activeTab === 'pdf-tools' ? 'var(--shadow)' : 'none' }}>أدوات PDF</button>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {!selectedTool ? (
          <>
            {(activeTab === 'convert' ? conversionTools : pdfTools).map(tool => (
              <Card key={tool.id} padded style={{ background: 'var(--surface)', cursor: 'pointer' }} onClick={() => startTool(tool)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <tool.icon size={24} color={tool.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{tool.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{tool.desc || 'تحويل سريع ودقيق'}</div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <FileText size={16} color="var(--text-3)" />
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <button onClick={() => removeFile(i)} style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                ))}
                
                {selectedTool.id === 'split' && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', display: 'block' }}>أدخل أرقام الصفحات (مثال: 1,3,5):</label>
                    <input className="form-input" value={splitRange} onChange={e => setSplitRange(e.target.value)} placeholder="1,2,3..." />
                  </div>
                )}

                {selectedTool.multiple && (
                  <button onClick={() => fileInputRef.current.click()} style={{ padding: '12px', border: '2px dashed var(--border)', borderRadius: '12px', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <PlusCircle size={18} /> <span style={{ fontWeight: 700 }}>إضافة ملف آخر</span>
                  </button>
                )}
                
                <button className="btn" onClick={processFiles} style={{ background: selectedTool.color, marginTop: '10px' }}>
                  <Play size={18} /> تنفيذ العملية
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }}>
                <Upload size={32} color="var(--text-3)" style={{ marginBottom: '12px' }} />
                <div style={{ fontWeight: 700 }}>اضغط لرفع ملف PDF</div>
              </div>
            )}
          </Card>
        )}
      </div>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple={selectedTool?.multiple} onChange={handleFileSelect} accept=".pdf,.dwg,.dwf,.docx,.xlsx" />

      {isProcessing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <Loader2 size={48} className="animate-spin" color="#fff" />
          <div style={{ marginTop: '20px', fontWeight: 700, fontSize: '18px', color: '#fff' }}>{status}</div>
        </div>
      )}

      {status && !isProcessing && (
        <div style={{ position: 'fixed', bottom: '110px', left: '20px', right: '20px', background: status.startsWith('خطأ') ? 'var(--red)' : '#059669', color: '#fff', padding: '16px', borderRadius: '16px', textAlign: 'center', fontWeight: 700, boxShadow: 'var(--shadow-md)', zIndex: 1500 }}>
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
