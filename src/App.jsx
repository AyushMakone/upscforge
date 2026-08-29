import React, { useState, useEffect } from 'react';
import { 
  BookOpen, BrainCircuit, UploadCloud, Play, 
  CheckCircle2, XCircle, ChevronRight, BarChart3, 
  RefreshCcw, AlertTriangle, FileText, Target, Clock,
  Printer, Search, Settings2, LayoutDashboard, Sparkles, History, CheckSquare, Award
} from 'lucide-react';

const INITIAL_SUBJECTS = [
  { id: 'ancient', name: 'Ancient History', lecs: 10, completedLecs: 0, mcqs: 500, solvedMcqs: 300 },
  { id: 'medieval', name: 'Medieval History', lecs: 6, completedLecs: 0, mcqs: 400, solvedMcqs: 0 },
  { id: 'modern', name: 'Modern History', lecs: 46, completedLecs: 0, mcqs: 1000, solvedMcqs: 0 },
  { id: 'art_culture', name: 'Art & Culture', lecs: 15, completedLecs: 0, mcqs: 600, solvedMcqs: 0 },
  { id: 'polity', name: 'Polity & Governance', lecs: 56, completedLecs: 0, mcqs: 1500, solvedMcqs: 0 },
  { id: 'economy', name: 'Economics', lecs: 46, completedLecs: 0, mcqs: 800, solvedMcqs: 0 },
  { id: 'environment', name: 'Environment & Ecology', lecs: 41, completedLecs: 0, mcqs: 700, solvedMcqs: 0 },
  { id: 'science_tech', name: 'Science & Tech', lecs: 18, completedLecs: 0, mcqs: 500, solvedMcqs: 0 },
  { id: 'geography', name: 'Geography', lecs: 46, completedLecs: 0, mcqs: 900, solvedMcqs: 0 },
  { id: 'ir', name: 'International Relations', lecs: 23, completedLecs: 0, mcqs: 400, solvedMcqs: 0 },
  { id: 'society', name: 'Society & Social Justice', lecs: 19, completedLecs: 0, mcqs: 300, solvedMcqs: 0 },
  { id: 'internal_sec', name: 'Internal Security', lecs: 11, completedLecs: 0, mcqs: 300, solvedMcqs: 0 },
  { id: 'disaster', name: 'Disaster Management', lecs: 4, completedLecs: 0, mcqs: 200, solvedMcqs: 0 },
  { id: 'post_ind', name: 'Post Independence', lecs: 7, completedLecs: 0, mcqs: 200, solvedMcqs: 0 },
  { id: 'world_history', name: 'World History', lecs: 15, completedLecs: 0, mcqs: 200, solvedMcqs: 0 },
  { id: 'ethics', name: 'Ethics (GS 4)', lecs: 27, completedLecs: 0, mcqs: 300, solvedMcqs: 0 }

];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem('upsc_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [testType, setTestType] = useState('prelims'); 
  const [inputType, setInputType] = useState('topic'); 
  const [topicInput, setTopicInput] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [mainsSubject, setMainsSubject] = useState('GS 2 (Polity & Governance)');
  const [mainsFormat, setMainsFormat] = useState('theory'); 
  
  const [currentStep, setCurrentStep] = useState('config'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [error, setError] = useState(null);
  const [historyArchive, setHistoryArchive] = useState(() => {
    const saved = localStorage.getItem('upsc_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('upsc_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('upsc_history', JSON.stringify(historyArchive));
  }, [historyArchive]);

  const updateSubjectProgress = (id, field, delta) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === id) {
        const newVal = Math.max(0, s[field] + delta);
        return { ...s, [field]: newVal };
      }
      return s;
    }));
  };

  const generateTest = async () => {
    setError(null);
    setCurrentStep('processing');
    setIsGenerating(true);
    setProgressText('Connecting to UPSCForge AI Engine...');
    await new Promise(r => setTimeout(r, 800));

    let promptText = "";
    if (testType === 'prelims') {
      if (inputType === 'topic') {
        promptText = `Generate ${numQuestions} UPSC Preliminary examination style multi-statement MCQs on the topic: "${topicInput}".`;
      } else if (inputType === 'full_paper') {
        promptText = `Generate a full length UPSC Prelims practice test with 10 questions covering diverse static and dynamic current affairs topics.`;
      } else {
        promptText = `Generate ${numQuestions} UPSC Prelims MCQs based on this text:\n${sourceText}`;
      }
    } else {
      if (mainsFormat === 'essay') {
        promptText = `Generate 1 abstract philosophical Essay topic suitable for UPSC Civil Services Mains exam, along with a structured thinking approach breaking down meaning, multi-dimensional perspectives (social, ethical, economic), and a balanced conclusion framework.`;
      } else {
        promptText = `Generate 3 UPSC Mains theory questions for ${mainsSubject} (PSIR / GS Syllabus aligned) with 150-250 word descriptive model answers including Intro, Body dimensions, and Conclusion.`;
      }
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) {
        throw new Error('Missing Gemini API key. Add VITE_GEMINI_API_KEY to a .env file in the project root.');
      }

      const payload = {
        contents: [{
          parts: [{ text: `${promptText}
          Return valid JSON matching this schema:
          Array of objects with keys:
          - question (string)
          - options (array of strings, empty if mains/essay)
          - correctAnswer (string)
          - explanation (string)
          - difficulty (Easy/Medium/Hard)
          - topicTag (string)` }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING" },
                options: { type: "ARRAY", items: { type: "STRING" } },
                correctAnswer: { type: "STRING" },
                explanation: { type: "STRING" },
                difficulty: { type: "STRING" },
                topicTag: { type: "STRING" }
              },
              required: ["question", "options", "correctAnswer", "explanation", "difficulty", "topicTag"]
            }
          }
        }
      };

      const modelName = 'gemini-3.6-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        const errorMessage = result?.error?.message || 'Unexpected Gemini API error.';
        throw new Error(errorMessage);
      }

      const rawText = result?.candidates?.map(candidate =>
        candidate?.content?.parts?.map(part => part?.text || '').join('')
      ).join('') || '';

      if (!rawText) {
        throw new Error('Gemini returned an empty response. Check your API key and model access.');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = JSON.parse(rawText.replace(/^```json\s*|\s*```$/g, ''));
      }

      if (!Array.isArray(parsed)) {
        throw new Error('Gemini returned an invalid response format.');
      }

      setQuestions(parsed);
      setCurrentStep('quiz');
      setUserAnswers({});
    } catch (err) {
      const message = err?.message || 'Failed to generate test. Please try again.';
      setError(message);
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinishQuiz = () => {
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      type: testType.toUpperCase(),
      title: testType === 'prelims' ? topicInput || 'Prelims Practice' : mainsSubject,
      total: questions.length
    };
    setHistoryArchive([newRecord, ...historyArchive]);
    setCurrentStep('results');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-white">UPSCForge</h1>
              <p className="text-xs text-indigo-400 font-medium">CSE 2028 Intelligence Hub</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setCurrentStep('config'); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard & Syllabus
            </button>
            <button 
              onClick={() => { setActiveTab('generator'); setCurrentStep('config'); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'generator' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Sparkles className="w-4 h-4" /> Test Generator
            </button>
            <button 
              onClick={() => setActiveTab('mentor')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'mentor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Award className="w-4 h-4" /> AI Mentor
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <History className="w-4 h-4" /> Past Papers
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
              <div>
                <h2 className="text-2xl font-bold text-white">You Will Do It</h2>
                <p className="text-slate-400 text-sm mt-1"> All the Best.</p>
              </div>
              <button 
                onClick={() => setActiveTab('generator')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Generate New Test
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(sub => {
                const lecPercent = Math.round((sub.completedLecs / sub.lecs) * 100);
                return (
                  <div key={sub.id} className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl shadow-xl hover:border-indigo-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white">{sub.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full">
                          {sub.id === 'psir' ? 'Optional Core' : 'GS Paper'}
                        </span>
                      </div>
                      <span className="text-sm font-black text-indigo-400">{lecPercent}%</span>
                    </div>

                    <div className="w-full bg-slate-700 h-2 rounded-full mb-4 overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${lecPercent}%` }}></div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/40">
                        <span>Lectures Done:</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateSubjectProgress(sub.id, 'completedLecs', -1)} className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center font-bold">-</button>
                          <span className="font-bold text-white">{sub.completedLecs} / {sub.lecs}</span>
                          <button onClick={() => updateSubjectProgress(sub.id, 'completedLecs', 1)} className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center font-bold">+</button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/40">
                        <span>MCQs Solved:</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateSubjectProgress(sub.id, 'solvedMcqs', -25)} className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center font-bold">-</button>
                          <span className="font-bold text-white">{sub.solvedMcqs}</span>
                          <button onClick={() => updateSubjectProgress(sub.id, 'solvedMcqs', 25)} className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center font-bold">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {currentStep === 'config' && (
              <div className="bg-slate-800/80 border border-slate-700/70 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Sparkles className="text-indigo-400" /> UPSC Test & Paper Generator
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button 
                    onClick={() => setTestType('prelims')}
                    className={`p-4 rounded-2xl border font-bold text-center transition-all ${testType === 'prelims' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    Prelims (Objective MCQs & Full Tests)
                  </button>
                  <button 
                    onClick={() => setTestType('mains')}
                    className={`p-4 rounded-2xl border font-bold text-center transition-all ${testType === 'mains' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    Mains & PSIR / Essay Module
                  </button>
                </div>

                {testType === 'prelims' ? (
                  <div className="space-y-6">
                    <div className="flex gap-4 border-b border-slate-700 pb-4">
                      <button onClick={() => setInputType('topic')} className={`text-sm font-semibold pb-2 border-b-2 ${inputType === 'topic' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>Topic Name</button>
                      <button onClick={() => setInputType('full_paper')} className={`text-sm font-semibold pb-2 border-b-2 ${inputType === 'full_paper' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>Full Prelims Paper</button>
                      <button onClick={() => setInputType('text')} className={`text-sm font-semibold pb-2 border-b-2 ${inputType === 'text' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>Paste Study Material</button>
                    </div>

                    {inputType === 'topic' && (
                      <input 
                        type="text" 
                        placeholder="e.g. Fundamental Rights, Monetary Policy, Mauryan Administration..." 
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    )}

                    {inputType === 'text' && (
                      <textarea 
                        rows="5"
                        placeholder="Paste NCERT / Newspaper notes here..."
                        value={sourceText}
                        onChange={e => setSourceText(e.target.value)}
                        className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    )}

                    <div>
                      <label className="text-sm font-semibold text-slate-300 block mb-2">Number of Questions: {numQuestions}</label>
                      <input 
                        type="range" min="5" max="50" step="5" value={numQuestions} 
                        onChange={e => setNumQuestions(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setMainsFormat('theory')} className={`p-3 rounded-xl border text-sm font-semibold ${mainsFormat === 'theory' ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>GS & PSIR Theory Questions</button>
                      <button onClick={() => setMainsFormat('essay')} className={`p-3 rounded-xl border text-sm font-semibold ${mainsFormat === 'essay' ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>Mini-Essay Practice</button>
                    </div>

                    {mainsFormat === 'theory' && (
                      <div>
                        <label className="text-sm font-semibold text-slate-300 block mb-2">Select Subject / Paper</label>
                        <select 
                          value={mainsSubject} 
                          onChange={e => setMainsSubject(e.target.value)}
                          className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium outline-none"
                        >
                          <option>GS 1 (History, Society, Geography)</option>
                          <option>GS 2 (Polity, Governance, IR)</option>
                          <option>GS 3 (Economy, Environment, Security)</option>
                          <option>GS 4 (Ethics, Integrity, Aptitude)</option>
                          <option>PSIR Optional (Political Theory & IR)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-red-400 text-sm mt-4 font-semibold">{error}</p>}

                <button 
                  onClick={generateTest}
                  className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" /> Generate Now via AI
                </button>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="text-center py-24 bg-slate-800/50 rounded-3xl border border-slate-700">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">{progressText}</h3>
                <p className="text-slate-400 text-sm">Structuring UPSC exam standards...</p>
              </div>
            )}

            {currentStep === 'quiz' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <h3 className="font-bold text-lg text-white">Active Assessment Session</h3>
                  <button onClick={() => window.print()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Print Booklet (QCAB)
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase">
                      <span>Question {idx + 1}</span>
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">{q.topicTag || 'UPSC Standard'}</span>
                    </div>
                    <p className="text-lg font-medium text-white leading-relaxed">{q.question}</p>

                    {q.options && q.options.length > 0 ? (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${userAnswers[idx] === opt ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
                            <input 
                              type="radio" name={`q-${idx}`} checked={userAnswers[idx] === opt} 
                              onChange={() => setUserAnswers({ ...userAnswers, [idx]: opt })}
                              className="mr-3 accent-indigo-500"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea 
                        rows="6" 
                        placeholder="Write your structured answer here (Introduction, Body headings, Conclusion)..."
                        className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none font-medium resize-none"
                      />
                    )}
                  </div>
                ))}

                <button 
                  onClick={handleFinishQuiz}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  Submit Assessment & View Solutions <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {currentStep === 'results' && (
              <div className="space-y-6 bg-slate-800/80 border border-slate-700 p-8 rounded-3xl">
                <div className="text-center pb-6 border-b border-slate-700">
                  <h3 className="text-2xl font-bold text-white mb-2">Assessment & Detailed Explanations</h3>
                  <p className="text-slate-400 text-sm">Review model answers and conceptual clarity below.</p>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-700 p-6 rounded-2xl space-y-4">
                    <p className="font-semibold text-white">Q{idx + 1}: {q.question}</p>
                    {q.correctAnswer && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-sm font-semibold">
                        Correct Answer: {q.correctAnswer}
                      </div>
                    )}
                    <div className="p-4 bg-indigo-950/40 border border-indigo-900 rounded-xl text-indigo-200 text-sm leading-relaxed">
                      <span className="font-bold block mb-1 text-indigo-400">AI EXPLANATION / MODEL FRAMEWORK:</span>
                      {q.explanation}
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => setCurrentStep('config')}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
                >
                  Back to Generator
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mentor' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-900/50 to-slate-800 border border-indigo-500/40 p-8 rounded-3xl shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Ayush Makone's AI Mentor Analysis</h2>
                  <p className="text-indigo-300 text-sm">Personalized preparation roadmap for UPSC 2028</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-200 text-sm leading-relaxed bg-slate-900/60 p-6 rounded-2xl border border-slate-700/60">
                <p className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Syllabus Pace Evaluation:
                </p>
                <p>
                  You have made solid progress in <strong>Polity & Governance</strong> and <strong>Modern History</strong>. However, your <strong>PSIR Optional</strong> core theories (Hobbes, Locke, Rousseau) and <strong>Ethics (GS 4)</strong> require increased weekly focus.
                </p>
                <p className="font-semibold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" /> Recommended Action Plan for Next Week:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  <li>Complete at least 5 pending lectures in <strong>PSIR Optional</strong>.</li>
                  <li>Solve 100 targeted MCQs on <strong>Environment & Ecology</strong> to boost accuracy.</li>
                  <li>Write 2 mini-essays on abstract philosophical statements using multi-dimensional perspectives.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">Past Practice Papers & Tests Archive</h2>
            {historyArchive.length === 0 ? (
              <p className="text-slate-400 bg-slate-800/40 p-8 rounded-2xl text-center border border-slate-700">No previous tests recorded yet. Generate and submit a test to view history!</p>
            ) : (
              <div className="space-y-4">
                {historyArchive.map(item => (
                  <div key={item.id} className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded uppercase">{item.type}</span>
                      <h4 className="font-bold text-lg text-white mt-2">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Completed on {item.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">{item.total} Questions Tested</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}