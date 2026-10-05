import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import { CaseService } from "../services/case.service";
import { CustomSelect } from "../components/ui/CustomSelect";
import { NumberInput } from "../components/ui/NumberInput";
import { ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";

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
    <GlowBackground className="flex flex-col min-h-screen">
      {/* Reusable floating cylindrical glassmorphism Navbar */}
      <Navbar />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20 flex-1">
        {/* Navigation back and demo pre-fill */}
        <div className="mb-8 flex items-center justify-between pb-4 border-b border-white/10">
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 text-xs font-display text-[#BABABA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cases</span>
          </Link>

          
        </div>

        {/* Form Container */}
        <div className="rounded-3xl bg-[#141215]/85 border border-white/10 p-7 sm:p-9 shadow-[0_24px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Create{" "}
              <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
                Verification Case
              </span>
            </h1>
            <p className="font-display text-xs sm:text-sm text-[#BABABA] mt-1.5">
              Declare transaction baseline before attaching scale and invoice evidence
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-300 font-display">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-display">
            {/* Row 1: Transaction ID & Partner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  placeholder="e.g. EW-104"
                  className="w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                  Partner / Counterparty *
                </label>
                <input
                  type="text"
                  name="partnerName"
                  value={formData.partnerName}
                  onChange={handleChange}
                  placeholder="e.g. ABC Recycling Pvt Ltd"
                  className="w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
                  required
                />
              </div>
            </div>

            {/* Row 2: Material, Claimed Quantity, Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className="sm:col-span-1">
                <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                  Material *
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g. PET Plastic Flakes"
                  className="w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                  Claimed Quantity *
                </label>
                <NumberInput
                  name="claimedQuantity"
                  value={formData.claimedQuantity}
                  onChange={handleChange}
                  placeholder="e.g. 560"
                  step={10}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                  Unit *
                </label>
                <CustomSelect
                  options={[
                    { value: "kg", label: "kg (Kilogram)" },
                    { value: "MT", label: "MT (Metric Ton)" },
                    { value: "lbs", label: "lbs (Pounds)" },
                    { value: "units", label: "units (Pieces)" },
                  ]}
                  value={formData.unit}
                  onChange={(val) => setFormData((prev) => ({ ...prev, unit: val }))}
                />
              </div>
            </div>

            {/* Row 3: Issuing Organization */}
            <div>
              <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                Issuing Organization (Optional)
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. Apex Polymer Solutions"
                className="w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
              />
            </div>

            {/* Row 4: Notes */}
            <div>
              <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                Notes & Context (Optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Delivery note number, vehicle license, or intake notes"
                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
              <Link
                to="/cases"
                className="px-4 py-2.5 rounded-xl text-xs font-display text-[#BABABA] hover:text-white hover:bg-white/[0.04] transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_20px_rgba(255,109,41,0.35)] hover:shadow-[0_0_28px_rgba(255,109,41,0.55)] transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Proceed</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </GlowBackground>
  );
};
