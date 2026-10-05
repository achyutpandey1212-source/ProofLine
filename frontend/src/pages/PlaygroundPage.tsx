import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import { JsonViewer } from "../components/playground/JsonViewer";
import { CurlViewer } from "../components/playground/CurlViewer";
import { ApiKeyModal } from "../components/apiKeys/ApiKeyModal";
import { ApiKeyService } from "../services/apiKey.service";
import {
  PlaygroundService,
  VerificationCreateRequest,
  RequestHistoryItem,
} from "../services/playground.service";
import {
  Key,
  Plus,
  Play,
  Upload,
  FileCheck,
  RotateCw,
  Sparkles,
  ExternalLink,
  Code2,
  Terminal,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileDown,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";

type ActiveTab = "FLOW" | "POST_VERIFICATION" | "POST_EVIDENCE" | "POST_RUN" | "GET_STATUS" | "GET_PACKET";

export const PlaygroundPage: React.FC = () => {
  // Authentication & API Key state
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [savedKeysCount, setSavedKeysCount] = useState<number>(0);

  // Playground Flow State
  const [activeTab, setActiveTab] = useState<ActiveTab>("FLOW");
  const [viewFormat, setViewFormat] = useState<"response" | "curl">("response");

  // Step 1: Create Verification Fields
  const [formValues, setFormValues] = useState<VerificationCreateRequest>({
    transactionId: "EW-104",
    partnerName: "ABC Recycling Pvt Ltd",
    material: "PET Plastic Flakes",
    claimedQuantity: 560,
    unit: "kg",
    organization: "Apex Polymer Solutions Ltd",
    notes: "PO reference #4492",
  });
  const [createdVerificationId, setCreatedVerificationId] = useState<string>("");

  // Step 2: Evidence State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState<string>("INVOICE");
  const [uploadedEvidence, setUploadedEvidence] = useState<Array<{ id: string; type: string; filename: string }>>([]);

  // Step 3 & 4: Execution & Result
  const [running, setRunning] = useState<boolean>(false);
  const [runStatus, setRunStatus] = useState<string>("");
  const [latestResponse, setLatestResponse] = useState<unknown>(null);
  const [latestStatus, setLatestStatus] = useState<number | undefined>(undefined);
  const [latestDuration, setLatestDuration] = useState<number | undefined>(undefined);
  const [latestRequestId, setLatestRequestId] = useState<string>("");

  // UI status & history
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has existing API keys to select from
    ApiKeyService.listKeys()
      .then((keys) => {
        if (Array.isArray(keys)) {
          setSavedKeysCount(keys.filter((k) => !k.isRevoked).length);
        } else {
          setSavedKeysCount(0);
        }
      })
      .catch(() => {
        // Unauthenticated or network error, silently handle
        setSavedKeysCount(0);
      });
  }, []);

  const addHistory = (item: Omit<RequestHistoryItem, "id" | "timestamp">) => {
    const newItem: RequestHistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 14)]);
  };

  const handleUseSavedKey = () => {
    setShowKeyModal(true);
  };

  // Step 1: Submit POST /api/v1/verifications
  const handleCreateVerification = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API Key (e.g., pl_live_...) before making requests.");
      return;
    }
    setErrorMessage(null);

    try {
      const idempKey = `idemp_create_${Date.now()}`;
      const res = await PlaygroundService.createVerification(apiKey, formValues, idempKey);
      setLatestStatus(res.status);
      setLatestResponse(res.data);
      setLatestDuration(res.durationMs);
      setLatestRequestId(res.requestId);

      addHistory({
        method: "POST",
        endpoint: "/api/v1/verifications",
        status: res.status,
        statusText: res.status === 201 ? "Created" : "Failed",
        durationMs: res.durationMs,
        response: res.data,
        isError: res.status >= 400,
      });

      if (res.status === 201) {
        const id = (res.data as any)?.id;
        if (id) {
          setCreatedVerificationId(id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit verification request");
    }
  };

  // Step 2: Upload Evidence File
  const handleUploadEvidence = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API Key first.");
      return;
    }
    if (!createdVerificationId) {
      setErrorMessage("Create a verification first to obtain an ID.");
      return;
    }
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }
    setErrorMessage(null);

    try {
      const res = await PlaygroundService.uploadEvidence(
        apiKey,
        createdVerificationId,
        selectedFile,
        selectedFile.name,
        evidenceType
      );
      setLatestStatus(res.status);
      setLatestResponse(res.data);
      setLatestDuration(res.durationMs);
      setLatestRequestId(res.requestId);

      addHistory({
        method: "POST",
        endpoint: `/api/v1/verifications/${createdVerificationId}/evidence`,
        status: res.status,
        statusText: res.status === 201 ? "Created" : "Failed",
        durationMs: res.durationMs,
        response: res.data,
        isError: res.status >= 400,
      });

      if (res.status === 201) {
        const evData = res.data as any;
        setUploadedEvidence((prev) => [
          ...prev,
          {
            id: evData.id || `EVD-${Date.now()}`,
            type: evData.type || evidenceType,
            filename: evData.filename || selectedFile.name,
          },
        ]);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to upload evidence");
    }
  };

  // Step 3: Run Verification & Poll Status
  const handleRunVerification = async () => {
    if (!apiKey.trim() || !createdVerificationId) return;
    setRunning(true);
    setRunStatus("Invoking verification engine...");
    setErrorMessage(null);

    try {
      const res = await PlaygroundService.runVerification(apiKey, createdVerificationId);
      setLatestStatus(res.status);
      setLatestResponse(res.data);
      setLatestDuration(res.durationMs);
      setLatestRequestId(res.requestId);

      addHistory({
        method: "POST",
        endpoint: `/api/v1/verifications/${createdVerificationId}/run`,
        status: res.status,
        statusText: res.status === 200 ? "OK" : "Failed",
        durationMs: res.durationMs,
        response: res.data,
        isError: res.status >= 400,
      });

      if (res.status === 200) {
        setRunStatus("Proofline is reviewing submitted evidence...");

        // Poll status
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          const statusRes = await PlaygroundService.getVerificationStatus(apiKey, createdVerificationId);
          setLatestStatus(statusRes.status);
          setLatestResponse(statusRes.data);
          setLatestDuration(statusRes.durationMs);
          setLatestRequestId(statusRes.requestId);

          const data = statusRes.data as any;
          if (data?.status === "COMPLETED" || attempts > 12) {
            clearInterval(pollInterval);
            setRunning(false);
            setRunStatus("Verification complete ✓");
            addHistory({
              method: "GET",
              endpoint: `/api/v1/verifications/${createdVerificationId}`,
              status: statusRes.status,
              statusText: "Completed",
              durationMs: statusRes.durationMs,
              response: statusRes.data,
              isError: false,
            });
          }
        }, 2000);
      } else {
        setRunning(false);
        setRunStatus("");
      }
    } catch (err: any) {
      setRunning(false);
      setRunStatus("");
      setErrorMessage(err?.message || "Failed to run verification");
    }
  };

  // Download Proof Packet PDF
  const handleDownloadProofPacket = async () => {
    if (!apiKey.trim() || !createdVerificationId) return;
    try {
      const { blob } = await PlaygroundService.downloadProofPacket(apiKey, createdVerificationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proof-packet-${createdVerificationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMessage(err?.error?.message || "Verification must be completed before downloading dossier.");
    }
  };

  // End-to-End "Try Demo" Flow
  const handleRunFullDemo = async () => {
    let activeKey = apiKey.trim();
    if (!activeKey) {
      try {
        const res = await fetch("/api/v1/sandbox-key");
        if (res.ok) {
          const data = await res.json();
          if (data.apiKey) {
            activeKey = data.apiKey;
            setApiKey(activeKey);
          }
        }
      } catch {
        // Continue
      }
    }

    if (!activeKey) {
      setErrorMessage("Please enter or generate an API key first.");
      return;
    }

    try {
      setIsDemoRunning(true);
      setErrorMessage(null);

      // 1. Create verification
      const createRes = await PlaygroundService.createVerification(activeKey, {
        transactionId: "EW-104",
        partnerName: "ABC Recycling Pvt Ltd",
        material: "PET Plastic Flakes",
        claimedQuantity: 560,
        unit: "kg",
        organization: "Apex Polymer Solutions Ltd",
        notes: "Automated Demo Pipeline Run",
      });

      const verId = (createRes.data as any)?.id;
      if (!verId) {
        throw new Error("Failed to initialize demo verification case.");
      }
      setCreatedVerificationId(verId);
      setLatestResponse(createRes.data);
      setLatestStatus(createRes.status);

      // 2. Load demo files from /demo/ and upload
      const demoFiles = [
        { path: "/demo/invoice-ew104.jpg", name: "invoice-ew104.jpg", type: "INVOICE" },
        { path: "/demo/scale-ticket-01.jpg", name: "scale-ticket-01.jpg", type: "SCALE_IMAGE" },
        { path: "/demo/scale-ticket-02.jpg", name: "scale-ticket-02.jpg", type: "SCALE_IMAGE" },
        { path: "/demo/scale-ticket-03.jpg", name: "scale-ticket-03.jpg", type: "SCALE_IMAGE" },
        { path: "/demo/certificate-ew104.pdf", name: "certificate-ew104.pdf", type: "CERTIFICATE" },
      ];

      const uploaded: any[] = [];
      for (const item of demoFiles) {
        const fileRes = await fetch(item.path);
        const blob = await fileRes.blob();
        const upRes = await PlaygroundService.uploadEvidence(activeKey, verId, blob, item.name, item.type);
        if (upRes.status === 201) {
          uploaded.push({ id: (upRes.data as any).id, type: item.type, filename: item.name });
        }
      }
      setUploadedEvidence(uploaded);

      // 3. Run verification
      setRunning(true);
      setRunStatus("Executing verification pipeline on demo evidence...");
      await PlaygroundService.runVerification(activeKey, verId);

      // 4. Poll until completed
      let finished = false;
      let counter = 0;
      while (!finished && counter < 15) {
        await new Promise((r) => setTimeout(r, 2000));
        counter++;
        const poll = await PlaygroundService.getVerificationStatus(activeKey, verId);
        const data = poll.data as any;
        if (data?.status === "COMPLETED") {
          finished = true;
          setLatestStatus(poll.status);
          setLatestResponse(data);
          setRunning(false);
          setRunStatus("Verification complete ✓");
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Demo execution failed.");
    } finally {
      setIsDemoRunning(false);
      setRunning(false);
    }
  };

  // Generate dynamic cURL command
  const getDynamicCurl = (): string => {
    const origin = window.location.origin;
    const backendUrl = import.meta.env.VITE_API_URL || origin;

    switch (activeTab) {
      case "POST_VERIFICATION":
      case "FLOW":
        return `curl -X POST "${backendUrl}/api/v1/verifications" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idemp_${Date.now()}" \\
  -d '${JSON.stringify(formValues, null, 2)}'`;

      case "POST_EVIDENCE":
        return `curl -X POST "${backendUrl}/api/v1/verifications/${createdVerificationId || ":verificationId"}/evidence" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -F "evidenceType=${evidenceType}" \\
  -F "file=@${selectedFile?.name || "invoice-ew104.pdf"}"`;

      case "POST_RUN":
        return `curl -X POST "${backendUrl}/api/v1/verifications/${createdVerificationId || ":verificationId"}/run" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -H "Idempotency-Key: run_${Date.now()}"`;

      case "GET_STATUS":
        return `curl -X GET "${backendUrl}/api/v1/verifications/${createdVerificationId || ":verificationId"}" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY"`;

      case "GET_PACKET":
        return `curl -X GET "${backendUrl}/api/v1/verifications/${createdVerificationId || ":verificationId"}/proof-packet" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -o "proof-packet-${createdVerificationId || "EW-104"}.pdf"`;
    }
  };

  // Check if result has metrics to render executive summary card
  const resObj = latestResponse as any;
  const isCompletedResult = resObj?.status === "COMPLETED" && resObj?.result;

  return (
    <GlowBackground className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-2 pb-24 flex-1 space-y-6">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
                API{" "}
                <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
                  Playground
                </span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FF6D29]/10 text-[#FFA776] border border-[#FF6D29]/25">
                v1
              </span>
            </div>
            <p className="font-display text-xs sm:text-sm text-[#BABABA]">
              Test Proofline's real Verification API with end-to-end multi-document flows.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunFullDemo}
              disabled={isDemoRunning}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FF6D29] hover:bg-[#ff7b3d] text-white text-xs font-display font-medium transition cursor-pointer disabled:opacity-40"
              title="Runs EW-104 verification with real demo images and polls the result"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemoRunning ? "Running Demo Pipeline..." : "Try 1-Click Demo"}</span>
            </button>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-display text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#BABABA]" />
              <span>Docs</span>
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-display flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* API Key Bar */}
        <div className="p-4 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs font-display">
            <span className="text-white font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#FF6D29]" />
              API Key Authentication
            </span>
            <span className="text-[11px] text-[#BABABA]/60 font-mono">
              Requests pass: <code className="text-[#FFA776]">Authorization: Bearer &lt;key&gt;</code>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Paste your API key (pl_live_...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-[#BABABA]/30 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-[#BABABA]/60 hover:text-white transition"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleUseSavedKey}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-display text-white transition cursor-pointer"
              >
                {savedKeysCount > 0 ? `Manage Keys (${savedKeysCount})` : "Create Key"}
              </button>
              {!apiKey && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/v1/sandbox-key");
                      if (res.ok) {
                        const data = await res.json();
                        if (data.apiKey) {
                          setApiKey(data.apiKey);
                          return;
                        }
                      }
                    } catch {
                      // Fallback handled below
                    }
                    const randHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
                    setApiKey(`pl_live_${randHex}`);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-display text-zinc-300 transition cursor-pointer whitespace-nowrap"
                  title="Generate a registered sandbox key directly into the input"
                >
                  Quick Key
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Endpoint Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("FLOW")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition cursor-pointer ${
              activeTab === "FLOW"
                ? "bg-white/10 text-white border border-white/15 font-medium"
                : "text-[#BABABA] hover:text-white bg-white/[0.02] hover:bg-white/[0.05]"
            }`}
          >
            <Layers className="w-3 h-3 text-[#FF6D29]" />
            <span>Guided Flow</span>
          </button>

          <span className="text-white/20">|</span>

          <button
            type="button"
            onClick={() => setActiveTab("POST_VERIFICATION")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "POST_VERIFICATION"
                ? "bg-white/[0.1] text-white border border-white/15"
                : "text-[#BABABA] hover:text-white"
            }`}
          >
            <span className="text-emerald-400 font-bold mr-1">POST</span>/verifications
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POST_EVIDENCE")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "POST_EVIDENCE"
                ? "bg-white/[0.1] text-white border border-white/15"
                : "text-[#BABABA] hover:text-white"
            }`}
          >
            <span className="text-emerald-400 font-bold mr-1">POST</span>/verifications/:id/evidence
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POST_RUN")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "POST_RUN"
                ? "bg-white/[0.1] text-white border border-white/15"
                : "text-[#BABABA] hover:text-white"
            }`}
          >
            <span className="text-emerald-400 font-bold mr-1">POST</span>/verifications/:id/run
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("GET_STATUS")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "GET_STATUS"
                ? "bg-white/[0.1] text-white border border-white/15"
                : "text-[#BABABA] hover:text-white"
            }`}
          >
            <span className="text-blue-400 font-bold mr-1">GET</span>/verifications/:id
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("GET_PACKET")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "GET_PACKET"
                ? "bg-white/[0.1] text-white border border-white/15"
                : "text-[#BABABA] hover:text-white"
            }`}
          >
            <span className="text-blue-400 font-bold mr-1">GET</span>/verifications/:id/proof-packet
          </button>
        </div>

        {/* MAIN PLAYGROUND: TWO-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: REQUEST BUILDER (7 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Step 1: Create Verification */}
            <div className="p-5 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                    1
                  </div>
                  <h3 className="text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Create Verification
                  </h3>
                </div>
                {createdVerificationId && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ID: {createdVerificationId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-display">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#BABABA]">Transaction ID</label>
                  <input
                    type="text"
                    value={formValues.transactionId}
                    onChange={(e) => setFormValues({ ...formValues, transactionId: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#BABABA]">Partner Name</label>
                  <input
                    type="text"
                    value={formValues.partnerName}
                    onChange={(e) => setFormValues({ ...formValues, partnerName: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#BABABA]">Material</label>
                  <input
                    type="text"
                    value={formValues.material}
                    onChange={(e) => setFormValues({ ...formValues, material: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#BABABA]">Quantity</label>
                    <input
                      type="number"
                      value={formValues.claimedQuantity}
                      onChange={(e) => setFormValues({ ...formValues, claimedQuantity: Number(e.target.value) })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#BABABA]">Unit</label>
                    <input
                      type="text"
                      value={formValues.unit}
                      onChange={(e) => setFormValues({ ...formValues, unit: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormValues({
                      transactionId: "EW-104",
                      partnerName: "ABC Recycling Pvt Ltd",
                      material: "PET Plastic Flakes",
                      claimedQuantity: 560,
                      unit: "kg",
                      organization: "Apex Polymer Solutions Ltd",
                      notes: "PO reference #4492",
                    })
                  }
                  className="text-[11px] font-display text-[#BABABA] hover:text-white transition cursor-pointer"
                >
                  Load Demo Values
                </button>

                <button
                  type="button"
                  onClick={handleCreateVerification}
                  disabled={!apiKey.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6D29] hover:bg-[#ff7b3d] text-white text-xs font-display font-medium transition cursor-pointer disabled:opacity-40"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Send Request</span>
                </button>
              </div>
            </div>

            {/* Step 2: Upload Evidence */}
            <div className={`p-5 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] space-y-4 transition-opacity ${!createdVerificationId ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                    2
                  </div>
                  <h3 className="text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Add Evidence
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">
                  {uploadedEvidence.length} attached
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs font-display">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#BABABA]">Evidence Type</label>
                    <select
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value)}
                      className="w-full bg-[#161418] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/30"
                    >
                      <option value="INVOICE">Commercial Invoice</option>
                      <option value="SCALE_IMAGE">Scale Image</option>
                      <option value="RECEIPT">Receipt</option>
                      <option value="CERTIFICATE">Certificate</option>
                      <option value="MATERIAL_IMAGE">Material Image</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#BABABA]">File</label>
                    <label className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.04] text-xs text-white cursor-pointer transition truncate">
                      <Upload className="w-3.5 h-3.5 text-[#BABABA]" />
                      <span className="truncate">{selectedFile ? selectedFile.name : "Select JPEG / PDF"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleUploadEvidence}
                    disabled={!selectedFile}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-display text-white transition cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {/* Uploaded List */}
                {uploadedEvidence.length > 0 && (
                  <div className="divide-y divide-white/5 border border-white/[0.08] rounded-xl overflow-hidden bg-black/40">
                    {uploadedEvidence.map((ev) => (
                      <div key={ev.id} className="p-2.5 flex items-center justify-between text-xs font-display">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-white font-medium">{ev.filename}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#BABABA]">{ev.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Run Verification */}
            <div className={`p-5 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] space-y-4 transition-opacity ${uploadedEvidence.length === 0 ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                    3
                  </div>
                  <h3 className="text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Run Verification
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">POST /run</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs font-display text-[#BABABA]">
                  {runStatus || "Trigger deterministic multi-document verification."}
                </div>

                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={running}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6D29] hover:bg-[#ff7b3d] text-white text-xs font-display font-medium transition cursor-pointer disabled:opacity-40"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
                  <span>{running ? "Reviewing..." : "Run Verification"}</span>
                </button>
              </div>
            </div>

            {/* Proof Packet Action */}
            {isCompletedResult && (
              <div className="p-5 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#FF6D29]" />
                    <h3 className="text-xs font-display font-semibold text-white uppercase tracking-wider">
                      Proof Packet Ready
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    AUDIT DOSSIER
                  </span>
                </div>
                <p className="text-xs text-[#BABABA]">
                  Your verification can now be downloaded as a cryptographic, vector-rendered A4 PDF proof packet.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadProofPacket}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-display font-medium text-white transition cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-[#FF6D29]" />
                  <span>Download Proof Packet PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: RESPONSE & CURL INSPECTOR (5 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Toggle response vs cURL */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setViewFormat("response")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition cursor-pointer ${
                    viewFormat === "response"
                      ? "bg-white/[0.1] text-white font-medium"
                      : "text-[#BABABA] hover:text-white"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Response</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewFormat("curl")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition cursor-pointer ${
                    viewFormat === "curl"
                      ? "bg-white/[0.1] text-white font-medium"
                      : "text-[#BABABA] hover:text-white"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Equivalent cURL</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#BABABA]/60">
                Live Output
              </span>
            </div>

            {/* Human Readable Summary Card if completed */}
            {isCompletedResult && viewFormat === "response" && (
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#110F11]/80 grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-[10px] font-mono text-[#BABABA] uppercase">Verdict</div>
                  <div className="text-xs font-display font-bold text-emerald-400">
                    {resObj.result.decision}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#BABABA] uppercase">Risk</div>
                  <div className="text-xs font-display font-semibold text-white">
                    {resObj.result.risk}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#BABABA] uppercase">Claimed</div>
                  <div className="text-xs font-mono font-medium text-[#BABABA]">
                    {resObj.result.claimedQuantity} kg
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#BABABA] uppercase">Variance</div>
                  <div className="text-xs font-mono font-semibold text-[#FFA776]">
                    {resObj.result.variancePercent}%
                  </div>
                </div>
              </div>
            )}

            {/* Code / Viewer area */}
            {viewFormat === "response" ? (
              latestResponse ? (
                <JsonViewer
                  data={latestResponse}
                  status={latestStatus}
                  durationMs={latestDuration}
                  requestId={latestRequestId}
                />
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-[#110F11]/40 text-xs font-display text-[#BABABA] space-y-2">
                  <Terminal className="w-8 h-8 text-[#BABABA]/30 mx-auto" />
                  <p>Send a request or run the 1-Click Demo to inspect real API responses.</p>
                </div>
              )
            ) : (
              <CurlViewer command={getDynamicCurl()} />
            )}

            {/* Recent Requests Section */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-display text-[#BABABA]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Requests
                  </span>
                  <button
                    onClick={() => setHistory([])}
                    className="text-[10px] text-[#BABABA]/40 hover:text-white transition"
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setLatestResponse(item.response);
                        setLatestStatus(item.status);
                        setLatestDuration(item.durationMs);
                        setViewFormat("response");
                      }}
                      className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition flex items-center justify-between text-left text-xs font-mono cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                            item.method === "POST" ? "text-emerald-400 bg-emerald-500/10" : "text-blue-400 bg-blue-500/10"
                          }`}
                        >
                          {item.method}
                        </span>
                        <span className="text-zinc-300 truncate text-[11px]">{item.endpoint}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#BABABA]">
                        <span>{item.durationMs}ms</span>
                        <span className={item.isError ? "text-red-400" : "text-emerald-400"}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onKeyCreated={(newKey) => {
          setApiKey(newKey);
        }}
        onClose={() => {
          setShowKeyModal(false);
          ApiKeyService.listKeys()
            .then((keys) => setSavedKeysCount(keys.filter((k) => !k.isRevoked).length))
            .catch(() => {});
        }}
      />
    </GlowBackground>
  );
};
