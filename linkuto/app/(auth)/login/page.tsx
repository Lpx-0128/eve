"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleTabSelector, { RoleType } from "@/components/RoleTabSelector";
import FileUploadZone from "@/components/FileUploadZone";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import LoadingState from "@/components/LoadingState";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState<RoleType>("participant");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleAuth = async () => {
    setError(null);

    // If signing up, validate the inputs before allowing Google Auth
    if (!isLogin) {
      if (role === "mentor") {
        setError("CV-based signup coming soon. Use a different role for now.");
        return;
      }
      if (!url || !url.startsWith("http")) {
        setError("Please enter a valid URL starting with http:// or https://");
        return;
      }
    }

    setIsLoading(true);

    try {
      // 1. Google Authentication
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // We set dummy cookies here so the middleware knows we are logged in and our role
      document.cookie = `firebase-auth-token=${idToken}; path=/; max-age=3600`;
      document.cookie = `user-role=${role}; path=/; max-age=3600`;
      document.cookie = `user-id=${user.uid}; path=/; max-age=3600`;

      // 2. If it's a login, just go to the profile
      if (isLogin) {
        router.push(`/${user.uid}/profile`);
        return;
      }

      // 3. If it's a signup, proceed with profile ingestion
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, userId: user.uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong during ingestion.");
      }

      // 4. Auto-navigate to profile after successful ingestion
      router.push(`/${user.uid}/profile`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication or Profile creation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F1EFE8" }}>
      {/* Left Panel - Hidden on mobile */}
      <div
        className="relative hidden w-5/12 flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{
          background: "linear-gradient(135deg, #736278 0%, #3A4F6E 40%, #00508B 100%)",
        }}
      >
        {/* Animated decorative shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 h-96 w-96 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ y: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full"
          style={{ backgroundColor: "rgba(6,182,212,0.1)", filter: "blur(60px)" }}
        />

        <div className="relative z-10">
          <h1
            className="text-3xl font-heading font-bold tracking-[0.25em]"
            style={{ color: "#FFFFFF" }}
          >
            LINKUTO
          </h1>
        </div>

        <div className="relative z-10 max-w-md">
          <h2
            className="text-4xl font-heading font-bold leading-tight mb-6"
            style={{ color: "#FFFFFF" }}
          >
            Ecosystem Relationship Intelligence
          </h2>
          <p className="text-lg font-body leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            Replace spreadsheets and manual effort. Connect startups, mentors, and sponsors
            intelligently at scale.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-7/12 xl:px-32 relative">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="mb-12 lg:hidden text-center">
            <h1
              className="text-4xl font-heading font-bold tracking-[0.25em]"
              style={{
                background: "linear-gradient(90deg, #736278, #00508B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              LINKUTO
            </h1>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10 text-center lg:text-left">
                <h2
                  className="text-3xl font-heading font-bold mb-3"
                  style={{ color: "#0F172A" }}
                >
                  {isLogin ? "Welcome back" : "Create your account"}
                </h2>
                <p className="font-body" style={{ color: "#64748B" }}>
                  {isLogin
                    ? "Sign in to access your ecosystem relationship graph."
                    : "Join the intelligent matching platform for innovation ecosystems."}
                </p>
              </div>

              <div
                className="p-8 rounded-2xl shadow-sm min-h-[320px] flex flex-col justify-center"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2DFD5",
                }}
              >
                {isLoading && !isLogin ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <LoadingState message="Authenticating & Generating Intelligent Profile..." variant="dots" />
                  </motion.div>
                ) : (
                  <>
                    {!isLogin && (
                      <div className="mb-8">
                        <RoleTabSelector activeRole={role} onRoleChange={setRole} />

                        <div className="space-y-2">
                          <label
                            className="text-sm font-semibold"
                            style={{ color: "#0F172A" }}
                          >
                            {role === "participant" && "Startup Website"}
                            {role === "sponsor" && "Company Website"}
                            {role === "organiser" && "Organisation Website"}
                            {role === "mentor" && "Professional Profile"}
                          </label>

                          {role === "mentor" ? (
                            <FileUploadZone />
                          ) : (
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              placeholder="https://example.com"
                              disabled={isLoading}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all font-body disabled:opacity-50"
                              style={{
                                border: "1px solid #E2DFD5",
                                backgroundColor: "#F9F8F5",
                                color: "#0F172A",
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = "#06B6D4";
                                e.currentTarget.style.backgroundColor = "#FFFFFF";
                                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.15)";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = "#E2DFD5";
                                e.currentTarget.style.backgroundColor = "#F9F8F5";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl text-sm font-medium"
                        style={{
                          backgroundColor: "#FEF2F2",
                          color: "#DC2626",
                          border: "1px solid #FECACA",
                        }}
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <button
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E2DFD5",
                          color: "#0F172A",
                        }}
                          onMouseEnter={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.backgroundColor = "#F9F8F5";
                              e.currentTarget.style.borderColor = "#D1CFC8";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.backgroundColor = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#E2DFD5";
                            }
                          }}
                        >
                          {isLoading && isLogin ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              {isLogin ? "Sign in with Google" : "Continue with Google"}
                            </>
                          )}
                        </button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-sm font-medium transition-colors cursor-pointer"
                  style={{ color: "#64748B" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#06B6D4")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                >
                  {isLogin ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <span style={{ color: "#06B6D4", fontWeight: 600 }}>Sign up</span>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <span style={{ color: "#06B6D4", fontWeight: 600 }}>Log in</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
