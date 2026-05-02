import { PDFDocument } from 'pdf-lib';

/**
 * Recursively flattens an array of strings that might be JSON arrays themselves.
 */
function flattenInputs(inputs) {
  const result = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string' && input.startsWith('[')) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          result.push(...flattenInputs(parsed));
        } else {
          result.push(input);
        }
      } catch {
        result.push(input);
      }
    } else {
      result.push(input);
    }
  }
  return result;
}

/**
 * Merges a primary PDF with multiple attachments (PDFs or Images).
 */
export async function mergePdfs(mainPdfBytes, attachmentInputs) {
  try {
    const mainDoc = await PDFDocument.load(mainPdfBytes);
    const flattened = flattenInputs(attachmentInputs);

    for (const base64Str of flattened) {
      try {
        if (typeof base64Str !== 'string') continue;

        if (base64Str.startsWith('data:application/pdf')) {
          const rawBase64 = base64Str.split(',')[1];
          const attachedDoc = await PDFDocument.load(rawBase64);
          const copiedPages = await mainDoc.copyPages(attachedDoc, attachedDoc.getPageIndices());
          copiedPages.forEach((page) => mainDoc.addPage(page));
        } else if (base64Str.startsWith('data:image/')) {
          const imgType = base64Str.split(';')[0].split('/')[1];
          const rawBase64 = base64Str.split(',')[1];
          let image;
          if (imgType === 'jpeg' || imgType === 'jpg') {
            image = await mainDoc.embedJpg(rawBase64);
          } else if (imgType === 'png') {
            image = await mainDoc.embedPng(rawBase64);
          } else {
            continue;
          }
          const page = mainDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
      } catch (err) {
        console.error("Failed to merge an attachment item", err);
      }
    }
    
    return await mainDoc.save();
  } catch (error) {
    console.error("Error in merging PDFs:", error);
    throw error;
  }
}
