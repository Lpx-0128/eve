"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Users, 
  Briefcase, 
  LineChart, 
  Target, 
  Sparkles, 
  Globe,
  Award,
  Wallet
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await fetch(`/api/profile?userId=${user.uid}`);
          const json = await res.json();
          if (res.ok && json.data) {
            setProfile(json.data);
          }
        } catch (error) {
          console.error("Error fetching profile via API:", error);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <LoadingState message="Loading your intelligent profile..." variant="skeleton" />;
  }

  if (!profile) {
    return (
      <div className="pt-20">
        <EmptyState 
          title="No Profile Found" 
          message="We couldn't find your generated profile. It might still be processing." 
        />
      </div>
    );
  }

  // Provide safe fallbacks if some fields are missing
  const name = profile.name || "Unknown Company";
  const headline = profile.headline || "No headline provided";
  const expertise = Array.isArray(profile.expertise) ? profile.expertise : [];
  const summary = profile.summary || "No summary available.";
  const ceoName = profile.ceo_name || "Unknown Founder";
  const industry = profile.industry || "Unknown Industry";
  const location = profile.location || "Global";
  const scale = profile.scale || "Unknown Scale";
  const funding = profile.funding_signals || "Bootstrapped / Undisclosed";
  const targetAudience = profile.target_audience || "General";
  const businessModel = profile.business_model || "Not specified";
  const coreValue = profile.core_value || "N/A";
  const socialProof = profile.social_proof || "N/A";
  const ceoInfo = profile.ceo_info || "No background information available.";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* 1. Header Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] bg-card-bg border border-border-warm shadow-sm"
      >
        {/* Abstract Gradient Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 80% 0%, rgba(6,182,212,0.4) 0%, transparent 40%), radial-gradient(circle at 20% 100%, rgba(115,98,120,0.3) 0%, transparent 40%)",
            filter: "blur(40px)"
          }}
        />

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Sparkles size={14} className="text-accent" />
                <span className="text-xs font-semibold text-accent tracking-wide uppercase">AI-Generated Intelligence</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-text-primary tracking-tight">
                {name}
              </h1>
              
              <p className="text-xl md:text-2xl font-body text-text-muted font-light leading-snug">
                {headline}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-6 py-3 rounded-xl font-semibold text-sm bg-card-bg border border-border-warm text-text-primary hover:bg-bg-base transition-colors shadow-sm cursor-pointer">
                Edit Profile
              </button>
              <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}>
                Share Insight
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Bento Grid Layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {/* Overview (Spans 2 columns) */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 bg-card-bg rounded-[2rem] p-8 border border-border-warm shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center border border-border-warm">
                <Globe size={20} className="text-text-primary" />
              </div>
              <h2 className="text-lg font-heading font-bold text-text-primary">Executive Summary</h2>
            </div>
            <p className="text-text-primary font-body leading-relaxed text-base">
              {summary}
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border-warm">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Core Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {expertise.map((skill: string) => (
                <span key={skill} className="px-4 py-2 rounded-lg bg-bg-base border border-border-warm text-sm font-medium text-text-primary">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Firmographics */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1 bg-card-bg rounded-[2rem] p-8 border border-border-warm shadow-sm space-y-6">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-2">Firmographics</h2>
          
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Building2 size={18} className="text-text-muted mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Industry</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{industry}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-text-muted mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Location</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users size={18} className="text-text-muted mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Scale</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{scale}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet size={18} className="text-accent mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Funding</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{funding}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leadership Profile */}
        <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-1 bg-card-bg rounded-[2rem] p-1 border border-border-warm shadow-sm overflow-hidden">
          <div className="h-full w-full bg-gradient-to-br from-[#736278]/5 to-[#00508B]/5 rounded-[1.8rem] p-7">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-6">Leadership</h2>
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white text-xl font-bold shadow-md">
                {ceoName.charAt(0)}
              </div>
              <div>
                <p className="text-base font-bold text-text-primary">{ceoName}</p>
                <p className="text-xs font-semibold text-accent tracking-wide uppercase mt-1">Founder & CEO</p>
              </div>
            </div>
            
            <p className="text-sm text-text-muted leading-relaxed italic">
              "{ceoInfo}"
            </p>
          </div>
        </motion.div>

        {/* Business Strategy (Bottom row spans) */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-2 bg-card-bg rounded-[2rem] p-8 border border-border-warm shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center border border-border-warm">
              <Briefcase size={20} className="text-text-primary" />
            </div>
            <h2 className="text-lg font-heading font-bold text-text-primary">Business Strategy</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <Target size={14} /> Target Audience
              </p>
              <p className="text-sm text-text-primary font-medium">{targetAudience}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <LineChart size={14} /> Business Model
              </p>
              <p className="text-sm text-text-primary font-medium">{businessModel}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 bg-card-bg rounded-[2rem] p-8 border border-border-warm shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center border border-border-warm">
              <Award size={20} className="text-accent" />
            </div>
            <h2 className="text-lg font-heading font-bold text-text-primary">Value & Traction</h2>
          </div>
          
          <div className="space-y-6 mt-6">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Core Value Proposition</p>
              <p className="text-sm text-text-primary font-medium leading-relaxed">{coreValue}</p>
            </div>
            <div className="pt-4 border-t border-border-warm">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Social Proof</p>
              <p className="text-sm text-text-primary font-medium leading-relaxed">{socialProof}</p>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
