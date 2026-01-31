
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getTutorResponse, getSpeakingFeedback } from '../services/geminiService';
import { ChatMessage, Level } from '../types';
import { getSystemInstruction } from '../constants';

interface ChatTutorProps {
  currentLevel: Level;
}

const DRILL_SCENARIOS = [
  { id: 1, title: "Patient Triage", scenario: "A patient arrives at the ER with severe abdominal pain. Ask them three diagnostic questions about the location, intensity, and duration of the pain." },
  { id: 2, title: "Medication Counseling", scenario: "Explain to an elderly patient that they must take their blood pressure medication twice daily, once in the morning and once at night, with food." },
  { id: 3, title: "Surgical Prep", scenario: "Comfort a nervous patient who is about to undergo a minor procedure. Explain that they will be under general anesthesia and won't feel a thing." }
];

// Helper functions for Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatTutor: React.FC<ChatTutorProps> = ({ currentLevel }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'drills'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello! I'm your ${currentLevel} AI Tutor. I'm here to help you practice English in a medical context. How can I assist you today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle'>('idle');
  
  // Drill specific state
  const [selectedDrill, setSelectedDrill] = useState(DRILL_SCENARIOS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [drillFeedback, setDrillFeedback] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping, liveStatus]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) liveSessionRef.current.close();
    };
  }, []);

  const toggleLiveMode = async () => {
    if (isLive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsLive(false);
      setLiveStatus('idle');
      return;
    }

    setIsLive(true);
    setLiveStatus('connecting');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setLiveStatus('speaking');
              const outputCtx = audioContextRef.current?.output!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setLiveStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error", e);
            setIsLive(false);
            setLiveStatus('idle');
          },
          onclose: () => {
            setIsLive(false);
            setLiveStatus('idle');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: getSystemInstruction(currentLevel)
        }
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start live session", err);
      setIsLive(false);
      setLiveStatus('idle');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordingBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDrillFeedback(null);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || isLive) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    history.push({ role: 'user', parts: [{ text: input }] });
    const responseText = await getTutorResponse(history as any, currentLevel);
    setMessages(prev => [...prev, { role: 'model', text: responseText || "I'm sorry, I couldn't process that.", timestamp: new Date() }]);
    setIsTyping(false);
  };

  const analyzeDrill = async () => {
    if (!recordingBlob) return;
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordingBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const feedback = await getSpeakingFeedback(base64Audio, selectedDrill.scenario, currentLevel);
        setDrillFeedback(feedback);
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error("Drill analysis failed", err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300">
      <div className="bg-slate-50 border-b border-slate-100 px-6 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-inner">🤖</div>
            <div>
              <h2 className="font-bold text-slate-800 flex items-center">
                AI Tutor Partner
                <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-black">{currentLevel}</span>
              </h2>
              <p className="text-xs text-slate-500">Real-time medical English practice</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleLiveMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                isLive ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {isLive ? (
                <>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span>Stop Session</span>
                </>
              ) : (
                <>
                  <span>🎙️</span>
                  <span>Live Voice</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Conversational Chat
            {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('drills')}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'drills' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Speaking Drills
            {activeTab === 'drills' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 relative">
              {isLive && (
                <div className="sticky top-0 p-4 z-10 w-full">
                  <div className="bg-blue-600/95 backdrop-blur-md text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-1 items-end h-6">
                        <div className={`w-1.5 bg-white rounded-full ${liveStatus === 'speaking' ? 'animate-bounce h-6' : 'h-2'}`}></div>
                        <div className={`w-1.5 bg-white rounded-full ${liveStatus === 'speaking' ? 'animate-bounce h-4' : 'h-2'}`} style={{animationDelay: '150ms'}}></div>
                        <div className={`w-1.5 bg-white rounded-full ${liveStatus === 'speaking' ? 'animate-bounce h-5' : 'h-2'}`} style={{animationDelay: '300ms'}}></div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Listening for your {currentLevel} English</p>
                        <p className="text-sm font-medium">
                          {liveStatus === 'connecting' && 'Connecting...'}
                          {liveStatus === 'listening' && 'Listening...'}
                          {liveStatus === 'speaking' && 'Tutor is speaking...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-[9px] mt-2 opacity-60 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  disabled={isLive}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isLive ? "Keyboard disabled during voice session..." : "Ask your medical tutor anything..."}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isLive}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select a Speaking Drill</h3>
                  <div className="grid grid-cols-1 gap-3 mb-8">
                    {DRILL_SCENARIOS.map(drill => (
                      <button
                        key={drill.id}
                        onClick={() => {
                          setSelectedDrill(drill);
                          setDrillFeedback(null);
                          setRecordingBlob(null);
                        }}
                        className={`text-left p-4 rounded-2xl border-2 transition-all ${
                          selectedDrill.id === drill.id ? 'border-blue-500 bg-blue-50/30' : 'border-slate-50 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <p className={`font-bold text-sm ${selectedDrill.id === drill.id ? 'text-blue-700' : 'text-slate-800'}`}>{drill.title}</p>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Your Task</p>
                    <p className="text-sm font-medium leading-relaxed">{selectedDrill.scenario}</p>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all duration-300 shadow-2xl ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-200' 
                          : 'bg-white border-4 border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500'
                      }`}
                    >
                      {isRecording ? '⏹️' : '🎙️'}
                    </button>
                    <p className="text-xs font-bold text-slate-400">
                      {isRecording ? "RELEASING TO FINISH..." : "HOLD TO SPEAK"}
                    </p>
                    
                    {recordingBlob && !isRecording && (
                      <div className="w-full pt-4 space-y-4">
                        <audio src={URL.createObjectURL(recordingBlob)} controls className="w-full h-8" />
                        <button
                          onClick={analyzeDrill}
                          disabled={isAnalyzing}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl transition-all hover:bg-blue-600 disabled:opacity-50"
                        >
                          {isAnalyzing ? 'Analyzing Clinical Speech...' : 'Get Diagnostic Feedback'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {!drillFeedback && !isAnalyzing && (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6">🏥</div>
                    <h3 className="text-slate-800 font-black text-xl tracking-tight">Speech Diagnostic</h3>
                    <p className="text-slate-400 text-sm max-w-xs mt-3 font-medium">Record your response to receive a detailed analysis of your medical English pronunciation and fluency.</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="bg-white rounded-[3rem] shadow-xl p-12 text-center flex flex-col items-center justify-center animate-pulse">
                    <div className="w-16 h-16 bg-blue-50 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-6"></div>
                    <p className="text-slate-800 font-bold">Evaluating Audio Markers...</p>
                  </div>
                )}

                {drillFeedback && (
                  <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right duration-700">
                    <div className="bg-slate-900 p-8 text-white">
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Diagnostic Results</h2>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-black">{drillFeedback.pronunciationScore}/10</p>
                          <p className="text-[10px] text-blue-300/60 uppercase font-black">Pronunciation</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black">{drillFeedback.fluencyScore}/10</p>
                          <p className="text-[10px] text-blue-300/60 uppercase font-black">Fluency</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black">{drillFeedback.accuracyScore}/10</p>
                          <p className="text-[10px] text-blue-300/60 uppercase font-black">Accuracy</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-xs">
                        "{drillFeedback.transcription}"
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-wider mb-3">Phonetic Focus</h4>
                        <div className="flex flex-wrap gap-2">
                          {drillFeedback.phoneticFeedback.map((f: string, i: number) => (
                            <span key={i} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-red-100">⚠️ {f}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-wider mb-3">Clinical Phrasing Tips</h4>
                        <div className="space-y-2">
                          {drillFeedback.medicalTips.map((t: string, i: number) => (
                            <div key={i} className="bg-blue-50 text-blue-700 p-3 rounded-xl text-[11px] font-bold border border-blue-100">✨ {t}</div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-slate-600 text-sm leading-relaxed">{drillFeedback.overallEvaluation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatTutor;
