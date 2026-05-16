"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, User, CheckCircle2, ShieldAlert, BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AIScreeningPage() {
  const { id } = useParams();
  const pathname = usePathname();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [programme, setProgramme] = useState<any>(null);
  const [error, setError] = useState("");

  const isOwner = userId && programme?.organiserId === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const runScreening = async () => {
      try {
        // Fetch programme
        const progRes = await fetch(`/api/programmes/${id}`);
        const progJson = await progRes.json();
        if (progRes.ok && progJson.data) {
          setProgramme(progJson.data);
        }

        // Run AI Screening
        const screenRes = await fetch(`/api/programmes/${id}/ai-screen`, {
          method: "POST"
        });
        const screenJson = await screenRes.json();
        
        if (screenRes.ok && screenJson.data) {
          setResults(screenJson.data);
        } else {
          setError(screenJson.error || "Failed to run AI screening");
        }
      } catch (err: any) {
        console.error(err);
        setError("An unexpected error occurred during AI screening.");
      } finally {
        setLoading(false);
      }
    };

    if (id) runScreening();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-32 text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-accent/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-accent">
            <BrainCircuit size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-text-primary">Live AI Screening in Progress</h2>
          <p className="text-text-muted font-body animate-pulse">
            Our AI engine is reading through all applications, analyzing their answers against your programme requirements...
          </p>
        </div>
      </div>
    );
  }

  // Access control
  if (!loading && programme && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Access Denied</h1>
        <p className="text-text-muted font-body max-w-md mx-auto">
          You don&apos;t have permission to run AI screening for this programme. Only the programme host can access this data.
        </p>
        <Link href="/programmes" className="text-accent font-semibold text-sm hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Programmes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <Link 
        href={pathname.split('/').slice(0, -1).join('/')} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Programme Management
      </Link>

      <PageHeader 
        title="Live AI Screening Results" 
        subtitle={`Evaluated ${results.length} applicants against your programme criteria.`}
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
          {error}
        </div>
      )}

      {results.length === 0 && !error ? (
        <div className="p-12 text-center bg-card-bg rounded-[2rem] border border-border-warm shadow-sm">
          <p className="text-text-muted font-body">No applications found to screen.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card-bg rounded-[2rem] border border-border-warm shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-bg-base/50">
                  <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">Applicant</th>
                  <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">RRI Fit Score</th>
                  <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">AI Reasoning</th>
                  <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {results.map((app) => {
                  const isTopFit = app.score >= 80;
                  return (
                    <tr key={app.id} className="hover:bg-bg-base/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTopFit ? 'bg-accent/10 text-accent' : 'bg-border-warm text-text-muted'}`}>
                            <User size={18} />
                          </div>
                          <span className="font-heading font-semibold text-text-primary">{app.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${
                            isTopFit 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : app.score >= 50 
                                ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {app.score}%
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-text-muted max-w-md font-body leading-relaxed">
                          {app.reason}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`flex items-center gap-1.5 font-semibold text-xs ${isTopFit ? 'text-emerald-600' : 'text-text-muted'}`}>
                          {isTopFit ? (
                            <>
                              <CheckCircle2 size={14} />
                              Strong Fit
                            </>
                          ) : (
                            'Needs Review'
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div className="p-6 rounded-[2rem] bg-accent/5 border border-accent/10 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-accent/10 text-accent">
          <Sparkles size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-primary mb-1">Live Gemini Analysis</h4>
          <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
            This analysis was generated live using the custom RRI (Relationship Relevance Index) core algorithm. Gemini 3.1 Flash-Lite evaluates each applicant's raw form responses across 4 dimensions: Semantic Keyword Alignment, Engagement Potential, Programme Eligibility Match, and Projected Success Feedback to calculate the exact fit score.
          </p>
        </div>
      </div>
    </div>
  );
}
