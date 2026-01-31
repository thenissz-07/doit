
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getTutorResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

// Helper functions for Live API as per instructions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
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

const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm your AI English tutor. I'm here to help you move from A2 to B1. Ready to practice speaking about health and medicine? Click the 'Live Voice' button!", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle'>('idle');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping, liveStatus]);

  // Clean up on unmount
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
          systemInstruction: "You are a friendly English Tutor focusing on Medical English. Help the user practice symptoms, doctor interactions, and health vocabulary at B1 level."
        }
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start live session", err);
      setIsLive(false);
      setLiveStatus('idle');
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
    const responseText = await getTutorResponse(history as any);
    setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-inner">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center">
              Speaking Partner
              <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full uppercase">B1 Prep</span>
            </h2>
            <p className="text-xs text-slate-500">Practice your medical scenarios</p>
          </div>
        </div>
        <button
          onClick={toggleLiveMode}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
            isLive 
              ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {isLive ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>Stop Voice Session</span>
            </>
          ) : (
            <>
              <span>🎙️</span>
              <span>Live Voice Practice</span>
            </>
          )}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 relative">
        {isLive && (
          <div className="absolute inset-x-0 top-0 p-4 z-10">
            <div className="bg-blue-600/95 backdrop-blur-md text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-300">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1 items-end h-6">
                  <div className={`w-1.5 bg-white rounded-full ${liveStatus === 'speaking' ? 'animate-bounce h-6' : 'h-2'}`} style={{animationDelay: '0ms'}}></div>
                  <div className={`w-1.5 bg-white rounded-full ${liveStatus === 'speaking' ? 'animate-bounce h-4' : 'h-2'}`} style={{animationDelay: '150ms'}}></div>
                  <div className={`w-1.5 bg-white rounded-full ${liveStatus === 'speaking' ? 'animate-bounce h-5' : 'h-2'}`} style={{animationDelay: '300ms'}}></div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Live Session Active</p>
                  <p className="text-sm font-medium">
                    {liveStatus === 'connecting' && 'Connecting to AI...'}
                    {liveStatus === 'listening' && 'Listening to you...'}
                    {liveStatus === 'speaking' && 'Tutor is speaking...'}
                  </p>
                </div>
              </div>
              <div className="text-[10px] border border-white/30 px-2 py-1 rounded-lg">Low Latency PCM</div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
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
              <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
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
            placeholder={isLive ? "Keyboard disabled during voice session..." : "Ask about symptoms or health advice..."}
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
        <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-wider font-bold">
          {isLive ? "Speak naturally - I can hear you!" : "Tip: Try asking 'What are the symptoms of a common cold?'"}
        </p>
      </div>
    </div>
  );
};

export default ChatTutor;
