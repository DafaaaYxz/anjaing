import React, { useState, useEffect, useRef } from 'react';
import { User, Message, GlobalSettings } from '../types';
import { generateResponse } from '../services/geminiService';
import { Terminal as TermIcon, Send, Trash2, Image as ImageIcon, Cpu, Wifi, FileCode, ChevronRight, Play } from 'lucide-react';

interface TerminalProps {
  user: User;
  settings: GlobalSettings;
  onSaveHistory: (messages: Message[]) => void;
  initialMessages?: Message[];
  onViewCode: (code: string, language: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ user, settings, onSaveHistory, initialMessages = [], onViewCode }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiName = user.isNameApproved ? user.requestedAiName : 'DevCORE';
  const devName = user.isNameApproved ? user.requestedDevName : 'XdpzQ';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save history on unmount or update
  useEffect(() => {
    onSaveHistory(messages);
  }, [messages, onSaveHistory]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      image: selectedImage ? URL.createObjectURL(selectedImage) : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare system instruction with dynamic names
    let systemInstruction = settings.customPersona
      .replace(/{{AI_NAME}}/g, aiName)
      .replace(/{{DEV_NAME}}/g, devName);

    // Prepare history for API
    const historyForApi = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }] // Simplified for text history
    }));

    try {
      const responseText = await generateResponse(
        userMsg.text,
        selectedImage,
        historyForApi,
        settings,
        systemInstruction
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `SYSTEM ERROR: ${error.message || 'CONNECTION REFUSED'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const handleReset = () => {
    setMessages([]);
    onSaveHistory([]);
  };

  // Helper to parse text and extract code blocks
  const renderMessageContent = (text: string) => {
    // Regex to capture ```language ... ``` blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      
      // Add code part
      parts.push({ 
        type: 'code', 
        language: match[1] || 'text', 
        content: match[2] 
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    // If no code blocks found, return raw text
    if (parts.length === 0) {
      return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
    }

    return (
      <div className="space-y-2">
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <div key={idx} className="whitespace-pre-wrap leading-relaxed">{part.content}</div>;
          } else {
            return (
              <div 
                key={idx}
                onClick={() => onViewCode(part.content, part.language)}
                className="group relative mt-2 mb-2 p-4 border border-dashed border-core-blue/40 bg-slate-900/50 hover:bg-core-blue/10 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-core-blue/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-slate-950 border border-core-blue/30 rounded shadow-lg group-hover:border-core-blue group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                    <FileCode className="text-core-blue" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                          SCRIPT_DETECTED
                       </span>
                       <span className="text-[10px] text-gray-500 font-mono uppercase">
                          {part.language}
                       </span>
                    </div>
                    <div className="font-mono text-sm text-gray-200 truncate font-bold group-hover:text-core-blue transition-colors">
                      generated_module_{idx}.{part.language === 'python' ? 'py' : part.language === 'javascript' ? 'js' : 'txt'}
                    </div>
                  </div>
                  <div className="text-gray-600 group-hover:text-core-blue transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-500 font-mono flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Play size={10} /> CLICK_TO_VIEW_SOURCE
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-core-black border-l border-r border-core-blue/30 max-w-5xl mx-auto shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="bg-core-panel/80 backdrop-blur border-b border-core-blue/30 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-core-blue/10 border border-core-blue rounded">
            <TermIcon className="w-5 h-5 text-core-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-core-blue font-mono">
              {aiName.toUpperCase()}_TERMINAL
            </h2>
            <div className="flex items-center gap-2 text-xs text-core-blue/60 font-mono">
              <span className="flex items-center gap-1"><Cpu size={10} /> NET: ONLINE</span>
              <span className="flex items-center gap-1"><Wifi size={10} /> ENC: AES-256</span>
            </div>
          </div>
        </div>
        <div className="text-right font-mono text-core-blue/80">
          <div className="text-sm font-bold">UPTIME: 20.000 HRS</div>
          <div className="text-xs">DEV: {devName}</div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 font-mono text-sm relative z-0">
        {messages.length === 0 && (
          <div className="text-center mt-20 opacity-50">
            <div className="border border-dashed border-core-blue/30 p-8 inline-block rounded">
              <p className="text-core-blue">SYSTEM READY...</p>
              <p className="text-xs mt-2">Waiting for input directive.</p>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] border p-3 rounded-lg backdrop-blur-sm ${
              msg.role === 'user' 
                ? 'border-core-blue/50 bg-core-blue/5 text-core-blue rounded-tr-none' 
                : 'border-slate-700 bg-slate-900/80 text-gray-300 rounded-tl-none shadow-[0_0_10px_rgba(0,0,0,0.5)]'
            }`}>
              <div className="flex items-center gap-2 mb-1 border-b border-white/5 pb-1">
                <span className={`text-xs font-bold uppercase ${msg.role === 'user' ? 'text-core-blue' : 'text-emerald-500'}`}>
                   {msg.role === 'user' ? 'USER@ROOT' : `SYSTEM@${aiName}`}
                </span>
                <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              
              {msg.image && (
                <img src={msg.image} alt="upload" className="max-w-full h-auto rounded border border-core-blue/30 mb-2" />
              )}
              
              {/* Content Render Logic */}
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start">
             <div className="max-w-[85%] border border-slate-700 bg-slate-900/80 p-3 rounded-lg rounded-tl-none">
                <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-core-black border-t border-core-blue/30">
        {selectedImage && (
          <div className="mb-2 flex items-center gap-2 text-xs text-core-blue bg-core-blue/10 p-1 rounded inline-block">
            <span>[IMG_BUFFER_LOADED]</span>
            <button onClick={() => setSelectedImage(null)} className="hover:text-white">x</button>
          </div>
        )}
        <div className="flex gap-2">
           <button 
            onClick={handleReset} 
            className="p-3 border border-core-alert/30 text-core-alert hover:bg-core-alert/10 transition-colors rounded"
            title="Reset Terminal"
          >
            <Trash2 size={20} />
          </button>
          
          {settings.featureImageGen && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={`p-3 border border-core-blue/30 text-core-blue hover:bg-core-blue/10 transition-colors rounded ${selectedImage ? 'bg-core-blue/20' : ''}`}
            >
              <ImageIcon size={20} />
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
            }} 
          />

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Enter command..."
              className="w-full h-full bg-core-panel/50 border border-core-blue/30 rounded pl-4 pr-12 text-core-blue focus:outline-none focus:border-core-blue focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] font-mono placeholder-core-blue/30"
              disabled={isLoading}
              autoFocus
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-core-blue disabled:opacity-50 hover:text-white transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
