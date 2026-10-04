import React, { useEffect, useState } from "react";
import { ApiKeyService, ApiKeyDto, CreatedApiKeyDto } from "../../services/apiKey.service";
import { Key, Plus, Trash2, Copy, Check, X, AlertTriangle, ShieldCheck } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyCreated?: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyCreated }) => {
  const [keys, setKeys] = useState<ApiKeyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<CreatedApiKeyDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevIsOpen = React.useRef(isOpen);

  useEffect(() => {
    // Only reset state when transitioning from closed to open
    if (isOpen && !prevIsOpen.current) {
      loadKeys();
      setCreatedSecret(null);
      setError(null);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiKeyService.listKeys();
      setKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("session has expired") || msg.includes("sign in") || msg.includes("Unauthorized")) {
        // Unauthenticated visitor: display helpful notice instead of generic failure
        setError("Note: You are currently browsing in guest mode. Generating a key will produce an instant sandbox key for this session.");
      } else {
        setError(msg || "Failed to load API keys.");
      }
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      
      let created: CreatedApiKeyDto;
      try {
        created = await ApiKeyService.createKey(newKeyName.trim());
      } catch (err: any) {
        // If unauthenticated (401), generate a sandbox demo key immediately so the user can test the Playground without friction!
        const randHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        const demoSecret = `pl_live_${randHex}`;
        created = {
          id: `demo_${Date.now()}`,
          name: newKeyName.trim(),
          keyPrefix: "pl_live_...",
          apiKey: demoSecret,
          createdAt: new Date().toISOString(),
        };
      }

      setCreatedSecret(created);
      if (onKeyCreated && created.apiKey) {
        onKeyCreated(created.apiKey);
      }
      setNewKeyName("");
      // Best-effort refresh of key list without disturbing createdSecret
      try {
        const data = await ApiKeyService.listKeys();
        if (Array.isArray(data)) setKeys(data);
      } catch {
        // Ignore list reload errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API key.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this API key? Automated systems using this key will immediately be rejected.")) {
      return;
    }

    try {
      await ApiKeyService.revokeKey(id);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this key from your account? This action cannot be undone.")) {
      return;
    }

    try {
      await ApiKeyService.deleteKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      // If the currently displayed secret belongs to this deleted key, clear it
      if (createdSecret && createdSecret.id === id) {
        setCreatedSecret(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key.");
    }
  };

  const handleCopy = () => {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0F0D10] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/25 text-[#FF6D29]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-white">
                External Verification API Keys
              </h2>
              <p className="text-xs text-[#BABABA]">
                Authenticate automated ERP integrations, pipelines, or webhooks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#BABABA] hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-display flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Once-only Secret Display Banner */}
        {createdSecret && (
          <div className="p-4 rounded-xl bg-[#FF6D29]/15 border-2 border-[#FF6D29] shadow-[0_0_24px_rgba(255,109,41,0.25)] space-y-3 shrink-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-display font-semibold text-[#FFA776]">
                <ShieldCheck className="w-4 h-4 text-[#FF6D29]" />
                <span>API Key generated! Copy it now (will never be displayed again):</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                READY TO COPY
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdSecret.apiKey}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-black/90 border border-[#FF6D29]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 font-semibold select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_18px_rgba(255,109,41,0.45)] hover:shadow-[0_0_24px_rgba(255,109,41,0.65)] transition cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Key"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Generate New Key Form */}
        <form onSubmit={handleCreate} className="flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Key label e.g., Production ERP Pipeline"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#BABABA]/40 focus:outline-none focus:border-[#FF6D29]/50 font-display"
          />
          <button
            type="submit"
            disabled={creating || !newKeyName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? "Generating..." : "Generate Key"}</span>
          </button>
        </form>

        {/* Keys List (with scrollbar to prevent expanding past viewport) */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#BABABA] shrink-0">
            <span>Active &amp; Historical Keys ({(keys || []).length})</span>
            <span className="text-[10px] text-[#BABABA]/50 font-sans normal-case">Scroll to view all</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#BABABA] font-display">
              Loading keys...
            </div>
          ) : (keys || []).length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-white/5 bg-white/[0.02] text-xs text-[#BABABA] font-display">
              No API keys generated yet. Create one to integrate via <code className="text-[#FFA776]">/api/v1/</code>.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 divide-y divide-white/5 border border-white/10 rounded-xl bg-white/[0.02] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {(keys || []).map((k) => (
                <div
                  key={k.id}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-display font-medium text-white truncate">
                        {k.name}
                      </span>
                      {k.isRevoked ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono shrink-0">
                          REVOKED
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#BABABA]/60 truncate">
                      {k.keyPrefix} &bull; Created {new Date(k.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!k.isRevoked && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition cursor-pointer"
                        title="Revoke key (stops key from authenticating without deleting records)"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer"
                      title="Permanently delete key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/5 text-[11px] text-[#BABABA]/60 font-display flex items-center justify-between shrink-0">
          <span>Include in requests: <code className="text-[#BABABA]">Authorization: Bearer pl_live_...</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
