import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowLeft, UserPlus, LogIn, KeyRound } from "lucide-react";

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

  // Email / Password Form State
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
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("popup-closed-by-user")) {
        setError("Sign-in popup was closed before completing.");
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
      console.error(err);
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
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK_TO_HOME</span>
        </Link>
        <div className="border border-black p-8 bg-white">
          <div className="flex items-center gap-2 mb-4 font-bold text-lg tracking-tight">
            <ShieldCheck className="w-6 h-6 text-black" />
            <span>PROOF_LINE</span>
          </div>

          <h1 className="text-xl font-bold text-black tracking-tight mb-2">Workspace Authentication</h1>
          <p className="text-xs text-gray-600 mb-6">
            Access commercial transaction cases and compliance audit records using Firebase Auth.
          </p>

          {error && (
            <div className="mb-6 p-3 border border-black bg-gray-50 text-xs font-mono">
              [AUTH_ERROR]: {error}
            </div>
          )}

          {/* 1. Google Sign-In */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-black bg-black text-white hover:bg-white hover:text-black text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span>{signingIn ? "AUTHENTICATING..." : "SIGN IN WITH GOOGLE"}</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-2 text-xs font-mono text-gray-500">OR EMAIL / PASSWORD</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* 2. Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full px-3 py-2 border border-black bg-white text-xs font-mono text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-black bg-white text-xs font-mono text-black"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={signingIn}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-black bg-white hover:bg-black hover:text-white text-xs font-mono font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {authMode === "SIGN_IN" ? (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>LOG IN</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>CREATE ACCOUNT</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs font-mono pt-1 text-gray-600">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "SIGN_IN" ? "SIGN_UP" : "SIGN_IN")}
                  className="underline hover:no-underline cursor-pointer"
                >
                  {authMode === "SIGN_IN"
                    ? "Need an account? Register"
                    : "Already registered? Sign in"}
                </button>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-2 text-xs font-mono text-gray-500">OR GUEST ACCESS</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* 3. Anonymous Guest Sign-In */}
            <button
              onClick={handleAnonymousSignIn}
              type="button"
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-gray-400 bg-gray-50 text-black hover:bg-gray-100 text-xs font-mono transition cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>CONTINUE AS ANONYMOUS REVIEWER</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="text-xs font-mono text-gray-500">
              AUDIT_DOMAIN: proofline-527f4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
