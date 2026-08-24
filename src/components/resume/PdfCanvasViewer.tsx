import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    console.warn('[PDF Canvas Viewer] Setting worker URL notice:', e);
  }
}

interface PdfCanvasViewerProps {
  blob: Blob | null;
  fileName: string;
  isLoading: boolean;
  error: string | null;
  onDownloadOriginal: () => void;
  onOpenInTab: () => void;
  onRetry: () => void;
  isDownloading?: boolean;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  blob,
  fileName,
  isLoading,
  error,
  onDownloadOriginal,
  onOpenInTab,
  onRetry,
  isDownloading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [parseError, setParseError] = useState<boolean>(false);

  // 1. Load PDF Document from Blob
  useEffect(() => {
    let active = true;
    setParseError(false);
    setPdfDoc(null);
    setCurrentPage(1);

    if (!blob) {
      return;
    }

    const loadDoc = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        if (!active) return;
        const typedArray = new Uint8Array(arrayBuffer);

        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          useSystemFonts: true,
          disableFontFace: false,
          stopAtErrors: false,
        });

        const doc = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages || 1);
        setCurrentPage(1);
      } catch (err) {
        console.error('[PdfCanvasViewer] Error parsing PDF document:', err);
        if (active) {
          setParseError(true);
        }
      }
    };

    loadDoc();

    return () => {
      active = false;
    };
  }, [blob]);

  // 2. Render Page onto HTML5 Canvas
  useEffect(() => {
    let isCancelled = false;

    if (!pdfDoc || !canvasRef.current) {
      return;
    }

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (_) {}
          renderTaskRef.current = null;
        }

        setIsRenderingPage(true);
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const dpr = window.devicePixelRatio || 1;
        const baseViewport = page.getViewport({ scale: zoomScale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) return;

        canvas.width = Math.floor(baseViewport.width * dpr);
        canvas.height = Math.floor(baseViewport.height * dpr);
        canvas.style.width = `${Math.floor(baseViewport.width)}px`;
        canvas.style.height = `${Math.floor(baseViewport.height)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: page.getViewport({ scale: zoomScale * dpr }),
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('[PdfCanvasViewer] Render page notice:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsRenderingPage(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [pdfDoc, currentPage, zoomScale]);

  // State A: Loading
  if (isLoading) {
    return (
      <div className="h-[520px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3.5 p-6 shadow-inner">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
          Loading resume...
        </p>
      </div>
    );
  }

  // State B: Fetch Error
  if (error) {
    return (
      <div className="h-[520px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-inner">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            ⚠️ Unable to open this resume
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {error || 'Unable to open this resume. Please try again.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap justify-center pt-2">
          <button
            type="button"
            onClick={onOpenInTab}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open in New Tab</span>
          </button>
          <button
            type="button"
            onClick={onDownloadOriginal}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // State C: PDF Parse Error / Browser fallback
  if (parseError || (!pdfDoc && blob)) {
    return (
      <div className="h-[520px] rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-inner">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            📄 Resume PDF
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            PDF preview isn't available in this browser.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap justify-center pt-2">
          <button
            type="button"
            onClick={onOpenInTab}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open in New Tab</span>
          </button>
          <button
            type="button"
            onClick={onDownloadOriginal}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    );
  }

  // State D: Normal Canvas Document Preview with controls
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-inner">
      
      {/* Viewer Floating Control Toolbar */}
      <div className="px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
        
        {/* Pagination */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold">
            Page {currentPage} of {numPages || 1}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Direct Action Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.max(0.75, Number((z - 0.2).toFixed(2))))}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setZoomScale(1.25)}
            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round((zoomScale / 1.25) * 100)}%
          </button>

          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))))}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={onOpenInTab}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Open original document in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Tab</span>
          </button>
        </div>

      </div>

      {/* Canvas Scroll Area */}
      <div className="w-full h-[520px] overflow-auto p-4 sm:p-6 flex flex-col items-center justify-start bg-slate-200/60 dark:bg-slate-950/80 custom-scrollbar">
        <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 transition-all">
          {isRenderingPage && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          )}
          <canvas ref={canvasRef} className="block max-w-none" />
        </div>
      </div>

    </div>
  );
};
