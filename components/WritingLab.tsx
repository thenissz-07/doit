
import React, { useState } from 'react';
import { getWritingFeedback } from '../services/geminiService';

const MEDICAL_PROMPTS = [
  { id: 'gp', title: 'Visiting the Doctor', task: 'Describe a time you felt unwell. Explain your symptoms and what the doctor told you to do.' },
  { id: 'healthy', title: 'Staying Healthy', task: 'Write about your daily habits. What do you do to stay healthy? Mention food, exercise, and sleep.' },
  { id: 'pharmacy', title: 'At the Pharmacy', task: 'Imagine you need to buy medicine for a cold. Write a dialogue between you and the pharmacist.' }
];

const WritingLab: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(MEDICAL_PROMPTS[0]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const analyzeWriting = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    
    // Custom context for medical feedback
    const contextPrompt = `Subject: Medical English (B1). Task: ${selectedPrompt.task}. Text: "${text}"`;
    const result = await getWritingFeedback(contextPrompt);
    setFeedback(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Clinical Unit: Health</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Medical Writing Lab</h1>
          <p className="text-slate-500 font-medium">Refine your diagnostic and descriptive English for B1 level.</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-lg">📈</span>
          <span className="text-sm font-bold text-slate-700">Writing Mastery: 65%</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <svg className="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            </div>
            
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Patient Scenario</h3>
            <div className="grid grid-cols-1 gap-3 mb-8">
              {MEDICAL_PROMPTS.map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setFeedback(null);
                  }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all relative group overflow-hidden ${
                    selectedPrompt.id === prompt.id
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-slate-50 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className={`font-bold text-sm ${selectedPrompt.id === prompt.id ? 'text-blue-700' : 'text-slate-800'}`}>
                        {prompt.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prompt.task}</p>
                    </div>
                    {selectedPrompt.id === prompt.id && (
                      <span className="text-blue-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Report</label>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                   Character Count: <span className={text.length < 50 ? 'text-red-500' : 'text-blue-600'}>{text.length}</span>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Draft your medical report here... Focus on symptom progression and doctor's advice."
                  className="w-full h-80 bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-8 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all resize-none text-slate-700 font-medium leading-relaxed shadow-inner"
                ></textarea>
                <div className="absolute bottom-6 right-6 flex space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-200 animate-pulse" style={{animationDelay: '0.2s'}}></span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {String.fromCharCode(64 + i)}
                    </div>
                 ))}
                 <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">+12</div>
              </div>
              <button
                onClick={analyzeWriting}
                disabled={text.length < 30 || loading}
                className="group bg-slate-900 hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all disabled:opacity-50 flex items-center space-x-3 overflow-hidden"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Analysis...</span>
                  </>
                ) : (
                  <>
                    <span>Submit to Specialist</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!feedback && !loading && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center flex flex-col items-center justify-center h-full group hover:border-blue-300 transition-colors">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">🏥</div>
              <h3 className="text-slate-800 font-black text-2xl tracking-tight">Diagnostic Results</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-3 font-medium leading-relaxed">Submit your report to receive a detailed linguistic diagnosis from our AI Specialist.</p>
            </div>
          )}

          {feedback && (
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-slate-100 overflow-hidden animate-in slide-in-from-right duration-700">
              {/* Report Header */}
              <div className="bg-slate-900 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-8">
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                    <span className="text-2xl font-black">B1</span>
                  </div>
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Diagnostic Summary</h2>
                <div className="flex items-baseline space-x-3">
                  <span className="text-5xl font-black">{feedback.score}</span>
                  <span className="text-blue-300/60 font-medium italic">CEFR Proficiency</span>
                </div>
              </div>

              <div className="p-10 space-y-10">
                {/* Corrections Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl">🩹</div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg tracking-tight">Clinical Observations</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Grammar & Syntax Errors</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {feedback.corrections.map((c: string, i: number) => (
                      <div key={i} className="group relative flex items-start space-x-4 bg-slate-50 hover:bg-red-50/50 p-5 rounded-3xl border border-transparent hover:border-red-100 transition-all">
                        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">
                          !
                        </div>
                        <p className="text-slate-600 group-hover:text-red-800 text-sm font-semibold leading-relaxed">
                          {c}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vocabulary Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">💊</div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg tracking-tight">Prescribed Vocabulary</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Professional Word Choice</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {feedback.vocabularySuggestions.map((v: string, i: number) => (
                      <div key={i} className="flex items-center space-x-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 group hover:bg-blue-100 transition-colors">
                        <span className="text-blue-500 group-hover:scale-125 transition-transform">✨</span>
                        <span className="text-blue-900 font-black text-xs uppercase tracking-wider">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Feedback / Doctor's Note */}
                <div className="relative pt-6 border-t border-slate-100">
                  <div className="absolute -top-3 left-10 bg-white px-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialist's Note</span>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 italic">
                    <p className="text-slate-600 leading-loose font-medium relative z-10">
                      <span className="text-4xl text-slate-200 absolute -top-4 -left-2 select-none font-serif">"</span>
                      {feedback.generalFeedback}
                      <span className="text-4xl text-slate-200 absolute -bottom-10 right-0 select-none font-serif">"</span>
                    </p>
                    <div className="mt-6 flex items-center space-x-3 border-t border-slate-200 pt-6">
                      <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">L.P</div>
                      <div>
                        <p className="text-xs font-black text-slate-800">Linguist Pro Specialist</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Department of Medical English</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingLab;
