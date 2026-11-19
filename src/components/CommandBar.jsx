import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Sparkles, 
  Send, 
  Upload, 
  FileText,
  Loader2
} from 'lucide-react';

export default function CommandBar({ 
  onCommandSubmit, 
  onTriggerReceiptScan,
  onUploadReceiptImage,
  isProcessing
}) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechLang, setSpeechLang] = useState('bn-BD'); // 'bn-BD' or 'en-US'
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const isListeningRef = useRef(false);
  const inputRef = useRef('');
  const interimRef = useRef('');

  // Keep ref values in sync for closures and seamless restart
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    interimRef.current = interimTranscript;
  }, [interimTranscript]);

  // Initialize SpeechRecognition with continuous listening
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let newFinal = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            newFinal += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (newFinal) {
          setInput(prev => (prev ? `${prev.trim()} ${newFinal.trim()}` : newFinal.trim()));
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          setSpeechError('Microphone permission denied.');
        } else if (event.error === 'no-speech') {
          // Normal pause in speech: do not cancel continuous recording
        } else if (event.error !== 'aborted') {
          setSpeechError(`Voice error (${event.error})`);
        }
      };

      recognition.onend = () => {
        // If user has not clicked stop, seamlessly restart recognition across pauses
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // In case it's already active or starting
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [speechLang]);

  // Manual Start / Stop Continuous Voice Recording
  const handleToggleVoice = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please use Chrome/Edge or click a sample preset chip below.");
      return;
    }

    if (isListeningRef.current) {
      // User clicked STOP & SEND
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}

      // Combine accumulated text and send immediately
      const fullText = (inputRef.current + (interimRef.current ? ' ' + interimRef.current : '')).trim();
      if (fullText && !isProcessing) {
        onCommandSubmit(fullText);
        setInput('');
        setInterimTranscript('');
      }
    } else {
      // User clicked START
      setSpeechError('');
      setInterimTranscript('');
      isListeningRef.current = true;
      setIsListening(true);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = speechLang;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn("Failed to start voice recognition:", err);
      }
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const finalQuery = (input || interimTranscript).trim();
    if (!finalQuery || isProcessing) return;

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
    }

    onCommandSubmit(finalQuery);
    setInput('');
    setInterimTranscript('');
  };

  const handlePresetClick = (presetText) => {
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
    }
    setInput(presetText);
    onCommandSubmit(presetText);
  };

  // Real Image Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      if (onUploadReceiptImage) {
        onUploadReceiptImage(base64Data, file.type);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const samplePresets = [
    { label: "5 kg chal bikri 400 taka", tag: "Sale" },
    { label: "Rahim 500 taka baki shodh dilo", tag: "Baki Paid" },
    { label: "Sumon bhai 300 taka baki nilo", tag: "Add Baki" },
    { label: "Electric bill 1200 taka khoroch", tag: "Expense" },
    { label: "20 L tel kinlam 3500 taka restock", tag: "Restock" },
  ];

  // Display value combines final captured input and live interim speech
  const displayInputValue = input
    ? (interimTranscript ? `${input} ${interimTranscript}` : input)
    : interimTranscript;

  return (
    <div className="w-full">
      {/* Hidden File Input for Real Receipt Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Main Glass Command Container */}
      <div className={`
        relative rounded-3xl p-4 sm:p-5 transition-all duration-300
        bg-white/80 backdrop-blur-2xl border border-slate-200/90 shadow-glass
        ${isListening ? 'ring-4 ring-rose-400/25 border-rose-400' : 'hover:border-slate-300'}
      `}>
        {/* Top Minimal Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              Smart Command Bar
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Bangla • Banglish • English
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle for Voice */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setSpeechLang('bn-BD')}
                className={`px-2.5 py-0.5 rounded-lg transition ${speechLang === 'bn-BD' ? 'bg-white text-brand-700 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang('en-US')}
                className={`px-2.5 py-0.5 rounded-lg transition ${speechLang === 'en-US' ? 'bg-white text-brand-700 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={displayInputValue}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening 
                ? (speechLang === 'bn-BD' ? "শুনছি... কথা বলা শেষ হলে লাল বোতাম চাপুন..." : "Listening... click the red stop button when done...") 
                : "Type or speak: '5 kg chal bikri 400 taka' or 'Rahim 500 taka baki shodh dilo'..."}
              className={`
                w-full pl-4 pr-12 py-3 rounded-2xl text-sm font-medium transition-all
                border placeholder:text-slate-400 focus:outline-none
                ${isListening 
                  ? 'border-rose-400 bg-rose-50/20 text-slate-900 ring-2 ring-rose-400/20' 
                  : 'border-slate-200/90 bg-white/90 focus:border-brand-500 focus:ring-2 focus:ring-brand-400/15 text-slate-800'
                }
              `}
            />

            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setInterimTranscript('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-md"
              >
                ✕
              </button>
            )}
          </div>

          {/* Voice Mic -> Square Stop Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? "Stop & Send" : "Click to speak"}
            aria-label={isListening ? "Stop & Send" : "Click to speak"}
            className={`
              p-3 rounded-2xl flex items-center justify-center transition-all duration-200
              ${isListening 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/25 animate-pulse' 
                : 'bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200'
              }
            `}
          >
            {isListening ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Upload Real Receipt Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload real receipt image (JPG/PNG)"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 transition flex items-center justify-center"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={(!input && !interimTranscript) || isProcessing}
            className={`
              px-5 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all
              ${(!input && !interimTranscript) || isProcessing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/25 active:scale-95'
              }
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </form>

        {/* Listening Recording Feedback */}
        {isListening && (
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-rose-700 bg-rose-50/80 border border-rose-200/80 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Listening ({speechLang === 'bn-BD' ? 'Bangla' : 'English'})... Click the Stop button when finished</span>
            </div>
            <span className="text-[11px] font-bold text-rose-600">Recording</span>
          </div>
        )}

        {speechError && (
          <div className="mt-2 text-xs text-coral-600 bg-coral-50 border border-coral-200 px-3 py-1.5 rounded-xl">
            {speechError}
          </div>
        )}

        {/* Minimal Presets Strip */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>

          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset.label)}
              className="group flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-200 text-slate-600 hover:text-brand-800 px-2.5 py-1 rounded-xl transition shadow-2xs active:scale-95"
            >
              <span className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                preset.tag === 'Sale' ? 'bg-brand-100 text-brand-700' :
                preset.tag === 'Expense' ? 'bg-coral-100 text-coral-700' :
                preset.tag === 'Baki Paid' ? 'bg-emerald-100 text-emerald-700' :
                preset.tag === 'Restock' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {preset.tag}
              </span>
              <span>"{preset.label}"</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => onTriggerReceiptScan('wholesale_memo')}
            className="flex items-center gap-1 text-xs font-medium bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl transition active:scale-95"
          >
            <FileText className="w-3 h-3" />
            <span>Sample Memo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
