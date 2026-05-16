"use client";

import { useEffect, useState } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Plus, Users, Star, Calendar, X, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("participant");
  const [userId, setUserId] = useState<string | null>(null);

  // Modal & Application State
  const [selectedProgramme, setSelectedProgramme] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });

    const getRole = () => {
      const match = document.cookie.match(new RegExp('(^| )user-role=([^;]+)'));
      if (match) setRole(match[2]);
    };
    getRole();

    const fetchProgrammes = async () => {
      try {
        const res = await fetch("/api/programmes");
        const json = await res.json();
        if (res.ok && json.data) {
          setProgrammes(json.data);
        }
      } catch (error) {
        console.error("Error fetching programmes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgrammes();

    return () => unsubscribe();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedProgramme) return;
    setIsApplying(true);

    try {
      const res = await fetch("/api/programmes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeId: selectedProgramme.id,
          participantId: userId,
          answers: formAnswers
        })
      });

      if (res.ok) {
        setApplicationSuccess(true);
        setTimeout(() => {
          setSelectedProgramme(null);
          setApplicationSuccess(false);
          setFormAnswers({});
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to apply:", error);
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return <LoadingState message="Syncing with the ecosystem..." variant="skeleton" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
            Ecosystem Programmes
          </h1>
          <p className="text-base text-text-muted font-body">
            Discover and join high-impact cohorts across the network.
          </p>
        </div>

        {role === "organiser" && (
          <Link href="/programmes/create">
            <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}>
              <Plus size={18} /> Publish Programme
            </button>
          </Link>
        )}
      </div>

      {programmes.length === 0 ? (
        <EmptyState
          title="No Active Programmes"
          message="The ecosystem is currently quiet. Check back later or publish a new cohort if you are an organiser."
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {programmes.map((prog) => (
            <motion.div
              key={prog.id}
              variants={itemVariants}
              onClick={() => setSelectedProgramme(prog)}
              className="bg-card-bg rounded-[2rem] p-8 border border-border-warm shadow-sm flex flex-col justify-between group cursor-pointer hover:border-accent/40 transition-colors"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bg-base to-border-warm flex items-center justify-center border border-border-warm text-xl font-bold text-text-primary">
                    {prog.name.charAt(0)}
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                    {prog.status}
                  </span>
                </div>

                <h2 className="text-xl font-heading font-bold text-text-primary line-clamp-1 mb-2">
                  {prog.name}
                </h2>
                <p className="text-sm text-text-muted font-body leading-relaxed line-clamp-3 mb-6">
                  {prog.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {prog.industry_focus?.slice(0, 3).map((ind: string) => (
                    <span key={ind} className="px-2.5 py-1 rounded-md bg-bg-base border border-border-warm text-[11px] font-medium text-text-muted">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-border-warm flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-text-muted font-medium">
                  <Users size={16} />
                  {prog.participants?.length || 0} Startups
                </div>
                <div className="flex items-center gap-1.5 text-text-muted font-medium">
                  <Star size={16} className="text-accent" />
                  {prog.mentors?.length || 0} Mentors
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Application Modal */}
      <AnimatePresence>
        {selectedProgramme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProgramme(null)}
              className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-card-bg rounded-[2.5rem] border border-border-warm shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 z-10">
                <button onClick={() => setSelectedProgramme(null)} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto">
                {applicationSuccess ? (
                  <div className="py-12 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-2xl font-heading font-extrabold text-text-primary">Application Submitted!</h2>
                    <p className="text-text-muted font-body">The organiser has been notified. You'll hear back soon.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                        <Sparkles size={24} />
                      </div>
                      <h2 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight">Apply to {selectedProgramme.name}</h2>
                      <p className="text-text-muted font-body text-sm leading-relaxed">{selectedProgramme.description}</p>
                    </div>

                    <form onSubmit={handleApply} className="space-y-6">
                      {selectedProgramme.applicationQuestions?.map((q: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">{q.label}</label>
                          <input
                            type="text"
                            required
                            placeholder="Your answer..."
                            onChange={(e) => setFormAnswers(prev => ({ ...prev, [q.label]: e.target.value }))}
                            className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm"
                          />
                        </div>
                      ))}

                      {(!selectedProgramme.applicationQuestions || selectedProgramme.applicationQuestions.length === 0) && (
                        <div className="p-4 rounded-xl bg-bg-base border border-border-warm text-sm text-text-muted italic">
                          No specific questions for this programme. Just click launch to apply!
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isApplying}
                        className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
                      >
                        {isApplying ? <Loader2 size={20} className="animate-spin" /> : "Submit Application"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
