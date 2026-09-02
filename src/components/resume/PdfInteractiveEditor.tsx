import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { jsPDF } from 'jspdf';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Edit3,
  Sliders,
  Type,
  Plus,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
  Eye,
  Layers,
  Save,
  Wand2,
} from 'lucide-react';
import { StructuredResumeData, ResumeVersionItem } from '../../types/resume';
import { resumeService } from '../../services/resumeService';

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    console.warn('[PdfInteractiveEditor] Worker URL notice:', e);
  }
}

export interface TextOverlayItem {
  id: string;
  pageIndex: number; // 1-indexed
  originalText: string;
  currentText: string;
  x: number; // in viewport CSS px
  y: number; // top in viewport CSS px
  width: number; // in viewport CSS px
  height: number; // in viewport CSS px
  fontSize: number; // in px
  fontFamily?: string;
  isModified: boolean;
}

interface PdfInteractiveEditorProps {
  blob: Blob | null;
  resume: ResumeVersionItem;
  initialStructuredData?: StructuredResumeData;
  onDataChange?: (updatedData: StructuredResumeData) => void;
  onTriggerAi?: (sectionType: string, currentContent: string, onApply: (improvedText: string) => void) => void;
  onSave: (updatedData: StructuredResumeData, editedPdfBlob: Blob, customLabel?: string) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export const PdfInteractiveEditor: React.FC<PdfInteractiveEditorProps> = ({
  blob,
  resume,
  initialStructuredData,
  onDataChange,
  onTriggerAi,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Overlay state: text items detected for the document
  const [overlays, setOverlays] = useState<TextOverlayItem[]>([]);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [editingInputText, setEditingInputText] = useState<string>('');

  // Synchronized structured data for ATS/AI and text export
  const [structuredData, setStructuredData] = useState<StructuredResumeData>(() => {
    if (initialStructuredData && (initialStructuredData.fullName || initialStructuredData.skills?.length)) {
      return initialStructuredData;
    }
    return resumeService.parseResumeTextToStructured(
      resume.resumeText || '',
      resume.targetRole || 'Software Developer',
      '',
      resume.fileName || resume.versionLabel
    );
  });

  // Sidebar tab for Quick Section Editing
  const [showSectionDrawer, setShowSectionDrawer] = useState<boolean>(false);
  const [hasEdits, setHasEdits] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Load PDF Document from Blob
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    setIsLoadingPdf(true);
    setLoadError(null);
    setPdfDoc(null);
    setOverlays([]);
    setCurrentPage(1);

    if (!blob) {
      setIsLoadingPdf(false);
      setLoadError('No PDF data available to edit.');
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
        setIsLoadingPdf(false);
      } catch (err: any) {
        console.error('[PdfInteractiveEditor] Error parsing PDF:', err);
        if (active) {
          setIsLoadingPdf(false);
          setLoadError(err?.message || 'Failed to load PDF for editing.');
        }
      }
    };

    loadDoc();

    return () => {
      active = false;
    };
  }, [blob]);

  // ---------------------------------------------------------------------------
  // 2. Render Page onto Canvas & Extract Text Coordinates
  // ---------------------------------------------------------------------------
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: zoomScale });
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const renderContext = {
        canvasContext: ctx,
        viewport: page.getViewport({ scale: zoomScale * dpr }),
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;

      // Extract text content if not already extracted for this page
      const textContent = await page.getTextContent();
      const rawItems = textContent.items as any[];

      // Filter and group text items into logical lines
      const pageOverlays: TextOverlayItem[] = [];
      const lineMap = new Map<number, any[]>();

      for (const item of rawItems) {
        if (!item.str || item.str.trim() === '') continue;

        const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        const fontHeight = (item.height || 10) * viewport.scale;
        const width = item.width * viewport.scale;

        // Group by approximate Y baseline (within 3px)
        const roundedY = Math.round(vy / 4) * 4;
        if (!lineMap.has(roundedY)) {
          lineMap.set(roundedY, []);
        }
        lineMap.get(roundedY)!.push({
          str: item.str,
          vx,
          vy,
          fontHeight,
          width,
          fontName: item.fontName,
        });
      }

      // Merge items per line into coherent overlay blocks
      let itemIdx = 0;
      lineMap.forEach((items) => {
        items.sort((a, b) => a.vx - b.vx);

        let curStr = '';
        let minX = Infinity;
        let maxX = -Infinity;
        let baselineY = items[0].vy;
        let maxFontH = 0;

        for (const it of items) {
          curStr += (curStr ? ' ' : '') + it.str;
          minX = Math.min(minX, it.vx);
          maxX = Math.max(maxX, it.vx + it.width);
          maxFontH = Math.max(maxFontH, it.fontHeight);
        }

        const calculatedTop = baselineY - maxFontH;
        const overlayId = `p${currentPage}_line_${itemIdx++}`;

        pageOverlays.push({
          id: overlayId,
          pageIndex: currentPage,
          originalText: curStr.trim(),
          currentText: curStr.trim(),
          x: Math.max(0, Math.floor(minX)),
          y: Math.max(0, Math.floor(calculatedTop)),
          width: Math.ceil(maxX - minX) + 4,
          height: Math.ceil(maxFontH * 1.2) + 2,
          fontSize: Math.max(10, Math.round(maxFontH * 0.95)),
          isModified: false,
        });
      });

      // Merge new page overlays while preserving any existing user modifications
      setOverlays((prev) => {
        const existingMap = new Map(prev.map((o) => [o.id, o]));
        const merged = pageOverlays.map((newO) => {
          const existing = existingMap.get(newO.id);
          if (existing && existing.isModified) {
            return {
              ...newO,
              currentText: existing.currentText,
              isModified: true,
            };
          }
          return newO;
        });

        // Retain overlays from other pages
        const otherPages = prev.filter((o) => o.pageIndex !== currentPage);
        return [...otherPages, ...merged];
      });
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('[PdfInteractiveEditor] Render notice:', err);
      }
    }
  }, [pdfDoc, currentPage, zoomScale]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // ---------------------------------------------------------------------------
  // 3. Inline Text Editing Handlers
  // ---------------------------------------------------------------------------
  const handleStartEditing = (overlay: TextOverlayItem) => {
    setEditingOverlayId(overlay.id);
    setEditingInputText(overlay.currentText);
  };

  const handleCommitInlineEdit = (overlayId: string) => {
    setOverlays((prev) =>
      prev.map((o) => {
        if (o.id === overlayId) {
          const isChanged = editingInputText !== o.originalText;
          return {
            ...o,
            currentText: editingInputText,
            isModified: isChanged,
          };
        }
        return o;
      })
    );
    setEditingOverlayId(null);
    setHasEdits(true);

    // Sync edited text into structuredData / resumeText
    syncOverlaysToStructuredData();
  };

  const handleCancelInlineEdit = () => {
    setEditingOverlayId(null);
    setEditingInputText('');
  };

  const handleRevertItem = (overlayId: string) => {
    setOverlays((prev) =>
      prev.map((o) => {
        if (o.id === overlayId) {
          return {
            ...o,
            currentText: o.originalText,
            isModified: false,
          };
        }
        return o;
      })
    );
    setEditingOverlayId(null);
  };

  // ---------------------------------------------------------------------------
  // 4. Sync Overlays to StructuredData & ResumeText
  // ---------------------------------------------------------------------------
  const syncOverlaysToStructuredData = useCallback(() => {
    setOverlays((currentOverlays) => {
      const fullModifiedText = currentOverlays
        .filter((o) => o.pageIndex === currentPage)
        .map((o) => o.currentText)
        .join('\n');

      if (fullModifiedText.length > 30) {
        const studentFullName = resume.fileName?.replace(/\.pdf$/i, '') || '';
        const parsed = resumeService.parseResumeTextToStructured(
          fullModifiedText,
          resume.targetRole || 'Software Developer',
          studentFullName,
          resume.fileName || resume.versionLabel
        );
        setStructuredData(parsed);
        if (onDataChange) {
          onDataChange(parsed);
        }
      }
      return currentOverlays;
    });
  }, [currentPage, resume, onDataChange]);

  // Current page active overlays
  const currentPageOverlays = useMemo(
    () => overlays.filter((o) => o.pageIndex === currentPage),
    [overlays, currentPage]
  );

  // ---------------------------------------------------------------------------
  // 5. Generate High-Res Edited PDF Blob from Document + Overlays
  // ---------------------------------------------------------------------------
  const generateEditedPdfBlob = async (): Promise<Blob> => {
    if (!pdfDoc) {
      throw new Error('PDF document not loaded');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const exportScale = 2.0; // High resolution rendering for crisp text & graphics

    for (let p = 1; p <= numPages; p++) {
      if (p > 1) {
        doc.addPage();
      }

      const page = await pdfDoc.getPage(p);
      const viewport = page.getViewport({ scale: exportScale });

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = Math.floor(viewport.width);
      offscreenCanvas.height = Math.floor(viewport.height);
      const ctx = offscreenCanvas.getContext('2d', { alpha: false });

      if (ctx) {
        // Step A: Render original PDF page onto canvas
        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        // Step B: Draw user modified text overlays on top
        const pageMods = overlays.filter((o) => o.pageIndex === p && o.isModified);
        const scaleFactor = exportScale / zoomScale;

        for (const mod of pageMods) {
          const modX = mod.x * scaleFactor;
          const modY = mod.y * scaleFactor;
          const modW = mod.width * scaleFactor;
          const modH = mod.height * scaleFactor;
          const modFontSize = mod.fontSize * scaleFactor;

          // Draw whiteout background over original text
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(modX - 2, modY - 1, modW + 8, modH + 2);

          // Draw replacement text
          ctx.fillStyle = '#0F172A'; // Slate-900 high contrast text
          ctx.font = `${Math.round(modFontSize)}px Helvetica, Arial, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(mod.currentText, modX, modY + 1);
        }

        // Step C: Convert canvas to image and add to jsPDF page
        const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    }

    return doc.output('blob');
  };

  // ---------------------------------------------------------------------------
  // 6. Save Edits Handler
  // ---------------------------------------------------------------------------
  const handleSaveClick = async () => {
    try {
      const editedBlob = await generateEditedPdfBlob();
      await onSave(structuredData, editedBlob);
    } catch (err: any) {
      console.error('[PdfInteractiveEditor] Save error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------------------------
  if (isLoadingPdf) {
    return (
      <div className="h-[560px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3.5 p-6 shadow-inner">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
          Loading original PDF for visual editing...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-[560px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-inner">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Unable to load PDF document
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {loadError}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
        >
          Return to View Mode
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-inner">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP EDITING TOOLBAR                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
        
        {/* Left: Mode Badge & Page Navigation */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px]">
            <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>PDF Visual Editor</span>
          </span>

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
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.max(0.75, Number((z - 0.2).toFixed(2))))}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 w-10 text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.min(2.0, Number((z + 0.2).toFixed(2))))}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomScale(1.25)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[10px] font-bold"
            title="Reset Zoom"
          >
            Fit
          </button>
        </div>

        {/* Right: Section Drawer Toggle & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSectionDrawer(!showSectionDrawer)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showSectionDrawer
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Section Content</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save as New Version</span>
          </button>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* HINT BAR                                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Original Layout Preserved:</strong> Click any text directly on your PDF to edit it inline, or open <strong>Section Content</strong> to rewrite bullets with AI.
          </span>
        </div>
        {hasEdits && (
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700">
            Unsaved Edits
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN VISUAL WORKSPACE: PDF CANVAS + OVERLAY LAYER             */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* Left/Center: Visual PDF Canvas with In-Place Text Overlays */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-slate-200/60 dark:bg-slate-950/80 min-h-[580px]"
        >
          <div className="relative shadow-2xl rounded-sm bg-white overflow-hidden transition-transform duration-150">
            
            {/* 1. Underlying Original PDF Canvas */}
            <canvas ref={canvasRef} className="block select-none" />

            {/* 2. Interactive Click-to-Edit Overlays Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {currentPageOverlays.map((overlay) => {
                const isEditing = editingOverlayId === overlay.id;

                if (isEditing) {
                  return (
                    <div
                      key={overlay.id}
                      style={{
                        position: 'absolute',
                        left: `${overlay.x}px`,
                        top: `${overlay.y}px`,
                        width: `${Math.max(overlay.width, 180)}px`,
                        minHeight: `${overlay.height}px`,
                        zIndex: 40,
                      }}
                      className="pointer-events-auto bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-xl rounded-md p-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <textarea
                        value={editingInputText}
                        onChange={(e) => setEditingInputText(e.target.value)}
                        rows={editingInputText.length > 50 ? 3 : 1}
                        style={{ fontSize: `${overlay.fontSize}px` }}
                        className="w-full bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none resize-y leading-tight"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommitInlineEdit(overlay.id);
                          } else if (e.key === 'Escape') {
                            handleCancelInlineEdit();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                        <div className="flex items-center gap-1 text-slate-400">
                          <span>Press ↵ to apply</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {overlay.isModified && (
                            <button
                              type="button"
                              onClick={() => handleRevertItem(overlay.id)}
                              className="px-2 py-0.5 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold cursor-pointer"
                              title="Revert to original"
                            >
                              Revert
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleCancelInlineEdit}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCommitInlineEdit(overlay.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 text-white font-bold cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Non-editing state: If modified, render solid whiteout overlay; if untouched, render subtle hover target
                if (overlay.isModified) {
                  return (
                    <div
                      key={overlay.id}
                      onClick={() => handleStartEditing(overlay)}
                      style={{
                        position: 'absolute',
                        left: `${overlay.x}px`,
                        top: `${overlay.y}px`,
                        width: `${overlay.width}px`,
                        minHeight: `${overlay.height}px`,
                        fontSize: `${overlay.fontSize}px`,
                      }}
                      className="pointer-events-auto bg-white border border-indigo-300 dark:border-indigo-600 hover:border-indigo-600 hover:shadow-sm text-slate-900 px-1 py-0.5 rounded-xs cursor-text transition-all leading-tight font-sans"
                      title="Click to edit modified text"
                    >
                      {overlay.currentText}
                    </div>
                  );
                }

                // Untouched item: Subtle click-to-edit hover frame
                return (
                  <div
                    key={overlay.id}
                    onClick={() => handleStartEditing(overlay)}
                    style={{
                      position: 'absolute',
                      left: `${overlay.x}px`,
                      top: `${overlay.y}px`,
                      width: `${overlay.width}px`,
                      height: `${overlay.height}px`,
                    }}
                    className="pointer-events-auto hover:bg-indigo-500/15 hover:border hover:border-indigo-500/50 rounded-xs cursor-text transition-colors group"
                    title={`Click to edit: "${overlay.originalText}"`}
                  />
                );
              })}
            </div>

          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Right Drawer: Structured Section Content & AI Polish        */}
        {/* ----------------------------------------------------------- */}
        {showSectionDrawer && (
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-auto max-h-[600px] lg:max-h-none overflow-y-auto">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Resume Content Sections
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              
              {/* Full Name & Title */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Full Name & Title
                </label>
                <input
                  type="text"
                  value={structuredData.fullName || ''}
                  onChange={(e) => {
                    const updated = { ...structuredData, fullName: e.target.value };
                    setStructuredData(updated);
                    setHasEdits(true);
                    if (onDataChange) onDataChange(updated);
                  }}
                  placeholder="Your Full Name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={structuredData.title || ''}
                  onChange={(e) => {
                    const updated = { ...structuredData, title: e.target.value };
                    setStructuredData(updated);
                    setHasEdits(true);
                    if (onDataChange) onDataChange(updated);
                  }}
                  placeholder="Target Role (e.g. Software Engineer)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Professional Summary
                  </label>
                  {onTriggerAi && (
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerAi('summary', structuredData.summary || '', (improved) => {
                          const updated = { ...structuredData, summary: improved };
                          setStructuredData(updated);
                          setHasEdits(true);
                          if (onDataChange) onDataChange(updated);
                        })
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Polish</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={structuredData.summary || ''}
                  onChange={(e) => {
                    const updated = { ...structuredData, summary: e.target.value };
                    setStructuredData(updated);
                    setHasEdits(true);
                    if (onDataChange) onDataChange(updated);
                  }}
                  placeholder="Write a concise professional summary..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Skills
                </label>
                <div className="space-y-2">
                  {(structuredData.skills || []).map((skillGroup, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <input
                        type="text"
                        value={skillGroup.category || ''}
                        onChange={(e) => {
                          const newSkills = [...(structuredData.skills || [])];
                          newSkills[gIdx] = { ...newSkills[gIdx], category: e.target.value };
                          const updated = { ...structuredData, skills: newSkills };
                          setStructuredData(updated);
                          setHasEdits(true);
                          if (onDataChange) onDataChange(updated);
                        }}
                        className="w-full text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-transparent focus:outline-none"
                        placeholder="Category (e.g. Languages)"
                      />
                      <input
                        type="text"
                        value={(skillGroup.items || []).join(', ')}
                        onChange={(e) => {
                          const newSkills = [...(structuredData.skills || [])];
                          newSkills[gIdx] = {
                            ...newSkills[gIdx],
                            items: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          const updated = { ...structuredData, skills: newSkills };
                          setStructuredData(updated);
                          setHasEdits(true);
                          if (onDataChange) onDataChange(updated);
                        }}
                        className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none"
                        placeholder="React, TypeScript, Node.js"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Experience Bullets
                </label>
                {(structuredData.experience || []).map((exp, eIdx) => (
                  <div
                    key={eIdx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      {exp.role || 'Role'} @ {exp.company || 'Company'}
                    </div>
                    {(exp.bulletPoints || []).map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5">
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) => {
                            const newExp = [...(structuredData.experience || [])];
                            const newBullets = [...(newExp[eIdx].bulletPoints || [])];
                            newBullets[bIdx] = e.target.value;
                            newExp[eIdx] = { ...newExp[eIdx], bulletPoints: newBullets };
                            const updated = { ...structuredData, experience: newExp };
                            setStructuredData(updated);
                            setHasEdits(true);
                            if (onDataChange) onDataChange(updated);
                          }}
                          className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none"
                        />
                        {onTriggerAi && (
                          <button
                            type="button"
                            onClick={() =>
                              onTriggerAi('experience', bullet, (improved) => {
                                const newExp = [...(structuredData.experience || [])];
                                const newBullets = [...(newExp[eIdx].bulletPoints || [])];
                                newBullets[bIdx] = improved;
                                newExp[eIdx] = { ...newExp[eIdx], bulletPoints: newBullets };
                                const updated = { ...structuredData, experience: newExp };
                                setStructuredData(updated);
                                setHasEdits(true);
                                if (onDataChange) onDataChange(updated);
                              })
                            }
                            className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                            title="AI Polish this bullet"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
