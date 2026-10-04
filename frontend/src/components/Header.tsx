import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, LogOut } from "lucide-react";

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-black sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/cases" className="flex items-center gap-2 text-black font-bold text-lg tracking-tight">
          <ShieldCheck className="w-5 h-5 text-black" />
          <span>PROOF_LINE</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-black">{user.displayName || "User"}</span>
              <span className="text-xs font-mono text-gray-500">{user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-black hover:bg-gray-100 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
