"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CreateProgrammePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industries, setIndustries] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userId) return;
    
    setLoading(true);

    try {
      const industryArray = industries.split(",").map(i => i.trim()).filter(i => i.length > 0);

      const res = await fetch("/api/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          industry_focus: industryArray,
          status: "active",
          organiserId: userId,
          organiserName: "Organiser" // In a real app, fetch their actual name from entities
        })
      });

      if (!res.ok) throw new Error("Failed to create programme");

      // Redirect back to the ecosystem list
      router.push("/programmes");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link href="/programmes" className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Ecosystem
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
          Publish a Programme
        </h1>
        <p className="text-base text-text-muted font-body">
          Launch a new cohort into the ecosystem and start accepting startups and mentors.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-bg rounded-[2rem] p-8 md:p-10 border border-border-warm shadow-sm relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Programme Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Winter Web3 Accelerator 2026"
              className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-text-primary placeholder:text-text-muted"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Ecosystem Mission / Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this programme aims to achieve and who it's for..."
              className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-text-primary placeholder:text-text-muted resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Industry Focus Focus <span className="text-text-muted font-normal normal-case">(comma separated)</span>
            </label>
            <input
              type="text"
              value={industries}
              onChange={(e) => setIndustries(e.target.value)}
              placeholder="Fintech, AI, Climate Tech, SaaS"
              className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-text-primary placeholder:text-text-muted"
            />
          </div>

          <div className="pt-6 border-t border-border-warm flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Launch Programme
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
