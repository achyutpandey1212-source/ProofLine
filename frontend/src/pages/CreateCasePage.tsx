import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { CaseService } from "../services/case.service";
import { OFFICIAL_DEMO_SCENARIO } from "../demo/demoScenario";
import { ArrowLeft, Save, AlertCircle, Sparkles } from "lucide-react";

export const CreateCasePage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    transactionId: "",
    partnerName: "",
    material: "",
    claimedQuantity: "",
    unit: "kg",
    organization: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFillDemoScenario = () => {
    setFormData({
      transactionId: OFFICIAL_DEMO_SCENARIO.caseData.transactionId,
      partnerName: OFFICIAL_DEMO_SCENARIO.caseData.partnerName,
      material: OFFICIAL_DEMO_SCENARIO.caseData.material,
      claimedQuantity: String(OFFICIAL_DEMO_SCENARIO.caseData.claimedQuantity),
      unit: OFFICIAL_DEMO_SCENARIO.caseData.unit,
      organization: OFFICIAL_DEMO_SCENARIO.caseData.organization,
      notes: OFFICIAL_DEMO_SCENARIO.caseData.notes,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transactionId.trim()) {
      setError("Transaction ID is required.");
      return;
    }
    if (!formData.partnerName.trim()) {
      setError("Partner Name is required.");
      return;
    }
    if (!formData.material.trim()) {
      setError("Material is required.");
      return;
    }

    const qty = parseFloat(formData.claimedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive claimed quantity.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const created = await CaseService.createCase({
        transactionId: formData.transactionId.trim(),
        partnerName: formData.partnerName.trim(),
        material: formData.material.trim(),
        claimedQuantity: qty,
        unit: formData.unit.trim(),
        organization: formData.organization.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      navigate(`/cases/${created.caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create verification case.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-1">
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-black">
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-700 hover:text-black transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK_TO_CASES</span>
          </Link>

          <button
            type="button"
            onClick={handleFillDemoScenario}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border border-black bg-gray-50 hover:bg-black hover:text-white transition cursor-pointer"
            title="Populates official scenario fields (Transaction EW-104, 560 kg claimed PET flakes)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LOAD DEMO CASE (EW-104)</span>
          </button>
        </div>

        <div className="border border-black p-6 bg-white">
          <div className="mb-6">
            <div className="font-mono text-xs text-gray-500 mb-1">INTAKE_FORM</div>
            <h1 className="text-xl font-bold text-black tracking-tight">Create Verification Case</h1>
            <p className="text-xs text-gray-600 mt-1">
              Initialize a commercial transaction envelope with declared values before attaching evidence documents.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 border border-black bg-gray-50 flex items-center gap-2 text-xs font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>[ERROR]: {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-gray-700 mb-1 uppercase">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  placeholder="e.g. EW-104"
                  className="w-full px-3 py-2 border border-black bg-white text-black font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-gray-700 mb-1 uppercase">
                  Partner / Counterparty *
                </label>
                <input
                  type="text"
                  name="partnerName"
                  value={formData.partnerName}
                  onChange={handleChange}
                  placeholder="e.g. ABC Recycling Pvt Ltd"
                  className="w-full px-3 py-2 border border-black bg-white text-black text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block font-mono text-gray-700 mb-1 uppercase">
                  Material *
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g. PET Plastic Flakes"
                  className="w-full px-3 py-2 border border-black bg-white text-black text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-gray-700 mb-1 uppercase">
                  Claimed Quantity *
                </label>
                <input
                  type="number"
                  step="any"
                  name="claimedQuantity"
                  value={formData.claimedQuantity}
                  onChange={handleChange}
                  placeholder="e.g. 560"
                  className="w-full px-3 py-2 border border-black bg-white text-black font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-gray-700 mb-1 uppercase">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black bg-white text-black font-mono text-xs"
                >
                  <option value="kg">kg</option>
                  <option value="MT">MT (Metric Ton)</option>
                  <option value="lbs">lbs</option>
                  <option value="units">units</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-mono text-gray-700 mb-1 uppercase">
                Issuing Organization (Optional)
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. Apex Polymer Solutions"
                className="w-full px-3 py-2 border border-gray-400 bg-white text-black text-xs"
              />
            </div>

            <div>
              <label className="block font-mono text-gray-700 mb-1 uppercase">
                Notes & Context (Optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Reference delivery note number, vehicle license, or intake comments"
                className="w-full px-3 py-2 border border-gray-400 bg-white text-black text-xs"
              />
            </div>

            <div className="pt-4 border-t border-gray-300 flex items-center justify-end gap-3">
              <Link
                to="/cases"
                className="px-4 py-2 border border-gray-400 text-black hover:bg-gray-100 transition text-xs font-mono"
              >
                CANCEL
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 border border-black bg-black text-white hover:bg-white hover:text-black transition text-xs font-mono cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? "RECORDING..." : "SAVE & PROCEED"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
