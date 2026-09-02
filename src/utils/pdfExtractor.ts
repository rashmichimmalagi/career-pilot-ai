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

      // Filter and structure text items with layout awareness
      const validItems: Array<{ str: string; x: number; y: number; hasEOL?: boolean }> = [];
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
          const transform = (item as any).transform || [0, 0, 0, 0, 0, 0];
          validItems.push({
            str: item.str,
            x: transform[4] || 0,
            y: transform[5] || 0,
            hasEOL: (item as any).hasEOL,
          });
        }
      }

      if (validItems.length === 0) {
        page.cleanup();
        continue;
      }

      // Group items into visual lines based on vertical Y coordinates (within 4px delta)
      // Note: In PDF coordinate system, Y=0 is bottom and higher Y is top of page
      validItems.sort((a, b) => b.y - a.y || a.x - b.x);

      const lines: string[] = [];
      let currentLineItems: Array<{ str: string; x: number }> = [];
      let currentLineY: number | null = null;

      for (const item of validItems) {
        if (currentLineY === null) {
          currentLineY = item.y;
          currentLineItems.push({ str: item.str, x: item.x });
        } else if (Math.abs(item.y - currentLineY) <= 4) {
          // Same line
          currentLineItems.push({ str: item.str, x: item.x });
        } else {
          // New line encountered - sort current line items from left to right (X ascending)
          currentLineItems.sort((a, b) => a.x - b.x);
          const lineStr = currentLineItems.map((i) => i.str.trim()).filter(Boolean).join(' ');
          if (lineStr.trim()) {
            lines.push(lineStr.trim());
          }
          currentLineY = item.y;
          currentLineItems = [{ str: item.str, x: item.x }];
        }
      }

      // Flush remaining line items
      if (currentLineItems.length > 0) {
        currentLineItems.sort((a, b) => a.x - b.x);
        const lineStr = currentLineItems.map((i) => i.str.trim()).filter(Boolean).join(' ');
        if (lineStr.trim()) {
          lines.push(lineStr.trim());
        }
      }

      const pageText = lines.join('\n');
      if (pageText.trim()) {
        pageTexts.push(pageText.trim());
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

/**
 * Extracts text from a remote PDF URL (e.g. Supabase storage or blob URL)
 */
export async function extractTextFromPdfUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], 'resume.pdf', { type: 'application/pdf' });
    return await extractTextFromPdf(file);
  } catch (err) {
    console.warn('[PDF extraction from URL] error:', err);
    return '';
  }
}

