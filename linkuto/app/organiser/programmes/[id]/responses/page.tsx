"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, User, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Mock data generator for AI screening
const generateMockApplicants = (count: number) => {
  const names = ["Aura AI", "Lumina Tech", "Nexas Health", "Vertex Solar", "CyberGuard", "Echo Pay", "Zenith", "Quantum Flow", "Terra Seed", "Sky Link"];
  const reasons = [
    "Strong technical alignment with the core cohort focus area.",
    "Exceptional founder background and market opportunity.",
    "Highly innovative solution in an underserved niche.",
    "Scalable business model with clear path to profitability.",
    "Direct synergy with existing ecosystem partners."
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `app-${i}`,
    name: names[i % names.length],
    score: Math.floor(Math.random() * (98 - 85) + 85), // High scores for shortlisted
    reason: reasons[i % reasons.length]
  })).sort((a, b) => b.score - a.score);
};

export default function ResponsesPage() {
  const { id } = useParams();
  const pathname = usePathname();
  const [shortlisted, setShortlisted] = useState<any[]>([]);
  const [targetCount, setTargetCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [programme, setProgramme] = useState<any>(null);

  const isOwner = userId && programme?.organiserId === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch programme to get target count
    const fetchProgramme = async () => {
      try {
        const res = await fetch(`/api/programmes/${id}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setProgramme(json.data);
          const count = json.data.targetShortlistCount || 5;
          setTargetCount(count);
          setShortlisted(generateMockApplicants(count));
        }
      } catch (error) {
        console.error("Error fetching programme:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProgramme();
  }, [id]);

  if (loading) return <LoadingState variant="skeleton" />;

  // Access control: block non-owners from seeing responses
  if (!loading && programme && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Access Denied</h1>
        <p className="text-text-muted font-body max-w-md mx-auto">
          You don&apos;t have permission to view responses for this programme. Only the programme host can access this data.
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
        title="AI Screening Results" 
        subtitle={`Top ${targetCount} applicants selected based on your programme criteria.`}
      />

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
                <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">AI Score</th>
                <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">AI Reasoning</th>
                <th className="px-8 py-5 text-xs font-bold text-text-primary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {shortlisted.map((app) => (
                <tr key={app.id} className="hover:bg-bg-base/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <User size={18} />
                      </div>
                      <span className="font-heading font-semibold text-text-primary">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm font-bold border border-emerald-500/20">
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
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                      <CheckCircle2 size={14} />
                      Shortlisted
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="p-6 rounded-[2rem] bg-accent/5 border border-accent/10 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-accent/10 text-accent">
          <Sparkles size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-primary mb-1">AI Logic Applied</h4>
          <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
            This list was automatically generated by analyzing applicant profiles against your programme&apos;s industry focus and description. Only the top {targetCount} profiles that met the threshold were selected.
          </p>
        </div>
      </div>
    </div>
  );
}
