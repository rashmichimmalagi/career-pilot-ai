import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Play,
  Send,
  RotateCcw,
  History,
  Copy,
  Check,
  Code,
  Terminal,
  FileCode2,
  Maximize2,
  Minimize2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sun,
  Moon,
  ShieldCheck,
  AlertCircle,
  Bot,
  Laptop
} from 'lucide-react';
import {
  CodingLanguage,
  CodingProblem,
  SubmissionEvaluationResult,
  CodingExample,
  AICodingMentorFeedback,
  CodingSubmission
} from '../../types/coding';
import { LANGUAGES, sanitizeStarterCode, codingService } from '../../services/codingService';
import { codingHistoryService, RestoredCodeResult } from '../../services/codingHistoryService';
import { AIMentorFeedbackPanel } from './AIMentorFeedbackPanel';
import { useAuth } from '../../context/AuthContext';

interface CodeEditorWorkspaceProps {
  language: CodingLanguage;
  availableLanguages?: CodingLanguage[];
  onLanguageChange: (lang: CodingLanguage) => void;
  code: string;
  onCodeChange: (code: string) => void;
  problem: CodingProblem;
  onRunCode: (customInput: string) => Promise<any>;
  onSubmitSolution: () => Promise<SubmissionEvaluationResult | null>;
  evaluationResult?: SubmissionEvaluationResult | null;
  executionId?: string;
  isRunning?: boolean;
  isSubmitting?: boolean;
  submissions?: CodingSubmission[];
}

// Map CodingLanguage to Monaco Editor language identifiers
export const getMonacoLanguage = (lang: CodingLanguage): string => {
  switch (lang) {
    case 'C':
      return 'c';
    case 'C++':
      return 'cpp';
    case 'Java':
      return 'java';
    case 'Python':
      return 'python';
    case 'JavaScript':
      return 'javascript';
    case 'SQL':
      return 'sql';
    default:
      return 'plaintext';
  }
};

export const CodeEditorWorkspace: React.FC<CodeEditorWorkspaceProps> = React.memo(({
  language,
  availableLanguages = LANGUAGES,
  onLanguageChange,
  code,
  onCodeChange,
  problem,
  onRunCode,
  onSubmitSolution,
  evaluationResult = null,
  executionId,
  isRunning = false,
  isSubmitting = false,
  submissions = [],
}) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[RENDER] CodeEditorWorkspace:', problem?.id, problem?.title, 'lang:', language);
  }
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'testcase' | 'testresult' | 'evaluation' | 'mentor'>('testcase');
  const [selectedExampleCase, setSelectedExampleCase] = useState<number>(0);
  const [useCustomInput, setUseCustomInput] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [lastRunResult, setLastRunResult] = useState<any | null>(null);

  // Restore Previous Code State
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [pendingRestoreCode, setPendingRestoreCode] = useState<RestoredCodeResult | null>(null);

  // Reset Code to Starter State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Monaco Loading & Readiness State
  const [monacoLoaded, setMonacoLoaded] = useState<boolean>(false);
  const [monacoFailed, setMonacoFailed] = useState<boolean>(false);

  // AI Coding Mentor State
  const [mentorFeedback, setMentorFeedback] = useState<AICodingMentorFeedback | null>(null);
  const [isMentorLoading, setIsMentorLoading] = useState<boolean>(false);
  const mentorAbortRef = useRef<AbortController | null>(null);

  // Native Editor Textarea & Gutter refs for synchronized scrolling
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  const { user, showToast } = useAuth();
  const userId = user?.id || 'guest';
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Automatically auto-save draft code (debounced)
  useEffect(() => {
    if (!problem?.id || !code) return;
    const timer = setTimeout(() => {
      codingHistoryService.saveDraftCode(userId, problem.id, language, code);
    }, 600);
    return () => clearTimeout(timer);
  }, [code, problem?.id, language, userId]);

  // Clean up in-flight mentor request on unmount
  useEffect(() => {
    return () => {
      mentorAbortRef.current?.abort();
    };
  }, []);

  // Set a safety timeout for Monaco: if Monaco CDN doesn't resolve within 2.5s, keep native editor active smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!monacoLoaded) {
        setMonacoFailed(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [monacoLoaded]);

  // Hard-reset stale AI Mentor feedback and aborted requests when a new execution starts or problem switches
  useEffect(() => {
    mentorAbortRef.current?.abort();
    setIsMentorLoading(false);
    setMentorFeedback(null);
  }, [executionId, problem.id, problem.title]);

  // Reset execution result, syntax status, and mentor feedback on language change
  useEffect(() => {
    mentorAbortRef.current?.abort();
    setIsMentorLoading(false);
    setMentorFeedback(null);
    setLastRunResult(null);
    setSyntaxStatus(null);
  }, [language]);

  // Automatically switch bottom tab to evaluation when evaluationResult arrives
  useEffect(() => {
    if (evaluationResult) {
      setBottomTab('evaluation');
    }
  }, [evaluationResult]);

  // Editor Theme (Dark / Light)
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('careerpilot_editor_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Language Change Confirmation Modal State
  const [pendingLanguage, setPendingLanguage] = useState<CodingLanguage | null>(null);
  const [showLangModal, setShowLangModal] = useState(false);

  // Syntax Validation State
  const [syntaxStatus, setSyntaxStatus] = useState<{
    valid: boolean;
    message: string;
    line?: number;
  } | null>(null);

  const notifyBlockedPaste = useCallback(() => {
    showToastRef.current(
      '🚫 Copy & Paste Not Allowed',
      'Please type your code manually to build muscle memory.',
      'warning',
      undefined,
      2500
    );
  }, []);

  const editorRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('careerpilot_editor_theme', editorTheme);
  }, [editorTheme]);

  const toggleEditorTheme = () => {
    setEditorTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    try {
      editorRef.current = editor;
      setMonacoLoaded(true);

      // Prevent paste operations in Coding Practice Monaco editor safely
      if (monaco && monaco.KeyMod && monaco.KeyCode) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
          notifyBlockedPaste();
        });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV, () => {
          notifyBlockedPaste();
        });
        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {
          notifyBlockedPaste();
        });
      }

      // Intercept keydown events for any remaining paste variations
      editor.onKeyDown((e) => {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        if (
          (isCtrlOrCmd && (e.code === 'KeyV' || e.browserEvent?.key?.toLowerCase() === 'v' || (monaco.KeyCode && e.keyCode === monaco.KeyCode.KeyV))) ||
          (e.shiftKey && (e.code === 'Insert' || (monaco.KeyCode && e.keyCode === monaco.KeyCode.Insert)))
        ) {
          e.preventDefault();
          e.stopPropagation();
          notifyBlockedPaste();
        }
      });

      // Intercept DOM-level paste and drag-drop events on editor container
      const domNode = editor.getDomNode();
      if (domNode) {
        const blockPaste = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          notifyBlockedPaste();
        };
        domNode.addEventListener('paste', blockPaste, true);
        domNode.addEventListener('drop', blockPaste, true);
      }

      // Define custom themes safely
      monaco.editor.defineTheme('careerpilot-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'type', foreground: '4EC9B0' },
          { token: 'class', foreground: '4EC9B0', fontStyle: 'bold' },
          { token: 'function', foreground: 'DCDCAA' },
          { token: 'variable', foreground: '9CDCFE' },
          { token: 'operator', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': '#0B0F19',
          'editor.foreground': '#E2E8F0',
          'editorLineNumber.foreground': '#475569',
          'editorLineNumber.activeForeground': '#818CF8',
          'editorGutter.background': '#070A11',
          'editor.selectionBackground': '#3730A366',
          'editor.inactiveSelectionBackground': '#3730A333',
          'editorCursor.foreground': '#818CF8',
          'editor.lineHighlightBackground': '#1E293B44',
          'scrollbar.shadow': '#00000055',
          'scrollbarSlider.background': '#33415588',
          'scrollbarSlider.hoverBackground': '#475569CC',
          'scrollbarSlider.activeBackground': '#6366F1DD',
        },
      });

      monaco.editor.defineTheme('careerpilot-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'AF00DB', fontStyle: 'bold' },
          { token: 'string', foreground: 'A31515' },
          { token: 'number', foreground: '098658' },
          { token: 'type', foreground: '267F99' },
          { token: 'class', foreground: '267F99', fontStyle: 'bold' },
          { token: 'function', foreground: '795E26' },
          { token: 'variable', foreground: '001080' },
          { token: 'operator', foreground: '000000' },
        ],
        colors: {
          'editor.background': '#FFFFFF',
          'editor.foreground': '#0F172A',
          'editorLineNumber.foreground': '#94A3B8',
          'editorLineNumber.activeForeground': '#4F46E5',
          'editorGutter.background': '#F8FAFC',
          'editor.selectionBackground': '#C7D2FE88',
          'editorCursor.foreground': '#4F46E5',
          'editor.lineHighlightBackground': '#F1F5F9AA',
          'scrollbar.shadow': '#00000018',
          'scrollbarSlider.background': '#CBD5E199',
          'scrollbarSlider.hoverBackground': '#94A3B8DD',
          'scrollbarSlider.activeBackground': '#4F46E5DD',
        },
      });
    } catch (mountErr) {
      console.warn('[CodeEditorWorkspace] Monaco mount warning:', mountErr);
      setMonacoLoaded(true);
    }
  };

  const fontSizeNumber = useMemo(() => {
    switch (fontSize) {
      case 'sm':
        return 13;
      case 'base':
        return 14.5;
      case 'lg':
        return 16.5;
      default:
        return 13;
    }
  }, [fontSize]);

  const getFontSizeNumber = useCallback(() => fontSizeNumber, [fontSizeNumber]);

  const monacoOptions = useMemo(() => ({
    fontSize: fontSizeNumber,
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, monospace",
    lineNumbers: 'on' as const,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    matchBrackets: 'always' as const,
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    folding: true,
    renderLineHighlight: 'all' as const,
    padding: { top: 12, bottom: 12 },
    wordWrap: 'off' as const,
    cursorBlinking: 'smooth' as const,
    smoothScrolling: true,
    formatOnPaste: false,
    formatOnType: true,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'auto' as const,
      verticalScrollbarSize: 14,
      horizontalScrollbarSize: 10,
      verticalSliderSize: 14,
      horizontalSliderSize: 10,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      useShadows: true,
      alwaysConsumeMouseWheel: true,
      handleMouseWheel: true,
      arrowSize: 11,
    },
    mouseWheelScrollSensitivity: 1,
    fixedOverflowWidgets: true,
    overviewRulerLanes: 2,
    hideCursorInOverviewRuler: false,
    overviewRulerBorder: true,
  }), [fontSizeNumber]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStarterCode = useCallback(() => {
    if (!problem) return '';
    return sanitizeStarterCode(
      problem.starterCode?.[language] || problem.starter_templates?.[language] || '',
      language,
      problem.title,
      problem.functionSignature?.[language]
    );
  }, [problem, language]);

  const handleResetClick = () => {
    const starter = getStarterCode();
    // If the editor is already unchanged or empty, apply reset directly
    if (!code || code.trim() === starter.trim()) {
      applyResetCode(starter, false);
      return;
    }
    // Code has been modified -> show confirmation dialog
    setShowResetModal(true);
  };

  const applyResetCode = (targetStarter?: string, showToastNotice = true) => {
    const starter = targetStarter ?? getStarterCode();
    onCodeChange(starter);
    if (editorRef.current) {
      try {
        editorRef.current.setValue(starter);
      } catch {
        // ignore if editor not ready
      }
    }
    setSyntaxStatus(null);
    setMentorFeedback(null);
    setLastRunResult(null);
    mentorAbortRef.current?.abort();
    setIsMentorLoading(false);
    setShowResetModal(false);

    if (showToastNotice) {
      showToastRef.current(
        'Code Reset',
        `Restored original starter code for ${language}.`,
        'info',
        undefined,
        2000
      );
    }
  };

  const handleRestorePreviousCode = () => {
    const starterCode = getStarterCode();

    const restorable = codingHistoryService.getRestorableCode(
      userId,
      problem.id,
      language,
      starterCode,
      submissions
    );

    if (
      !restorable ||
      !restorable.code ||
      (restorable.source === 'starter' && restorable.code.trim() === code.trim())
    ) {
      showToastRef.current(
        'No Previous Code',
        'No previous code available.',
        'info',
        undefined,
        2500
      );
      return;
    }

    // If editor has code and differs from candidate
    if (code.trim().length > 0 && code.trim() !== restorable.code.trim()) {
      setPendingRestoreCode(restorable);
      setShowRestoreModal(true);
    } else {
      // Editor is empty or contains only whitespace: restore immediately
      applyRestoredCode(restorable);
    }
  };

  const applyRestoredCode = (target: RestoredCodeResult) => {
    onCodeChange(target.code);
    if (editorRef.current) {
      try {
        editorRef.current.setValue(target.code);
      } catch {
        // ignore if editor not ready
      }
    }
    setSyntaxStatus(null);
    setMentorFeedback(null);
    setLastRunResult(null);
    mentorAbortRef.current?.abort();
    setIsMentorLoading(false);
    setShowRestoreModal(false);
    setPendingRestoreCode(null);

    showToastRef.current(
      'Code Restored',
      `Restored ${target.label.toLowerCase()} for ${language}.`,
      'success',
      undefined,
      2500
    );
  };

  // Language selection with confirmation modal if student has typed code
  const requestLanguageChange = (newLang: CodingLanguage) => {
    if (newLang === language) return;

    const currentStarter = sanitizeStarterCode(
      problem.starterCode?.[language],
      language,
      problem.title,
      problem.functionSignature?.[language]
    );

    const isModified = code.trim().length > 0 && code.trim() !== currentStarter.trim();

    if (isModified) {
      setPendingLanguage(newLang);
      setShowLangModal(true);
    } else {
      applyLanguageChange(newLang);
    }
  };

  const applyLanguageChange = (newLang: CodingLanguage) => {
    onLanguageChange(newLang);
    setPendingLanguage(null);
    setShowLangModal(false);
    setSyntaxStatus(null);
  };

  // Synchronize scrolling between textarea and line numbers gutter in native fallback mode
  const handleNativeScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Tab & Auto-Indentation key handler for the fallback code editor
  const handleNativeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Prevent paste (Ctrl+V / Cmd+V)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      notifyBlockedPaste();
      return;
    }

    // Ctrl/Cmd + Enter to Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleSubmit();
      } else {
        handleRun();
      }
      return;
    }

    const { selectionStart, selectionEnd, value } = textarea;

    // TAB key support (4 spaces indent / Shift+Tab dedent)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Dedent
        const beforeCursor = value.substring(0, selectionStart);
        const lastLineBreak = beforeCursor.lastIndexOf('\n');
        const lineStart = lastLineBreak === -1 ? 0 : lastLineBreak + 1;
        const lineText = value.substring(lineStart, selectionStart);
        if (lineText.startsWith('    ')) {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 4);
          onCodeChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, selectionStart - 4);
            textarea.selectionEnd = Math.max(lineStart, selectionEnd - 4);
          }, 0);
        }
      } else {
        // Tab: Insert 4 spaces
        const tabSpaces = '    ';
        const newValue = value.substring(0, selectionStart) + tabSpaces + value.substring(selectionEnd);
        onCodeChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = selectionStart + 4;
          textarea.selectionEnd = selectionStart + 4;
        }, 0);
      }
      return;
    }

    // Auto-closing brackets and quotes: (, {, [, ", '
    const autoPairs: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (autoPairs[e.key]) {
      e.preventDefault();
      const openChar = e.key;
      const closeChar = autoPairs[openChar];
      const selected = value.substring(selectionStart, selectionEnd);
      const newValue = value.substring(0, selectionStart) + openChar + selected + closeChar + value.substring(selectionEnd);
      onCodeChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1 + selected.length;
      }, 0);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const beforeCursor = value.substring(0, selectionStart);
      const lastLineBreak = beforeCursor.lastIndexOf('\n');
      const currentLine = lastLineBreak === -1 ? beforeCursor : beforeCursor.substring(lastLineBreak + 1);
      const indentMatch = currentLine.match(/^(\s+)/);
      let indent = indentMatch ? indentMatch[1] : '';

      // Extra indent if previous line ended with { or :
      if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':')) {
        indent += '    ';
      }

      const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
      onCodeChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1 + indent.length;
        textarea.selectionEnd = selectionStart + 1 + indent.length;
      }, 0);
    }
  };

  // Client-side syntax validation heuristic
  const validateSyntax = (srcCode: string, lang: CodingLanguage) => {
    const trimmed = srcCode.trim();
    if (!trimmed) {
      return { valid: false, message: 'Editor contains empty code.' };
    }

    const stack: { char: string; line: number }[] = [];
    const lines = srcCode.split('\n');
    let inString = false;
    let stringChar = '';

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx];
      if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('--')) {
        continue;
      }

      for (let cIdx = 0; cIdx < line.length; cIdx++) {
        const ch = line[cIdx];

        if (ch === '"' || ch === "'" || ch === '`') {
          if (!inString) {
            inString = true;
            stringChar = ch;
          } else if (stringChar === ch && line[cIdx - 1] !== '\\') {
            inString = false;
          }
          continue;
        }

        if (inString) continue;

        if (ch === '(' || ch === '{' || ch === '[') {
          stack.push({ char: ch, line: lIdx + 1 });
        } else if (ch === ')' || ch === '}' || ch === ']') {
          if (stack.length === 0) {
            return {
              valid: false,
              message: `Syntax notice: Unmatched closing bracket '${ch}' on line ${lIdx + 1}.`,
              line: lIdx + 1,
            };
          }
          const last = stack.pop()!;
          const matches =
            (last.char === '(' && ch === ')') ||
            (last.char === '{' && ch === '}') ||
            (last.char === '[' && ch === ']');
          if (!matches) {
            return {
              valid: false,
              message: `Syntax notice: Mismatched bracket '${ch}' on line ${lIdx + 1} (expected closing for '${last.char}' from line ${last.line}).`,
              line: lIdx + 1,
            };
          }
        }
      }
    }

    if (stack.length > 0) {
      const unclosed = stack[stack.length - 1];
      return {
        valid: false,
        message: `Syntax notice: Unclosed bracket '${unclosed.char}' opened on line ${unclosed.line}.`,
        line: unclosed.line,
      };
    }

    return { valid: true, message: 'Code syntax looks valid.' };
  };

  const handleRun = async () => {
    mentorAbortRef.current?.abort();
    setIsMentorLoading(false);
    setMentorFeedback(null);
    setLastRunResult(null);

    // Save run code snapshot
    codingHistoryService.saveRunCode(userId, problem.id, language, code);

    const syntax = validateSyntax(code, language);
    setSyntaxStatus(syntax);

    setBottomTab('testresult');
    const inputToRun = useCustomInput
      ? customInput
      : problem.examples?.[selectedExampleCase]?.input || '';
    const res = await onRunCode(inputToRun);
    setLastRunResult(res);
  };

  const handleSubmit = async () => {
    mentorAbortRef.current?.abort();
    setIsMentorLoading(false);
    setMentorFeedback(null);

    // Save submitted code snapshot
    codingHistoryService.saveSubmittedCode(userId, problem.id, language, code);

    const syntax = validateSyntax(code, language);
    setSyntaxStatus(syntax);

    setBottomTab('evaluation');
    await onSubmitSolution();
  };

  const isCodeEmptyOrTemplate = (codeText: string, lang: string, prob: CodingProblem) => {
    if (!codeText || !codeText.trim()) return true;
    const trimmed = codeText.trim();
    if (trimmed.length < 6) return true;
    const starter = prob.starterCode?.[lang] || prob.starter_templates?.[lang] || '';
    if (starter && trimmed === starter.trim()) return true;

    const meaningfulLines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith('//') &&
          !l.startsWith('#') &&
          !l.startsWith('/*') &&
          !l.startsWith('*') &&
          !l.startsWith('--') &&
          !l.startsWith('import ') &&
          !l.startsWith('from ') &&
          !l.startsWith('package ')
      );
    return meaningfulLines.length === 0;
  };

  const getAIFeedbackButtonProps = (statusTextOrStatus: string | undefined, loading: boolean) => {
    if (loading) {
      return {
        label: 'AI Mentor is analyzing your code...',
        icon: Loader2,
        spin: true,
        className: 'bg-indigo-600/80 text-white cursor-not-allowed opacity-75',
      };
    }
    const st = (statusTextOrStatus || '').toLowerCase();
    if (st.includes('accepted') || st.includes('passed')) {
      return {
        label: '🤖 Review My Code',
        icon: Sparkles,
        spin: false,
        className: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      };
    }
    if (st.includes('compilation') || st.includes('compile error')) {
      return {
        label: '🤖 Explain Error',
        icon: Bot,
        spin: false,
        className: 'bg-amber-600 hover:bg-amber-500 text-white',
      };
    }
    if (st.includes('runtime')) {
      return {
        label: '🤖 Explain Error',
        icon: Bot,
        spin: false,
        className: 'bg-rose-600 hover:bg-rose-500 text-white',
      };
    }
    if (st.includes('time limit') || st.includes('tle')) {
      return {
        label: '⏱ Optimize My Approach',
        icon: Bot,
        spin: false,
        className: 'bg-amber-600 hover:bg-amber-500 text-white',
      };
    }
    return {
      label: '🤖 Get AI Feedback',
      icon: Bot,
      spin: false,
      className: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    };
  };

  const handleRequestMentorFeedback = async (
    requestedLevel = 1,
    isReview = false,
    switchTab = false
  ) => {
    if (isMentorLoading) return;

    if (isCodeEmptyOrTemplate(code, language, problem)) {
      setMentorFeedback({
        status: 'empty_code',
        statusText: 'Please write your solution first.',
        isEmptyCode: true,
        emptyCodeMessage: 'Please write your solution first.',
        whatWentWrong: 'Please write your solution first.',
        whyItHappened: 'The editor is empty or contains unmodified starter code.',
        currentHint: 'Break down the problem requirements and implement your logic in the editor before requesting AI mentor guidance.',
        whatToReconsider: 'Review the problem statement, input constraints, and expected output.',
        hintLevel: 1,
        maxHintLevel: 3,
        hasMoreHints: false,
        complexity: {
          isAppropriate: false,
          currentTime: '-',
          currentSpace: '-',
          expectedTime: problem.expectedComplexity?.time || 'O(N)',
          expectedSpace: problem.expectedComplexity?.space || 'O(1)',
          explanation: 'Write solution code to analyze time and space complexity.',
        },
        edgeCases: ['Empty inputs', 'Single element arrays', 'Large input boundary'],
        nextStep: 'Type your solution logic in the code editor, test it with Run Code, then click Get AI Feedback.',
      });
      if (switchTab) setBottomTab('mentor');
      return;
    }

    if (mentorAbortRef.current) {
      mentorAbortRef.current.abort();
    }
    const abortController = new AbortController();
    mentorAbortRef.current = abortController;

    setIsMentorLoading(true);
    if (switchTab) {
      setBottomTab('mentor');
    }

    const execContext =
      bottomTab === 'evaluation' || evaluationResult
        ? evaluationResult
        : lastRunResult;

    const targetExecutionId = execContext?.executionId || executionId || '';

    try {
      const fb = await codingService.getAIMentorFeedback(
        {
          problem,
          language,
          code,
          executionResult: execContext,
          executionId: targetExecutionId,
          hintLevel: requestedLevel,
          reviewMode: isReview || execContext?.status === 'accepted',
        },
        abortController.signal
      );
      if (!abortController.signal.aborted) {
        if (!targetExecutionId || !fb.executionId || fb.executionId === targetExecutionId) {
          setMentorFeedback(fb);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('[CodeEditorWorkspace] Mentor feedback error:', err);
    } finally {
      if (mentorAbortRef.current === abortController) {
        setIsMentorLoading(false);
        mentorAbortRef.current = null;
      }
    }
  };

  const currentExamples: CodingExample[] = problem.examples || [];
  const lines = useMemo(() => (code || '').split('\n'), [code]);
  const linesCount = Math.max(lines.length, 1);

  return (
    <div
      id="code-editor-workspace-container"
      className={`h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex-shrink-0 p-3 sm:px-4 sm:py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Language Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Language:</span>
          </div>

          <select
            id="editor-language-select"
            value={language}
            onChange={(e) => requestLanguageChange(e.target.value as CodingLanguage)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Controls (Font Size, Theme Toggle ☀ / ☾, Copy, Reset, Fullscreen) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Font Size Toggle */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-800/60 rounded-xl p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'sm'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Small Font"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'base'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Medium Font"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'lg'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Large Font"
            >
              A+
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            id="editor-theme-toggle-btn"
            onClick={toggleEditorTheme}
            className="p-1.5 sm:px-2 sm:py-1 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title={editorTheme === 'dark' ? 'Switch to light editor' : 'Switch to dark editor'}
            aria-label={editorTheme === 'dark' ? 'Switch to light editor' : 'Switch to dark editor'}
          >
            {editorTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Restore Previous Code Button */}
          <button
            type="button"
            id="restore-previous-code-btn"
            onClick={handleRestorePreviousCode}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Restore Previous Code"
            aria-label="Restore Previous Code"
          >
            <History className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">Restore</span>
          </button>

          {/* Reset Starter Code */}
          <button
            type="button"
            id="reset-code-btn"
            onClick={handleResetClick}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Reset to Starter Code"
            aria-label="Reset to Starter Code"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-xs cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Reset Code Confirmation Modal */}
      {showResetModal && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Reset Code to Starter?
              </h4>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Reset code to the original starter code?
                <br />
                Your current code will be replaced.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {problem.title}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                  {language}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                id="cancel-reset-code-btn"
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reset-code-btn"
                onClick={() => applyResetCode()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Previous Code Confirmation Modal */}
      {showRestoreModal && pendingRestoreCode && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Restore Previous Code?
              </h4>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Restore your previous code?
                <br />
                Your current editor content will be replaced.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Source: {pendingRestoreCode.label}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                  {language}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingRestoreCode(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-restore-code-btn"
                onClick={() => applyRestoredCode(pendingRestoreCode)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Change Warning Modal */}
      {showLangModal && pendingLanguage && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Change Coding Language?
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Changing language will replace the current code with the starter template for{' '}
              <strong>{pendingLanguage}</strong>. Continue?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLangModal(false);
                  setPendingLanguage(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyLanguageChange(pendingLanguage)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer shadow-xs"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESILIENT CODE EDITOR CONTAINER */}
      <div
        id="code-editor-area"
        className={`flex-1 min-h-[220px] relative overflow-hidden ${
          editorTheme === 'dark' ? 'bg-[#0B0F19]' : 'bg-white'
        }`}
      >
        {/* Monaco Editor Mount Wrapper */}
        {!monacoFailed ? (
          <div className="absolute inset-0 w-full h-full min-h-0">
            <Editor
              height="100%"
              width="100%"
              language={getMonacoLanguage(language)}
              theme={editorTheme === 'dark' ? 'careerpilot-dark' : 'careerpilot-light'}
              value={code}
              onChange={(val) => onCodeChange(val || '')}
              onMount={handleEditorDidMount}
              loading={
                <div className="w-full h-full flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Loading Code Editor...</span>
                </div>
              }
              options={monacoOptions}
            />
          </div>
        ) : (
          /* Fallback Line-Numbered Code Editor if Monaco CDN fails */
          <div className="absolute inset-0 w-full h-full flex flex-row overflow-hidden font-mono select-text">
            {/* Line Number Gutter */}
            <div
              ref={lineNumbersRef}
              className={`flex-shrink-0 w-12 py-3 pr-2 text-right select-none overflow-hidden border-r ${
                editorTheme === 'dark'
                  ? 'bg-[#070A11] border-slate-800 text-slate-600'
                  : 'bg-[#F8FAFC] border-slate-200 text-slate-400'
              }`}
              style={{
                fontSize: `${fontSizeNumber}px`,
                lineHeight: '1.6',
              }}
            >
              {lines.map((_, i) => (
                <div key={i} className="leading-[1.6]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea Area */}
            <textarea
              ref={textareaRef}
              id="coding-arena-code-input"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={handleNativeKeyDown}
              onScroll={handleNativeScroll}
              onPaste={(e) => {
                e.preventDefault();
                notifyBlockedPaste();
              }}
              onDrop={(e) => {
                e.preventDefault();
                notifyBlockedPaste();
              }}
              spellCheck={false}
              wrap="off"
              className={`flex-1 h-full p-3 pl-3 resize-none outline-none overflow-auto font-mono ${
                editorTheme === 'dark'
                  ? 'bg-[#0B0F19] text-slate-100 placeholder-slate-600 caret-indigo-400'
                  : 'bg-white text-slate-900 placeholder-slate-400 caret-indigo-600'
              }`}
              style={{
                fontSize: `${fontSizeNumber}px`,
                lineHeight: '1.6',
                tabSize: 4,
              }}
              placeholder={`// Write your ${language} solution here...`}
            />
          </div>
        )}
      </div>

      {/* Syntax Notice Banner (if validated) */}
      {syntaxStatus && (
        <div
          className={`flex-shrink-0 px-4 py-1.5 border-t text-[11px] font-mono flex items-center justify-between ${
            syntaxStatus.valid
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {syntaxStatus.valid ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>{syntaxStatus.message}</span>
          </div>
          <span className="text-[10px] opacity-75 font-sans">Syntax Check</span>
        </div>
      )}

      {/* Bottom Console / Testcase / Evaluation Pane */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col">
        {/* Console Tab Headers */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setBottomTab('testcase')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                bottomTab === 'testcase'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Testcase</span>
            </button>

            <button
              type="button"
              onClick={() => setBottomTab('testresult')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                bottomTab === 'testresult'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Test Result</span>
            </button>

            <button
              type="button"
              onClick={() => setBottomTab('evaluation')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                bottomTab === 'evaluation'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Evaluation</span>
              {evaluationResult && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    evaluationResult.status === 'accepted' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              )}
            </button>

            <button
              type="button"
              id="mentor-tab-btn"
              onClick={() => {
                setBottomTab('mentor');
                if (!mentorFeedback && !isMentorLoading) {
                  handleRequestMentorFeedback(1);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                bottomTab === 'mentor'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Mentor</span>
              {mentorFeedback && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {linesCount} {linesCount === 1 ? 'line' : 'lines'}
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-3 max-h-48 sm:max-h-56 overflow-y-auto space-y-3">
          {/* TAB 1: TESTCASE SELECTION */}
          {bottomTab === 'testcase' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {currentExamples.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedExampleCase(i);
                      setUseCustomInput(false);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !useCustomInput && selectedExampleCase === i
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Case {i + 1}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setUseCustomInput(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    useCustomInput
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Custom Input
                </button>
              </div>

              {useCustomInput ? (
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input parameters..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              ) : currentExamples[selectedExampleCase] ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">
                      Input:
                    </span>
                    <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {currentExamples[selectedExampleCase].input}
                    </pre>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">
                      Expected Output:
                    </span>
                    <pre className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-pre-wrap">
                      {currentExamples[selectedExampleCase].output}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-xs text-slate-400">No test cases configured.</div>
              )}
            </div>
          )}

          {/* TAB 2: TEST RESULT */}
          {bottomTab === 'testresult' && (
            <div className="space-y-3 font-mono text-xs">
              {isRunning ? (
                <div className="p-6 text-center space-y-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs font-sans">Running code against test cases...</p>
                </div>
              ) : lastRunResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {lastRunResult.status === 'accepted' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{lastRunResult.statusText || 'Wrong Answer'}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Runtime: {lastRunResult.runtimeMs || 24} ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 whitespace-pre-wrap">
                    <span className="text-[10px] text-slate-400 font-sans block mb-1">Standard Output:</span>
                    {lastRunResult.stdout || 'Program executed successfully.'}
                  </div>

                  {/* AI Feedback Button for Test Run */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-sans">
                    {(() => {
                      const btnProps = getAIFeedbackButtonProps(
                        lastRunResult.statusText || lastRunResult.status,
                        isMentorLoading
                      );
                      const IconComponent = btnProps.icon;
                      return (
                        <button
                          type="button"
                          id="get-ai-feedback-run-btn"
                          onClick={() =>
                            handleRequestMentorFeedback(1, lastRunResult.status === 'accepted')
                          }
                          disabled={isMentorLoading}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75 ${btnProps.className}`}
                        >
                          <IconComponent className={`w-4 h-4 ${btnProps.spin ? 'animate-spin' : ''}`} />
                          <span>{btnProps.label}</span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Inline Mentor Feedback if triggered */}
                  {(mentorFeedback || isMentorLoading) && (
                    <div className="pt-2">
                      <AIMentorFeedbackPanel
                        feedback={mentorFeedback}
                        isLoading={isMentorLoading}
                        onRequestNextHint={(lvl) => handleRequestMentorFeedback(lvl)}
                        onRefreshFeedback={() => handleRequestMentorFeedback(1)}
                        onClose={() => setMentorFeedback(null)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Click <strong>Run Code</strong> to validate your solution against sample testcases.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI EVALUATION */}
          {bottomTab === 'evaluation' && (
            <div className="space-y-3 text-xs">
              {isSubmitting ? (
                <div className="p-6 text-center space-y-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Evaluating against hidden test suite & AI analysis...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Checking time complexity, space complexity, and edge cases.
                  </p>
                </div>
              ) : evaluationResult ? (
                <div className="space-y-3">
                  {/* Verdict Banner */}
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      evaluationResult.status === 'accepted'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {evaluationResult.status === 'accepted' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold font-mono">
                          {evaluationResult.statusText}
                        </h4>
                        <p className="text-[11px] opacity-90 font-sans">
                          {evaluationResult.passedTestCases} / {evaluationResult.totalTestCases} Test Cases Passed
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <div>{evaluationResult.runtimeMs} ms</div>
                      <div>{(evaluationResult.memoryKb / 1024).toFixed(1)} MB</div>
                    </div>
                  </div>

                  {/* AI Mentor Action Button */}
                  <div className="flex flex-wrap items-center gap-2 font-sans">
                    {(() => {
                      const btnProps = getAIFeedbackButtonProps(
                        evaluationResult.statusText || evaluationResult.status,
                        isMentorLoading
                      );
                      const IconComponent = btnProps.icon;
                      return (
                        <button
                          type="button"
                          id="get-ai-feedback-eval-btn"
                          onClick={() =>
                            handleRequestMentorFeedback(1, evaluationResult.status === 'accepted')
                          }
                          disabled={isMentorLoading}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75 ${btnProps.className}`}
                        >
                          <IconComponent className={`w-4 h-4 ${btnProps.spin ? 'animate-spin' : ''}`} />
                          <span>{btnProps.label}</span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Dedicated AI Mentor Panel */}
                  {(mentorFeedback || isMentorLoading) && (
                    <div className="pt-1">
                      <AIMentorFeedbackPanel
                        feedback={mentorFeedback}
                        isLoading={isMentorLoading}
                        onRequestNextHint={(lvl) => handleRequestMentorFeedback(lvl)}
                        onRefreshFeedback={() => handleRequestMentorFeedback(1)}
                        onClose={() => setMentorFeedback(null)}
                      />
                    </div>
                  )}

                  {/* AI Evaluation Overview Cards */}
                  {evaluationResult.aiFeedback && !mentorFeedback && (
                    <div className="space-y-2 font-sans">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Correctness Analysis
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                          {evaluationResult.aiFeedback.correctness}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 font-sans block">
                            Your Time Complexity:
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {evaluationResult.aiFeedback.timeComplexity}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 font-sans block">
                            Your Space Complexity:
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {evaluationResult.aiFeedback.spaceComplexity}
                          </span>
                        </div>
                      </div>

                      {evaluationResult.aiFeedback.optimalApproach && (
                        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                            Optimal Approach
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                            {evaluationResult.aiFeedback.optimalApproach}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Submit your solution to execute against hidden test cases and receive in-depth AI feedback.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DEDICATED AI MENTOR TAB */}
          {bottomTab === 'mentor' && (
            <div className="space-y-3 font-sans text-xs">
              {mentorFeedback || isMentorLoading ? (
                <AIMentorFeedbackPanel
                  feedback={mentorFeedback}
                  isLoading={isMentorLoading}
                  onRequestNextHint={(lvl) => handleRequestMentorFeedback(lvl)}
                  onRefreshFeedback={() => handleRequestMentorFeedback(1)}
                  onClose={() => setMentorFeedback(null)}
                />
              ) : (
                <div className="p-6 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      AI Coding Mentor Ready
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Get pedagogical hints, concept breakdowns, complexity analysis, and edge case checklists tailored to your implementation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRequestMentorFeedback(1)}
                    disabled={isMentorLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Analyze My Code</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Execution Actions Toolbar */}
        <div className="flex-shrink-0 p-3 sm:px-4 sm:py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              {monacoLoaded ? 'Monaco Editor' : 'Code Editor Active'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="run-code-btn"
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-current" />
                  <span>Run Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="submit-code-btn"
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Solution</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
