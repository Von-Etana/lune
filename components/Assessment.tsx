
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, AlertTriangle, Loader, Code, ShieldAlert, ShieldCheck, Eye, Command, Check, Send } from 'lucide-react';
import { evaluateCodeSubmission, generateCheatingAnalysis, generateAssessment } from '../services/geminiService';
import { mintCertificate } from '../services/pwrService';
import { EvaluationResult, AssessmentContent, DifficultyLevel } from '../types';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';

interface AssessmentProps {
  skill: string;
  difficulty: DifficultyLevel;
  onComplete: (result: EvaluationResult) => void;
}

const COMPLETION_KEYWORDS = [
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
  'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
  'async', 'await', 'class', 'extends', 'constructor', 'this', 'super',
  'import', 'export', 'from', 'default', 'console', 'log', 'null', 'undefined',
  'true', 'false', 'Promise', 'JSON', 'map', 'filter', 'reduce', 'forEach',
  'length', 'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'Object',
  'Array', 'String', 'Number', 'Boolean', 'Date', 'Math', 'window', 'document'
];

export const Assessment: React.FC<AssessmentProps> = ({ skill, difficulty, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [assessmentContent, setAssessmentContent] = useState<AssessmentContent | null>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [cheatingEvents, setCheatingEvents] = useState<string[]>([]);
  const [webcamActive, setWebcamActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenge' | 'theory'>('challenge');
  const [theoryAnswers, setTheoryAnswers] = useState<Record<number, number>>({});
  const [statusMessage, setStatusMessage] = useState("");
  
  // Editor State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [showGazeOverlay, setShowGazeOverlay] = useState(false);
  const [gazePosition, setGazePosition] = useState({ x: 50, y: 50 });

  // Proctoring Metrics
  const [pasteCount, setPasteCount] = useState(0);
  const [suspiciousGazeCount, setSuspiciousGazeCount] = useState(0);
  const [pasteContentWarnings, setPasteContentWarnings] = useState(0);
  const [typingBursts, setTypingBursts] = useState(0);
  
  const isPasting = useRef(false);
  const leaveTime = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Load Assessment Content
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const content = await generateAssessment(skill, difficulty);
      setAssessmentContent(content);
      setCode(content.starterCode || '// Start coding here...');
      setLoading(false);
    };
    loadContent();
  }, [skill, difficulty]);

  // Anti-Cheating: Visibility & Context Menu & DevTools
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveTime.current = Date.now();
      } else {
        const duration = Date.now() - leaveTime.current;
        // Granular Check: Only flag if gone for meaningful time (>2s)
        if (duration > 2000) {
           const msg = `Tab switch detected (${(duration/1000).toFixed(1)}s)`;
           setWarnings(prev => [...prev, "Warning: Assessment focus lost."]);
           setCheatingEvents(prev => [...prev, msg]);
           setActiveAlert("Focus Lost: Please stay on this tab.");
           setTimeout(() => setActiveAlert(null), 3000);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setActiveAlert("Security Warning: Right-click menu disabled.");
      setTimeout(() => setActiveAlert(null), 2000);
    };

    const handleKeyDownGlobal = (e: KeyboardEvent) => {
       if (
         e.key === 'F12' || 
         (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
       ) {
          e.preventDefault();
          setCheatingEvents(prev => [...prev, "Attempted DevTools Access"]);
          setActiveAlert("Security Violation: DevTools disabled.");
          setTimeout(() => setActiveAlert(null), 3000);
       }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDownGlobal);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, []);

  // Anti-Cheating: Granular Paste Detection
  const handlePaste = (e: React.ClipboardEvent) => {
    isPasting.current = true;
    const text = e.clipboardData.getData('text');
    
    // AI Markers Check
    const llmIndicators = ["here is the code", "sure,", "generated by", "openai", "gpt", "claude", "solution:"];
    const hasLLMMarkers = llmIndicators.some(marker => text.toLowerCase().includes(marker));

    if (hasLLMMarkers) {
       setPasteContentWarnings(prev => prev + 1);
       setWarnings(prev => [...prev, "Critical: AI-generated content detected."]);
       setCheatingEvents(prev => [...prev, "Critical: LLM Markers in Paste"]);
       setActiveAlert("Proctor Alert: AI content signature detected.");
       setTimeout(() => setActiveAlert(null), 5000);
    } else if (text.length > 150) {
      setPasteCount(prev => prev + 1);
      setCheatingEvents(prev => [...prev, `Large paste: ${text.length} chars`]);
      setActiveAlert("Proctor Alert: Large code block paste detected.");
      setTimeout(() => setActiveAlert(null), 3000);
    }
    
    setTimeout(() => { isPasting.current = false; }, 100);
  };

  // Webcam Setup
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setWebcamActive(true);
        }
      } catch (err) {
        console.error("Webcam access denied", err);
        setWarnings(prev => [...prev, "Camera required for verification."]);
      }
    };
    startWebcam();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Editor Logic: Scroll Sync & Autocomplete
  const handleScroll = () => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateCursorAndSuggestions = (e: React.ChangeEvent<HTMLTextAreaElement> | React.KeyboardEvent | React.MouseEvent) => {
    if (!textareaRef.current) return;
    
    const { selectionStart, value } = textareaRef.current;
    const textBeforeCaret = value.substring(0, selectionStart);
    const lines = textBeforeCaret.split('\n');
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/[\s(){}[\];,]/);
    const currentWord = words[words.length - 1];

    // Calculate cursor position for popup
    const lineHeight = 24; 
    const charWidth = 9.6; // Approximate for Fira Code 16px
    const top = (lines.length) * lineHeight - textareaRef.current.scrollTop;
    const left = (currentLine.length * charWidth) - textareaRef.current.scrollLeft + 40; // +Padding

    setCursorPosition({ top, left });

    if (currentWord.length > 1) {
      const matches = COMPLETION_KEYWORDS.filter(k => k.startsWith(currentWord) && k !== currentWord);
      if (matches.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSuggestionIndex(0);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateCursorAndSuggestions(e);

    // Burst typing check
    if (!isPasting.current && Math.abs(newCode.length - code.length) > 10) {
       setTypingBursts(prev => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(i => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const textBeforeCaret = value.substring(0, selectionStart);
    const words = textBeforeCaret.split(/[\s(){}[\];,]/);
    const currentWord = words[words.length - 1];
    
    const before = value.substring(0, selectionStart - currentWord.length);
    const after = value.substring(selectionStart);
    const newCode = before + suggestion + after;
    
    setCode(newCode);
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = (before + suggestion).length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSubmit = useCallback(async () => {
    if (!assessmentContent) return;

    setIsSubmitting(true);
    setStatusMessage("Analyzing session integrity...");

    const metrics = {
      tabSwitches: cheatingEvents.filter(e => e.includes('Tab')).length,
      pasteEvents: pasteCount,
      suspiciousEyemovements: suspiciousGazeCount,
      typingBursts: typingBursts,
      pasteContentWarnings: pasteContentWarnings
    };

    const cheatAnalysis = await generateCheatingAnalysis(cheatingEvents, metrics, code);

    setStatusMessage("Evaluating code performance...");
    const evaluation = await evaluateCodeSubmission(
      code, 
      skill, 
      assessmentContent.description,
      theoryAnswers
    );

    let txHash = undefined;
    const passed = evaluation.score >= 70;
    
    if (passed && !cheatAnalysis.isCheating) {
      setStatusMessage("Minting Certificate on PWR Chain...");
      try {
         txHash = await mintCertificate("Candidate", skill, evaluation.score);
      } catch (e) {
         console.error("Mint failed", e);
      }
    }

    setIsSubmitting(false);
    onComplete({
      score: evaluation.score,
      feedback: evaluation.feedback,
      passed,
      cheatingDetected: cheatAnalysis.isCheating,
      cheatingReason: cheatAnalysis.reason,
      certificationHash: txHash
    });
  }, [code, skill, cheatingEvents, pasteCount, suspiciousGazeCount, typingBursts, pasteContentWarnings, onComplete, assessmentContent, theoryAnswers]);

  if (loading) {
    return (
       <div className="h-screen w-full bg-editor flex flex-col items-center justify-center text-white space-y-4">
          <Loader className="animate-spin w-10 h-10 text-teal-500" />
          <h2 className="text-xl font-mono">Initializing Environment...</h2>
          <p className="text-gray-500 text-sm">Configuring {difficulty} Assessment</p>
       </div>
    );
  }

  return (
    <div className="h-screen w-full bg-editor text-gray-300 flex flex-col font-mono overflow-hidden select-none">
      
      {/* Alert Toast */}
      {activeAlert && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-red-400 font-bold">
            <AlertTriangle className="animate-bounce" size={20} />
            {activeAlert}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="h-12 bg-editorSide border-b border-black flex items-center justify-between px-4 select-none z-20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-sans text-gray-400 font-bold tracking-wide">LUNE <span className="text-teal-500">IDE</span></span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">{difficulty} Mode</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-teal-400 bg-teal-900/30 px-3 py-1 rounded-full border border-teal-500/20">
             <ShieldCheck size={14} />
             <span className="text-xs font-bold">Secured by PWR Chain</span>
          </div>
          <div className="font-mono font-bold text-white bg-gray-700 px-3 py-1 rounded">
             {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div className="w-1/3 bg-editorSide border-r border-black flex flex-col z-10">
           {/* Webcam Feed */}
          <div className="h-48 bg-black relative border-b border-gray-700 group overflow-hidden">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover opacity-80" />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded text-xs text-green-400 backdrop-blur-md">
               <Eye size={12} />
               <span>Proctor Active</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-editorSide border-b border-black">
             <button onClick={() => setActiveTab('challenge')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'challenge' ? 'bg-editor text-white border-t-2 border-teal-500' : 'text-gray-500 hover:bg-gray-800'}`}>Challenge</button>
             <button onClick={() => setActiveTab('theory')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'theory' ? 'bg-editor text-white border-t-2 border-teal-500' : 'text-gray-500 hover:bg-gray-800'}`}>Theory</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
             {activeTab === 'challenge' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                   <h3 className="text-white font-bold text-xl mb-2">{assessmentContent?.title}</h3>
                   <p className="text-gray-400 leading-relaxed">{assessmentContent?.description}</p>
                   <div className="mt-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded text-blue-200 text-xs">
                      <strong>Instructions:</strong> Complete the function in the editor. You can use standard libraries. Use Ctrl+Space for autocomplete.
                   </div>
                </div>
             ) : (
                <div className="space-y-8">
                   {assessmentContent?.theoryQuestions?.map((q, idx) => (
                      <div key={q.id} className="text-sm">
                         <p className="text-white font-bold mb-3">{idx + 1}. {q.question}</p>
                         <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                               <label key={optIdx} className={`flex items-center gap-3 p-3 rounded border transition cursor-pointer ${theoryAnswers[q.id] === optIdx ? 'bg-teal-900/30 border-teal-500/50 text-white' : 'border-gray-700 hover:bg-gray-800 text-gray-400'}`}>
                                  <input 
                                    type="radio" 
                                    name={`q-${q.id}`}
                                    checked={theoryAnswers[q.id] === optIdx}
                                    onChange={() => setTheoryAnswers(prev => ({...prev, [q.id]: optIdx}))}
                                    className="accent-teal-500"
                                  />
                                  <span>{opt}</span>
                               </label>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             )}

             {/* Live Warning Feed */}
             {warnings.length > 0 && (
              <div className="mt-6 space-y-2">
                  {warnings.slice(-3).map((w, i) => (
                      <div key={i} className="bg-red-900/20 border border-red-500/30 p-2 rounded text-red-200 text-xs flex items-center gap-2 animate-pulse">
                          <AlertTriangle size={12} /> {w}
                      </div>
                  ))}
              </div>
             )}
          </div>

          {/* Submit Area */}
          <div className="p-4 border-t border-black bg-editorSide">
              {isSubmitting ? (
                  <div className="text-xs text-teal-400 flex items-center justify-center gap-2 py-3">
                      <Loader className="animate-spin" size={14} /> {statusMessage}
                  </div>
              ) : (
                  <button 
                    onClick={handleSubmit}
                    className="w-full bg-teal-600 text-white py-3 rounded font-bold hover:bg-teal-500 transition flex items-center justify-center gap-2"
                  >
                      Submit Assessment <Send size={16} />
                  </button>
              )}
          </div>
        </div>

        {/* Right Panel: Enhanced Code Editor */}
        <div className="flex-1 relative bg-editor" ref={editorContainerRef}>
            {/* Layer 1: Syntax Highlighting (Bottom) */}
             <pre 
                ref={preRef}
                className="absolute inset-0 w-full h-full p-8 m-0 overflow-hidden font-mono text-base leading-relaxed pointer-events-none z-0" 
                aria-hidden="true"
                style={{ tabSize: 2 }}
             >
                <code className="language-javascript" dangerouslySetInnerHTML={{ __html: Prism.highlight(code, Prism.languages.javascript, 'javascript') }} />
             </pre>

            {/* Layer 2: Input (Top) */}
             <textarea 
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onClick={updateCursorAndSuggestions}
                onScroll={handleScroll}
                onPaste={handlePaste}
                className="absolute inset-0 w-full h-full p-8 m-0 bg-transparent text-transparent caret-white font-mono text-base leading-relaxed resize-none outline-none z-10 selection:bg-teal-500/30" 
                spellCheck="false"
                autoCapitalize="off"
                autoCorrect="off"
                style={{ tabSize: 2 }}
             />

             {/* Layer 3: Autocomplete Dropdown */}
             {showSuggestions && (
                <div 
                    style={{ top: cursorPosition.top + 20, left: cursorPosition.left }} 
                    className="absolute z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-48 overflow-hidden"
                >
                   <div className="bg-gray-900 px-2 py-1 text-[10px] text-gray-500 uppercase font-bold border-b border-gray-700">Suggestions</div>
                   <ul className="max-h-40 overflow-y-auto">
                       {suggestions.map((s, i) => (
                           <li 
                             key={s} 
                             className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${i === suggestionIndex ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                             onClick={() => insertSuggestion(s)}
                           >
                               <Code size={12} className="opacity-50" /> {s}
                           </li>
                       ))}
                   </ul>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};
