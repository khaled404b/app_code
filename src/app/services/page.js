'use client';

import { useState, useRef, useEffect } from 'react';
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
  Settings2,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('convert'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Visual Page Manager State
  const [pdfPages, setPdfPages] = useState([]); // Array of { fileIndex, pageIndex, rotation, isSelected, id }
  const fileInputRef = useRef(null);

  const pdfTools = [
    { id: 'visual-editor', title: 'محرر الصفحات الذكي', icon: Settings2, desc: 'دمج، تقسيم، تدوير، وإعادة ترتيب الصفحات بصرياً', color: '#8b5cf6', multiple: true },
    { id: 'quick-merge', title: 'دمج سريع', icon: Files, desc: 'دمج عدة ملفات فوراً', color: '#6366f1', multiple: true },
  ];

  const conversionTools = [
    { id: 'dwg-pdf', title: 'DWG إلى PDF', icon: FileCode, from: 'DWG', to: 'PDF', color: '#ef4444' },
    { id: 'word-pdf', title: 'Word إلى PDF', icon: FileText, from: 'DOCX', to: 'PDF', color: '#3b82f6' },
    { id: 'excel-pdf', title: 'Excel إلى PDF', icon: FileSpreadsheet, from: 'XLSX', to: 'PDF', color: '#10b981' },
  ];

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (selectedTool?.id === 'visual-editor' || selectedTool?.id === 'quick-merge') {
      setIsProcessing(true);
      setStatus('جاري تحميل الصفحات...');
      
      try {
        const newPages = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const count = pdfDoc.getPageCount();
          
          for (let j = 0; j < count; j++) {
            newPages.push({
              id: Math.random().toString(36).substr(2, 9),
              fileName: file.name,
              fileData: arrayBuffer,
              pageIndex: j,
              rotation: 0,
              isSelected: true
            });
          }
        }
        setPdfPages([...pdfPages, ...newPages]);
        setSelectedFiles([...selectedFiles, ...files]);
      } catch (err) {
        setStatus(`خطأ في تحميل الملف: ${err.message}`);
      } finally {
        setIsProcessing(false);
        setStatus(null);
      }
    } else {
      setSelectedFiles(files);
    }
  };

  const togglePageSelection = (id) => {
    setPdfPages(pdfPages.map(p => p.id === id ? { ...p, isSelected: !p.isSelected } : p));
  };

  const rotatePage = (id) => {
    setPdfPages(pdfPages.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const movePage = (index, direction) => {
    const newPages = [...pdfPages];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    
    const [movedItem] = newPages.splice(index, 1);
    newPages.splice(targetIndex, 0, movedItem);
    setPdfPages(newPages);
  };

  const removePage = (id) => {
    setPdfPages(pdfPages.filter(p => p.id !== id));
  };

  const processFinalPdf = async () => {
    const activePages = pdfPages.filter(p => p.isSelected);
    if (activePages.length === 0) {
      alert('يرجى اختيار صفحة واحدة على الأقل');
      return;
    }

    setIsProcessing(true);
    setStatus('جاري إنتاج الملف النهائي...');

    try {
      const finalPdf = await PDFDocument.create();
      
      // Cache loaded documents to avoid re-parsing same file data multiple times
      const docCache = new Map();

      for (const pageInfo of activePages) {
        let sourceDoc;
        if (docCache.has(pageInfo.fileData)) {
          sourceDoc = docCache.get(pageInfo.fileData);
        } else {
          sourceDoc = await PDFDocument.load(pageInfo.fileData, { ignoreEncryption: true });
          docCache.set(pageInfo.fileData, sourceDoc);
        }

        const [copiedPage] = await finalPdf.copyPages(sourceDoc, [pageInfo.pageIndex]);
        copiedPage.setRotation(degrees(pageInfo.rotation));
        finalPdf.addPage(copiedPage);
      }

      const pdfBytes = await finalPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frame_edited_${Date.now()}.pdf`;
      link.click();
      
      finish('تم إنتاج الملف وتحميله بنجاح!');
    } catch (err) {
      setIsProcessing(false);
      setStatus(`خطأ: ${err.message}`);
    }
  };

  const finish = (msg) => {
    setIsProcessing(false);
    setStatus(msg);
    setPdfPages([]);
    setSelectedFiles([]);
    setSelectedTool(null);
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="page" style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', transition: 'all 0.3s' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px' }}>مركز الخدمات الذكي</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>تحكم كامل ومباشر في ملفاتك الهندسية</p>
      </div>

      {!selectedTool ? (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--surface-2)', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => setActiveTab('convert')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: activeTab === 'convert' ? 'var(--surface)' : 'transparent', color: activeTab === 'convert' ? 'var(--text)' : 'var(--text-3)', fontWeight: 700 }}>تحويل الملفات</button>
            <button onClick={() => setActiveTab('pdf-tools')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: activeTab === 'pdf-tools' ? 'var(--surface)' : 'transparent', color: activeTab === 'pdf-tools' ? 'var(--text)' : 'var(--text-3)', fontWeight: 700 }}>أدوات PDF</button>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {(activeTab === 'convert' ? conversionTools : pdfTools).map(tool => (
              <Card key={tool.id} padded style={{ background: 'var(--surface)', cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => { setSelectedTool(tool); if (tool.multiple) fileInputRef.current.click(); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <tool.icon size={20} color={tool.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>{tool.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{tool.desc}</div>
                  </div>
                  <ChevronRight size={18} color="var(--text-3)" />
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Tool Header */}
          <Card padded style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <selectedTool.icon color={selectedTool.color} size={20} />
                <h2 style={{ fontWeight: 800, fontSize: '16px' }}>{selectedTool.title}</h2>
              </div>
              <button onClick={() => { setSelectedTool(null); setPdfPages([]); }} style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text)' }}>
                <X size={16} />
              </button>
            </div>
          </Card>

          {/* Visual Page Grid */}
          {pdfPages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {pdfPages.map((page, index) => (
                <div key={page.id} style={{ 
                  background: page.isSelected ? 'var(--surface)' : 'var(--surface-2)', 
                  borderRadius: '12px', border: page.isSelected ? `2px solid ${selectedTool.color}` : '1px solid var(--border)',
                  overflow: 'hidden', position: 'relative', opacity: page.isSelected ? 1 : 0.6, transition: '0.2s'
                }}>
                  {/* Page Preview Placeholder */}
                  <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', transform: `rotate(${page.rotation}deg)`, transition: '0.3s' }}>
                    <FileText size={40} color={page.isSelected ? selectedTool.color : 'var(--text-3)'} />
                    <span style={{ fontSize: '10px', marginTop: '8px', color: 'var(--text-3)', fontWeight: 700 }}>صفحة {page.pageIndex + 1}</span>
                  </div>

                  {/* Page Controls */}
                  <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => movePage(index, -1)} disabled={index === 0} className="icon-btn" style={{ width: '24px', height: '24px' }}><ArrowUp size={12} /></button>
                      <button onClick={() => movePage(index, 1)} disabled={index === pdfPages.length - 1} className="icon-btn" style={{ width: '24px', height: '24px' }}><ArrowDown size={12} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => rotatePage(page.id)} className="icon-btn" style={{ width: '24px', height: '24px', color: 'var(--blue)' }}><RotateCw size={12} /></button>
                      <button onClick={() => togglePageSelection(page.id)} className="icon-btn" style={{ width: '24px', height: '24px', color: page.isSelected ? 'var(--green)' : 'var(--text-3)' }}>
                        {page.isSelected ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Floating Remove */}
                  <button onClick={() => removePage(page.id)} style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}

              {/* Add More Button */}
              <div onClick={() => fileInputRef.current.click()} style={{ 
                height: '165px', border: '2px dashed var(--border)', borderRadius: '12px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', color: 'var(--text-3)'
              }}>
                <PlusCircle size={24} />
                <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '8px' }}>إضافة ملف</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {pdfPages.length > 0 && (
            <button className="btn" onClick={processFinalPdf} style={{ background: selectedTool.color, position: 'sticky', bottom: '110px', boxShadow: 'var(--shadow-md)' }}>
              <Play size={18} /> حفظ الملف المعدل ({pdfPages.filter(p => p.isSelected).length} صفحة)
            </button>
          )}

          {/* Initial Upload State */}
          {pdfPages.length === 0 && (
            <Card padded style={{ background: 'var(--surface)', border: '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
              <Upload size={32} color="var(--text-3)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 800 }}>ارفع ملفات الـ PDF للبدء</div>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>سيتم عرض الصفحات لتتمكن من دمجها، ترتيبها وتدويرها</p>
            </Card>
          )}
        </div>
      )}

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple={selectedTool?.multiple} onChange={handleFileSelect} accept=".pdf,.dwg,.dwf,.docx,.xlsx" />

      {isProcessing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <Loader2 size={40} className="animate-spin" color="#fff" />
          <div style={{ marginTop: '16px', fontWeight: 700, fontSize: '16px', color: '#fff' }}>{status}</div>
        </div>
      )}

      {status && !isProcessing && (
        <div style={{ position: 'fixed', bottom: '110px', left: '20px', right: '20px', background: status.startsWith('خطأ') ? 'var(--red)' : '#059669', color: '#fff', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, boxShadow: 'var(--shadow-md)', zIndex: 1500 }}>
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
