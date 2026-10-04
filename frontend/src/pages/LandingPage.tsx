import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowRight, CheckCircle, FileText, Scale, AlertTriangle } from "lucide-react";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>PROOF_LINE</span>
          </div>
          <div>
            {user ? (
              <Link
                to="/cases"
                className="px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black transition text-sm font-medium"
              >
                Go to Workspace
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black transition text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-12 flex-1 flex flex-col gap-12">
        {/* Hero Section */}
        <div className="border border-black p-8 sm:p-12 bg-white">
          <div className="max-w-3xl flex flex-col gap-4">
            <div className="inline-block self-start border border-black px-2 py-0.5 text-xs font-mono uppercase">
              System Specification: Verification Engine v1.0
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Deterministic Multi-Document Verification
            </h1>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
              Automated reconciliation and discrepancy detection for commercial transaction records.
              Validates physical scale weight receipts against commercial invoices using deterministic
              mathematical tolerance models.
            </p>
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/cases" : "/login"}
                className="inline-flex items-center gap-2 px-6 py-3 border border-black bg-black text-white hover:bg-white hover:text-black transition text-sm font-semibold tracking-wide"
              >
                <span>{user ? "Open Workspace" : "Access Console"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cases"
                className="inline-flex items-center gap-2 px-6 py-3 border border-black bg-white text-black hover:bg-gray-100 transition text-sm font-semibold"
              >
                <span>View Cases</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Step Workflow Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-black p-6 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-gray-500 mb-2">PHASE_01</div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-black" />
                <h2 className="text-base font-bold">Evidence Intake</h2>
              </div>
              <p className="text-sm text-gray-700">
                Upload commercial invoices and weighbridge slips. Documents are cataloged with strict provenance tracking.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 font-mono text-xs text-gray-600">
              Format: JPG, PNG, PDF
            </div>
          </div>

          <div className="border border-black p-6 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-gray-500 mb-2">PHASE_02</div>
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-black" />
                <h2 className="text-base font-bold">Tolerance Engine</h2>
              </div>
              <p className="text-sm text-gray-700">
                Deterministic comparison of Gross, Tare, Net weights, dates, and partner entities against claimed payload.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 font-mono text-xs text-gray-600">
              Rule: Deterministic Math
            </div>
          </div>

          <div className="border border-black p-6 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-gray-500 mb-2">PHASE_03</div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-black" />
                <h2 className="text-base font-bold">Discrepancy Audit</h2>
              </div>
              <p className="text-sm text-gray-700">
                Structured findings highlight variance, tolerance bounds, and risk classifications for compliance signoff.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 font-mono text-xs text-gray-600">
              Status: Verified / Review
            </div>
          </div>
        </div>

        {/* System Capabilities Section */}
        <div className="border border-black p-6">
          <div className="font-mono text-xs text-gray-500 mb-3">CAPABILITIES_MATRIX</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-300 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm">Identity Isolation</h3>
              </div>
              <p className="text-xs text-gray-600">Single-tenant data access control via bearer tokens.</p>
            </div>
            <div className="border border-gray-300 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm">Auditable Lineage</h3>
              </div>
              <p className="text-xs text-gray-600">Direct linkage from finding to raw image evidence.</p>
            </div>
            <div className="border border-gray-300 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm">Resumable Pipeline</h3>
              </div>
              <p className="text-xs text-gray-600">Checkpoint-based workflow orchestration.</p>
            </div>
            <div className="border border-gray-300 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm">Exportable Reports</h3>
              </div>
              <p className="text-xs text-gray-600">Deterministic verification summaries and metrics.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
          <div className="font-mono">PROOF_LINE // COMMERCIAL VERIFICATION SYSTEM</div>
          <div className="font-mono">STATUS: OPERATIONAL</div>
        </div>
      </footer>
    </div>
  );
};
