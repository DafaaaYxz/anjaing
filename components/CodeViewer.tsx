import React from 'react';
import { ArrowLeft, Copy, Check, Terminal as TermIcon, FileCode, Download } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language: string;
  onBack: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language, onBack }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${Date.now()}.${language || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[85vh] bg-core-black border-l border-r border-core-blue/30 max-w-6xl mx-auto shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="bg-core-panel/90 backdrop-blur border-b border-core-blue/30 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-core-blue/10 rounded text-core-blue transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-2">
            <FileCode className="text-emerald-500" size={20} />
            <div>
              <h2 className="text-lg font-bold text-gray-200 font-mono tracking-wide uppercase">
                {language || 'PLAINTEXT'}_MODULE
              </h2>
              <p className="text-[10px] text-core-blue/60 font-mono">READ_ONLY_MODE :: {code.length} BYTES</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 border border-core-blue/30 text-core-blue/80 hover:text-white hover:bg-core-blue/10 rounded text-xs font-mono transition-all"
          >
            <Download size={14} /> DOWNLOAD
          </button>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-core-blue/10 border border-core-blue/50 text-core-blue hover:bg-core-blue hover:text-white rounded text-xs font-bold font-mono transition-all"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'COPIED' : 'COPY_SOURCE'}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto bg-[#0a0f1e] custom-scrollbar relative">
         <div className="absolute top-0 left-0 w-8 h-full bg-slate-900/50 border-r border-slate-800 text-right py-4 pr-2 select-none">
            {code.split('\n').map((_, i) => (
              <div key={i} className="text-[10px] font-mono text-gray-700 leading-6">{i + 1}</div>
            ))}
         </div>
         <pre className="p-4 pl-10 font-mono text-sm leading-6 text-gray-300 whitespace-pre tab-4">
           <code>{code}</code>
         </pre>
      </div>

      {/* Footer Status */}
      <div className="bg-core-black p-2 border-t border-core-blue/30 text-center">
         <span className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em]">
           END_OF_FILE // SYSTEM_GENERATED
         </span>
      </div>
    </div>
  );
};
