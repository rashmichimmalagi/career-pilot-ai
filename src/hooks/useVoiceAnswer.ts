import { useState, useEffect, useRef, useCallback } from 'react';

// Declare types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

interface UseVoiceAnswerOptions {
  language?: string;
  initialTranscript?: string;
  onTranscriptChange?: (text: string) => void;
}

export function useVoiceAnswer(options: UseVoiceAnswerOptions = {}) {
  const { language = 'en-US', initialTranscript = '', onTranscriptChange } = options;

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [interimText, setInterimText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to record');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>(transcript);
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  // Keep transcriptRef and onTranscriptChangeRef in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        'Speech-to-text is not supported in this browser. Please use Chrome, Edge, or Safari, or switch to Type Answer.'
      );
    } else {
      setIsSupported(true);
    }
  }, []);

  // Initialize SpeechRecognition instance
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening... Speak your answer clearly');
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalChunk = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            finalChunk += text + ' ';
          } else {
            currentInterim += text;
          }
        }

        if (finalChunk) {
          const currentPrev = transcriptRef.current;
          const separator = currentPrev && !currentPrev.endsWith(' ') ? ' ' : '';
          const updated = currentPrev + separator + finalChunk.trim();
          transcriptRef.current = updated;
          setTranscript(updated);
          setHasRecorded(true);

          if (onTranscriptChangeRef.current) {
            onTranscriptChangeRef.current(updated);
          }
        }

        setInterimText(currentInterim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('[useVoiceAnswer] Speech recognition event error:', event.error);
        
        if (event.error === 'no-speech') {
          // Benign timeout while user pauses to think; don't break recording
          setStatusMessage('Listening... (speak when ready)');
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone permission required. Please allow microphone access in your browser.');
          setStatusMessage('Microphone permission denied');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('Microphone not detected. Please verify your audio input device.');
          setStatusMessage('Microphone unavailable');
        } else if (event.error === 'network') {
          setErrorMessage('Speech recognition network error. Check your connection or type your answer.');
          setStatusMessage('Network error');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }

        shouldListenRef.current = false;
        setIsListening(false);
      };

      recognition.onend = () => {
        // If user didn't explicitly stop and continuous listening is intended, restart
        if (shouldListenRef.current) {
          try {
            recognition.start();
            return;
          } catch (_) {}
        }

        setIsListening(false);
        setInterimText('');
        if (transcriptRef.current.trim()) {
          setStatusMessage('Transcript ready for review');
          setHasRecorded(true);
        } else {
          setStatusMessage('Recording paused');
        }
      };

      return recognition;
    } catch (err: any) {
      console.error('[useVoiceAnswer] Failed to create SpeechRecognition:', err);
      setErrorMessage('Failed to initialize speech recognition engine.');
      return null;
    }
  }, [language]);

  const startListening = useCallback(async () => {
    setErrorMessage(null);

    // Explicitly prompt for mic permission via getUserMedia first if available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setStatusMessage('Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the probe tracks immediately
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.warn('[useVoiceAnswer] getUserMedia permission error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Microphone permission required. Please enable microphone permissions in your browser bar.');
          setStatusMessage('Permission required');
          return;
        }
      }
    }

    // Stop existing if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }

    const rec = initRecognition();
    if (!rec) {
      setErrorMessage('Speech Recognition is unavailable in this environment.');
      return;
    }

    recognitionRef.current = rec;
    shouldListenRef.current = true;

    try {
      rec.start();
      setStatusMessage('Listening... Speak your answer clearly');
    } catch (err: any) {
      console.warn('[useVoiceAnswer] start error:', err);
      if (err.name === 'InvalidStateError') {
        // Already started
        setIsListening(true);
      } else {
        setErrorMessage('Could not start speech recognition. Please check your microphone.');
        shouldListenRef.current = false;
      }
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    setInterimText('');
    setStatusMessage('Transcript ready for review');
  }, []);

  const resetTranscript = useCallback(() => {
    stopListening();
    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');
    setHasRecorded(false);
    setStatusMessage('Ready to record');
    setErrorMessage(null);
    if (onTranscriptChangeRef.current) {
      onTranscriptChangeRef.current('');
    }
  }, [stopListening]);

  const updateTranscript = useCallback((newText: string) => {
    transcriptRef.current = newText;
    setTranscript(newText);
    if (newText.trim()) {
      setHasRecorded(true);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimText,
    statusMessage,
    errorMessage,
    hasRecorded,
    startListening,
    stopListening,
    resetTranscript,
    updateTranscript,
  };
}
