import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface JsonViewerProps {
  data: unknown;
  status?: number;
  durationMs?: number;
  requestId?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  status,
  durationMs,
  requestId,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"pretty" | "raw">("pretty");

  const jsonString =
    viewMode === "pretty"
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (!status) return null;
    const isSuccess = status >= 200 && status < 300;
    const isClientErr = status >= 400 && status < 500;
    return (
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
          isSuccess
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : isClientErr
            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
      >
        {status} {status === 200 ? "OK" : status === 201 ? "Created" : status === 400 ? "Bad Request" : status === 401 ? "Unauthorized" : status === 404 ? "Not Found" : status === 429 ? "Too Many Requests" : ""}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0A080B] overflow-hidden flex flex-col h-full">
      {/* Inspector Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {durationMs !== undefined && (
            <span className="text-[11px] font-mono text-[#BABABA]">
              {durationMs}ms
            </span>
          )}
          {requestId && (
            <span
              className="text-[10px] font-mono text-[#BABABA]/60 truncate max-w-[120px] sm:max-w-[200px]"
              title={`Request ID: ${requestId}`}
            >
              {requestId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("pretty")}
              className={`px-2 py-0.5 rounded text-[11px] font-display transition cursor-pointer ${
                viewMode === "pretty"
                  ? "bg-white/[0.1] text-white"
                  : "text-[#BABABA] hover:text-white"
              }`}
            >
              Pretty
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-2 py-0.5 rounded text-[11px] font-display transition cursor-pointer ${
                viewMode === "raw"
                  ? "bg-white/[0.1] text-white"
                  : "text-[#BABABA] hover:text-white"
              }`}
            >
              Raw
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-display text-[#BABABA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code viewport */}
      <div className="p-3.5 flex-1 overflow-auto max-h-[500px] text-xs font-mono text-zinc-300 leading-relaxed selection:bg-[#FF6D29]/30">
        <pre className="whitespace-pre">{jsonString}</pre>
      </div>
    </div>
  );
};
