
import React, { useState } from 'react';
import { getWritingFeedback } from '../services/geminiService';
import { Level } from '../types';

interface WritingLabProps {
  currentLevel: Level;
}

const MEDICAL_PROMPTS = [
  { id: 'gp', title: 'Visiting the Doctor', task: 'Describe a time you felt unwell. Explain your symptoms and what the doctor told you to do.' },
  { id: 'healthy', title: 'Staying Healthy', task: 'Write about your daily habits. What do you do to stay healthy? Mention food, exercise, and sleep.' },
  { id: 'pharmacy', title: 'At the Pharmacy', task: 'Imagine you need to buy medicine for a cold. Write a dialogue between you and the pharmacist.' }
];

const WritingLab: React.FC<WritingLabProps> = ({ currentLevel }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(MEDICAL_PROMPTS[0]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const analyzeWriting = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    const result = await getWritingFeedback(text, currentLevel);
    setFeedback(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Medical Writing Unit</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Writing Specialist</h1>
          <p className="text-slate-500 font-medium">Linguistic diagnostic for <strong>{currentLevel}</strong> proficiency.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 overflow-hidden relative">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Patient Scenario</h3>
            <div className="grid grid-cols-1 gap-3 mb-8">
              {MEDICAL_PROMPTS.map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setFeedback(null);
                  }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all relative ${
                    selectedPrompt.id === prompt.id ? 'border-blue-500 bg-blue-50/30' : 'border-slate-50 hover:border-slate-200 bg-white'
                  }`}
                >
                  <p className={`font-bold text-sm ${selectedPrompt.id === prompt.id ? 'text-blue-700' : 'text-slate-800'}`}>{prompt.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prompt.task}</p>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Draft your clinical report here..."
                className="w-full h-80 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] p-8 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all resize-none text-slate-700 font-medium leading-relaxed"
              ></textarea>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={analyzeWriting}
                disabled={text.length < 20 || loading}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
              >
                {loading ? 'Consulting Specialist...' : 'Submit Diagnostic Report'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!feedback && !loading && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6">🩺</div>
              <h3 className="text-slate-800 font-black text-xl tracking-tight">Pending Diagnosis</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-3 font-medium">Submit your writing to receive tailored {currentLevel} level corrections.</p>
            </div>
          )}

          {feedback && (
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-slate-100 overflow-hidden animate-in slide-in-from-right duration-700">
              <div className="bg-slate-900 p-8 text-white relative">
                <div className="absolute top-4 right-8">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Analysis Target</div>
                  <div className="text-xl font-bold">{currentLevel}</div>
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Linguistic Outcome</h2>
                <div className="flex items-baseline space-x-3">
                  <span className="text-5xl font-black">{feedback.score}</span>
                  <span className="text-blue-300/60 font-medium italic">Estimated Grade</span>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-4">🩹 Clinical Corrections</h4>
                  <div className="space-y-2">
                    {feedback.corrections.map((c: string, i: number) => (
                      <div key={i} className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 text-xs font-bold leading-relaxed transition-all hover:bg-red-100">! {c}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-4">💊 Suggested Vocabulary</h4>
                  <div className="flex flex-wrap gap-2">
                    {feedback.vocabularySuggestions.map((v: string, i: number) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black border border-blue-100 uppercase tracking-wider">✨ {v}</span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-slate-600 italic text-sm leading-loose">"{feedback.generalFeedback}"</p>
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
