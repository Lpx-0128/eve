"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Sparkles, BrainCircuit, Check, X, Building2, Brain, Globe, Target, Info } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, "insight" | "programme">>({});
  const [selectedProgramme, setSelectedProgramme] = useState<string>("All");
  const [availableProgrammes, setAvailableProgrammes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const roleMatch = document.cookie.match(new RegExp('(^| )user-role=([^;]+)'));
          const role = roleMatch ? roleMatch[2] : null;

          const res = await fetch("/api/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.uid, role })
          });
          
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Failed to fetch recommendations");
          
          const results = json.results || [];
          setRecommendations(results);

          // Extract unique programmes for filtering
          const progs = Array.from(new Set(results.map((r: any) => r.bestMatchedProgramme).filter(Boolean))) as string[];
          setAvailableProgrammes(progs);
          
        } catch (err: any) {
          console.error("Recommendations error:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const filteredRecommendations = selectedProgramme === "All" 
    ? recommendations 
    : recommendations.filter(r => r.bestMatchedProgramme === selectedProgramme);

  const toggleTab = (id: string, tab: "insight" | "programme") => {
    setActiveTabs(prev => ({ ...prev, [id]: tab }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
          <BrainCircuit className="text-accent animate-pulse" size={24} />
        </div>
        <h2 className="text-xl font-heading font-bold text-text-primary mb-2">Analyzing Ecosystem Matrix</h2>
        <p className="text-text-muted font-body text-center max-w-md">
          Our AI is evaluating thousands of data points to calculate the Relationship Relevance Index for your profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState 
        title="Processing Error" 
        message={`We couldn't generate recommendations at this time. ${error}`} 
      />
    );
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState 
        title="No Matches Found" 
        message="Your ecosystem currently lacks strong matches for your profile. Invite more participants to grow the network." 
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
            Intelligent Matches
          </h1>
          <p className="text-base text-text-muted font-body">
            AI-driven recommendations scored by the Relationship Relevance Index (RRI).
          </p>
        </div>

        {/* Programme Filter */}
        {availableProgrammes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedProgramme("All")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                selectedProgramme === "All"
                  ? "bg-accent text-white border-accent shadow-md"
                  : "bg-card-bg text-text-muted border-border-warm hover:border-accent/40"
              }`}
            >
              All Programmes
            </button>
            {availableProgrammes.map((prog) => (
              <button
                key={prog}
                onClick={() => setSelectedProgramme(prog)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  selectedProgramme === prog
                    ? "bg-accent text-white border-accent shadow-md"
                    : "bg-card-bg text-text-muted border-border-warm hover:border-accent/40"
                }`}
              >
                {prog}
              </button>
            ))}
          </div>
        )}
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6"
      >
        {filteredRecommendations.map((rec) => {
          const { candidate, score, explanation, confidence, bestMatchedProgramme, id } = rec;
          const activeTab = activeTabs[id] || "insight";
          
          // Badge styling based on confidence
          let badgeColor = "bg-green-500/10 text-green-600 border-green-500/20";
          if (confidence === "medium") badgeColor = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
          if (confidence === "low") badgeColor = "bg-red-500/10 text-red-600 border-red-500/20";

          return (
            <motion.div 
              key={id} 
              variants={itemVariants} 
              className="bg-card-bg rounded-[2rem] p-6 md:p-8 border border-border-warm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Decorative gradient corner */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-2xl group-hover:bg-accent/10 transition-colors pointer-events-none" />

              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Left column: Avatar & Score */}
                <div className="flex flex-col items-center gap-4 min-w-[120px]">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white text-3xl font-bold shadow-md">
                    {candidate.name ? candidate.name.charAt(0) : "U"}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-text-primary font-heading tracking-tighter">
                      {(score * 100).toFixed(1)}<span className="text-sm text-text-muted ml-0.5">%</span>
                    </div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">
                      RRI Score
                    </div>
                  </div>
                </div>

                {/* Middle column: Info & Explanation */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-heading font-bold text-text-primary">{candidate.name || "Unknown"}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                          {confidence} Match
                        </span>
                      </div>
                      <p className="text-sm text-accent font-medium mt-1">
                        {candidate.type || "Participant"}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full border border-border-warm flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                        <X size={18} />
                      </button>
                      <button className="px-5 h-10 rounded-full text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                        style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}>
                        <Check size={16} /> Connect
                      </button>
                    </div>
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex border-b border-border-warm">
                    <button 
                      onClick={() => toggleTab(id, "insight")}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeTab === "insight" ? "text-accent" : "text-text-muted hover:text-text-primary"}`}
                    >
                      <span className="flex items-center gap-1.5"><Info size={14} /> AI Insight</span>
                      {activeTab === "insight" && <motion.div layoutId={`tab-${id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                    </button>
                    <button 
                      onClick={() => toggleTab(id, "programme")}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeTab === "programme" ? "text-accent" : "text-text-muted hover:text-text-primary"}`}
                    >
                      <span className="flex items-center gap-1.5"><Target size={14} /> Programme Fit</span>
                      {activeTab === "programme" && <motion.div layoutId={`tab-${id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                    </button>
                  </div>

                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-base/50 p-5 rounded-2xl border border-border-warm/50 min-h-[100px]"
                  >
                    {activeTab === "insight" ? (
                      <div className="flex gap-3">
                        <Sparkles className="text-accent shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-text-primary font-medium leading-relaxed">
                          "{explanation}"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Target className="text-accent" size={16} />
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-white/50">Best Matched Programme</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          <p className="text-lg font-heading font-extrabold text-text-primary tracking-tight">
                            {bestMatchedProgramme || "N/A"}
                          </p>
                        </div>
                        <p className="text-xs text-text-muted font-medium italic opacity-70">
                          Identified via the Relationship Relevance Index (RRI) based on your active programmes.
                        </p>
                      </div>
                    )}
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {candidate.industry && (
                      <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                        <Building2 size={16} className="text-accent/60" /> {candidate.industry}
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                        <Globe size={16} className="text-accent/60" /> {candidate.location}
                      </div>
                    )}
                  </div>
                  
                  {candidate.expertise && candidate.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {candidate.expertise.slice(0, 4).map((skill: string) => (
                        <span key={skill} className="px-3 py-1.5 rounded-xl bg-bg-base border border-border-warm text-[11px] font-bold text-text-muted uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                      {candidate.expertise.length > 4 && (
                        <span className="px-2 py-1.5 rounded-xl bg-transparent text-[11px] font-bold text-text-muted/60 uppercase tracking-wider">
                          +{candidate.expertise.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
