'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui';
import { 
  Files, 
  RotateCw, 
  Upload, 
  Download, 
  FileText,
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
  Trash2,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

export default function ServicesPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [pdfPages, setPdfPages] = useState([]); 
  const [outputFileName, setOutputFileName] = useState('');
  const fileInputRef = useRef(null);
  const [pdfjs, setPdfjs] = useState(null);

  useEffect(() => {
    // Robust PDF.js loading
    const loadPdfjs = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        setPdfjs(pdfjsLib);
      } catch (e) {
        console.error('Failed to load PDF.js', e);
      }
    };
    loadPdfjs();
  }, []);

  const generateThumbnail = async (file, pageIndex = 0) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    
    if (!pdfjs) return null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageIndex + 1);
      
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      const url = canvas.toDataURL('image/jpeg', 0.8);
      
      // Clean up PDF resources
      await pdf.destroy();
      return url;
    } catch (e) {
      console.error('Thumbnail error:', e);
      return null;
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    setStatus('جاري توليد المعاينة (PDF وصور)...');
    
    try {
      const newPages = [];
      for (const file of files) {
        if (!outputFileName) setOutputFileName(file.name.split('.')[0] + '_معدل');

        if (file.type.startsWith('image/')) {
          const thumb = await generateThumbnail(file);
          newPages.push({
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.name,
            fileData: await file.arrayBuffer(),
            pageIndex: 0,
            rotation: 0,
            isSelected: true,
            thumbnail: thumb,
            isImage: true,
            mimeType: file.type
          });
        } else if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const count = pdfDoc.getPageCount();
          
          for (let j = 0; j < count; j++) {
            const thumb = await generateThumbnail(file, j);
            newPages.push({
              id: Math.random().toString(36).substr(2, 9),
              fileName: file.name,
              fileData: arrayBuffer,
              pageIndex: j,
              rotation: 0,
              isSelected: true,
              thumbnail: thumb,
              isImage: false
            });
          }
        }
      }
      setPdfPages([...pdfPages, ...newPages]);
    } catch (err) {
      setStatus(`خطأ: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setStatus(null);
    }
  };

  const processFinalPdf = async () => {
    const activePages = pdfPages.filter(p => p.isSelected);
    if (activePages.length === 0) return;

    setIsProcessing(true);
    setStatus('جاري دمج الملفات والتحويل...');

    try {
      const finalPdf = await PDFDocument.create();
      const docCache = new Map();

      for (const pageInfo of activePages) {
        if (pageInfo.isImage) {
          const imageBytes = pageInfo.fileData;
          let embeddedImage;
          if (pageInfo.mimeType === 'image/jpeg' || pageInfo.mimeType === 'image/jpg') {
            embeddedImage = await finalPdf.embedJpg(imageBytes);
          } else {
            embeddedImage = await finalPdf.embedPng(imageBytes);
          }
          
          const page = finalPdf.addPage([embeddedImage.width, embeddedImage.height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: embeddedImage.width,
            height: embeddedImage.height,
          });
          page.setRotation(degrees(pageInfo.rotation));
        } else {
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
      }

      const pdfBytes = await finalPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputFileName || 'frame_document'}.pdf`;
      link.click();
      
      finish('تم دمج وتحميل الملف بنجاح!');
    } catch (err) {
      setIsProcessing(false);
      setStatus(`خطأ: ${err.message}`);
    }
  };

  const finish = (msg) => {
    setIsProcessing(false);
    setStatus(msg);
    setPdfPages([]);
    setSelectedTool(null);
    setOutputFileName('');
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="page" style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', transition: 'all 0.3s' }}>
      
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px' }}>المحرر البصري المتكامل</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>دمج الصور والـ PDF مع معاينة فورية</p>
      </div>

      {!selectedTool ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          <Card padded style={{ background: 'var(--surface)', cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => { setSelectedTool({ color: '#8b5cf6' }); fileInputRef.current.click(); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `#8b5cf615`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 size={20} color="#8b5cf6" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '15px' }}>ابدأ الدمج والتعديل البصري</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>ارفع صور أو ملفات PDF وادمجها معاً</div>
              </div>
              <ChevronRight size={18} color="var(--text-3)" />
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <Card padded style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 800, fontSize: '16px' }}>مساحة العمل البصرية</h2>
              <button onClick={() => { setSelectedTool(null); setPdfPages([]); setOutputFileName(''); }} style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text)' }}>
                <X size={16} />
              </button>
            </div>
          </Card>

          {pdfPages.length > 0 && (
            <>
              <Card padded style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Edit3 size={18} color="var(--text-3)" />
                <input 
                  type="text" 
                  value={outputFileName} 
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="اسم الملف الناتج..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontWeight: 700, fontSize: '14px' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>.pdf</span>
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {pdfPages.map((page, index) => (
                  <div key={page.id} style={{ 
                    background: page.isSelected ? 'var(--surface)' : 'var(--surface-2)', 
                    borderRadius: '12px', border: page.isSelected ? `2px solid ${selectedTool.color}` : '1px solid var(--border)',
                    overflow: 'hidden', position: 'relative'
                  }}>
                    <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', position: 'relative' }}>
                      {page.thumbnail ? (
                        <img src={page.thumbnail} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `rotate(${page.rotation}deg)`, transition: '0.3s' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <Loader2 size={24} className="animate-spin" color="var(--text-3)" />
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>تحميل المعاينة...</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                        {page.isImage ? <ImageIcon size={10} style={{ display: 'inline', marginLeft: '4px' }} /> : null}
                        صفحة {index + 1}
                      </div>
                    </div>

                    <div style={{ padding: '6px', display: 'flex', justifyContent: 'space-between', background: 'var(--surface)' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button onClick={() => {
                          const newPages = [...pdfPages];
                          if (index > 0) {
                            [newPages[index], newPages[index-1]] = [newPages[index-1], newPages[index]];
                            setPdfPages(newPages);
                          }
                        }} disabled={index === 0} className="icon-btn" style={{ width: '22px', height: '22px' }}><ArrowUp size={10} /></button>
                        <button onClick={() => {
                          const newPages = [...pdfPages];
                          if (index < newPages.length - 1) {
                            [newPages[index], newPages[index+1]] = [newPages[index+1], newPages[index]];
                            setPdfPages(newPages);
                          }
                        }} disabled={index === pdfPages.length - 1} className="icon-btn" style={{ width: '22px', height: '22px' }}><ArrowDown size={10} /></button>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button onClick={() => setPdfPages(pdfPages.map(p => p.id === page.id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))} className="icon-btn" style={{ width: '22px', height: '22px' }}><RotateCw size={10} /></button>
                        <button onClick={() => setPdfPages(pdfPages.map(p => p.id === page.id ? { ...p, isSelected: !p.isSelected } : p))} className="icon-btn" style={{ width: '22px', height: '22px', color: page.isSelected ? 'var(--green)' : 'var(--text-3)' }}>
                          {page.isSelected ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                        </button>
                      </div>
                    </div>

                    <button onClick={() => setPdfPages(pdfPages.filter(p => p.id !== page.id))} style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                
                <div onClick={() => fileInputRef.current.click()} style={{ height: '178px', border: '2px dashed var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}>
                  <PlusCircle size={24} />
                  <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '8px' }}>إضافة ملف/صورة</span>
                </div>
              </div>

              <button className="btn" onClick={processFinalPdf} style={{ background: selectedTool.color, position: 'sticky', bottom: '110px', boxShadow: 'var(--shadow-md)', marginTop: '20px' }}>
                <Play size={18} /> دمج وحفظ باسم "{outputFileName || 'frame'}.pdf"
              </button>
            </>
          )}

          {pdfPages.length === 0 && (
            <Card padded style={{ background: 'var(--surface)', border: '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer', padding: '60px 20px' }} onClick={() => fileInputRef.current.click()}>
              <Upload size={40} color="var(--text-3)" style={{ marginBottom: '16px' }} />
              <div style={{ fontWeight: 800 }}>ارفع ملفات PDF أو صور (JPG, PNG)</div>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '8px' }}>سيتم دمجها جميعاً في ملف واحد مع معاينة فورية</p>
            </Card>
          )}
        </div>
      )}

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleFileSelect} accept=".pdf,image/*" />

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
