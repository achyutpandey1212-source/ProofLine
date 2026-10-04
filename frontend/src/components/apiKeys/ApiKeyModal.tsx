import React, { useEffect, useState } from "react";
import { ApiKeyService, ApiKeyDto, CreatedApiKeyDto } from "../../services/apiKey.service";
import { Key, Plus, Trash2, Copy, Check, X, AlertTriangle, ShieldCheck } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<ApiKeyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<CreatedApiKeyDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadKeys();
      setCreatedSecret(null);
      setError(null);
    }
  }, [isOpen]);

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiKeyService.listKeys();
      setKeys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys.");
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
      const created = await ApiKeyService.createKey(newKeyName.trim());
      setCreatedSecret(created);
      setNewKeyName("");
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API key.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this API key? This action is permanent and immediate.")) {
      return;
    }

    try {
      await ApiKeyService.revokeKey(id);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key.");
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0F0D10] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
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
            className="p-1.5 rounded-lg text-[#BABABA] hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-display flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Once-only Secret Display Banner */}
        {createdSecret && (
          <div className="p-4 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-display font-semibold text-[#FFA776]">
              <ShieldCheck className="w-4 h-4 text-[#FF6D29]" />
              <span>Copy your new API Key now — it will never be displayed again:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdSecret.apiKey}
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6D29] hover:bg-[#E04516] text-white text-xs font-display font-medium transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Generate New Key Form */}
        <form onSubmit={handleCreate} className="flex gap-2">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium disabled:opacity-40 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? "Generating..." : "Generate Key"}</span>
          </button>
        </form>

        {/* Keys List */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]">
            Active Keys ({keys.length})
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#BABABA] font-display">
              Loading keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-white/5 bg-white/[0.02] text-xs text-[#BABABA] font-display">
              No API keys generated yet. Create one to integrate via <code className="text-[#FFA776]">/api/v1/</code>.
            </div>
          ) : (
            <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-display font-medium text-white">
                        {k.name}
                      </span>
                      {k.isRevoked ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                          REVOKED
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#BABABA]/60">
                      {k.keyPrefix} &bull; Created {new Date(k.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {!k.isRevoked && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer"
                      title="Revoke key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-[11px] text-[#BABABA]/60 font-display flex items-center justify-between">
          <span>Include in requests as: <code className="text-[#BABABA]">Authorization: Bearer pl_live_...</code></span>
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
