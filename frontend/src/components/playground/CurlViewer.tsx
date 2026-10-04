import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CurlViewerProps {
  command: string;
}

export const CurlViewer: React.FC<CurlViewerProps> = ({ command }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl border border-white/10 bg-[#0A080B] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="text-[11px] font-mono text-[#BABABA]">bash / cURL</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-display text-[#BABABA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy cURL"}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed selection:bg-[#FF6D29]/30">
        <pre className="whitespace-pre">{command}</pre>
      </div>
    </div>
  );
};
