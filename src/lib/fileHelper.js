// Helper: load pdfjs from CDN
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('مكتبة PDF غير متوفرة بعد التحميل'));
      }
    };
    script.onerror = () => reject(new Error('فشل تحميل مكتبة PDF من الخادم'));
    document.head.appendChild(script);
  });
}

// Render one PDF page to a base64 JPEG
async function renderPageToBase64(page) {
  try {
    const viewport = page.getViewport({ scale: 1.0 }); // Slightly lower scale for performance
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.5); // Lower quality (0.5) to save memory/DB space
  } catch (err) {
    console.error("Page render error:", err);
    throw new Error('فشل معالجة صفحة من المستند');
  }
}

/**
 * Process an uploaded file:
 * - Image: returns base64 string
 * - PDF: converts each page to JPEG, returns JSON array string
 */
export async function processAttachment(file) {
  if (!file) throw new Error('الملف غير موجود');

  // Handle Images
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
      r.readAsDataURL(file);
    });
  }

  // Handle PDF
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await loadPdfJs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      const pages = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) { // Limit to 20 pages for safety
        const page = await pdf.getPage(i);
        const b64 = await renderPageToBase64(page);
        pages.push(b64);
      }
      return JSON.stringify(pages);
    } catch (err) {
      console.error("PDF process error:", err);
      throw new Error('فشل معالجة ملف PDF: ' + err.message);
    }
  }

  // Fallback for other files (try reading as data URL anyway)
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('فشل قراءة الملف'));
    r.readAsDataURL(file);
  });
}

/**
 * Parse a stored attachment value into array of src strings.
 * Handles: JSON array of base64 | single base64 | http URL
 */
export function parseAttachment(stored) {
  if (!stored) return [];
  if (typeof stored !== 'string') return [];
  
  if (stored.startsWith('[')) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.flatMap(item => parseAttachment(item));
      }
      return [stored];
    } catch {
      return [stored];
    }
  }
  
  if (stored.startsWith('data:') || stored.startsWith('http')) {
    return [stored];
  }
  
  return [];
}
