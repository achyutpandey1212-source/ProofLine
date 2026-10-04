import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import {
  Key,
  Terminal,
  Shield,
  Layers,
  Copy,
  Check,
  Play,
  ChevronRight,
} from "lucide-react";

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    const sectionIds = [
      "overview",
      "auth",
      "conventions",
      "create",
      "evidence",
      "run",
      "status",
      "packet",
      "workflow",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://api.proofline.io";

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <GlowBackground className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-2 pb-24 flex-1">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-display text-[#BABABA] mb-1.5">
              <span>Developer Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[#FFA776]">API Reference v1</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Documentation &{" "}
              <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
                API Reference
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/playground"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_2px_14px_rgba(255,109,41,0.3)] hover:shadow-[0_2px_20px_rgba(255,109,41,0.45)] transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open Playground</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 space-y-1 sticky top-28 self-start text-xs font-display z-10 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]/60 px-3 pb-2">
              Getting Started
            </div>
            <button
              onClick={() => scrollToSection("overview")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                activeSection === "overview"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Architecture & Overview</span>
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollToSection("auth")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                activeSection === "auth"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Authentication & Security</span>
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollToSection("conventions")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                activeSection === "conventions"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Headers & Idempotency</span>
              <Shield className="w-3.5 h-3.5" />
            </button>

            <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]/60 px-3 pt-6 pb-2">
              Endpoints (v1)
            </div>
            <button
              onClick={() => scrollToSection("create")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                activeSection === "create"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span><b className="text-emerald-400 font-bold mr-1">POST</b>/verifications</span>
            </button>
            <button
              onClick={() => scrollToSection("evidence")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                activeSection === "evidence"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span><b className="text-emerald-400 font-bold mr-1">POST</b>/.../evidence</span>
            </button>
            <button
              onClick={() => scrollToSection("run")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                activeSection === "run"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span><b className="text-emerald-400 font-bold mr-1">POST</b>/.../run</span>
            </button>
            <button
              onClick={() => scrollToSection("status")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                activeSection === "status"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span><b className="text-blue-400 font-bold mr-1">GET</b>/verifications/:id</span>
            </button>
            <button
              onClick={() => scrollToSection("packet")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                activeSection === "packet"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span><b className="text-blue-400 font-bold mr-1">GET</b>/.../proof-packet</span>
            </button>
            <button
              onClick={() => scrollToSection("review")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                activeSection === "review"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span><b className="text-emerald-400 font-bold mr-1">POST</b>/.../review</span>
            </button>

            <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]/60 px-3 pt-6 pb-2">
              Workflow Guide
            </div>
            <button
              onClick={() => scrollToSection("workflow")}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                activeSection === "workflow"
                  ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium border border-[#FF6D29]/30"
                  : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Complete cURL Walkthrough</span>
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </aside>

          {/* Documentation Content Area */}
          <div className="lg:col-span-9 space-y-10">
            {/* 1. Overview */}
            <section id="overview" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/25 text-[#FF6D29]">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white">
                  Verification Engine Architecture
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] leading-relaxed font-display">
                The Proofline Verification API exposes Proofline's deterministic multi-document verification pipeline as an auditable, production-grade REST interface. External systems—including ERPs, procurement workflows, compliance engines, and automated pipelines—can submit commercial claims, attach evidentiary documents (invoices, scale tickets, weight logs), execute verification, retrieve structured decisions, and download auditable Proof Packet PDF dossiers.
              </p>

              {/* Architecture Diagram */}
              <div className="p-5 rounded-xl border border-white/10 bg-[#080709] overflow-x-auto text-xs font-mono text-zinc-300">
                <pre>{`External ERP / Pipeline
           │
           ▼  POST /api/v1/verifications (Idempotent)
   Created Case Identifier
           │
           ▼  POST /api/v1/verifications/:id/evidence (JPEG, PNG, PDF)
   Evidence Ingestion & Vaulting
           │
           ▼  POST /api/v1/verifications/:id/run (Idempotent)
 ┌──────────────────────────────────────────────┐
 │  Existing Gemini Vision Fact Extraction      │
 │  Existing Deterministic Verification Engine  │
 │  Evidence ➔ Facts ➔ Rules ➔ Proof Graph      │
 └──────────────────────────────────────────────┘
           │
           ├─► GET /api/v1/verifications/:id (Decision: VERIFIED / REVIEW_REQUIRED)
           │
           └─► GET /api/v1/verifications/:id/proof-packet (Official Signed PDF Dossier)`}</pre>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[#BABABA] font-display">
                <b className="text-white">Black-Box Guarantee:</b> The API abstracts all internal Gemini vision parsing, deterministic rule execution, and MongoDB state transitions behind a standard, reproducible verification contract.
              </div>
            </section>

            {/* 2. Authentication */}
            <section id="auth" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/25 text-[#FF6D29]">
                  <Key className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white">
                  API Key Authentication
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] leading-relaxed font-display">
                Authenticate all requests by including your secret API key in the standard HTTP <code className="text-[#FFA776]">Authorization</code> header using the <code className="text-[#FFA776]">Bearer</code> scheme.
              </p>

              <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300">
                <span>Authorization: Bearer pl_live_d8a1f49b20e74c10a34b22c9</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("Authorization: Bearer pl_live_YOUR_API_KEY", "auth-header")}
                  className="absolute right-3 top-3 px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-[#BABABA] flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedSnippet === "auth-header" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-display">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5">
                  <span className="text-white font-medium">Key Storage & Hashing</span>
                  <p className="text-[#BABABA]">
                    Proofline never stores raw keys in plaintext. All keys are hashed with SHA-256 upon generation. If you lose a key, revoke it and generate a new one.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5">
                  <span className="text-white font-medium">Tenant Isolation</span>
                  <p className="text-[#BABABA]">
                    Every API key belongs strictly to its issuing user account. Requests querying cases belonging to other accounts receive an impenetrable 404 Not Found.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Conventions & Headers */}
            <section id="conventions" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/25 text-[#FF6D29]">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white">
                  Standard Headers & Error Contract
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-display border border-white/10 rounded-xl overflow-hidden">
                  <thead className="bg-white/[0.04] text-[#BABABA] font-mono text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-4">Header</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-[#FFA776]">Authorization</td>
                      <td className="py-2.5 px-4 text-[#BABABA]">Required</td>
                      <td className="py-2.5 px-4">Bearer &lt;pl_live_...&gt; authentication token.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-[#FFA776]">Idempotency-Key</td>
                      <td className="py-2.5 px-4 text-[#BABABA]">Recommended</td>
                      <td className="py-2.5 px-4">Unique key preventing duplicate creation during retries.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-[#FFA776]">X-Request-ID</td>
                      <td className="py-2.5 px-4 text-[#BABABA]">Response</td>
                      <td className="py-2.5 px-4">Unique server-generated trace ID (`req_...`).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-[#FFA776]">X-RateLimit-Remaining</td>
                      <td className="py-2.5 px-4 text-[#BABABA]">Response</td>
                      <td className="py-2.5 px-4">Remaining requests before 60 req/min limit triggers 429.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-display font-medium text-white">Standard Error Structure</span>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid verification request",
    "details": [
      {
        "field": "claimedQuantity",
        "message": "claimedQuantity must be a positive number"
      }
    ],
    "requestId": "req_03a9f91e48c1"
  }
}`}</pre>
                </div>
              </div>
            </section>

            {/* 4. POST /verifications */}
            <section id="create" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    POST
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white">/api/v1/verifications</span>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">Create Verification</span>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Initializes a new verification case for an inbound shipment, grain settlement, or commercial transaction.
              </p>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Example Request Body</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "transactionId": "EW-104",
  "partnerName": "ABC Recycling Pvt Ltd",
  "material": "PET Plastic Flakes",
  "claimedQuantity": 560,
  "unit": "kg",
  "organization": "Apex Polymer Solutions Ltd",
  "notes": "PO reference #4492"
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Response (201 Created)</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "id": "PL-EW104-58F9D2",
  "transactionId": "EW-104",
  "partnerName": "ABC Recycling Pvt Ltd",
  "material": "PET Plastic Flakes",
  "claimedQuantity": 560,
  "unit": "kg",
  "status": "CREATED",
  "createdAt": "2026-10-04T16:58:51.889Z"
}`}</pre>
                </div>
              </div>
            </section>

            {/* 5. POST /evidence */}
            <section id="evidence" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    POST
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white">/api/v1/verifications/:verificationId/evidence</span>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">Attach Evidence</span>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Uploads an evidentiary document via <code className="text-[#FFA776]">multipart/form-data</code>. Supported formats: JPEG, PNG, WEBP, and PDF up to 10MB.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-display border border-white/10 rounded-xl overflow-hidden">
                  <thead className="bg-white/[0.04] text-[#BABABA] font-mono text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Valid Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-[#FFA776]">file</td>
                      <td className="py-2.5 px-4 text-[#BABABA]">Binary</td>
                      <td className="py-2.5 px-4">File stream (invoice.pdf, scale-ticket.jpg)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-[#FFA776]">evidenceType</td>
                      <td className="py-2.5 px-4 text-[#BABABA]">String</td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">INVOICE, SCALE_IMAGE, RECEIPT, CERTIFICATE, MATERIAL_IMAGE, DOCUMENT</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Response (201 Created)</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "id": "EVD-0E59A9",
  "type": "INVOICE",
  "filename": "invoice-ew104.pdf",
  "status": "UPLOADED"
}`}</pre>
                </div>
              </div>
            </section>

            {/* 6. POST /run */}
            <section id="run" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    POST
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white">/api/v1/verifications/:verificationId/run</span>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">Execute Verification</span>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Triggers the verification engine against all uploaded evidence. The system performs Gemini OCR & fact extraction, reconciles declared vs. measured weights, checks tolerance thresholds, and constructs the tamper-evident proof graph.
              </p>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Response (200 OK)</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "verificationId": "PL-EW104-58F9D2",
  "status": "PROCESSING"
}`}</pre>
                </div>
              </div>
            </section>

            {/* 7. GET /verifications/:id */}
            <section id="status" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    GET
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white">/api/v1/verifications/:verificationId</span>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">Retrieve Decision</span>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Polls the verification status and retrieves the final deterministic decision (<code className="text-emerald-400">VERIFIED</code> or <code className="text-[#FFA776]">REVIEW_REQUIRED</code>), risk score, numerical variance, and itemized audit findings.
              </p>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Response: Completed & Verified (200 OK)</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "id": "PL-EW104-58F9D2",
  "status": "COMPLETED",
  "result": {
    "decision": "VERIFIED",
    "risk": "LOW",
    "claimedQuantity": 560,
    "measuredQuantity": 555.6,
    "difference": 4.4,
    "variancePercent": 0.79
  },
  "findings": [],
  "createdAt": "2026-10-04T16:58:51.889Z",
  "completedAt": "2026-10-04T16:58:53.900Z"
}`}</pre>
                </div>
              </div>
            </section>

            {/* 8. GET /proof-packet */}
            <section id="packet" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    GET
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white">/api/v1/verifications/:verificationId/proof-packet</span>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">Export Audit PDF</span>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Streams the official cryptographic vector PDF dossier containing executive summary, evidence register, rule results, and linear chain-of-custody provenance paths.
              </p>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs font-mono text-[#BABABA] space-y-1">
                <div>Content-Type: application/pdf</div>
                <div>Content-Disposition: attachment; filename="proof-packet-PL-EW104.pdf"</div>
              </div>
            </section>

            {/* 8b. POST /verifications/:id/review */}
            <section id="review" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    POST
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white">/api/v1/verifications/:verificationId/review</span>
                </div>
                <span className="text-[11px] font-mono text-[#BABABA]">Human Resolution</span>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Records a human review decision on a verification case. Review decisions do <strong>not</strong> mutate automated verification results, calculated risks, or physical extractions; they register conscious business disposition in an immutable audit trail.
              </p>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Request Payload</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "decision": "APPROVED", // "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED"
  "note": "Tolerance exception signed off by compliance officer."
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#BABABA]">Response (200 OK)</div>
                <div className="rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  <pre>{`{
  "success": true,
  "caseId": "PL-EW104-58F9D2",
  "resolutionState": "APPROVED",
  "review": {
    "decision": "APPROVED",
    "note": "Tolerance exception signed off by compliance officer.",
    "decidedAt": "2026-10-04T18:30:00.000Z",
    "previousResolution": "PENDING_REVIEW"
  }
}`}</pre>
                </div>
              </div>
            </section>

            {/* 9. cURL Walkthrough */}
            <section id="workflow" className="p-6 sm:p-8 rounded-2xl bg-[#0F0D10] border border-white/10 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/25 text-[#FF6D29]">
                  <Terminal className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white">
                  Complete End-to-End cURL Integration
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-[#BABABA] font-display">
                Follow this sequence to integrate Proofline with any automated workflow or bash script:
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-display font-medium text-white">1. Create Verification</div>
                  <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <pre>{`curl -X POST "${origin}/api/v1/verifications" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: tx_001_submit" \\
  -d '{
    "transactionId": "EW-104",
    "partnerName": "ABC Recycling Pvt Ltd",
    "material": "PET Plastic Flakes",
    "claimedQuantity": 560,
    "unit": "kg"
  }'`}</pre>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-display font-medium text-white">2. Upload Commercial Invoice</div>
                  <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <pre>{`curl -X POST "${origin}/api/v1/verifications/PL-EW104-58F9D2/evidence" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -F "evidenceType=INVOICE" \\
  -F "file=@invoice-ew104.pdf"`}</pre>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-display font-medium text-white">3. Upload Certified Scale Ticket</div>
                  <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <pre>{`curl -X POST "${origin}/api/v1/verifications/PL-EW104-58F9D2/evidence" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -F "evidenceType=SCALE_IMAGE" \\
  -F "file=@scale-ticket-01.jpg"`}</pre>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-display font-medium text-white">4. Run Verification Pipeline</div>
                  <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <pre>{`curl -X POST "${origin}/api/v1/verifications/PL-EW104-58F9D2/run" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -H "Idempotency-Key: tx_001_run"`}</pre>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-display font-medium text-white">5. Poll Status & Retrieve Result</div>
                  <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <pre>{`curl -X GET "${origin}/api/v1/verifications/PL-EW104-58F9D2" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY"`}</pre>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-display font-medium text-white">6. Download Proof Packet PDF</div>
                  <div className="relative rounded-xl border border-white/10 bg-[#080709] p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <pre>{`curl -X GET "${origin}/api/v1/verifications/PL-EW104-58F9D2/proof-packet" \\
  -H "Authorization: Bearer $PROOFLINE_API_KEY" \\
  -o "proof-packet-EW104.pdf"`}</pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </GlowBackground>
  );
};
