import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 hover:border-white/20 focus:border-[#FF6D29] focus:outline-none flex items-center justify-between text-xs text-white font-display transition cursor-pointer select-none ${
          isOpen ? "border-[#FF6D29] ring-1 ring-[#FF6D29]/40" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#BABABA] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-[#FF6D29]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl bg-[#141215]/95 border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-1.5 space-y-0.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-display transition cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#FF6D29]/15 text-[#FFA776] font-medium"
                    : "text-[#BABABA] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6D29]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
