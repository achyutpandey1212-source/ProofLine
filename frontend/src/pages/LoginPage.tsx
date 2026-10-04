import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GlowBackground } from "../components/ui/GlowBackground";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymous,
    loading,
  } = useAuth();

  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!loading && user) {
    return <Navigate to="/cases" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("popup-closed-by-user")) {
        setError("Sign-in cancelled.");
      } else {
        setError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setSigningIn(true);
      setError(null);
      if (authMode === "SIGN_IN") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await signInAnonymous();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <GlowBackground className="flex flex-col justify-between p-6 sm:p-10 min-h-screen">
      {/* Top clean header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-display text-[#BABABA] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-[420px] mx-auto my-auto py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-2 leading-tight">
            Sign In{" "}
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              to Proofline
            </span>
          </h1>
          <p className="font-display text-sm text-[#BABABA]">
            Deterministic settlement and audit verification
          </p>
        </div>

        {/* Clean, well-structured form card */}
        <div className="rounded-3xl bg-[#141215]/90 border border-white/10 p-8 shadow-[0_24px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-display">
              {error}
            </div>
          )}

          {/* 1. Google One-Click Action */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            type="button"
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-white text-xs font-display font-medium transition cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            <span>{signingIn ? "Connecting..." : "Continue with Google"}</span>
          </button>

          {/* Divider with explicit margin and clear typography */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-display uppercase tracking-widest text-[#BABABA]/50 select-none">
              or
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* 2. Structured Email & Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@domain.com"
                className="w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-display text-[#BABABA] mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#FF6D29] focus:outline-none text-xs text-white placeholder-[#BABABA]/30 font-display transition"
                required
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={signingIn}
              className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white font-medium text-xs font-display shadow-[0_0_24px_rgba(255,109,41,0.35)] hover:shadow-[0_0_32px_rgba(255,109,41,0.55)] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{authMode === "SIGN_IN" ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Toggle sign in / sign up */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "SIGN_IN" ? "SIGN_UP" : "SIGN_IN")}
                className="text-xs font-display text-[#BABABA] hover:text-white transition-colors cursor-pointer"
              >
                {authMode === "SIGN_IN"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>

          {/* 3. Guest Access Row */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleAnonymousSignIn}
              type="button"
              disabled={signingIn}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/10 hover:border-white/20 text-xs font-display text-[#BABABA] hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <span>Continue as Guest Reviewer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="w-full max-w-4xl mx-auto text-center text-xs font-display text-[#BABABA]/40">
        &copy; {new Date().getFullYear()} Proofline
      </div>
    </GlowBackground>
  );
};
