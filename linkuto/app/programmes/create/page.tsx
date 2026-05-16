"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const PROGRAMME_TYPES = [
  "Accelerator",
  "Incubator",
  "Hackathon",
  "Bootcamp",
  "Workshop",
  "Demo Day",
  "Fellowship",
  "Grant Programme",
];

export default function CreateProgrammePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Organiser");

  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [programmeType, setProgrammeType] = useState("Accelerator");
  const [industries, setIndustries] = useState("");

  // Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  // Logistics
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number>(20);
  const [targetShortlistCount, setTargetShortlistCount] = useState<number>(5);

  // Value proposition
  const [eligibility, setEligibility] = useState("");
  const [perks, setPerks] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Application Form states
  const [predefinedQuestions, setPredefinedQuestions] = useState([
    { id: "pitch_deck", label: "Company Pitch Deck (URL)", enabled: true },
    { id: "funding_stage", label: "Current Funding Stage", enabled: true },
    { id: "team_size", label: "Core Team Size", enabled: false },
    { id: "market_size", label: "Estimated Market Size (TAM)", enabled: false },
  ]);
  const [customQuestions, setCustomQuestions] = useState<{id: string, label: string}[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const res = await fetch(`/api/profile?userId=${user.uid}`);
          const json = await res.json();
          if (res.ok && json.data && json.data.name) {
            setDisplayName(json.data.name);
          } else {
            setDisplayName(user.displayName || user.email || "Organiser");
          }
        } catch {
          setDisplayName(user.displayName || user.email || "Organiser");
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const togglePredefined = (id: string) => {
    setPredefinedQuestions(prev => prev.map(q => q.id === id ? { ...q, enabled: !q.enabled } : q));
  };

  const addCustomQuestion = () => {
    setCustomQuestions([...customQuestions, { id: Math.random().toString(36).substr(2, 9), label: "" }]);
  };

  const updateCustomQuestion = (id: string, label: string) => {
    setCustomQuestions(prev => prev.map(q => q.id === id ? { ...q, label } : q));
  };

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userId) return;
    
    setLoading(true);

    try {
      const industryArray = industries.split(",").map(i => i.trim()).filter(i => i.length > 0);
      
      const applicationQuestions = [
        ...predefinedQuestions.filter(q => q.enabled).map(q => ({ label: q.label, type: "text", isCustom: false })),
        ...customQuestions.filter(q => q.label.trim().length > 0).map(q => ({ label: q.label, type: "text", isCustom: true }))
      ];

      const res = await fetch("/api/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          programmeType,
          industry_focus: industryArray,
          startDate: startDate || null,
          endDate: endDate || null,
          applicationDeadline: applicationDeadline || null,
          location: location || null,
          maxParticipants,
          eligibility: eligibility || null,
          perks: perks || null,
          websiteUrl: websiteUrl || null,
          applicationQuestions,
          targetShortlistCount,
          status: "active",
          organiserId: userId,
          organiserName: displayName,
        })
      });

      if (!res.ok) throw new Error("Failed to create programme");
      router.push("/programmes");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const inputClass = "w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-text-primary";

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
          Launch a new cohort and configure everything participants need to know.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-bg rounded-[2rem] p-8 md:p-10 border border-border-warm shadow-sm relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">

          {/* ─── Section 1: Basic Information ─── */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-bold text-text-primary border-b border-border-warm pb-2">Basic Information</h2>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Programme Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Winter Web3 Accelerator 2026" className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Programme Type *</label>
                <select value={programmeType} onChange={(e) => setProgrammeType(e.target.value)} className={inputClass}>
                  {PROGRAMME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Industry Focus</label>
                <input type="text" value={industries} onChange={(e) => setIndustries(e.target.value)} placeholder="Fintech, AI, SaaS" className={inputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Mission / Description *</label>
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this programme aim to achieve? What will participants experience?" className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* ─── Section 2: Dates & Location ─── */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-bold text-text-primary border-b border-border-warm pb-2">Schedule & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Application Deadline</label>
                <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder='e.g. Kuala Lumpur, Malaysia — or "Virtual"' className={inputClass} />
            </div>
          </div>

          {/* ─── Section 3: Capacity & Eligibility ─── */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-bold text-text-primary border-b border-border-warm pb-2">Capacity & Eligibility</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Max Participants</label>
                <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)} min="1" placeholder="e.g. 20" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">AI Shortlist Count</label>
                <input type="number" required value={targetShortlistCount} onChange={(e) => setTargetShortlistCount(parseInt(e.target.value) || 0)} min="1" placeholder="e.g. 5" className={inputClass} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Eligibility Criteria</label>
              <input type="text" value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="e.g. Pre-seed to Series A startups in Southeast Asia" className={inputClass} />
            </div>
          </div>

          {/* ─── Section 4: Value Proposition ─── */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-bold text-text-primary border-b border-border-warm pb-2">What Participants Get</h2>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Perks & Benefits</label>
              <textarea rows={3} value={perks} onChange={(e) => setPerks(e.target.value)} placeholder="e.g. $50K equity-free funding, 12 weeks of mentorship, co-working space, demo day pitch opportunity" className={`${inputClass} resize-none`} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Programme Website (optional)</label>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourprogramme.com" className={inputClass} />
            </div>
          </div>

          {/* ─── Section 5: Application Form Builder ─── */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-bold text-text-primary border-b border-border-warm pb-2">Application Form Builder</h2>
            
            <div className="space-y-4">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Predefined Questions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predefinedQuestions.map(q => (
                  <button
                    key={q.id} type="button" onClick={() => togglePredefined(q.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-sm font-medium ${
                      q.enabled ? "bg-accent/10 border-accent text-accent" : "bg-bg-base border-border-warm text-text-muted hover:border-accent/50"
                    }`}
                  >
                    {q.label}
                    {q.enabled && <Sparkles size={14} className="shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Custom Questions</label>
                <button type="button" onClick={addCustomQuestion} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                  + Add Question
                </button>
              </div>
              <div className="space-y-3">
                {customQuestions.map((q, idx) => (
                  <div key={q.id} className="flex gap-2">
                    <input type="text" value={q.label} onChange={(e) => updateCustomQuestion(q.id, e.target.value)} placeholder={`Question #${idx + 1}`} className="flex-1 px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all text-sm font-body text-text-primary" />
                    <button type="button" onClick={() => removeCustomQuestion(q.id)} className="p-3 text-text-muted hover:text-red-500 transition-colors">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Submit ─── */}
          <div className="pt-6 border-t border-border-warm flex justify-end">
            <button
              type="submit" disabled={loading}
              className="px-8 py-4 rounded-xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Launch Programme
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
