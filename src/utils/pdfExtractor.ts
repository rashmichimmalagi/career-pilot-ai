import * as pdfjsLib from 'pdfjs-dist';

// Configure worker safely for browser environment
if (typeof window !== 'undefined') {
  try {
    // Use worker from standard CDN matching version or fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF Worker initialization note:', e);
  }
}

/**
 * Extracts all text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      useSystemFonts: true,
      disableFontFace: false,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');

      fullText += `\n--- Page ${pageNum} ---\n` + pageText;
    }

    const cleanedText = fullText.trim();
    if (!cleanedText || cleanedText.length < 30) {
      throw new Error('Extracted text is too short or empty');
    }

    return cleanedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Unable to read this PDF. Please upload another PDF.');
  }
}
