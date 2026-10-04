import React from "react";
import { Plus, Minus } from "lucide-react";

interface NumberInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  required?: boolean;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  name,
  value,
  onChange,
  placeholder = "0",
  step = 1,
  min = 0,
  required = false,
  className = "",
}) => {
  const handleStep = (increment: boolean) => {
    const current = parseFloat(value) || 0;
    const nextVal = increment ? current + step : Math.max(min, current - step);
    const fakeEvent = {
      target: {
        name,
        value: String(nextVal),
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(fakeEvent);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="number"
        step="any"
        min={min}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 pl-4 pr-16 rounded-xl bg-black/50 border border-white/10 hover:border-white/20 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
      />

      {/* Custom Stepper Controls */}
      <div className="absolute right-1.5 flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleStep(false)}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/5 hover:border-white/15 flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
          title="Decrease"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleStep(true)}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/5 hover:border-white/15 flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
          title="Increase"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
