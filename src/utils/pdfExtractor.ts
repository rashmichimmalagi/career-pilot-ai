import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    console.warn('[PDF Worker Init] Setting worker URL fallback:', e);
  }
}

/**
 * Robustly and efficiently extracts all readable text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    // Initialize document loading task with optimized options
    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      useSystemFonts: true,
      disableFontFace: true,
      stopAtErrors: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent({
        includeMarkedContent: false,
      });

      const pageStr = textContent.items
        .map((item: any) => {
          if ('str' in item && typeof item.str === 'string') {
            return item.str.trim();
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      if (pageStr.trim()) {
        pageTexts.push(pageStr.trim());
      }

      // Cleanup page resources immediately
      page.cleanup();
    }

    const fullText = pageTexts.join('\n\n').trim();
    // Safety text ceiling
    return fullText.slice(0, 20000);
  } catch (error) {
    console.error('[PDF extraction] Extraction error details:', error);
    throw error;
  }
}
